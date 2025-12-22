import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  FileText, 
  Download,
  RefreshCw,
  Eye,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DealStep {
  id: string;
  step_number: number;
  step_name: string;
  step_description: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  file_url?: string;
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

  const fetchDealSteps = async () => {
    try {
      // Load configurable step templates from database (admin can edit these)
      const { data: templateRows, error: templateError } = await supabase
        .from('deal_step_templates')
        .select('*')
        .eq('is_active', true)
        .order('step_number');

      if (!templateError && templateRows && templateRows.length > 0) {
        setTemplates(templateRows as DealStepTemplate[]);
      } else {
        // Fallback to default hardcoded template if DB is empty
        setTemplates(DEFAULT_DEAL_STEPS_TEMPLATE);
      }

      // First check if steps exist for this deal
      const { data: existingSteps, error: fetchError } = await supabase
        .from('deal_steps')
        .select('*')
        .eq('deal_id', dealId)
        .order('step_number');

      if (fetchError) throw fetchError;

      if (!existingSteps || existingSteps.length === 0) {
        // Create steps based on current templates
        const baseTemplates = (templateRows && templateRows.length > 0)
          ? (templateRows as DealStepTemplate[])
          : DEFAULT_DEAL_STEPS_TEMPLATE;

        const newSteps = baseTemplates.map((template) => ({
          deal_id: dealId,
          step_number: template.step_number,
          step_name: template.step_name,
          step_description: template.step_description || '',
          status: 'not_started' // All steps start as not_started, brokers activate them by saving
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
      toast({
        title: "Error",
        description: "Failed to load deal steps",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync existing deal steps with current templates (update names/descriptions only)
  const handleSyncTemplates = async () => {
    if (!confirm('This will update step names and descriptions from the current templates. Your progress, files, and notes will be preserved. Continue?')) {
      return;
    }

    setSyncingTemplates(true);
    try {
      // Get current templates
      const currentTemplates = templates.length > 0 ? templates : DEFAULT_DEAL_STEPS_TEMPLATE;

      // Update each step with matching template data
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
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }
      // Only allow PDF files
      const allowedTypes = ['.pdf'];
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!allowedTypes.includes(fileExt)) {
        throw new Error('Please upload only PDF files');
      }
      // Upload file to Supabase storage
      const fileName = `${dealId}/${stepId}_${Date.now()}${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('broker-documents')
        .upload(fileName, file);
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file. Please check your permissions and try again.');
      }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('broker-documents')
        .getPublicUrl(fileName);
      // Update step with file URL
      const { error: updateError } = await supabase
        .from('deal_steps')
        .update({ 
          file_url: publicUrl
        })
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
      // Extract the file path from the URL (after the bucket name)
      const urlParts = fileUrl.split('/broker-documents/');
      const filePath = urlParts[1];
      if (!filePath) throw new Error('Invalid file URL');
      // Get a signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('broker-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour
      if (error || !data?.signedUrl) throw error || new Error('Could not generate signed URL');
      // Create a temporary anchor element to trigger download
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
      // Extract the file path from the URL (after the bucket name)
      const urlParts = fileUrl.split('/broker-documents/');
      const filePath = urlParts[1];
      if (!filePath) throw new Error('Invalid file URL');

      // Get a signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('broker-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour

      if (error || !data?.signedUrl) throw error || new Error('Could not generate signed URL');

      // Open the signed URL in a new tab
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
      if (!step) {
        throw new Error('Step not found');
      }
      // Validate required fields based on current templates
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
      // All steps, including step 1, require admin approval (status 'pending')
      const newStatus = 'pending';
      const completedAt = null;
      // Update step with notes and appropriate status
      const { error: updateError } = await supabase
        .from('deal_steps')
        .update({ 
          notes: notes[stepId]?.trim() || null,
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', stepId);
      if (updateError) {
        console.error('Database error:', updateError);
        throw new Error('Failed to save step to database. Please check your permissions.');
      }
      toast({
        title: "Success",
        description: "Step saved and submitted for admin approval!"
      });
      // Clear the notes for this step
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

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  
  // Get the current active step (first incomplete step)
  const getCurrentStep = () => {
    // Find the first step that's not completed
    const currentStep = steps.find(step => step.status !== 'completed');
    return currentStep ? currentStep.step_number : steps.length + 1;
  };
  
  const currentStepNumber = getCurrentStep();
  
  // Check if a step should be visible/accessible
  const isStepAccessible = (stepNumber: number) => {
    // Always show completed steps
    if (steps.find(s => s.step_number === stepNumber)?.status === 'completed') {
      return true;
    }
    // Show current step (first incomplete step)
    return stepNumber === currentStepNumber;
  };
  
  // Check if a step should be interactive (can upload files, etc.)
  const isStepInteractive = (stepNumber: number) => {
    const step = steps.find(s => s.step_number === stepNumber);
    // Allow interaction for current step OR rejected steps (so they can be resubmitted)
    return stepNumber === currentStepNumber || step?.status === 'rejected';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading deal steps...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Deal Progress</CardTitle>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress: {completedSteps}/{steps.length} steps completed</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Show current step information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">
            Current Step: {currentStepNumber <= steps.length ? currentStepNumber : 'All Complete'}
          </h4>
          <p className="text-blue-700 text-sm">
            {currentStepNumber <= steps.length 
              ? `Complete step ${currentStepNumber} to proceed to the next step.`
              : 'All steps have been completed! 🎉'
            }
          </p>
        </div>

        {/* Completed Steps */}
        {steps.filter(step => step.status === 'completed').map((step) => {
          const template = templates.find(t => t.step_number === step.step_number) ||
            DEFAULT_DEAL_STEPS_TEMPLATE.find(t => t.step_number === step.step_number);
          const requiresFile = template?.requires_file || false;
          
          return (
            <div key={step.id} className="border rounded-lg p-6 bg-green-50 border-green-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStepIcon(step.status)}
                  <div>
                    <h3 className="font-semibold text-lg">
                      Step {step.step_number}: {step.step_name}
                    </h3>
                    <Badge variant="default" className="mt-1">
                      ✓ Completed
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">{step.step_description}</p>

              {step.file_url && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Document uploaded</span>
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDocument(step.file_url)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadDocument(step.file_url, step.step_name)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {step.completed_at && (
                <p className="text-sm text-muted-foreground">
                  Completed on: {new Date(step.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}

        {/* Current Active Step and Rejected Steps */}
        {steps.filter(step => step.step_number === currentStepNumber || step.status === 'rejected')
          .map(step => {
            const template = templates.find(t => t.step_number === step.step_number) ||
              DEFAULT_DEAL_STEPS_TEMPLATE.find(t => t.step_number === step.step_number);
            const requiresFile = template?.requires_file || false;
            const canEdit = step.status !== 'pending';
            
            return (
              <div key={step.id} className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step.status)}
                    <div>
                      <h3 className="font-semibold text-lg text-blue-800">
                        Step {step.step_number}: {step.step_name}
                      </h3>
                       <Badge variant={getStepBadgeVariant(step.status)} className="mt-1">
                         {step.status === 'pending' ? 
                           (step.step_number === 1 ? 'Processing...' : 'Waiting for Approval') : 
                          step.status === 'rejected' ? 'Rejected - Action Required' : 
                          step.status === 'not_started' ? 'Ready to Complete' : 'Current Step'}
                       </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{step.step_description}</p>

                {/* Admin notes/feedback */}
                {step.notes && step.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                    <p className="text-sm text-red-800"><strong>Admin Feedback:</strong> {step.notes}</p>
                  </div>
                )}

                 {step.status === 'pending' && step.step_number !== 1 && (
                   <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                     <p className="text-sm text-yellow-800">
                       📋 Your step has been submitted and is waiting for admin approval.
                     </p>
                   </div>
                 )}

                {canEdit && (
                  <div className="space-y-4">
                    {/* Message/Notes Section - Always available */}
                    <div>
                      <Label htmlFor={`notes-${step.id}`}>
                        Message/Notes {requiresFile ? '(Optional)' : '(Required)'}
                      </Label>
                      <Textarea
                        id={`notes-${step.id}`}
                        placeholder={requiresFile ? "Add any notes for this step..." : "Describe what you've done for this step..."}
                        value={notes[step.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    {/* File Upload Section - Only if required */}
                    {requiresFile && (
                      <div>
                        <Label htmlFor={`file-${step.id}`}>
                          Upload Document {step.status === 'rejected' ? '(Re-upload Required)' : '(Required)'}
                        </Label>
                        
                        {step.file_url && (
                          <div className="flex items-center gap-2 p-2 bg-muted rounded mt-1 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">Current document</span>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDocument(step.file_url)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadDocument(step.file_url, step.step_name)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id={`file-${step.id}`}
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(step.id, file);
                              }
                            }}
                            disabled={uploadingStep === step.id}
                          />
                          {uploadingStep === step.id && (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepted formats: PDF (Max 10MB)
                        </p>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex items-center gap-2 pt-4 border-t">
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
                          <Upload className="h-4 w-4" />
                        )}
                        Save & {step.step_number === 1 ? 'Complete Step' : 'Submit for Approval'}
                      </Button>
                      
                      <div className="text-xs text-muted-foreground">
                        {requiresFile && !step.file_url && step.status !== 'rejected' && (
                          <span>📎 Document required before saving</span>
                        )}
                        {!requiresFile && (!notes[step.id] || notes[step.id].trim() === '') && (
                          <span>✏️ Message required before saving</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {/* Future Steps Preview */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-600 border-b pb-2">Upcoming Steps</h4>
          {steps.filter(step => step.step_number > currentStepNumber && step.status !== 'rejected').slice(0, 3).map((step, index) => (
            <div key={step.id} className="border rounded-lg p-4 bg-gray-50 opacity-75">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <h5 className="font-medium text-gray-700">
                    Step {step.step_number}: {step.step_name}
                  </h5>
                  <Badge variant="outline" className="text-xs">
                    🔒 Locked
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600">{step.step_description}</p>
            </div>
          ))}
          
          {steps.filter(step => step.step_number > currentStepNumber && step.status !== 'rejected').length > 3 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                +{steps.filter(step => step.step_number > currentStepNumber && step.status !== 'rejected').length - 3} more steps
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealSteps;