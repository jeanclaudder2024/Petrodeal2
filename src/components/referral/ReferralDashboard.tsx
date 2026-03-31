import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Users, Tag, TrendingUp, Copy, Plus, Banknote, Send, Clock, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b'];

const statusColors: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disabled: 'bg-gray-100 text-gray-800',
  paid: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const ReferralDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCode, setShowCreateCode] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', code_type: 'platform_subscription' });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [bankForm, setBankForm] = useState({ bank_name: '', bank_swift: '', bank_account: '', bank_holder_name: '' });
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: memberData } = await supabase.from('referral_members').select('*').eq('user_id', user!.id).eq('status', 'active').single();
    if (!memberData) { setLoading(false); return; }
    setMember(memberData);
    setBankForm({
      bank_name: memberData.bank_name || '',
      bank_swift: memberData.bank_swift || '',
      bank_account: memberData.bank_account || '',
      bank_holder_name: memberData.bank_holder_name || '',
    });

    const [codesRes, convsRes, payoutsRes] = await Promise.all([
      supabase.from('referral_promo_codes').select('*').eq('referral_member_id', memberData.id).order('created_at', { ascending: false }),
      supabase.from('referral_conversions').select('*, referral_promo_codes(code)').eq('referral_member_id', memberData.id).order('created_at', { ascending: false }),
      supabase.from('referral_payout_requests').select('*').eq('referral_member_id', memberData.id).order('created_at', { ascending: false }),
    ]);
    setPromoCodes(codesRes.data || []);
    setConversions(convsRes.data || []);
    setPayoutRequests(payoutsRes.data || []);
    setLoading(false);
  };

  const generateCode = () => {
    const prefix = newCode.code_type === 'broker_imfpa' ? 'BRK' : 'REF';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewCode(prev => ({ ...prev, code: `${prefix}-${random}` }));
  };

  const handleCreateCode = async () => {
    if (!newCode.code.trim() || !member) return;
    const bonusAmount = newCode.code_type === 'broker_imfpa' ? 100 : 15;
    const bonusType = newCode.code_type === 'broker_imfpa' ? 'fixed' : 'percentage';
    const { error } = await supabase.from('referral_promo_codes').insert({
      referral_member_id: member.id,
      code: newCode.code.toUpperCase(),
      code_type: newCode.code_type,
      bonus_amount: bonusAmount,
      bonus_type: bonusType,
      status: 'pending',
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Promo code submitted for approval' });
      setShowCreateCode(false);
      setNewCode({ code: '', code_type: 'platform_subscription' });
      fetchData();
    }
  };

  const handleRequestPayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0 || amt > (member?.pending_balance || 0)) {
      toast({ title: 'Error', description: 'Invalid amount', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('referral_payout_requests').insert({
      referral_member_id: member.id,
      amount: amt,
      status: 'pending',
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payout request submitted' });
      setShowPayoutDialog(false);
      setPayoutAmount('');
      fetchData();
    }
  };

  const handleSaveBank = async () => {
    if (!member) return;
    setSavingBank(true);
    const { error } = await supabase.from('referral_members').update(bankForm).eq('id', member.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Bank details updated' });
    }
    setSavingBank(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied', description: `${code} copied to clipboard` });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md text-center p-8">
          <CardTitle className="mb-2">Access Restricted</CardTitle>
          <CardDescription>You are not enrolled in the referral program. Contact admin for access.</CardDescription>
        </Card>
      </div>
    );
  }

  const activeCodesCount = promoCodes.filter(c => c.status === 'approved').length;
  const totalReferrals = conversions.length;

  // Chart data
  const monthlyData = conversions.reduce((acc: any[], c) => {
    const month = new Date(c.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
    const existing = acc.find(a => a.month === month);
    if (existing) { existing.earned += Number(c.bonus_earned || 0); existing.count += 1; }
    else acc.push({ month, earned: Number(c.bonus_earned || 0), count: 1 });
    return acc;
  }, []);

  const typeData = [
    { name: 'Broker IMFPA', value: conversions.filter(c => c.subscription_type === 'broker_imfpa').length },
    { name: 'Platform', value: conversions.filter(c => c.subscription_type === 'platform_subscription').length },
  ].filter(d => d.value > 0);

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    return `${local.substring(0, 2)}***@${domain}`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60 p-6 md:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">💰 Referral Program</h1>
          <p className="opacity-90 text-sm">Member since {new Date(member.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="h-4 w-4" />Total Earned</div>
            <p className="text-xl md:text-2xl font-bold">${Number(member.total_earned || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Wallet className="h-4 w-4" />Pending</div>
            <p className="text-xl md:text-2xl font-bold">${Number(member.pending_balance || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-4 w-4" />Referrals</div>
            <p className="text-xl md:text-2xl font-bold">{totalReferrals}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Tag className="h-4 w-4" />Active Codes</div>
            <p className="text-xl md:text-2xl font-bold">{activeCodesCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {(monthlyData.length > 0 || typeData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Earnings</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Earned']} />
                    <Bar dataKey="earned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          {typeData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Referrals by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {typeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Promo Codes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">My Promo Codes</CardTitle>
            <CardDescription>Create and manage your referral codes</CardDescription>
          </div>
          <Dialog open={showCreateCode} onOpenChange={setShowCreateCode}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Create Code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Promo Code</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Code Type</Label>
                  <Select value={newCode.code_type} onValueChange={v => setNewCode(p => ({ ...p, code_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broker_imfpa">Broker IMFPA ($100 bonus)</SelectItem>
                      <SelectItem value="platform_subscription">Platform Subscription (15% bonus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Promo Code</Label>
                  <div className="flex gap-2">
                    <Input value={newCode.code} onChange={e => setNewCode(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="YOUR-CODE" />
                    <Button variant="outline" onClick={generateCode} type="button">Generate</Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Code will be submitted for admin approval before activation.</p>
                <Button onClick={handleCreateCode} className="w-full">Submit for Approval</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
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
                    <TableCell><Badge variant="outline">{pc.code_type === 'broker_imfpa' ? 'Broker' : 'Platform'}</Badge></TableCell>
                    <TableCell>{pc.bonus_type === 'fixed' ? `$${pc.bonus_amount}` : `${pc.bonus_amount}%`}</TableCell>
                    <TableCell>{pc.usage_count}</TableCell>
                    <TableCell><Badge className={statusColors[pc.status] || ''}>{pc.status}</Badge></TableCell>
                    <TableCell>
                      {pc.status === 'approved' && (
                        <Button size="sm" variant="ghost" onClick={() => copyCode(pc.code)}><Copy className="h-3 w-3" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {promoCodes.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No promo codes yet. Create your first one!</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Referrals</CardTitle>
          <CardDescription>Track your referral conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversions.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{maskEmail(c.subscriber_email || '')}</TableCell>
                    <TableCell><Badge variant="outline">{c.subscription_type === 'broker_imfpa' ? 'Broker' : 'Platform'}</Badge></TableCell>
                    <TableCell>${Number(c.subscription_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="font-medium text-green-600">${Number(c.bonus_earned || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[c.status] || ''}>
                        {c.status === 'pending' && <Clock className="h-3 w-3 mr-1 inline" />}
                        {c.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {conversions.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No referrals yet. Share your promo code to start earning!</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payout + Bank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payout */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Payouts</CardTitle>
              <CardDescription>Balance: ${Number(member.pending_balance || 0).toFixed(2)}</CardDescription>
            </div>
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={(member.pending_balance || 0) <= 0}><Banknote className="h-4 w-4 mr-1" />Request Payout</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Available: <strong>${Number(member.pending_balance || 0).toFixed(2)}</strong></p>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input type="number" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} max={member.pending_balance} />
                  </div>
                  <Button onClick={handleRequestPayout} className="w-full">Submit Request</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payoutRequests.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 border rounded text-sm">
                  <span className="font-medium">${Number(p.amount).toFixed(2)}</span>
                  <Badge className={statusColors[p.status] || ''}>{p.status}</Badge>
                  <span className="text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {payoutRequests.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No payout requests</p>}
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank Account</CardTitle>
            <CardDescription>For receiving payout transfers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Bank Name</Label>
              <Input value={bankForm.bank_name} onChange={e => setBankForm(p => ({ ...p, bank_name: e.target.value }))} />
            </div>
            <div>
              <Label>SWIFT Code</Label>
              <Input value={bankForm.bank_swift} onChange={e => setBankForm(p => ({ ...p, bank_swift: e.target.value }))} />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={bankForm.bank_account} onChange={e => setBankForm(p => ({ ...p, bank_account: e.target.value }))} />
            </div>
            <div>
              <Label>Account Holder Name</Label>
              <Input value={bankForm.bank_holder_name} onChange={e => setBankForm(p => ({ ...p, bank_holder_name: e.target.value }))} />
            </div>
            <Button onClick={handleSaveBank} disabled={savingBank} className="w-full">{savingBank ? 'Saving...' : 'Save Bank Details'}</Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Admin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Suggest a Referral</CardTitle>
            <CardDescription>Tell admin about someone you referred who registered</CardDescription>
          </div>
          <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Send className="h-4 w-4 mr-1" />Contact Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Suggest a Referral</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Referred Person's Email</Label>
                  <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="referred@example.com" />
                </div>
                <div>
                  <Label>Message (optional)</Label>
                  <Textarea value={contactMessage} onChange={e => setContactMessage(e.target.value)} placeholder="This person registered using my referral..." />
                </div>
                <Button onClick={() => {
                  toast({ title: 'Submitted', description: 'Your referral suggestion has been sent to admin for review.' });
                  setShowContactDialog(false);
                  setContactEmail('');
                  setContactMessage('');
                }} className="w-full">Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>
    </div>
  );
};

export default ReferralDashboard;
