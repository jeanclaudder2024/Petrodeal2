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
import { CreditCard, Plus, Trash2, CheckCircle2, Loader2, Percent, Shield, Pencil, Gift } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

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

interface SpecialPromo {
  id: string;
  code: string;
  discount_percentage: number;
  free_months: number;
  plan_tier: string;
  is_active: boolean;
  max_redemptions: number | null;
  redemption_count: number;
  valid_until: string | null;
  stripe_coupon_id: string | null;
  stripe_promo_code_id: string | null;
  created_at: string;
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

  // Special Promo state
  const [specialPromos, setSpecialPromos] = useState<SpecialPromo[]>([]);
  const [isSpecialDialogOpen, setIsSpecialDialogOpen] = useState(false);
  const [specialForm, setSpecialForm] = useState({
    code: '',
    discount_percentage: 100,
    free_months: 3,
    plan_tier: 'basic',
    valid_until: '',
    max_redemptions: '',
  });

  useEffect(() => {
    loadConfiguration();
    loadDiscounts();
    loadSpecialPromos();
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

  const loadSpecialPromos = async () => {
    try {
      const { data, error } = await supabase
        .from('special_promo_codes' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading special promos:', error);
        return;
      }
      setSpecialPromos((data || []) as unknown as SpecialPromo[]);
    } catch (error) {
      console.error('Error loading special promos:', error);
    }
  };

  const toggleStripeMode = async () => {
    setLoading(true);
    try {
      const newMode = !isLiveMode;
      const modeValue = newMode ? 'live' : 'test';
      
      const { data: existing } = await supabase
        .from('stripe_configuration' as any)
        .select('id')
        .maybeSingle();

      let error;
      if (existing && (existing as any).id) {
        const result = await supabase
          .from('stripe_configuration' as any)
          .update({
            stripe_mode: modeValue,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', (existing as any).id);
        error = result.error;
      } else {
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

  // Special Promo Code functions
  const createSpecialPromo = async () => {
    if (!specialForm.code) {
      toast({ title: "Validation Error", description: "Please enter a promo code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-special-promo', {
        body: {
          code: specialForm.code.toUpperCase(),
          discount_percentage: specialForm.discount_percentage,
          free_months: specialForm.free_months,
          plan_tier: specialForm.plan_tier,
          valid_until: specialForm.valid_until || null,
          max_redemptions: specialForm.max_redemptions ? parseInt(specialForm.max_redemptions) : null,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: "Special Promo Created", description: `Code ${specialForm.code.toUpperCase()} created in Stripe` });
        setIsSpecialDialogOpen(false);
        setSpecialForm({ code: '', discount_percentage: 100, free_months: 3, plan_tier: 'basic', valid_until: '', max_redemptions: '' });
        loadSpecialPromos();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create special promo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialPromo = async (promo: SpecialPromo) => {
    try {
      const { error } = await supabase
        .from('special_promo_codes' as any)
        .update({ is_active: !promo.is_active } as any)
        .eq('id', promo.id);

      if (error) throw error;
      toast({ title: promo.is_active ? "Deactivated" : "Activated" });
      loadSpecialPromos();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteSpecialPromo = async (id: string) => {
    if (!confirm('Are you sure? This will not delete the coupon from Stripe.')) return;
    try {
      const { error } = await supabase.from('special_promo_codes' as any).delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted" });
      loadSpecialPromos();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configuration">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="discounts">Stripe Promo Codes</TabsTrigger>
          <TabsTrigger value="special">Special Promo Codes</TabsTrigger>
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

        {/* Special Promo Codes Tab */}
        <TabsContent value="special" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" />Special Promo Codes</CardTitle>
                <CardDescription>X months at a discount with NO free trial — billing starts immediately</CardDescription>
              </div>
              <Dialog open={isSpecialDialogOpen} onOpenChange={setIsSpecialDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Special Promo</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Special Promo Code</DialogTitle>
                    <DialogDescription>
                      Create a promo code that gives X months at a discount with no 5-day free trial
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Promo Code *</Label>
                      <Input 
                        value={specialForm.code} 
                        onChange={(e) => setSpecialForm({ ...specialForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })} 
                        placeholder="VIPFREE3" 
                      />
                    </div>
                    <div>
                      <Label>Plan *</Label>
                      <Select value={specialForm.plan_tier} onValueChange={(v) => setSpecialForm({ ...specialForm, plan_tier: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Free Months: {specialForm.free_months}</Label>
                      <Slider
                        value={[specialForm.free_months]}
                        onValueChange={([v]) => setSpecialForm({ ...specialForm, free_months: v })}
                        min={1}
                        max={12}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 month</span>
                        <span>12 months</span>
                      </div>
                    </div>
                    <div>
                      <Label>Discount: {specialForm.discount_percentage}%</Label>
                      <Slider
                        value={[specialForm.discount_percentage]}
                        onValueChange={([v]) => setSpecialForm({ ...specialForm, discount_percentage: v })}
                        min={1}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        100% = completely free, 50% = half price
                      </p>
                    </div>
                    <div>
                      <Label>Valid Until (optional)</Label>
                      <Input 
                        type="date" 
                        value={specialForm.valid_until} 
                        onChange={(e) => setSpecialForm({ ...specialForm, valid_until: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label>Max Redemptions (optional)</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={specialForm.max_redemptions} 
                        onChange={(e) => setSpecialForm({ ...specialForm, max_redemptions: e.target.value })} 
                        placeholder="Unlimited" 
                      />
                    </div>

                    {/* Preview */}
                    <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                      <p className="font-semibold">Preview:</p>
                      <p>Code: <span className="font-mono">{specialForm.code || '...'}</span></p>
                      <p>{specialForm.discount_percentage}% off for {specialForm.free_months} month{specialForm.free_months > 1 ? 's' : ''} on {specialForm.plan_tier}</p>
                      <p className="text-muted-foreground">No 5-day free trial — billing starts immediately</p>
                    </div>

                    <Button onClick={createSpecialPromo} disabled={loading} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
                      Create in Stripe
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {specialPromos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No special promo codes yet</p>
                  <p className="text-sm">Create one to offer free months without a trial period</p>
                </div>
              ) : (
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Months</TableHead>
                      <TableHead>Redeemed</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialPromos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono font-semibold">{p.code}</TableCell>
                        <TableCell><Badge variant="outline">{p.plan_tier.charAt(0).toUpperCase() + p.plan_tier.slice(1)}</Badge></TableCell>
                        <TableCell>{p.discount_percentage}%</TableCell>
                        <TableCell>{p.free_months} mo</TableCell>
                        <TableCell>{p.redemption_count}{p.max_redemptions ? `/${p.max_redemptions}` : ''}</TableCell>
                        <TableCell>{p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '∞'}</TableCell>
                        <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleSpecialPromo(p)}>
                            {p.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteSpecialPromo(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
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