import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Search, Eye, CheckCircle, XCircle, Trash2, Download, Clock, AlertTriangle, Plus, Edit, Save, Loader2
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface IMFPAAgreement {
  imfpa_id: string;
  deal_id: string;
  imfpa_reference_code: string | null;
  status: string;
  broker_role: string | null;
  broker_entity_name: string | null;
  seller_entity_name: string | null;
  buyer_entity_name: string | null;
  commodity_type: string | null;
  commission_type: string | null;
  commission_value: number | null;
  currency: string | null;
  payment_method: string | null;
  payment_trigger: string | null;
  valid_from: string | null;
  valid_until: string | null;
  governing_law: string | null;
  jurisdiction: string | null;
  signed_by_broker: boolean;
  signed_by_seller: boolean;
  signed_by_buyer: boolean;
  document_url: string | null;
  created_at: string;
  created_by: string | null;
  assigned_to_broker_id: string | null;
}

interface BrokerOption {
  id: string;
  full_name: string;
  company_name: string | null;
  user_id: string;
}

const IMFPAManagement = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [agreements, setAgreements] = useState<IMFPAAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<IMFPAAgreement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<IMFPAAgreement>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [brokerDeals, setBrokerDeals] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [creatingImfpa, setCreatingImfpa] = useState(false);
  const [createForm, setCreateForm] = useState({
    broker_id: '',
    deal_id: '',
    seller_entity_name: '',
    buyer_entity_name: '',
    commodity_type: 'crude_oil',
    commission_type: 'percentage',
    commission_value: '',
    currency: 'USD',
    payment_method: 'mt103',
    payment_trigger: 'upon_bl_release',
    governing_law: 'English Law',
    jurisdiction: 'London, UK',
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAgreements();
    fetchBrokers();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.from('imfpa_agreements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAgreements(data || []);
    } catch (error) {
      console.error('Error fetching IMFPA agreements:', error);
      toast({ title: "Error", description: "Failed to load IMFPA agreements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      const { data } = await supabase.from('broker_profiles').select('id, full_name, company_name, user_id').order('full_name');
      setBrokers(data || []);
    } catch (e) { /* silent */ }
  };

  const fetchBrokerDeals = async (brokerId: string) => {
    try {
      const { data } = await supabase.from('broker_deals').select('id, deal_type, cargo_type, status, seller_company_name, buyer_company_name').eq('broker_id', brokerId);
      setBrokerDeals(data || []);
    } catch (e) { /* silent */ }
  };

  const logStatusChange = async (imfpaId: string, oldStatus: string, newStatus: string, notes?: string) => {
    try {
      await supabase.from('imfpa_status_history' as any).insert({
        imfpa_id: imfpaId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: user?.id,
        notes: notes || `Status changed by admin`,
      });
    } catch (e) { /* silent */ }
  };

  const handleStatusChange = async (imfpaId: string, oldStatus: string, newStatus: string) => {
    try {
      const { error } = await db.from('imfpa_agreements').update({ status: newStatus }).eq('imfpa_id', imfpaId);
      if (error) throw error;
      await logStatusChange(imfpaId, oldStatus, newStatus);
      toast({ title: "Success", description: `Status changed to ${newStatus}` });
      fetchAgreements();
      if (selectedAgreement?.imfpa_id === imfpaId) {
        setSelectedAgreement(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (imfpaId: string) => {
    if (!confirm('Are you sure you want to delete this IMFPA agreement?')) return;
    try {
      const { error } = await db.from('imfpa_agreements').delete().eq('imfpa_id', imfpaId);
      if (error) throw error;
      toast({ title: "Success", description: "IMFPA agreement deleted" });
      fetchAgreements();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete agreement", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedAgreement) return;
    setSavingEdit(true);
    try {
      const { error } = await db.from('imfpa_agreements').update(editData).eq('imfpa_id', selectedAgreement.imfpa_id);
      if (error) throw error;
      if (editData.status && editData.status !== selectedAgreement.status) {
        await logStatusChange(selectedAgreement.imfpa_id, selectedAgreement.status, editData.status, 'Status changed via inline edit');
      }
      toast({ title: "Success", description: "Agreement updated" });
      setIsEditing(false);
      fetchAgreements();
      setSelectedAgreement(prev => prev ? { ...prev, ...editData } : null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update agreement", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateImfpa = async () => {
    if (!createForm.broker_id) {
      toast({ title: "Error", description: "Please select a broker", variant: "destructive" });
      return;
    }
    setCreatingImfpa(true);
    try {
      const date = format(new Date(), 'yyyyMMdd');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const refCode = `IMFPA-${date}-${random}`;

      const broker = brokers.find(b => b.id === createForm.broker_id);
      const insertData: any = {
        imfpa_reference_code: refCode,
        status: 'draft',
        broker_role: 'mandate_holder',
        broker_entity_name: broker?.company_name || broker?.full_name || '',
        seller_entity_name: createForm.seller_entity_name || null,
        buyer_entity_name: createForm.buyer_entity_name || null,
        commodity_type: createForm.commodity_type,
        commission_type: createForm.commission_type,
        commission_value: createForm.commission_value ? parseFloat(createForm.commission_value) : null,
        currency: createForm.currency,
        payment_method: createForm.payment_method,
        payment_trigger: createForm.payment_trigger,
        governing_law: createForm.governing_law,
        jurisdiction: createForm.jurisdiction,
        valid_from: createForm.valid_from,
        valid_until: createForm.valid_until,
        created_by: user?.id,
        assigned_to_broker_id: createForm.broker_id,
        deal_id: createForm.deal_id || null,
        signed_by_broker: false,
        signed_by_seller: false,
        signed_by_buyer: false,
      };

      const { error } = await supabase.from('imfpa_agreements' as any).insert(insertData);
      if (error) throw error;

      toast({ title: "Success", description: "IMFPA created and assigned to broker" });
      setIsCreateOpen(false);
      setCreateForm({
        broker_id: '', deal_id: '', seller_entity_name: '', buyer_entity_name: '',
        commodity_type: 'crude_oil', commission_type: 'percentage', commission_value: '',
        currency: 'USD', payment_method: 'mt103', payment_trigger: 'upon_bl_release',
        governing_law: 'English Law', jurisdiction: 'London, UK',
        valid_from: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
      fetchAgreements();
    } catch (error) {
      console.error('Error creating IMFPA:', error);
      toast({ title: "Error", description: "Failed to create IMFPA", variant: "destructive" });
    } finally {
      setCreatingImfpa(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      draft: { variant: 'secondary', icon: <Clock className="h-3 w-3 mr-1" /> },
      pending: { variant: 'outline', icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      active: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      completed: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    const c = config[status] || config.draft;
    return <Badge variant={c.variant} className="flex items-center gap-1">{c.icon}{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const filteredAgreements = agreements.filter(a =>
    a.imfpa_reference_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.broker_entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.seller_entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.buyer_entity_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: agreements.length,
    draft: agreements.filter(a => a.status === 'draft').length,
    pending: agreements.filter(a => a.status === 'pending').length,
    active: agreements.filter(a => a.status === 'active').length,
    completed: agreements.filter(a => a.status === 'completed').length,
  };

  const openDetailDialog = (agreement: IMFPAAgreement) => {
    setSelectedAgreement(agreement);
    setEditData({ ...agreement });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              IMFPA Agreement Management
            </CardTitle>
            <CardDescription>Review, approve, create, and manage IMFPA agreements</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create IMFPA
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-muted/30 text-primary' },
            { label: 'Draft', value: stats.draft, cls: 'bg-muted/30 text-muted-foreground' },
            { label: 'Pending', value: stats.pending, cls: 'bg-amber-500/10 text-amber-600' },
            { label: 'Active', value: stats.active, cls: 'bg-emerald-500/10 text-emerald-600' },
            { label: 'Completed', value: stats.completed, cls: 'bg-blue-500/10 text-blue-600' },
          ].map(s => (
            <div key={s.label} className={`text-center p-3 rounded-lg ${s.cls.split(' ')[0]}`}>
              <div className={`text-2xl font-bold ${s.cls.split(' ')[1]}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by reference, broker, seller, or buyer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
            ) : filteredAgreements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No IMFPA agreements found</p>
            ) : (
              filteredAgreements.map(a => (
                <Card key={a.imfpa_id} className="border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{a.imfpa_reference_code || a.imfpa_id.slice(0, 8)}</span>
                      {getStatusBadge(a.status)}
                    </div>
                    <div className="text-sm font-medium">{a.broker_entity_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">
                      S: {a.seller_entity_name || 'TBD'} • B: {a.buyer_entity_name || 'TBD'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.commodity_type || 'N/A'} • {a.commission_value ? `${a.commission_value}${a.commission_type === 'percentage' ? '%' : ` ${a.currency}`}` : 'N/A'}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetailDialog(a)}>
                        <Eye className="h-3 w-3 mr-1" />View
                      </Button>
                      {a.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => handleStatusChange(a.imfpa_id, a.status, 'active')}>
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange(a.imfpa_id, a.status, 'rejected')}>
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(a.imfpa_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredAgreements.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No IMFPA agreements found</TableCell></TableRow>
                ) : (
                  filteredAgreements.map(a => (
                    <TableRow key={a.imfpa_id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{a.imfpa_reference_code || a.imfpa_id.slice(0, 8)}</TableCell>
                      <TableCell>{a.broker_entity_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-0.5">
                          <div><span className="text-muted-foreground">S:</span> {a.seller_entity_name || 'TBD'}</div>
                          <div><span className="text-muted-foreground">B:</span> {a.buyer_entity_name || 'TBD'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{a.commodity_type || 'N/A'}</TableCell>
                      <TableCell>
                        {a.commission_value ? `${a.commission_value}${a.commission_type === 'percentage' ? '%' : ` ${a.currency || 'USD'}`}` : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusBadge(a.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={a.signed_by_broker ? 'default' : 'outline'} className="text-xs">B</Badge>
                          <Badge variant={a.signed_by_seller ? 'default' : 'outline'} className="text-xs">S</Badge>
                          <Badge variant={a.signed_by_buyer ? 'default' : 'outline'} className="text-xs">Byr</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openDetailDialog(a)}><Eye className="h-4 w-4" /></Button>
                          {a.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(a.imfpa_id, a.status, 'active')} className="text-emerald-600 hover:bg-emerald-50"><CheckCircle className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(a.imfpa_id, a.status, 'rejected')} className="text-destructive hover:bg-destructive/10"><XCircle className="h-4 w-4" /></Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleDelete(a.imfpa_id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Detail / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                IMFPA Agreement Details
              </DialogTitle>
              <Button size="sm" variant={isEditing ? 'default' : 'outline'} onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-3 w-3 mr-1" />{isEditing ? 'Cancel Edit' : 'Edit'}
              </Button>
            </div>
            <DialogDescription>Review and manage agreement details</DialogDescription>
          </DialogHeader>

          {selectedAgreement && (
            <div className="space-y-4">
              {/* Status Override */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Reference Code</Label>
                  <p className="font-mono text-sm">{selectedAgreement.imfpa_reference_code || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  {isEditing ? (
                    <Select value={editData.status || selectedAgreement.status} onValueChange={v => setEditData(p => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['draft', 'pending', 'active', 'completed', 'rejected'].map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="mt-1">{getStatusBadge(selectedAgreement.status)}</div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Editable Fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'broker_entity_name', label: 'Broker Entity' },
                  { key: 'broker_role', label: 'Broker Role' },
                  { key: 'seller_entity_name', label: 'Seller' },
                  { key: 'buyer_entity_name', label: 'Buyer' },
                  { key: 'commodity_type', label: 'Commodity' },
                  { key: 'commission_type', label: 'Commission Type' },
                  { key: 'commission_value', label: 'Commission Value' },
                  { key: 'currency', label: 'Currency' },
                  { key: 'payment_method', label: 'Payment Method' },
                  { key: 'payment_trigger', label: 'Payment Trigger' },
                  { key: 'governing_law', label: 'Governing Law' },
                  { key: 'jurisdiction', label: 'Jurisdiction' },
                ].map(f => (
                  <div key={f.key}>
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    {isEditing ? (
                      <Input
                        className="h-8 mt-1 text-sm"
                        value={(editData as any)[f.key] ?? (selectedAgreement as any)[f.key] ?? ''}
                        onChange={e => setEditData(p => ({ ...p, [f.key]: f.key === 'commission_value' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm mt-0.5 capitalize">{(selectedAgreement as any)[f.key] || 'N/A'}</p>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Valid From</Label>
                  {isEditing ? (
                    <Input type="date" className="h-8 mt-1" value={editData.valid_from ?? selectedAgreement.valid_from ?? ''} onChange={e => setEditData(p => ({ ...p, valid_from: e.target.value }))} />
                  ) : (
                    <p className="text-sm">{selectedAgreement.valid_from ? format(new Date(selectedAgreement.valid_from), 'MMM dd, yyyy') : 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valid Until</Label>
                  {isEditing ? (
                    <Input type="date" className="h-8 mt-1" value={editData.valid_until ?? selectedAgreement.valid_until ?? ''} onChange={e => setEditData(p => ({ ...p, valid_until: e.target.value }))} />
                  ) : (
                    <p className="text-sm">{selectedAgreement.valid_until ? format(new Date(selectedAgreement.valid_until), 'MMM dd, yyyy') : 'N/A'}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Signatures */}
              <div>
                <Label className="text-xs text-muted-foreground">Signatures</Label>
                <div className="flex gap-3 mt-1">
                  <Badge variant={selectedAgreement.signed_by_broker ? 'default' : 'outline'}>{selectedAgreement.signed_by_broker ? '✓' : '○'} Broker</Badge>
                  <Badge variant={selectedAgreement.signed_by_seller ? 'default' : 'outline'}>{selectedAgreement.signed_by_seller ? '✓' : '○'} Seller</Badge>
                  <Badge variant={selectedAgreement.signed_by_buyer ? 'default' : 'outline'}>{selectedAgreement.signed_by_buyer ? '✓' : '○'} Buyer</Badge>
                </div>
              </div>

              {selectedAgreement.document_url && (
                <>
                  <Separator />
                  <Button variant="outline" className="flex items-center gap-2" asChild>
                    <a href={selectedAgreement.document_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />Download Document
                    </a>
                  </Button>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            {isEditing && (
              <Button onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes
              </Button>
            )}
            {!isEditing && selectedAgreement?.status === 'pending' && (
              <>
                <Button onClick={() => handleStatusChange(selectedAgreement.imfpa_id, selectedAgreement.status, 'active')} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="h-4 w-4 mr-1" />Approve
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange(selectedAgreement.imfpa_id, selectedAgreement.status, 'rejected')} className="text-destructive border-destructive/30">
                  <XCircle className="h-4 w-4 mr-1" />Reject
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create IMFPA Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Create IMFPA Agreement</DialogTitle>
            <DialogDescription>Create and assign an IMFPA to a broker</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Assign to Broker *</Label>
              <Select value={createForm.broker_id} onValueChange={v => { setCreateForm(p => ({ ...p, broker_id: v, deal_id: '' })); fetchBrokerDeals(v); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select broker" /></SelectTrigger>
                <SelectContent>
                  {brokers.map(b => <SelectItem key={b.id} value={b.id}>{b.full_name} {b.company_name ? `(${b.company_name})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {createForm.broker_id && (
              <div>
                <Label className="text-xs">Link to Deal (optional)</Label>
                <Select value={createForm.deal_id || '__none__'} onValueChange={v => setCreateForm(p => ({ ...p, deal_id: v === '__none__' ? '' : v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="No deal — standalone IMFPA" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No deal — standalone</SelectItem>
                    {brokerDeals.map(d => <SelectItem key={d.id} value={d.id}>{d.cargo_type || d.deal_type} — {d.status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Seller Entity</Label>
                <Input className="mt-1 h-8" value={createForm.seller_entity_name} onChange={e => setCreateForm(p => ({ ...p, seller_entity_name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Buyer Entity</Label>
                <Input className="mt-1 h-8" value={createForm.buyer_entity_name} onChange={e => setCreateForm(p => ({ ...p, buyer_entity_name: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Commodity</Label>
                <Select value={createForm.commodity_type} onValueChange={v => setCreateForm(p => ({ ...p, commodity_type: v }))}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crude_oil">Crude Oil</SelectItem>
                    <SelectItem value="refined_products">Refined Products</SelectItem>
                    <SelectItem value="lng">LNG</SelectItem>
                    <SelectItem value="lpg">LPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Commission Type</Label>
                <Select value={createForm.commission_type} onValueChange={v => setCreateForm(p => ({ ...p, commission_type: v }))}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="per_bbl">Per Barrel</SelectItem>
                    <SelectItem value="lump_sum">Lump Sum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Commission Value (suggested)</Label>
                <Input className="mt-1 h-8" type="number" step="0.01" value={createForm.commission_value} onChange={e => setCreateForm(p => ({ ...p, commission_value: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={createForm.currency} onValueChange={v => setCreateForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Governing Law</Label>
                <Select value={createForm.governing_law} onValueChange={v => setCreateForm(p => ({ ...p, governing_law: v }))}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English Law">English Law</SelectItem>
                    <SelectItem value="Swiss Law">Swiss Law</SelectItem>
                    <SelectItem value="Singapore Law">Singapore Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Jurisdiction</Label>
                <Select value={createForm.jurisdiction} onValueChange={v => setCreateForm(p => ({ ...p, jurisdiction: v }))}>
                  <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="London, UK">London, UK</SelectItem>
                    <SelectItem value="Geneva, Switzerland">Geneva, Switzerland</SelectItem>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Valid From</Label>
                <Input className="mt-1 h-8" type="date" value={createForm.valid_from} onChange={e => setCreateForm(p => ({ ...p, valid_from: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Valid Until</Label>
                <Input className="mt-1 h-8" type="date" value={createForm.valid_until} onChange={e => setCreateForm(p => ({ ...p, valid_until: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateImfpa} disabled={creatingImfpa || !createForm.broker_id}>
              {creatingImfpa ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Create & Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default IMFPAManagement;
