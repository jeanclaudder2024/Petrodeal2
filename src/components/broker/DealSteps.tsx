import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  FileText, 
  Download,
  RefreshCw,
  Eye,
  Lock,
  User,
  Building2,
  Shield,
  Calendar,
  Send,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import DealProcessExplainer from './DealProcessExplainer';

interface DealStep {
  id: string;
  step_number: number;
  step_name: string;
  step_description: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  file_url?: string;
  created_at?: string;
}

interface DealStepTemplate {
  id?: string;
  step_number: number;
  step_name: string;
  step_description: string | null;
  requires_file: boolean | null;
  is_active?: boolean | null;
}

interface DealStepsProps {
  dealId: string;
  onClose: () => void;
}

const DEFAULT_DEAL_STEPS_TEMPLATE: DealStepTemplate[] = [
  {
    step_number: 1,
    step_name: "Buyer Acceptance",
    step_description: "Buyer accepts soft corporate offer and seller's procedure. Issues official ICPO addressed to the end seller.",
    requires_file: true
  },
  {
    step_number: 2,
    step_name: "Contract Signing",
    step_description: "Seller issues draft contract (SPA). Buyer signs and returns it. Seller legalizes it via Ministry of Energy at seller's cost.",
    requires_file: true
  },
  {
    step_number: 3,
    step_name: "PPOP Documents Released",
    step_description: "Seller sends partial Proof of Product (PPOP) documents: Refinery Commitment, Certificate of Origin, Quality & Quantity Report, Product Availability Statement, Export License.",
    requires_file: true
  },
  {
    step_number: 4,
    step_name: "Buyer Issues Bank Instrument",
    step_description: "Buyer issues DLC MT700 or SBLC MT760 within 7 working days. If not, buyer sends 1% guarantee deposit to secure the deal.",
    requires_file: true
  },
  {
    step_number: 5,
    step_name: "Full POP + 2% PB",
    step_description: "Seller releases full POP + 2% PB upon instrument confirmation or guarantee deposit. Documents include: License to Export, Transnet Contract, Charter Party Agreement, Bill of Lading, SGS Report, Title Transfer, etc.",
    requires_file: true
  },
  {
    step_number: 6,
    step_name: "Shipment Begins",
    step_description: "Shipment begins according to contract. Estimated time to buyer's port: 21–28 days.",
    requires_file: false
  },
  {
    step_number: 7,
    step_name: "Final Inspection & Payment",
    step_description: "Buyer conducts SGS/CIQ at discharge port. After confirmation, payment is released via MT103/TT within 3 banking days.",
    requires_file: true
  },
  {
    step_number: 8,
    step_name: "Intermediary Commissions",
    step_description: "Seller pays commission to all intermediaries within 2–4 days of receiving final payment.",
    requires_file: false
  }
];

// Action owners for each step
const STEP_ACTION_OWNERS: Record<number, { owner: string; reviewRequired: boolean }> = {
  1: { owner: 'Buyer', reviewRequired: false },
  2: { owner: 'Seller/Buyer', reviewRequired: true },
  3: { owner: 'Seller', reviewRequired: true },
  4: { owner: 'Buyer', reviewRequired: true },
  5: { owner: 'Seller', reviewRequired: true },
  6: { owner: 'Seller', reviewRequired: false },
  7: { owner: 'Buyer', reviewRequired: true },
  8: { owner: 'Seller', reviewRequired: false }
};

// Document requirements for steps that need files
const STEP_DOCUMENTS: Record<number, string[]> = {
  1: ['ICPO Document'],
  2: ['Sales & Purchase Agreement (SPA)'],
  3: ['Refinery Commitment', 'Certificate of Origin', 'Quality Report'],
  4: ['Bank Instrument (DLC/SBLC)'],
  5: ['Full POP Package', 'Performance Bond'],
  7: ['SGS/CIQ Inspection Report', 'Payment Confirmation']
};

const DealSteps: React.FC<DealStepsProps> = ({ dealId, onClose }) => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<DealStep[]>([]);
  const [templates, setTemplates] = useState<DealStepTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingStep, setUploadingStep] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [syncingTemplates, setSyncingTemplates] = useState(false);

  useEffect(() => {
    fetchDealSteps();
  }, [dealId]);

  // Real-time subscription for step updates (auto-refresh when admin approves)
  useEffect(() => {
    const channel = supabase
      .channel(`deal_steps_${dealId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deal_steps',
          filter: `deal_id=eq.${dealId}`
        },
        (payload) => {
          console.log('Step updated:', payload);
          fetchDealSteps();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  const fetchDealSteps = async () => {
    try {
      const { data: templateRows, error: templateError } = await supabase
        .from('deal_step_templates')
        .select('*')
        .eq('is_active', true)
        .order('step_number');

      if (!templateError && templateRows && templateRows.length > 0) {
        setTemplates(templateRows as DealStepTemplate[]);
      } else {
        setTemplates(DEFAULT_DEAL_STEPS_TEMPLATE);
      }

      const { data: existingSteps, error: fetchError } = await supabase
        .from('deal_steps')
        .select('*')
        .eq('deal_id', dealId)
        .order('step_number');

      if (fetchError) throw fetchError;

      if (!existingSteps || existingSteps.length === 0) {
        const baseTemplates = (templateRows && templateRows.length > 0)
          ? (templateRows as DealStepTemplate[])
          : DEFAULT_DEAL_STEPS_TEMPLATE;

        const newSteps = baseTemplates.map((template) => ({
          deal_id: dealId,
          step_number: template.step_number,
          step_name: template.step_name,
          step_description: template.step_description || '',
          status: 'not_started'
        }));

        const { data: createdSteps, error: createError } = await supabase
          .from('deal_steps')
          .insert(newSteps)
          .select('*');

        if (createError) throw createError;
        setSteps(createdSteps || []);
      } else {
        setSteps(existingSteps as DealStep[]);
      }
    } catch (error) {
      console.error('Error fetching deal steps:', error);
      setSteps([]); // Will trigger fallback UI
    } finally {
      setLoading(false);
    }
  };

  const handleSyncTemplates = async () => {
    if (!confirm('This will update step names and descriptions from the current templates. Your progress, files, and notes will be preserved. Continue?')) {
      return;
    }

    setSyncingTemplates(true);
    try {
      const currentTemplates = templates.length > 0 ? templates : DEFAULT_DEAL_STEPS_TEMPLATE;

      for (const step of steps) {
        const template = currentTemplates.find(t => t.step_number === step.step_number);
        if (template) {
          await supabase
            .from('deal_steps')
            .update({
              step_name: template.step_name,
              step_description: template.step_description || ''
            })
            .eq('id', step.id);
        }
      }

      toast({
        title: "Success",
        description: "Deal steps synced with current templates"
      });

      await fetchDealSteps();
    } catch (error) {
      console.error('Error syncing templates:', error);
      toast({
        title: "Error",
        description: "Failed to sync templates",
        variant: "destructive"
      });
    } finally {
      setSyncingTemplates(false);
    }
  };

  const handleFileUpload = async (stepId: string, file: File) => {
    setUploadingStep(stepId);
    try {
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File size must be less than 25MB');
      }
      const allowedTypes = ['.pdf'];
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!allowedTypes.includes(fileExt)) {
        throw new Error('Please upload only PDF files');
      }
      const fileName = `${dealId}/${stepId}_${Date.now()}${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('broker-documents')
        .upload(fileName, file);
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file. Please check your permissions and try again.');
      }
      const { data: { publicUrl } } = supabase.storage
        .from('broker-documents')
        .getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from('deal_steps')
        .update({ file_url: publicUrl })
        .eq('id', stepId);
      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('File uploaded but failed to update step. Please contact support.');
      }
      toast({
        title: "Success",
        description: "File uploaded successfully. Remember to save your step to submit it for approval."
      });
      await fetchDealSteps();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingStep(null);
    }
  };

  const handleDownloadDocument = async (fileUrl: string, stepName: string) => {
    try {
      const urlParts = fileUrl.split('/broker-documents/');
      const filePath = urlParts[1];
      if (!filePath) throw new Error('Invalid file URL');
      const { data, error } = await supabase.storage
        .from('broker-documents')
        .createSignedUrl(filePath, 60 * 60);
      if (error || !data?.signedUrl) throw error || new Error('Could not generate signed URL');
      const link = document.createElement('a');
      link.href = data.signedUrl;
      const urlParts2 = filePath.split('/');
      const fileName = urlParts2[urlParts2.length - 1] || `${stepName.replace(/\s+/g, '_')}_document`;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Download Started",
        description: "Document download has been initiated."
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Failed to download document. Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = async (fileUrl: string) => {
    try {
      const urlParts = fileUrl.split('/broker-documents/');
      const filePath = urlParts[1];
      if (!filePath) throw new Error('Invalid file URL');
      const { data, error } = await supabase.storage
        .from('broker-documents')
        .createSignedUrl(filePath, 60 * 60);
      if (error || !data?.signedUrl) throw error || new Error('Could not generate signed URL');
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "View Error",
        description: "Failed to open document. Please try downloading it instead.",
        variant: "destructive"
      });
    }
  };

  const handleSaveStep = async (stepId: string) => {
    setSavingStep(stepId);
    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) throw new Error('Step not found');

      const template = templates.find(t => t.step_number === step.step_number) ||
        DEFAULT_DEAL_STEPS_TEMPLATE.find(t => t.step_number === step.step_number);
      const requiresFile = template?.requires_file || false;
      const hasNotes = notes[stepId]?.trim();

      if (requiresFile && !step.file_url && !hasNotes) {
        toast({
          title: "Validation Error",
          description: "This step requires either a document upload or notes describing your actions.",
          variant: "destructive"
        });
        return;
      }
      if (!requiresFile && !hasNotes) {
        toast({
          title: "Validation Error",
          description: "Please add notes describing what you've done for this step.",
          variant: "destructive"
        });
        return;
      }

      const newStatus = 'pending';
      const { error: updateError } = await supabase
        .from('deal_steps')
        .update({
          notes: notes[stepId]?.trim() || null,
          status: newStatus,
          completed_at: null
        })
        .eq('id', stepId);

      if (updateError) {
        console.error('Database error:', updateError);
        throw new Error('Failed to save step to database. Please check your permissions.');
      }

      toast({
        title: "Success",
        description: "Step saved and submitted for IPTO review!"
      });

      setNotes(prev => ({ ...prev, [stepId]: '' }));
      await fetchDealSteps();
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save step. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingStep(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          icon: CheckCircle, 
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800',
          label: 'IPTO Approved',
          bgClass: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
        };
      case 'pending':
        return { 
          icon: Clock, 
          color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
          label: 'Under IPTO Review',
          bgClass: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        };
      case 'rejected':
        return { 
          icon: AlertCircle, 
          color: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
          label: 'Rejected',
          bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        };
      default:
        return { 
          icon: Clock, 
          color: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700',
          label: 'Released',
          bgClass: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
        };
    }
  };

  const getOwnerIcon = (owner: string) => {
    if (owner.includes('Seller')) return Building2;
    if (owner.includes('Buyer')) return User;
    return User;
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const getCurrentStep = () => {
    const currentStep = steps.find(step => step.status !== 'completed');
    return currentStep ? currentStep.step_number : steps.length + 1;
  };

  const currentStepNumber = getCurrentStep();

  const isStepInteractive = (stepNumber: number) => {
    const step = steps.find(s => s.step_number === stepNumber);
    return stepNumber === currentStepNumber || step?.status === 'rejected';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading deal steps...</span>
        </CardContent>
      </Card>
    );
  }

  // Fallback: if steps failed to load, show infographic
  if (steps.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">Deal steps are being configured</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">Here's how the deal process works:</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
        <DealProcessExplainer />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-2 border-slate-200 dark:border-slate-700">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Deal Progress</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete each step sequentially for IPTO oversight
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{completedSteps} of {steps.length} steps completed</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current Step Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              {currentStepNumber <= steps.length ? `Step ${currentStepNumber} in Progress` : 'All Steps Complete'}
            </h4>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {currentStepNumber <= steps.length 
              ? 'Complete this step and submit for IPTO review to unlock the next step.'
              : 'Congratulations! All deal steps have been completed successfully.'
            }
          </p>
        </div>

        {/* All Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const template = templates.find(t => t.step_number === step.step_number) ||
              DEFAULT_DEAL_STEPS_TEMPLATE.find(t => t.step_number === step.step_number);
            const requiresFile = template?.requires_file || false;
            const statusConfig = getStatusConfig(step.status);
            const StatusIcon = statusConfig.icon;
            const actionOwner = STEP_ACTION_OWNERS[step.step_number] || { owner: 'Broker', reviewRequired: false };
            const OwnerIcon = getOwnerIcon(actionOwner.owner);
            const isLocked = step.step_number > currentStepNumber && step.status !== 'completed';
            const isActive = isStepInteractive(step.step_number);
            const documents = STEP_DOCUMENTS[step.step_number] || [];
            const isSensitiveStep = [2, 4, 5].includes(step.step_number);

            return (
              <div 
                key={step.id} 
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  isLocked 
                    ? 'border-slate-200 dark:border-slate-700 opacity-60' 
                    : isActive 
                      ? 'border-primary shadow-md' 
                      : statusConfig.bgClass
                }`}
              >
                {/* Step Header */}
                <div className={`p-4 ${isLocked ? 'bg-slate-100 dark:bg-slate-800' : step.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-900'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isLocked ? 'bg-slate-200 dark:bg-slate-700' : 
                        step.status === 'completed' ? 'bg-emerald-500' : 
                        step.status === 'pending' ? 'bg-amber-500' :
                        step.status === 'rejected' ? 'bg-red-500' : 'bg-primary'
                      }`}>
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        ) : (
                          <StatusIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">Step {step.step_number}</span>
                          <h3 className="font-semibold">{step.step_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={`${statusConfig.color} border text-xs`}>
                            {isLocked ? 'Locked' : statusConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <OwnerIcon className="h-3 w-3" />
                            {actionOwner.owner}
                          </Badge>
                          {actionOwner.reviewRequired && !isLocked && (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              IPTO Review
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {step.completed_at && (
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(step.completed_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 ml-13">{step.step_description}</p>
                </div>

                {/* Locked Message */}
                {isLocked && (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Previous step not completed – complete step {step.step_number - 1} to unlock
                    </p>
                  </div>
                )}

                {/* Active Step Content */}
                {isActive && step.status !== 'pending' && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                    {/* Rejection Feedback */}
                    {step.status === 'rejected' && step.notes && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Rejection Reason:</strong> {step.notes}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                          Please address the issue and re-submit.
                        </p>
                      </div>
                    )}

                    {/* Document Upload Table */}
                    {requiresFile && documents.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Required Documents</Label>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[250px]">Document</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documents.map((doc, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium text-sm">{doc}</TableCell>
                                <TableCell>
                                  {step.file_url && idx === 0 ? (
                                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                      Uploaded
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {step.file_url && idx === 0 ? (
                                    <div className="flex items-center gap-1 justify-end">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleViewDocument(step.file_url!)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDownloadDocument(step.file_url!, step.step_name)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : idx === 0 ? (
                                    <div className="flex items-center gap-2 justify-end">
                                      <Input
                                        type="file"
                                        accept=".pdf"
                                        className="max-w-[180px] h-8 text-xs"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleFileUpload(step.id, file);
                                        }}
                                        disabled={uploadingStep === step.id}
                                      />
                                      {uploadingStep === step.id && (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Included in upload</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <p className="text-xs text-muted-foreground mt-2">
                          Upload a single PDF containing all required documents (max 25MB)
                        </p>
                      </div>
                    )}

                    {/* Notes Section */}
                    <div>
                      <Label htmlFor={`notes-${step.id}`} className="text-sm font-medium">
                        Notes {requiresFile ? '(Optional)' : '(Required)'}
                      </Label>
                      <Textarea
                        id={`notes-${step.id}`}
                        placeholder={requiresFile 
                          ? "Add any additional notes for IPTO review..." 
                          : "Describe what you've done for this step..."
                        }
                        value={notes[step.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                        className="mt-1.5"
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        onClick={() => handleSaveStep(step.id)}
                        disabled={
                          savingStep === step.id ||
                          (!requiresFile && (!notes[step.id] || notes[step.id].trim() === '')) ||
                          (requiresFile && step.status === 'rejected' && !step.file_url)
                        }
                        className="flex items-center gap-2"
                      >
                        {savingStep === step.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Submit for IPTO Review
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {requiresFile && !step.file_url && "Document required"}
                        {!requiresFile && (!notes[step.id] || !notes[step.id].trim()) && "Notes required"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pending Review Status */}
                {step.status === 'pending' && (
                  <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Submitted and awaiting IPTO review
                    </p>
                  </div>
                )}

                {/* Completed Step - IPTO Approved Message */}
                {step.status === 'completed' && (
                  <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        IPTO Reviewed and Approved
                        {step.completed_at && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal ml-2">
                            on {format(new Date(step.completed_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </p>
                      {step.file_url && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDocument(step.file_url!)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadDocument(step.file_url!, step.step_name)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Legal Disclaimer for Sensitive Steps */}
                {isSensitiveStep && !isLocked && step.status !== 'completed' && (
                  <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-muted-foreground">
                      International Petroleum Trade Oversight (IPTO) acts as an independent workflow reviewer only. 
                      IPTO does not guarantee payment, delivery, or performance.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealSteps;
