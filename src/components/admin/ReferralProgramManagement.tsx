import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Tag, ArrowRightLeft, Banknote, Settings, Plus, Check, X, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disabled: 'bg-gray-100 text-gray-800',
  paid: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const ReferralProgramManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberNotes, setAddMemberNotes] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [detailMember, setDetailMember] = useState<any>(null);

  useEffect(() => {
    fetchMembers();
    fetchPromoCodes();
    fetchConversions();
    fetchPayouts();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from('referral_members').select('*').order('created_at', { ascending: false });
    if (data) {
      // Fetch emails for each member
      const enriched = await Promise.all(data.map(async (m: any) => {
        const { data: emailData } = await supabase.rpc('get_user_email_by_id', { user_uuid: m.user_id });
        return { ...m, email: emailData || 'Unknown' };
      }));
      setMembers(enriched);
    }
  };

  const fetchPromoCodes = async () => {
    const { data } = await supabase.from('referral_promo_codes').select('*, referral_members(user_id)').order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all(data.map(async (pc: any) => {
        const userId = pc.referral_members?.user_id;
        if (userId) {
          const { data: emailData } = await supabase.rpc('get_user_email_by_id', { user_uuid: userId });
          return { ...pc, referrer_email: emailData || 'Unknown' };
        }
        return { ...pc, referrer_email: 'Unknown' };
      }));
      setPromoCodes(enriched);
    }
  };

  const fetchConversions = async () => {
    const { data } = await supabase.from('referral_conversions').select('*, referral_promo_codes(code), referral_members(user_id)').order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all(data.map(async (c: any) => {
        const userId = c.referral_members?.user_id;
        if (userId) {
          const { data: emailData } = await supabase.rpc('get_user_email_by_id', { user_uuid: userId });
          return { ...c, referrer_email: emailData || 'Unknown' };
        }
        return { ...c, referrer_email: 'Unknown' };
      }));
      setConversions(enriched);
    }
  };

  const fetchPayouts = async () => {
    const { data } = await supabase.from('referral_payout_requests').select('*, referral_members(user_id, bank_name, bank_account, bank_swift, bank_holder_name)').order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all(data.map(async (p: any) => {
        const userId = p.referral_members?.user_id;
        if (userId) {
          const { data: emailData } = await supabase.rpc('get_user_email_by_id', { user_uuid: userId });
          return { ...p, referrer_email: emailData || 'Unknown' };
        }
        return { ...p, referrer_email: 'Unknown' };
      }));
      setPayouts(enriched);
    }
  };

  const handleAddMember = async () => {
    if (!addMemberEmail.trim()) return;
    setLoading(true);
    const { data: userId } = await supabase.rpc('get_user_id_by_email', { user_email: addMemberEmail.trim() });
    if (!userId) {
      toast({ title: 'Error', description: 'User not found with that email', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from('referral_members').insert({
      user_id: userId,
      status: 'active',
      notes: addMemberNotes || null,
      created_by: me?.user?.id || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Referrer enrolled successfully' });
      setShowAddDialog(false);
      setAddMemberEmail('');
      setAddMemberNotes('');
      fetchMembers();
    }
    setLoading(false);
  };

  const toggleMemberStatus = async (id: string, current: string) => {
    const newStatus = current === 'active' ? 'suspended' : 'active';
    await supabase.from('referral_members').update({ status: newStatus }).eq('id', id);
    fetchMembers();
    toast({ title: 'Updated', description: `Member ${newStatus}` });
  };

  const handlePromoCodeAction = async (id: string, action: 'approved' | 'rejected') => {
    const { data: me } = await supabase.auth.getUser();
    await supabase.from('referral_promo_codes').update({
      status: action,
      approved_by: me?.user?.id || null,
      approved_at: new Date().toISOString(),
    }).eq('id', id);
    fetchPromoCodes();
    toast({ title: 'Updated', description: `Promo code ${action}` });
  };

  const handleConversionApprove = async (conv: any) => {
    const { data: me } = await supabase.auth.getUser();
    // Update conversion status
    await supabase.from('referral_conversions').update({
      status: 'approved',
      approved_by: me?.user?.id || null,
    }).eq('id', conv.id);
    // Credit referrer's pending_balance
    const { data: member } = await supabase.from('referral_members').select('pending_balance, total_earned').eq('id', conv.referral_member_id).single();
    if (member) {
      await supabase.from('referral_members').update({
        pending_balance: (member.pending_balance || 0) + conv.bonus_earned,
        total_earned: (member.total_earned || 0) + conv.bonus_earned,
      }).eq('id', conv.referral_member_id);
    }
    fetchConversions();
    fetchMembers();
    toast({ title: 'Approved', description: `$${conv.bonus_earned} credited to referrer` });
  };

  const handlePayoutAction = async (payout: any, action: 'approved' | 'completed' | 'rejected') => {
    const { data: me } = await supabase.auth.getUser();
    const updates: any = {
      status: action,
      processed_by: me?.user?.id || null,
      processed_at: new Date().toISOString(),
    };
    await supabase.from('referral_payout_requests').update(updates).eq('id', payout.id);

    if (action === 'completed') {
      const { data: member } = await supabase.from('referral_members').select('pending_balance, total_paid').eq('id', payout.referral_member_id).single();
      if (member) {
        await supabase.from('referral_members').update({
          pending_balance: Math.max(0, (member.pending_balance || 0) - payout.amount),
          total_paid: (member.total_paid || 0) + payout.amount,
        }).eq('id', payout.referral_member_id);
      }
    }
    fetchPayouts();
    fetchMembers();
    toast({ title: 'Updated', description: `Payout ${action}` });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex min-w-max gap-1 h-auto flex-nowrap p-1">
            <TabsTrigger value="members" className="flex items-center gap-1.5 whitespace-nowrap"><Users className="h-4 w-4" />Members</TabsTrigger>
            <TabsTrigger value="promo-codes" className="flex items-center gap-1.5 whitespace-nowrap"><Tag className="h-4 w-4" />Promo Codes</TabsTrigger>
            <TabsTrigger value="conversions" className="flex items-center gap-1.5 whitespace-nowrap"><ArrowRightLeft className="h-4 w-4" />Conversions</TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-1.5 whitespace-nowrap"><Banknote className="h-4 w-4" />Payouts</TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 whitespace-nowrap"><Settings className="h-4 w-4" />Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* MEMBERS TAB */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Referral Members</CardTitle>
                <CardDescription>Users enrolled in the referral program</CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Referrer</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Enroll New Referrer</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>User Email</Label>
                      <Input placeholder="user@example.com" value={addMemberEmail} onChange={e => setAddMemberEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label>Admin Notes (optional)</Label>
                      <Textarea placeholder="Notes..." value={addMemberNotes} onChange={e => setAddMemberNotes(e.target.value)} />
                    </div>
                    <Button onClick={handleAddMember} disabled={loading} className="w-full">
                      {loading ? 'Adding...' : 'Enroll Referrer'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total Earned</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.email}</TableCell>
                        <TableCell><Badge className={statusColors[m.status] || ''}>{m.status}</Badge></TableCell>
                        <TableCell>${Number(m.total_earned || 0).toFixed(2)}</TableCell>
                        <TableCell>${Number(m.pending_balance || 0).toFixed(2)}</TableCell>
                        <TableCell>${Number(m.total_paid || 0).toFixed(2)}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => toggleMemberStatus(m.id, m.status)}>
                            {m.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDetailMember(m)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {members.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No referral members yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detail Dialog */}
          <Dialog open={!!detailMember} onOpenChange={() => setDetailMember(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Member Details</DialogTitle></DialogHeader>
              {detailMember && (
                <div className="space-y-3 text-sm">
                  <p><strong>Email:</strong> {detailMember.email}</p>
                  <p><strong>Status:</strong> {detailMember.status}</p>
                  <p><strong>Total Earned:</strong> ${Number(detailMember.total_earned || 0).toFixed(2)}</p>
                  <p><strong>Pending Balance:</strong> ${Number(detailMember.pending_balance || 0).toFixed(2)}</p>
                  <p><strong>Total Paid:</strong> ${Number(detailMember.total_paid || 0).toFixed(2)}</p>
                  <p><strong>Bank:</strong> {detailMember.bank_name || 'Not set'}</p>
                  <p><strong>Account:</strong> {detailMember.bank_account || 'Not set'}</p>
                  <p><strong>SWIFT:</strong> {detailMember.bank_swift || 'Not set'}</p>
                  <p><strong>Holder:</strong> {detailMember.bank_holder_name || 'Not set'}</p>
                  <p><strong>Notes:</strong> {detailMember.notes || 'None'}</p>
                  <p><strong>Joined:</strong> {new Date(detailMember.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* PROMO CODES TAB */}
        <TabsContent value="promo-codes">
          <Card>
            <CardHeader>
              <CardTitle>Promo Codes</CardTitle>
              <CardDescription>Review and approve referral promo codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoCodes.map(pc => (
                      <TableRow key={pc.id}>
                        <TableCell className="font-mono font-medium">{pc.code}</TableCell>
                        <TableCell><Badge variant="outline">{pc.code_type === 'broker_imfpa' ? 'Broker IMFPA' : 'Platform'}</Badge></TableCell>
                        <TableCell>{pc.referrer_email}</TableCell>
                        <TableCell>{pc.bonus_type === 'fixed' ? `$${pc.bonus_amount}` : `${pc.bonus_amount}%`}</TableCell>
                        <TableCell>{pc.usage_count}{pc.max_uses ? `/${pc.max_uses}` : ''}</TableCell>
                        <TableCell><Badge className={statusColors[pc.status] || ''}>{pc.status}</Badge></TableCell>
                        <TableCell className="flex gap-1">
                          {pc.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handlePromoCodeAction(pc.id, 'approved')}><Check className="h-3 w-3" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handlePromoCodeAction(pc.id, 'rejected')}><X className="h-3 w-3" /></Button>
                            </>
                          )}
                          {pc.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => handlePromoCodeAction(pc.id, 'rejected')}>Disable</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {promoCodes.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No promo codes yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONVERSIONS TAB */}
        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Referral Conversions</CardTitle>
              <CardDescription>Track and approve referral bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscriber</TableHead>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversions.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>{c.subscriber_email}</TableCell>
                        <TableCell>{c.referrer_email}</TableCell>
                        <TableCell className="font-mono">{c.referral_promo_codes?.code}</TableCell>
                        <TableCell><Badge variant="outline">{c.subscription_type === 'broker_imfpa' ? 'Broker' : 'Platform'}</Badge></TableCell>
                        <TableCell>${Number(c.subscription_amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="font-medium text-green-600">${Number(c.bonus_earned || 0).toFixed(2)}</TableCell>
                        <TableCell><Badge className={statusColors[c.status] || ''}>{c.status}</Badge></TableCell>
                        <TableCell>
                          {c.status === 'pending' && (
                            <Button size="sm" onClick={() => handleConversionApprove(c)}>Approve Bonus</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {conversions.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No conversions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYOUTS TAB */}
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests</CardTitle>
              <CardDescription>Process referrer payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>SWIFT</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.referrer_email}</TableCell>
                        <TableCell className="font-medium">${Number(p.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>{p.referral_members?.bank_name || '-'}</TableCell>
                        <TableCell>{p.referral_members?.bank_account || '-'}</TableCell>
                        <TableCell>{p.referral_members?.bank_swift || '-'}</TableCell>
                        <TableCell><Badge className={statusColors[p.status] || ''}>{p.status}</Badge></TableCell>
                        <TableCell className="flex gap-1">
                          {p.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handlePayoutAction(p, 'approved')}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => handlePayoutAction(p, 'rejected')}>Reject</Button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <Button size="sm" onClick={() => handlePayoutAction(p, 'completed')}>Mark Completed</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {payouts.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payout requests yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program Settings</CardTitle>
              <CardDescription>Configure bonus rules and program parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="outline">Broker IMFPA</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">Plan price: $499</p>
                  <p className="text-sm text-muted-foreground">Fixed bonus per referral: <strong className="text-foreground">$100</strong></p>
                  <p className="text-xs text-muted-foreground mt-2">Referrer earns $100 for each new broker subscription through their promo code.</p>
                </div>
                <div className="space-y-2 p-4 border rounded-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Badge variant="outline">Platform Subscription</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">Percentage bonus: <strong className="text-foreground">15%</strong></p>
                  <p className="text-xs text-muted-foreground mt-2">Referrer earns 15% of the subscription amount paid by new users through their promo code.</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Program Flow</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Admin enrolls a user as referrer from the Members tab</li>
                  <li>Referrer creates a promo code from their dashboard (requires admin approval)</li>
                  <li>New users subscribe using the promo code</li>
                  <li>Conversion is recorded and awaits admin approval</li>
                  <li>Admin approves → bonus credited to referrer's pending balance</li>
                  <li>Referrer requests payout → admin processes bank transfer</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralProgramManagement;
