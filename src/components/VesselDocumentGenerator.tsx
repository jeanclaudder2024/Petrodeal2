import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Loader2, CheckCircle, XCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DocumentTemplate {
  id: string;
  name: string;
  title?: string;
  description?: string;
  file_name: string;
  placeholders?: string[];
  is_active?: boolean;
  can_download?: boolean;
  plan_name?: string;
  plan_tier?: string;
  remaining_downloads?: number;
  max_downloads?: number;
  current_downloads?: number;
  metadata?: {
    description?: string;
    display_name?: string;
  };
}

interface ProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  message: string;
  progress?: number;
}

interface VesselDocumentGeneratorProps {
  vesselImo: string;
  vesselName: string;
}

// For VPS deployment - use production API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://petrodealhub.com/api'  // Production API
  : 'http://localhost:8000'; // Development

export default function VesselDocumentGenerator({ vesselImo, vesselName }: VesselDocumentGeneratorProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});

  useEffect(() => {
    fetchTemplates();
  }, [user?.id]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // If user is logged in, try user-downloadable-templates endpoint
      // But if it fails (500 error), silently fallback to public templates
      if (user?.id) {
        try {
          // Validate user.id is not null/undefined/empty
          const userId = user.id;
          if (!userId || userId === null || userId === undefined || String(userId).trim() === '') {
            // Skip user endpoint if user.id is invalid
            throw new Error('Invalid user ID');
          }
          
          const response = await fetch(`${API_BASE_URL}/user-downloadable-templates`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: String(userId).trim() }),
          });
          
          // Only process if response is successful (200-299)
          if (response.ok) {
            const data = await response.json();
            
            if (data.templates && Array.isArray(data.templates)) {
              // Process templates from backend
              const processedTemplates = data.templates.map((t: any) => {
                // Backend returns: name (display_name), description, plan_name, metadata
                const displayName = t.name || 
                                   t.metadata?.display_name || 
                                   t.title || 
                                   (t.file_name ? t.file_name.replace('.docx', '') : '') || 
                                   'Unknown Template';
                
                const description = t.description || 
                                   t.metadata?.description || 
                                   '';
                
                const planName = t.plan_name || t.plan_tier || null;
                
                return {
                  id: t.id || t.template_id || String(t.id),
                  name: displayName,
                  title: t.title || displayName,
                  description: description,
                  file_name: t.file_name || '',
                  placeholders: t.placeholders || [],
                  is_active: t.is_active !== false,
                  can_download: t.can_download !== false,
                  plan_name: planName,
                  plan_tier: t.plan_tier || null,
                  remaining_downloads: t.remaining_downloads,
                  max_downloads: t.max_downloads,
                  current_downloads: t.current_downloads,
                  metadata: {
                    display_name: displayName,
                    description: description,
                    ...t.metadata
                  }
                } as DocumentTemplate;
              });
              
              setTemplates(processedTemplates);
              setLoading(false);
              return;
            }
          }
          // If response is not ok (500, 404, etc.), silently continue to fallback
          // Don't log or show error - just use public templates
        } catch (error) {
          // Network error or other exception - silently continue to fallback
          // This is expected if the endpoint doesn't exist or has issues
          // No need to log or show error to user
        }
      }
      
      // Fallback: fetch all templates
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const templatesList = data.templates || [];
        let activeTemplates = templatesList
          .filter((t: DocumentTemplate) => t.is_active !== false)
          .map((t: DocumentTemplate) => ({
            ...t,
            can_download: true, // Default for non-logged-in users
          }));
        
        // Enrich templates with plan information and check user permissions
        try {
          // Get user's plan information
          let userPlanTier: string | null = null;
          let userPlanId: string | null = null;
          let userMaxDownloads: number | null = null;
          let userCurrentDownloads: number = 0;
          
          if (user?.id) {
            const { data: subscriber } = await supabase
              .from('subscribers')
              .select('subscription_tier, subscription_plan')
              .eq('user_id', user.id)
              .limit(1)
              .single();
            
            if (subscriber) {
              userPlanTier = subscriber.subscription_tier || subscriber.subscription_plan || null;
              
              // Get plan details including max downloads
              if (userPlanTier) {
                const { data: plan } = await supabase
                  .from('subscription_plans')
                  .select('id, plan_name, plan_tier, max_downloads_per_month')
                  .eq('plan_tier', userPlanTier)
                  .limit(1)
                  .single();
                
                if (plan) {
                  userPlanId = plan.id;
                  userMaxDownloads = plan.max_downloads_per_month;
                  
                  // Get current month's download count for user
                  const startOfMonth = new Date();
                  startOfMonth.setDate(1);
                  startOfMonth.setHours(0, 0, 0, 0);
                  
                  const { count } = await supabase
                    .from('processed_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('created_by', user.id)
                    .gte('created_at', startOfMonth.toISOString());
                  
                  userCurrentDownloads = count || 0;
                }
              }
            }
          }
          
          // Get all templates from database to match by file_name
          const { data: dbTemplates } = await supabase
            .from('document_templates')
            .select('id, file_name, title, description')
            .eq('is_active', true);
          
          if (dbTemplates) {
            // Get plan permissions for templates
            const templateIds = dbTemplates.map(t => t.id);
            const { data: permissions } = await supabase
              .from('plan_template_permissions')
              .select('template_id, plan_id, can_download')
              .in('template_id', templateIds)
              .eq('can_download', true);
            
            // Get plan details
            let planDetails: Record<string, any> = {};
            if (permissions && permissions.length > 0) {
              const planIds = [...new Set(permissions.map(p => p.plan_id))];
              const { data: plans } = await supabase
                .from('subscription_plans')
                .select('id, plan_name, plan_tier')
                .in('id', planIds);
              
              if (plans) {
                planDetails = Object.fromEntries(
                  plans.map(p => [p.id, { plan_name: p.plan_name, plan_tier: p.plan_tier }])
                );
              }
            }
            
            // Create a map of file_name to template info
            const templateMap = new Map<string, any>();
            dbTemplates.forEach(t => {
              const fileName = t.file_name?.replace('.docx', '').toLowerCase() || '';
              if (fileName) {
                templateMap.set(fileName, {
                  id: t.id,
                  title: t.title,
                  description: t.description
                });
              }
            });
            
            // Enrich activeTemplates with plan information and check permissions
            activeTemplates = activeTemplates.map(t => {
              const fileName = (t.file_name || t.name || '').replace('.docx', '').toLowerCase();
              const dbTemplate = templateMap.get(fileName);
              
              let canDownload = true; // Default for non-logged-in users
              let planName: string | null = null;
              let planTier: string | null = null;
              let remainingDownloads: number | null = null;
              let maxDownloads: number | null = null;
              
              if (dbTemplate && permissions) {
                // Find plan permission for this template
                const templatePerm = permissions.find(p => p.template_id === dbTemplate.id);
                if (templatePerm && planDetails[templatePerm.plan_id]) {
                  const plan = planDetails[templatePerm.plan_id];
                  planName = plan.plan_name;
                  planTier = plan.plan_tier;
                  
                  // Check if user's plan has permission to download this template
                  if (userPlanId) {
                    // User is logged in - check if their plan allows this template
                    canDownload = templatePerm.plan_id === userPlanId;
                    
                    // Set download limits if user has a plan
                    if (userMaxDownloads !== null) {
                      maxDownloads = userMaxDownloads;
                      remainingDownloads = Math.max(0, userMaxDownloads - userCurrentDownloads);
                    }
                  } else {
                    // User not logged in - template requires a plan
                    canDownload = false;
                  }
                } else if (userPlanId) {
                  // Template has no plan restrictions, but user is logged in
                  // Allow download but check download limits
                  if (userMaxDownloads !== null) {
                    maxDownloads = userMaxDownloads;
                    remainingDownloads = Math.max(0, userMaxDownloads - userCurrentDownloads);
                  }
                }
              } else if (userPlanId) {
                // Template not in database, but user is logged in
                // Allow download but check download limits
                if (userMaxDownloads !== null) {
                  maxDownloads = userMaxDownloads;
                  remainingDownloads = Math.max(0, userMaxDownloads - userCurrentDownloads);
                }
              }
              
              return {
                ...t,
                id: dbTemplate?.id || t.id,
                plan_name: planName,
                plan_tier: planTier,
                can_download: canDownload,
                max_downloads: maxDownloads,
                remaining_downloads: remainingDownloads,
                current_downloads: userCurrentDownloads
              };
            });
          }
        } catch (planError) {
          // If plan enrichment fails, just use templates without plan info
          // This is expected if database is not available or user doesn't have access
          console.debug('Could not enrich templates with plan info:', planError);
        }
        
        setTemplates(activeTemplates);
      } else {
        const errorText = await response.text();
        // Failed to fetch templates
        toast.error(`Failed to fetch templates: ${response.status}`);
      }
    } catch (error: any) {
      // Error fetching templates
      toast.error(`Error fetching templates: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (template: DocumentTemplate) => {
    const templateKey = template.id || template.file_name || template.name;
    
    // Check if user can download this template
    const hasRemainingDownloads = template.remaining_downloads === undefined || 
                                 template.remaining_downloads === null || 
                                 template.remaining_downloads > 0;
    
    const canDownload = (template.can_download !== false) && hasRemainingDownloads;
    
    if (!canDownload) {
      if (template.can_download === false) {
        toast.error('This template is not available in your current plan. Please upgrade to access this template.');
      } else if (template.remaining_downloads !== undefined && template.remaining_downloads !== null && template.remaining_downloads <= 0) {
        toast.error(`You have reached your download limit (${template.max_downloads} downloads per month). Please upgrade your plan for more downloads.`);
      } else {
        toast.error('You do not have permission to download this template.');
      }
      return;
    }
    
    try {
      setProcessingStatus(prev => ({
        ...prev,
        [templateKey]: {
          status: 'processing',
          message: 'Downloading',
          progress: 10
        }
      }));

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingStatus(prev => {
          const current = prev[templateKey];
          if (current && current.status === 'processing' && current.progress && current.progress < 95) {
            return {
              ...prev,
              [templateKey]: {
                ...current,
                progress: Math.min(current.progress + 8, 95),
                message: 'Downloading'
              }
            };
          }
          return prev;
        });
      }, 400);

      const timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Request timeout'
          }
        }));
        toast.error('Request timeout - please try again');
      }, 30000);

      // Send request to backend - EXACTLY like CMS does (which works perfectly!)
      // CMS sends ONLY: template_name and vessel_imo (no template_id, no user_id)
      
      // Validate vessel_imo first
      const vesselImoTrimmed = String(vesselImo || '').trim();
      if (!vesselImoTrimmed || vesselImoTrimmed === '') {
        toast.error('Vessel IMO is missing. Please try again.');
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Vessel IMO missing'
          }
        }));
        return;
      }

      // Get template_name from template (like CMS does)
      // CMS uses templateName directly, we need to get it from template.file_name or template.name
      let templateName = '';
      if (template.file_name) {
        templateName = String(template.file_name).trim();
      } else if (template.name) {
        templateName = String(template.name).trim();
      } else {
        toast.error('Template name is missing. Please refresh and try again.');
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Template name missing'
          }
        }));
        return;
      }

      // Remove .docx extension if present (CMS sends it without extension)
      if (templateName.toLowerCase().endsWith('.docx')) {
        templateName = templateName.slice(0, -5);
      }

      // Final validation
      if (!templateName || templateName === '' || templateName === 'null' || templateName === 'undefined') {
        toast.error('Invalid template name. Please refresh and try again.');
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Invalid template name'
          }
        }));
        return;
      }

      // Build request data - CMS style (simple and works!)
      const requestData: any = {
        template_name: templateName,
        vessel_imo: vesselImoTrimmed
      };
      
      // DO NOT send template_id or user_id - CMS doesn't send them and it works!

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/generate-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        });
      } catch (fetchError) {
        // Network error
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: 'Network error - please check your connection'
          }
        }));
        toast.error('Network error. Please try again.');
        return;
      }

      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      if (response.ok) {
        const contentDisposition = response.headers.get('Content-Disposition');
        const templateName = template.file_name || template.name || 'template';
        const apiTemplateName = templateName.replace('.docx', '');
        let filename = `${apiTemplateName}_${vesselImo}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/['"]/g, '').trim();
          }
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'completed',
            message: 'Downloaded successfully',
            progress: 100
          }
        }));
        
        toast.success('Document downloaded successfully');
      } else {
        // Try to get error message from response
        // Note: response body can only be read once, so we clone it
        let errorMessage = `Failed to process (${response.status})`;
        try {
          // Clone response to read it without consuming the original
          const responseClone = response.clone();
          const errorData = await responseClone.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (e) {
          // If response is not JSON, try text
          try {
            const responseClone = response.clone();
            const errorText = await responseClone.text();
            if (errorText) {
              errorMessage = errorText.substring(0, 200); // Limit length
            }
          } catch (textError) {
            // Use default message
          }
        }
        
        setProcessingStatus(prev => ({
          ...prev,
          [templateKey]: {
            status: 'failed',
            message: `Failed (${response.status})`
          }
        }));
        
        // Handle different error status codes with actual error message
        if (response.status === 404) {
          toast.error(`Template or vessel not found: ${errorMessage}`);
        } else if (response.status === 403) {
          toast.error(`Permission denied: ${errorMessage}`);
        } else if (response.status === 500) {
          toast.error(`Server error: ${errorMessage}`);
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      // Error processing document
      setProcessingStatus(prev => ({
        ...prev,
        [templateKey]: {
          status: 'failed',
          message: 'Processing error',
          progress: 0
        }
      }));
      toast.error('Error processing file');
    }
  };

  const getStatusIcon = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProcessingStatus['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading templates...</span>
      </div>
    );
  }

  return (
    <div>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates available.</p>
            <p className="text-sm">Contact your administrator to upload templates.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={fetchTemplates}
            >
              Refresh Templates
            </Button>
          </div>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Available Document Templates ({templates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => {
              const templateKey = template.id || template.file_name || template.name;
              const status = processingStatus[templateKey];
              const isProcessing = status?.status === 'processing';
              
              // Get display values
              const displayName = template.metadata?.display_name || 
                                 template.name || 
                                 template.title || 
                                 (template.file_name ? template.file_name.replace('.docx', '') : '') || 
                                 'Unknown Template';
              
              const description = template.description || 
                                 template.metadata?.description || 
                                 '';
              
              const planName = template.plan_name || template.plan_tier || null;
              
              // Check if user can download
              const hasRemainingDownloads = template.remaining_downloads === undefined || 
                                           template.remaining_downloads === null || 
                                           template.remaining_downloads > 0;
              
              const canDownload = (template.can_download !== false) && hasRemainingDownloads;
              
              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(status?.status || 'idle')}
                      <div className="flex-1 min-w-0">
                        {/* Template Display Name */}
                        <h4 className="font-medium text-base">{displayName}</h4>
                        
                        {/* Plan Information - Show if user is logged in */}
                        {user?.id && planName && (
                          <div className="mt-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-primary">Plan:</span> {planName}
                            </p>
                          </div>
                        )}
                        
                        {/* Description - Always show */}
                        <div className="mt-1.5">
                          {description && description.trim() ? (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {description}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 italic">
                              No description available
                            </p>
                          )}
                        </div>
                        
                        {/* Download Counter - Always show if user is logged in and has limits */}
                        {user?.id && (
                          <div className="mt-2">
                            {template.max_downloads !== undefined && template.max_downloads !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="font-medium text-muted-foreground">Downloads:</span>
                                  <span className={`font-semibold ${
                                    template.remaining_downloads !== undefined && 
                                    template.remaining_downloads !== null && 
                                    template.remaining_downloads > 0 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {template.remaining_downloads !== undefined && 
                                     template.remaining_downloads !== null 
                                      ? template.remaining_downloads 
                                      : 0}
                                  </span>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="text-muted-foreground">{template.max_downloads}</span>
                                  <span className="text-muted-foreground text-xs">per month</span>
                                </div>
                                {template.remaining_downloads !== undefined && 
                                 template.remaining_downloads !== null && 
                                 template.remaining_downloads === 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    Limit Reached
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Unlimited downloads
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Lock Message - Show if cannot download */}
                        {!canDownload && (
                          <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-xs font-medium text-amber-800 dark:text-amber-200 block">
                                This template is not available in your current plan
                              </span>
                              {planName && (
                                <span className="text-xs text-amber-700 dark:text-amber-300 mt-1 block">
                                  Upgrade to <strong>{planName}</strong> plan to download this document
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Processing Status */}
                        {status && (
                          <div className="mt-3">
                            {status.status === 'processing' && status.progress !== undefined && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                    {status.message}
                                  </span>
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {status.progress}%
                                  </span>
                                </div>
                                <Progress value={status.progress} className="h-2" />
                              </div>
                            )}
                            {status.status !== 'processing' && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={getStatusColor(status.status)}>
                                  {status.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {status.message}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => processDocument(template)}
                      disabled={isProcessing || !canDownload}
                      className={`${
                        !canDownload 
                          ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                      title={!canDownload ? (planName ? `Upgrade to ${planName} plan to download` : 'Not available in your plan') : ''}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Downloading...
                        </>
                      ) : !canDownload ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

