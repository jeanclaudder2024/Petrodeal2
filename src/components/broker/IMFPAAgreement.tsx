import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Lock, 
  Unlock,
  Shield,
  Calendar,
  Building2,
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Sparkles,
  Download,
  Signature
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
}

interface DealInfo {
  id: string;
  deal_type: string;
  cargo_type: string;
  status: string;
  steps_completed: number;
  total_steps: number;
}

interface IMFPAAgreementProps {
  dealId: string;
  dealInfo: DealInfo;
  brokerProfile: {
    full_name: string;
    company_name: string;
    country: string;
  };
  onClose?: () => void;
}

const IMFPAAgreement: React.FC<IMFPAAgreementProps> = ({ dealId, dealInfo, brokerProfile, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imfpa, setImfpa] = useState<IMFPAData | null>(null);
  
  // Check if Step 8 is approved (steps_completed >= 8)
  const isStep8Approved = dealInfo.steps_completed >= 8;

  useEffect(() => {
    fetchIMFPA();
  }, [dealId]);

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
        // Initialize with default values
        setImfpa({
          deal_id: dealId,
          status: 'draft',
          broker_role: 'mandate_holder',
          broker_entity_name: brokerProfile.company_name || brokerProfile.full_name,
          broker_registration_country: brokerProfile.country || '',
          broker_company_number: '',
          commodity_type: dealInfo.cargo_type || 'crude_oil',
          commission_type: 'percentage',
          commission_value: 2.5,
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

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      // Simulate AI generation with realistic data
      const generatedData: Partial<IMFPAData> = {
        imfpa_reference_code: generateReferenceCode(),
        broker_role: 'mandate_holder',
        commodity_type: dealInfo.cargo_type || 'crude_oil',
        commission_type: 'percentage',
        commission_value: Math.floor(Math.random() * 3) + 1.5, // 1.5-4.5%
        currency: 'USD',
        payment_method: ['mt103', 'split_payment', 'escrow'][Math.floor(Math.random() * 3)],
        payment_trigger: ['upon_spa_signature', 'upon_lc_issuance', 'upon_bl_release', 'upon_sgs_confirmation'][Math.floor(Math.random() * 4)],
        governing_law: ['English Law', 'Swiss Law', 'Singapore Law'][Math.floor(Math.random() * 3)],
        jurisdiction: ['London, UK', 'Geneva, Switzerland', 'Singapore'][Math.floor(Math.random() * 3)],
      };

      if (isStep8Approved) {
        generatedData.seller_entity_name = 'Generated Seller Entity Ltd.';
        generatedData.buyer_entity_name = 'Generated Buyer Corporation';
      }

      setImfpa(prev => prev ? { ...prev, ...generatedData } : null);
      toast.success('AI generated IMFPA data');
    } catch (error) {
      toast.error('Failed to generate data');
    } finally {
      setGenerating(false);
    }
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
        // Update existing
        const { error } = await supabase
          .from('imfpa_agreements' as any)
          .update(dataToSave)
          .eq('imfpa_id', imfpa.imfpa_id);
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('imfpa_agreements' as any)
          .insert(dataToSave)
          .select()
          .single();
        if (error) throw error;
        setImfpa({ ...imfpa, imfpa_id: (data as any).imfpa_id });
      }

      toast.success('IMFPA agreement saved');
    } catch (error) {
      console.error('Error saving IMFPA:', error);
      toast.error('Failed to save IMFPA agreement');
    } finally {
      setSaving(false);
    }
  };

  const handleSignBroker = async () => {
    if (!imfpa) return;

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
      toast.success('Agreement signed by broker');
    } catch (error) {
      toast.error('Failed to sign agreement');
    }
  };

  const updateField = (field: keyof IMFPAData, value: any) => {
    setImfpa(prev => prev ? { ...prev, [field]: value } : null);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending Approval</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Irrevocable Master Fee Protection Agreement</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Reference: {imfpa.imfpa_reference_code || 'Not generated'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(imfpa.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleAIGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              AI Generate
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Agreement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Broker Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Broker Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Broker Role</label>
            <Select value={imfpa.broker_role} onValueChange={(v) => updateField('broker_role', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mandate_holder">Mandate Holder</SelectItem>
                <SelectItem value="introducing_broker">Introducing Broker</SelectItem>
                <SelectItem value="co_broker">Co-Broker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Entity Name</label>
            <Input 
              value={imfpa.broker_entity_name} 
              onChange={(e) => updateField('broker_entity_name', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Registration Country</label>
            <Input 
              value={imfpa.broker_registration_country} 
              onChange={(e) => updateField('broker_registration_country', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Number</label>
            <Input 
              value={imfpa.broker_company_number} 
              onChange={(e) => updateField('broker_company_number', e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Seller & Buyer (Locked until Step 8) */}
      <Card className={!isStep8Approved ? 'opacity-75' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isStep8Approved ? (
              <Unlock className="h-5 w-5 text-green-500" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            Seller & Buyer Information
            {!isStep8Approved && (
              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-500">
                Locked until Step 8 Approved
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seller Entity Name</label>
            <div className="relative">
              <Input 
                value={imfpa.seller_entity_name || ''} 
                onChange={(e) => updateField('seller_entity_name', e.target.value)} 
                disabled={!isStep8Approved}
                placeholder={isStep8Approved ? 'Enter seller entity' : 'Locked'}
              />
              {!isStep8Approved && (
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Buyer Entity Name</label>
            <div className="relative">
              <Input 
                value={imfpa.buyer_entity_name || ''} 
                onChange={(e) => updateField('buyer_entity_name', e.target.value)} 
                disabled={!isStep8Approved}
                placeholder={isStep8Approved ? 'Enter buyer entity' : 'Locked'}
              />
              {!isStep8Approved && (
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission & Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Commission & Payment Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Commodity Type</label>
            <Select value={imfpa.commodity_type} onValueChange={(v) => updateField('commodity_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crude_oil">Crude Oil</SelectItem>
                <SelectItem value="refined_products">Refined Products</SelectItem>
                <SelectItem value="lng">LNG</SelectItem>
                <SelectItem value="lpg">LPG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Commission Type</label>
            <Select value={imfpa.commission_type} onValueChange={(v) => updateField('commission_type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="per_bbl">Per Barrel ($)</SelectItem>
                <SelectItem value="lump_sum">Lump Sum ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Commission Value</label>
            <Input 
              type="number"
              step="0.01"
              value={imfpa.commission_value} 
              onChange={(e) => updateField('commission_value', parseFloat(e.target.value))} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <Select value={imfpa.currency} onValueChange={(v) => updateField('currency', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={imfpa.payment_method} onValueChange={(v) => updateField('payment_method', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mt103">MT103</SelectItem>
                <SelectItem value="split_payment">Split Payment</SelectItem>
                <SelectItem value="escrow">Escrow</SelectItem>
                <SelectItem value="paymaster">Paymaster</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Trigger</label>
            <Select value={imfpa.payment_trigger} onValueChange={(v) => updateField('payment_trigger', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upon_spa_signature">Upon SPA Signature</SelectItem>
                <SelectItem value="upon_lc_issuance">Upon LC Issuance</SelectItem>
                <SelectItem value="upon_bl_release">Upon B/L Release</SelectItem>
                <SelectItem value="upon_sgs_confirmation">Upon SGS Confirmation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Banking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bank Name</label>
            <Input 
              value={imfpa.bank_name} 
              onChange={(e) => updateField('bank_name', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">SWIFT Code</label>
            <Input 
              value={imfpa.bank_swift} 
              onChange={(e) => updateField('bank_swift', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Account (Masked)</label>
            <Input 
              value={imfpa.beneficiary_account_masked} 
              onChange={(e) => updateField('beneficiary_account_masked', e.target.value)} 
              placeholder="****1234"
            />
          </div>
        </CardContent>
      </Card>

      {/* Validity & Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Validity & Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valid From</label>
            <Input 
              type="date"
              value={imfpa.valid_from} 
              onChange={(e) => updateField('valid_from', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valid Until</label>
            <Input 
              type="date"
              value={imfpa.valid_until} 
              onChange={(e) => updateField('valid_until', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Governing Law</label>
            <Input 
              value={imfpa.governing_law} 
              onChange={(e) => updateField('governing_law', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Jurisdiction</label>
            <Input 
              value={imfpa.jurisdiction} 
              onChange={(e) => updateField('jurisdiction', e.target.value)} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Signature className="h-5 w-5" />
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm font-medium mb-2">Broker</p>
              {imfpa.signed_by_broker ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Signed</span>
                </div>
              ) : (
                <Button size="sm" onClick={handleSignBroker} disabled={!imfpa.imfpa_id}>
                  Sign as Broker
                </Button>
              )}
            </div>
            <div className="p-4 border rounded-lg text-center opacity-50">
              <p className="text-sm font-medium mb-2">Seller</p>
              {imfpa.signed_by_seller ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Signed</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span>Pending</span>
                </div>
              )}
            </div>
            <div className="p-4 border rounded-lg text-center opacity-50">
              <p className="text-sm font-medium mb-2">Buyer</p>
              {imfpa.signed_by_buyer ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Signed</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span>Pending</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IMFPAAgreement;
