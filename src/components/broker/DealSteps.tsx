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
  UserPlus,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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

interface DealStepsProps {
  dealId: string;
  onClose: () => void;
}

const DEAL_STEPS_TEMPLATE = [
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<DealStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingStep, setUploadingStep] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [savingStep, setSavingStep] = useState<string | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      checkBrokerProfile();
    }
  }, [user, dealId]);

  const checkBrokerProfile = async () => {
    try {
      setCheckingProfile(true);
      
      // Check if user has admin role first
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', {
        _user_id: user!.id
      });

      if (roleError) {
        console.error('Error checking user role:', roleError);
      }

      // If user is admin, allow access without broker profile
      if (userRole === 'admin') {
        setBrokerProfile({ isAdmin: true });
        fetchDealSteps();
        return;
      }
      
      // For non-admin users, check broker profile
      const { data: profile, error } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No broker profile found and not admin
          setBrokerProfile(null);
        } else {
          throw error;
        }
      } else {
        setBrokerProfile(profile);
        // Fetch deal steps if broker profile exists
        fetchDealSteps();
      }
    } catch (error) {
      console.error('Error checking broker profile:', error);
      toast({
        title: "Error",
        description: "Failed to verify access permissions",
        variant: "destructive"
      });
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchDealSteps = async () => {
    try {
      // First check if steps exist for this deal
      const { data: existingSteps, error: fetchError } = await supabase
        .from('deal_steps')
        .select('*')
        .eq('deal_id', dealId)
        .order('step_number');

      if (fetchError) throw fetchError;

      if (!existingSteps || existingSteps.length === 0) {
        // Create default steps if they don't exist
        const newSteps = DEAL_STEPS_TEMPLATE.map((template, index) => ({
          deal_id: dealId,
          step_number: template.step_number,
          step_name: template.step_name,
          step_description: template.step_description,
          status: 'not_started' // All steps start as not_started, brokers activate them by saving
        }));

        const { data: createdSteps, error: createError } = await supabase
          .from('deal_steps')
          .insert(newSteps)
          .select('*');

        if (createError) throw createError;
        setSteps(createdSteps || []);
        // Initialize empty notes for new steps
        setNotes({});
      } else {
        setSteps(existingSteps);
        // Load existing notes into state
        const notesMap: { [key: string]: string } = {};
        existingSteps.forEach(step => {
          if (step.notes) {
            notesMap[step.id] = step.notes;
          }
        });
        setNotes(notesMap);
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

  const handleFileUpload = async (stepId: string, file: File) => {
    setUploadingStep(stepId);
    
    try {
      // Upload file to Supabase storage with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${dealId}/${stepId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('broker-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Create signed URL for private bucket (valid for 1 year)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('broker-documents')
        .createSignedUrl(fileName, 31536000); // 1 year in seconds

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
        throw signedUrlError;
      }

      // Just update the step with file URL - don't change status yet
      const { error: updateError } = await supabase
        .from('deal_steps')
        .update({ 
          file_url: signedUrlData.signedUrl
        })
        .eq('id', stepId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "File uploaded successfully. Remember to save your step."
      });

      fetchDealSteps();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: `Failed to upload file: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setUploadingStep(null);
    }
  };

  const handleSaveStep = async (stepId: string) => {
    setSavingStep(stepId);
    
    try {
      const step = steps.find(s => s.id === stepId);
      
      // Step 1 is automatically approved, others need admin approval
      const isFirstStep = step?.step_number === 1;
      const newStatus = isFirstStep ? 'completed' : 'pending';
      const completedAt = isFirstStep ? new Date().toISOString() : null;

      // Update step with notes and appropriate status
      const { error: updateError } = await supabase
        .from('deal_steps')
        .update({ 
          notes: notes[stepId] || null,
          status: newStatus,
          completed_at: completedAt
        })
        .eq('id', stepId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: isFirstStep 
          ? "Step 1 completed! You can now proceed to step 2."
          : "Step saved and submitted for admin approval!"
      });

      // Clear the notes for this step
      setNotes(prev => ({ ...prev, [stepId]: '' }));
      fetchDealSteps();
    } catch (error) {
      console.error('Error saving step:', error);
      toast({
        title: "Error",
        description: "Failed to save step",
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
    return stepNumber === currentStepNumber;
  };

  if (checkingProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Checking broker profile...</span>
        </CardContent>
      </Card>
    );
  }

  // Show broker setup prompt if no broker profile exists (only for non-admin users)
  if (!brokerProfile) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Access Required</CardTitle>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Complete Your Broker Profile</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              To access deal steps and manage your trading activities, you need to complete your broker profile setup first.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/broker-setup')} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Complete Setup
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        {steps.filter(step => step.status === 'completed').map((step, index) => {
          const template = DEAL_STEPS_TEMPLATE.find(t => t.step_number === step.step_number);
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

              {/* Display saved notes/description */}
              {step.notes && (
                <div className="bg-white border border-gray-200 rounded p-3 mb-4">
                  <h5 className="font-medium text-sm text-gray-700 mb-2">Notes/Description:</h5>
                  <p className="text-sm text-gray-600">{step.notes}</p>
                </div>
              )}

              {step.file_url && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Document uploaded</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(step.file_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    View
                  </Button>
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

        {/* Current Active Step */}
        {currentStepNumber <= steps.length && (
          (() => {
            const step = steps.find(s => s.step_number === currentStepNumber);
            if (!step) return null;
            
            const template = DEAL_STEPS_TEMPLATE.find(t => t.step_number === step.step_number);
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(step.file_url, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            id={`file-${step.id}`}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                          Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
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
          })()
        )}

        {/* Future Steps Preview */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-600 border-b pb-2">Upcoming Steps</h4>
          {steps.filter(step => step.step_number > currentStepNumber).slice(0, 3).map((step, index) => (
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
          
          {steps.filter(step => step.step_number > currentStepNumber).length > 3 && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                +{steps.filter(step => step.step_number > currentStepNumber).length - 3} more steps
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DealSteps;