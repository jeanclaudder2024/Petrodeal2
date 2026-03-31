import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Shield,
  Building2,
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Copy,
  Send,
  Clock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface IMFPAData {
  imfpa_id?: string;
  deal_id: string;
  imfpa_reference_code?: string;
  status: string;
  broker_role: string;
  broker_entity_name: string;
  broker_registration_country: string;
  broker_company_number: string;
  seller_entity_name?: string;
  buyer_entity_name?: string;
  commodity_type: string;
  commission_type: string;
  commission_value: number;
  currency: string;
  payment_method: string;
  payment_trigger: string;
  bank_name: string;
  bank_swift: string;
  beneficiary_account_masked: string;
  valid_from: string;
  valid_until: string;
  governing_law: string;
  jurisdiction: string;
  signed_by_broker: boolean;
  signed_by_seller: boolean;
  signed_by_buyer: boolean;
  created_by?: string;
  assigned_to_broker_id?: string;
}

interface DealInfo {
  id: string;
  deal_type: string;
  cargo_type: string;
  status: string;
  steps_completed: number;
  total_steps: number;
  seller_company_name?: string;
  buyer_company_name?: string;
}

interface IMFPAAgreementProps {
  dealId?: string;
  dealInfo?: DealInfo;
  brokerProfile: {
    id?: string;
    full_name: string;
    company_name: string;
    country: string;
  };
  imfpaData?: IMFPAData;
  isAdminAssigned?: boolean;
  onClose?: () => void;
}

const STATUS_STEPS = [
  { key: 'draft', label: 'Draft', icon: FileText },
  { key: 'pending', label: 'Submitted', icon: Send },
  { key: 'active', label: 'Active', icon: CheckCircle },
  { key: 'completed', label: 'Completed', icon: Shield },
];

