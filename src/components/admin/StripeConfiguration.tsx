import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Plus, Trash2, CheckCircle2, Loader2, Percent, Shield, Pencil } from 'lucide-react';

interface Discount {
  id: string;
  promo_code: string;
  discount_percentage: number;
  billing_cycle: string;
  discount_name: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  plan_tier?: string;
}

export default function StripeConfiguration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editForm, setEditForm] = useState({
    discount_name: '',
    plan_tier: 'all',
    valid_until: '',
    is_active: true,
    first_time_only: false,
  });
  
  const [discountForm, setDiscountForm] = useState({
    promo_code: '',
    discount_name: '',
    discount_percentage: 10,
    billing_cycle: 'both',
    valid_until: '',
    max_redemptions: '',
    first_time_only: false,
    plan_tier: 'all',
  });

  useEffect(() => {
    loadConfiguration();
    loadDiscounts();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_configuration' as any)
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error loading stripe config:', error);
        return;
      }

      if (data) {
        // Use stripe_mode column (not is_live_mode)
        setIsLiveMode((data as any).stripe_mode === 'live');
      }
    } catch (error) {
      console.error('Error loading stripe config:', error);
    }
  };

  const loadDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_discounts' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading discounts:', error);
        return;
      }
      setDiscounts((data || []) as unknown as Discount[]);
    } catch (error) {
      console.error('Error loading discounts:', error);
    }
  };

  const toggleStripeMode = async () => {
    setLoading(true);
    try {
      const newMode = !isLiveMode;
      const modeValue = newMode ? 'live' : 'test';
      
      // Check if a record exists first
      const { data: existing } = await supabase
        .from('stripe_configuration' as any)
        .select('id')
        .maybeSingle();

      let error;
      if (existing && (existing as any).id) {
        // Update existing record
        const result = await supabase
          .from('stripe_configuration' as any)
          .update({
            stripe_mode: modeValue,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', (existing as any).id);
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('stripe_configuration' as any)
          .insert({
            stripe_mode: modeValue,
            updated_at: new Date().toISOString()
          } as any);
        error = result.error;
      }

      if (error) throw error;

      setIsLiveMode(newMode);
      toast({
        title: "Mode Updated",
        description: `Switched to ${newMode ? 'Live' : 'Test'} mode`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update mode",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testStripeConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-stripe-connection', {
        body: { isLiveMode }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: data.message,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Stripe",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const createDiscount = async () => {
    if (!discountForm.promo_code || !discountForm.discount_name || !discountForm.valid_until) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-coupon', {
        body: {
          promo_code: discountForm.promo_code.toUpperCase(),
          discount_name: discountForm.discount_name,
          discount_percentage: discountForm.discount_percentage,
          billing_cycle: discountForm.billing_cycle,
          valid_until: discountForm.valid_until,
          max_redemptions: discountForm.max_redemptions ? parseInt(discountForm.max_redemptions) : null,
          first_time_only: discountForm.first_time_only,
          plan_tier: discountForm.plan_tier,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Discount Created", description: "Promo code created successfully" });
        setIsDialogOpen(false);
        setDiscountForm({ promo_code: '', discount_name: '', discount_percentage: 10, billing_cycle: 'both', valid_until: '', max_redemptions: '', first_time_only: false, plan_tier: 'all' });
        loadDiscounts();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create discount", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('subscription_discounts' as any).delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted" });
      loadDiscounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    setEditForm({
      discount_name: discount.discount_name,
      plan_tier: discount.plan_tier || 'all',
      valid_until: discount.valid_until ? discount.valid_until.split('T')[0] : '',
      is_active: discount.is_active,
      first_time_only: (discount as any).first_time_only || false,
    });
    setIsEditDialogOpen(true);
  };

  const updateDiscount = async () => {
    if (!editingDiscount) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscription_discounts' as any)
        .update({
          discount_name: editForm.discount_name,
          plan_tier: editForm.plan_tier,
          valid_until: editForm.valid_until,
          is_active: editForm.is_active,
          first_time_only: editForm.first_time_only,
        } as any)
        .eq('id', editingDiscount.id);

      if (error) throw error;
      toast({ title: "Updated", description: "Discount updated successfully" });
      setIsEditDialogOpen(false);
      setEditingDiscount(null);
      loadDiscounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configuration">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="discounts">Stripe Promo Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Payment Mode
              </CardTitle>
              <CardDescription>Switch between Test and Live mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${isLiveMode ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {isLiveMode ? <Shield className="h-6 w-6 text-green-600" /> : <CreditCard className="h-6 w-6 text-yellow-600" />}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{isLiveMode ? 'Live Mode' : 'Test Mode'}</p>
                    <p className="text-sm text-muted-foreground">
                      {isLiveMode ? 'Processing real payments' : 'Using test credentials'}
                    </p>
                  </div>
                </div>
                <Switch checked={isLiveMode} onCheckedChange={toggleStripeMode} disabled={loading} />
              </div>

              <Button onClick={testStripeConnection} disabled={testing} variant="outline" className="w-full">
                {testing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Test Connection</>}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Test Keys</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>STRIPE_PUBLIC_KEY_TEST</p>
                    <p>STRIPE_SECRET_KEY_TEST</p>
                    <p>STRIPE_WEBHOOK_SECRET_TEST</p>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Live Keys</CardTitle></CardHeader>
                  <CardContent className="text-xs space-y-1">
                    <p>STRIPE_PUBLIC_KEY_LIVE</p>
                    <p>STRIPE_SECRET_KEY_LIVE</p>
                    <p>STRIPE_WEBHOOK_SECRET_LIVE</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" />Stripe Promo Codes</CardTitle>
                <CardDescription>Synced with Stripe - Use these codes at checkout</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Discount</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Promo Code *</Label><Input value={discountForm.promo_code} onChange={(e) => setDiscountForm({ ...discountForm, promo_code: e.target.value.toUpperCase() })} placeholder="SUMMER2024" /></div>
                    <div><Label>Name *</Label><Input value={discountForm.discount_name} onChange={(e) => setDiscountForm({ ...discountForm, discount_name: e.target.value })} placeholder="Summer Sale" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Discount %</Label><Input type="number" min="1" max="100" value={discountForm.discount_percentage} onChange={(e) => setDiscountForm({ ...discountForm, discount_percentage: parseInt(e.target.value) })} /></div>
                      <div><Label>Billing</Label>
                        <Select value={discountForm.billing_cycle} onValueChange={(v) => setDiscountForm({ ...discountForm, billing_cycle: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Applicable Plan</Label>
                      <Select value={discountForm.plan_tier} onValueChange={(v) => setDiscountForm({ ...discountForm, plan_tier: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Plans</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="broker">Broker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Valid Until *</Label><Input type="date" value={discountForm.valid_until} onChange={(e) => setDiscountForm({ ...discountForm, valid_until: e.target.value })} /></div>
                    <div className="flex items-center gap-2"><Switch checked={discountForm.first_time_only} onCheckedChange={(v) => setDiscountForm({ ...discountForm, first_time_only: v })} /><Label>First-time only</Label></div>
                    <Button onClick={createDiscount} disabled={loading} className="w-full">{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {discounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No discount codes yet</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Plan</TableHead><TableHead>Valid Until</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {discounts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono font-semibold">{d.promo_code}</TableCell>
                        <TableCell>{d.discount_percentage}%</TableCell>
                        <TableCell><Badge variant="outline">{d.plan_tier === 'all' || !d.plan_tier ? 'All Plans' : d.plan_tier.charAt(0).toUpperCase() + d.plan_tier.slice(1)}</Badge></TableCell>
                        <TableCell>{new Date(d.valid_until).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant={d.is_active ? 'default' : 'secondary'}>{d.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(d)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteDiscount(d.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
            <DialogDescription>
              Code: <span className="font-mono font-semibold">{editingDiscount?.promo_code}</span> — {editingDiscount?.discount_percentage}% off (immutable in Stripe)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={editForm.discount_name} onChange={(e) => setEditForm({ ...editForm, discount_name: e.target.value })} /></div>
            <div>
              <Label>Applicable Plan</Label>
              <Select value={editForm.plan_tier} onValueChange={(v) => setEditForm({ ...editForm, plan_tier: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valid Until</Label><Input type="date" value={editForm.valid_until} onChange={(e) => setEditForm({ ...editForm, valid_until: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editForm.is_active} onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })} /><Label>Active</Label></div>
            <div className="flex items-center gap-2"><Switch checked={editForm.first_time_only} onCheckedChange={(v) => setEditForm({ ...editForm, first_time_only: v })} /><Label>First-time only</Label></div>
            <Button onClick={updateDiscount} disabled={loading} className="w-full">{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
