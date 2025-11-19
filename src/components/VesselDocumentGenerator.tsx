import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Loader2, CheckCircle, XCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
          const response = await fetch(`${API_BASE_URL}/user-downloadable-templates`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ user_id: user.id }),
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
        const activeTemplates = templatesList
          .filter((t: DocumentTemplate) => t.is_active !== false)
          .map((t: DocumentTemplate) => ({
            ...t,
            can_download: true, // Default for non-logged-in users
          }));
        
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

      // Send request to backend
      const requestData: any = {
        vessel_imo: vesselImo,
        user_id: user?.id || null
      };
      
      // Ensure we always send either template_id or template_name (not both, and not None)
      if (template.id) {
        requestData.template_id = template.id;
      } else {
        // Get template name - ensure it's not empty
        const templateFileName = template.file_name || template.name || '';
        if (!templateFileName) {
          toast.error('Template name is missing. Please try again.');
          setProcessingStatus(prev => ({
            ...prev,
            [templateKey]: {
              status: 'failed',
              message: 'Template name missing'
            }
          }));
          return;
        }
        // Remove .docx extension if present
        const apiTemplateName = templateFileName.replace(/\.docx$/i, '');
        if (!apiTemplateName) {
          toast.error('Invalid template name. Please try again.');
          setProcessingStatus(prev => ({
            ...prev,
            [templateKey]: {
              status: 'failed',
              message: 'Invalid template name'
            }
          }));
          return;
        }
        requestData.template_name = apiTemplateName;
      }
      
      // Validate vessel_imo is not empty
      if (!vesselImo || !vesselImo.trim()) {
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
                        
                        {/* Download Counter - Show if user is logged in */}
                        {user?.id && template.max_downloads !== undefined && template.max_downloads !== null && (
                          <div className="mt-2">
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
                              </div>
                              {template.remaining_downloads === 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  Limit Reached
                                </Badge>
                              )}
                            </div>
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