const IMFPAAgreement: React.FC<IMFPAAgreementProps> = ({ 
  dealId, 
  dealInfo, 
  brokerProfile, 
  imfpaData: externalImfpa,
  isAdminAssigned = false,
  onClose 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imfpa, setImfpa] = useState<IMFPAData | null>(null);

  useEffect(() => {
    if (externalImfpa) {
      setImfpa(externalImfpa);
      setLoading(false);
    } else if (dealId) {
      fetchIMFPA();
    }
  }, [dealId, externalImfpa]);

  const fetchIMFPA = async () => {
    try {
      const { data, error } = await supabase
        .from('imfpa_agreements' as any)
        .select('*')
        .eq('deal_id', dealId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setImfpa(data as any);
      } else {
        setImfpa({
          deal_id: dealId!,
          status: 'draft',
          broker_role: 'mandate_holder',
          broker_entity_name: brokerProfile.company_name || brokerProfile.full_name,
          broker_registration_country: brokerProfile.country || '',
          broker_company_number: '',
          seller_entity_name: dealInfo?.seller_company_name || '',
          buyer_entity_name: dealInfo?.buyer_company_name || '',
          commodity_type: dealInfo?.cargo_type || 'crude_oil',
          commission_type: 'percentage',
          commission_value: 0,
          currency: 'USD',
          payment_method: 'mt103',
          payment_trigger: 'upon_bl_release',
          bank_name: '',
          bank_swift: '',
          beneficiary_account_masked: '',
          valid_from: format(new Date(), 'yyyy-MM-dd'),
          valid_until: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          governing_law: 'English Law',
          jurisdiction: 'London, UK',
          signed_by_broker: false,
          signed_by_seller: false,
          signed_by_buyer: false,
        });
      }
    } catch (error) {
      console.error('Error fetching IMFPA:', error);
      toast.error('Failed to load IMFPA agreement');
    } finally {
      setLoading(false);
    }
  };

  const generateReferenceCode = () => {
    const date = format(new Date(), 'yyyyMMdd');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `IMFPA-${date}-${random}`;
  };

  const validateForSubmission = (): string[] => {
    const errors: string[] = [];
    if (!imfpa) return ['No IMFPA data'];
    if (!imfpa.commission_value || imfpa.commission_value <= 0) errors.push('Commission value must be greater than 0');
    if (!imfpa.bank_name?.trim()) errors.push('Bank name is required');
    if (!imfpa.bank_swift?.trim()) errors.push('SWIFT code is required');
    if (!imfpa.beneficiary_account_masked?.trim()) errors.push('Account number is required');
    return errors;
  };

  const validateForSigning = (): string[] => {
    const errors = validateForSubmission();
    if (!imfpa?.governing_law?.trim()) errors.push('Governing law is required');
    if (!imfpa?.jurisdiction?.trim()) errors.push('Jurisdiction is required');
    return errors;
  };

  const handleSave = async () => {
    if (!imfpa) return;
    setSaving(true);
    try {
      const dataToSave = {
        ...imfpa,
        imfpa_reference_code: imfpa.imfpa_reference_code || generateReferenceCode(),
        updated_at: new Date().toISOString(),
      };

      if (imfpa.imfpa_id) {
        const { error } = await supabase
          .from('imfpa_agreements' as any)
          .update(dataToSave)
          .eq('imfpa_id', imfpa.imfpa_id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('imfpa_agreements' as any)
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;
        setImfpa({ ...imfpa, imfpa_id: (data as any).imfpa_id, imfpa_reference_code: dataToSave.imfpa_reference_code });
      }
      toast.success('IMFPA agreement saved');
    } catch (error) {
      console.error('Error saving IMFPA:', error);
      toast.error('Failed to save IMFPA agreement');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    const errors = validateForSubmission();
    if (errors.length > 0) {
      toast.error('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }
    if (!imfpa?.imfpa_id) {
      await handleSave();
    }
    setSubmitting(true);
    try {
      // Save first if needed
      const refCode = imfpa!.imfpa_reference_code || generateReferenceCode();
      const saveData: any = {
        ...imfpa,
        imfpa_reference_code: refCode,
        status: 'pending',
        updated_at: new Date().toISOString(),
      };
      
      if (imfpa!.imfpa_id) {
        const { error } = await supabase
          .from('imfpa_agreements' as any)
          .update({ status: 'pending' })
          .eq('imfpa_id', imfpa!.imfpa_id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('imfpa_agreements' as any)
          .insert(saveData)
          .select()
          .single();
        if (error) throw error;
        setImfpa(prev => prev ? { ...prev, imfpa_id: (data as any).imfpa_id, imfpa_reference_code: refCode } : null);
      }

      // Log status change
      if (imfpa!.imfpa_id) {
        await supabase.from('imfpa_status_history' as any).insert({
          imfpa_id: imfpa!.imfpa_id,
          old_status: 'draft',
          new_status: 'pending',
          changed_by: user?.id,
          notes: 'Submitted for admin review by broker',
        });
      }

      setImfpa(prev => prev ? { ...prev, status: 'pending' } : null);
      toast.success('IMFPA submitted for admin review');
    } catch (error) {
      console.error('Error submitting IMFPA:', error);
      toast.error('Failed to submit for review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignBroker = async () => {
    if (!imfpa) return;
    const errors = validateForSigning();
    if (errors.length > 0) {
      toast.error('Please complete all required fields before signing:\n' + errors.join('\n'));
      return;
    }

    try {
      const { error } = await supabase
        .from('imfpa_agreements' as any)
        .update({ 
          signed_by_broker: true,
          signature_hash: `BROKER-${user?.id}-${Date.now()}`
        })
        .eq('imfpa_id', imfpa.imfpa_id);
      if (error) throw error;
      setImfpa(prev => prev ? { ...prev, signed_by_broker: true } : null);
      toast.success('Agreement signed successfully');
    } catch (error) {
      toast.error('Failed to sign agreement');
    }
  };

  const updateField = (field: keyof IMFPAData, value: any) => {
    setImfpa(prev => prev ? { ...prev, [field]: value } : null);
  };

  const copyReference = () => {
    if (imfpa?.imfpa_reference_code) {
      navigator.clipboard.writeText(imfpa.imfpa_reference_code);
      toast.success('Reference code copied');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!imfpa) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === imfpa.status);
  const isReadOnly = imfpa.status === 'active' || imfpa.status === 'completed';
  const canEdit = imfpa.status === 'draft' || imfpa.status === 'rejected';

  return (
    <div className="space-y-4">
      {/* Admin Assigned Badge */}
      {isAdminAssigned && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Assigned by Admin</p>
            <p className="text-xs text-muted-foreground">This IMFPA was created by the platform admin. Please review and complete your commission & banking details.</p>
          </div>
        </div>
      )}

      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">IMFPA Agreement</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-muted-foreground">
                    {imfpa.imfpa_reference_code || 'Draft — Not submitted'}
                  </span>
                  {imfpa.imfpa_reference_code && (
                    <button onClick={copyReference} className="text-muted-foreground hover:text-primary">
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const isCurrent = step.key === imfpa.status;
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                    isCurrent ? 'bg-primary text-primary-foreground' : 
                    isActive ? 'bg-primary/20 text-primary' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="h-3 w-3" />
                    {step.label}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <ArrowRight className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/30'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {imfpa.status === 'rejected' && (
            <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-md p-2 text-xs text-destructive">
              This agreement was rejected. Please update and resubmit.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal & Broker Information — Read Only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            Deal & Broker Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoField label="Broker Role" value={imfpa.broker_role?.replace(/_/g, ' ')} />
            <InfoField label="Broker Entity" value={imfpa.broker_entity_name} />
            <InfoField label="Country" value={imfpa.broker_registration_country} />
            <InfoField label="Company Number" value={imfpa.broker_company_number || 'Not set'} />
            <InfoField label="Seller" value={imfpa.seller_entity_name || 'To be determined'} />
            <InfoField label="Buyer" value={imfpa.buyer_entity_name || 'To be determined'} />
            <InfoField label="Commodity" value={imfpa.commodity_type?.replace(/_/g, ' ')} />
            <InfoField label="Governing Law" value={imfpa.governing_law} />
            <InfoField label="Jurisdiction" value={imfpa.jurisdiction} />
            <InfoField label="Payment Method" value={imfpa.payment_method?.replace(/_/g, ' ')?.toUpperCase()} />
            <InfoField label="Payment Trigger" value={imfpa.payment_trigger?.replace(/_/g, ' ')} />
            <InfoField 
              label="Validity" 
              value={`${imfpa.valid_from ? format(new Date(imfpa.valid_from), 'MMM dd, yyyy') : 'N/A'} — ${imfpa.valid_until ? format(new Date(imfpa.valid_until), 'MMM dd, yyyy') : 'N/A'}`} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission Terms — Editable by Broker */}
      <Card className={canEdit ? 'border-primary/30' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Banknote className="h-4 w-4 text-primary" />
            Your Commission Terms
            {canEdit && <Badge variant="outline" className="text-[10px] ml-auto">Editable</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Commission Type</label>
            <Select value={imfpa.commission_type} onValueChange={(v) => updateField('commission_type', v)} disabled={isReadOnly}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="per_bbl">Per Barrel ($)</SelectItem>
                <SelectItem value="lump_sum">Lump Sum ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Commission Value</label>
            <Input 
              type="number"
              step="0.01"
              className="h-9"
              value={imfpa.commission_value || ''} 
              onChange={(e) => updateField('commission_value', parseFloat(e.target.value) || 0)}
              disabled={isReadOnly}
              placeholder="e.g. 2.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Currency</label>
            <Select value={imfpa.currency} onValueChange={(v) => updateField('currency', v)} disabled={isReadOnly}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Banking Details — Editable by Broker */}
      <Card className={canEdit ? 'border-primary/30' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            Banking Details
            {canEdit && <Badge variant="outline" className="text-[10px] ml-auto">Editable</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Bank Name</label>
            <Input 
              className="h-9"
              value={imfpa.bank_name} 
              onChange={(e) => updateField('bank_name', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. HSBC Bank"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">SWIFT Code</label>
            <Input 
              className="h-9"
              value={imfpa.bank_swift} 
              onChange={(e) => updateField('bank_swift', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. HSBCGB2L"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Account (Masked)</label>
            <Input 
              className="h-9"
              value={imfpa.beneficiary_account_masked} 
              onChange={(e) => updateField('beneficiary_account_masked', e.target.value)}
              disabled={isReadOnly}
              placeholder="****1234"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-primary" />
            Digital Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 border rounded-lg text-center ${imfpa.signed_by_broker ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border'}`}>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">Broker</p>
              {imfpa.signed_by_broker ? (
                <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold">Signed</span>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleSignBroker} disabled={!imfpa.imfpa_id || isReadOnly} className="text-xs h-7">
                  Sign Agreement
                </Button>
              )}
            </div>
            <div className="p-3 border rounded-lg text-center opacity-50">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">Seller</p>
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Pending</span>
              </div>
            </div>
            <div className="p-3 border rounded-lg text-center opacity-50">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">Buyer</p>
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Pending</span>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="mt-3 bg-muted/50 rounded-md p-3">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              By signing this Irrevocable Master Fee Protection Agreement (IMFPA), you acknowledge that all commission 
              terms are binding and enforceable under the governing law specified above. This digital signature constitutes 
              a legally binding agreement between all parties. Commission payments are irrevocable once the payment trigger 
              conditions are met.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleSave} disabled={saving} variant="outline" className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button 
            onClick={handleSubmitForReview} 
            disabled={submitting || imfpa.status === 'pending'}
            className="flex-1"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit for Admin Review
          </Button>
        </div>
      )}

      {imfpa.status === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            ⏳ Your IMFPA is under admin review. You will be notified once it's approved.
          </p>
        </div>
      )}
    </div>
  );
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted/30 rounded-md px-3 py-2">
    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
    <p className="text-sm font-medium capitalize mt-0.5">{value || 'N/A'}</p>
  </div>
);

export default IMFPAAgreement;
