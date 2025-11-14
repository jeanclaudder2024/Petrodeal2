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
  description: string;
  file_name: string;
  placeholders: string[];
  is_active: boolean;
  can_download?: boolean;
  plan_name?: string;
  plan_tier?: string;
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
      
      // If user is logged in, use user-downloadable-templates endpoint to get templates with plan info
      if (user?.id) {
        console.log('Fetching user downloadable templates from:', `${API_BASE_URL}/user-downloadable-templates`);
        
        const response = await fetch(`${API_BASE_URL}/user-downloadable-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify({ user_id: user.id }),
        });
        
        console.log('User templates response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('User templates data:', data);
          
          if (data.templates && Array.isArray(data.templates)) {
            // Templates already have plan_name and plan_tier from backend
            setTemplates(data.templates);
            console.log('User downloadable templates loaded:', data.templates.length);
            setLoading(false);
            return;
          }
        }
      }
      
      // Fallback: fetch all templates (for non-logged-in users or if user endpoint fails)
      console.log('Fetching all templates from:', `${API_BASE_URL}/templates`);
      
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      console.log('Templates response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Templates data:', data);
        
        // Filter only active templates
        const templatesList = data.templates || [];
        const activeTemplates = templatesList.filter((template: DocumentTemplate) => template.is_active !== false);
        // Set can_download to true by default for non-logged-in users
        // Also ensure plan_name and description are available from metadata
        activeTemplates.forEach(t => {
          if (t.can_download === undefined) {
            t.can_download = true;
          }
          // Use metadata description if available
          if (!t.description && t.metadata?.description) {
            t.description = t.metadata.description;
          }
          // Use metadata display_name if available
          if (!t.name && t.metadata?.display_name) {
            t.name = t.metadata.display_name;
          }
        });
        setTemplates(activeTemplates);
        
        console.log('Active templates:', activeTemplates.length);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch templates:', response.status, errorText);
        toast.error(`Failed to fetch document templates: ${response.status} ${errorText.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Error fetching document templates: ${errorMessage}`);
      
      // Show more helpful error message
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
        toast.error('Cannot connect to API server. Make sure it is running on http://localhost:8000');
      }
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (templateName: string, templateDisplayName: string) => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      console.log('Processing document:', { templateName, templateDisplayName, vesselImo });
      
      // Set processing status with progress
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'processing',
          message: 'Downloading',
          progress: 10
        }
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingStatus(prev => {
          const current = prev[templateName];
          if (current && current.status === 'processing' && current.progress && current.progress < 95) {
            return {
              ...prev,
              [templateName]: {
                ...current,
                progress: Math.min(current.progress + 8, 95),
                message: 'Downloading'  // Always show "Downloading"
              }
            };
          }
          return prev;
        });
      }, 400);

      // Add timeout to prevent stuck progress
      timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        setProcessingStatus(prev => ({
          ...prev,
          [templateName]: {
            status: 'failed',
            message: 'Request timeout - server may be busy, please try again'
          }
        }));
        toast.error('Request timeout - server may be busy, please try again');
      }, 30000); // 30 second timeout

      const requestData = {
        template_name: templateName,
        vessel_imo: vesselImo,
        user_id: user?.id || null
      };

      console.log('Sending request to:', `${API_BASE_URL}/generate-document`);
      console.log('Request data:', requestData);

      const response = await fetch(`${API_BASE_URL}/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(requestData),
      });

      console.log('Response received:', response.status, response.statusText);

      // Clear progress interval and timeout
      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      console.log('Process response status:', response.status);

      if (response.ok) {
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `generated_${templateName.replace('.docx', '')}_${vesselImo}.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=(.+?)(?:;|$)/);
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/"/g, '').trim();
          }
        }
        
        // Handle file download (PDF or DOCX)
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
          [templateName]: {
            status: 'completed',
            message: 'Downloaded successfully',
            progress: 100
          }
        }));
        
        toast.success('Document downloaded successfully');
      } else {
        const responseText = await response.text();
        // Clear timeout
        clearTimeout(timeoutId);
        setProcessingStatus(prev => ({
          ...prev,
          [templateName]: {
            status: 'failed',
            message: `Failed to process (${response.status})`
          }
        }));
        toast.error(`Failed to process file (${response.status})`);
        console.error('HTTP Error:', response.status, responseText);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      // Clear timeout if it exists
      if (typeof timeoutId !== 'undefined') {
        clearTimeout(timeoutId);
      }
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading templates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          File Download
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Download files for {vesselName} (IMO: {vesselImo})
        </p>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-4">
            {templates.map((template) => {
              const status = processingStatus[template.file_name];
              const isProcessing = status?.status === 'processing';
              const isCompleted = status?.status === 'completed';
              const isFailed = status?.status === 'failed';

              const canDownload = template.can_download !== false;
              const planName = template.plan_name || template.plan_tier;
              const displayName = template.name || template.title || template.file_name || 'Unknown Template';
              const displayDescription = template.description || template.metadata?.description || '';
              
              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status?.status || 'idle')}
                      <div className="flex-1">
                        <h4 className="font-medium">{displayName}</h4>
                        
                        {/* Plan Name - Always show if user is logged in */}
                        {user?.id && (planName || !canDownload) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Plan:</span> {planName || 'Not available in your plan'}
                          </p>
                        )}
                        
                        {/* Description */}
                        {displayDescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {displayDescription}
                          </p>
                        )}
                        
                        {/* Lock indicator if cannot download */}
                        {!canDownload && (
                          <div className="flex items-center gap-2 mt-2">
                            <Lock className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              This template is not available in your current plan
                            </span>
                          </div>
                        )}
                        
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
                                <div className="relative w-full h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                  {/* Animated progress bar with gradient */}
                                  <div 
                                    className="absolute inset-0 rounded-full transition-all duration-500 ease-out"
                                    style={{ 
                                      width: `${status.progress}%`,
                                      background: 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8, #2563eb, #3b82f6)',
                                      backgroundSize: '200% 100%',
                                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
                                    }}
                                  >
                                    {/* Shimmer effect overlay */}
                                    <div 
                                      className="absolute inset-0 rounded-full"
                                      style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 2s infinite'
                                      }}
                                    ></div>
                                  </div>
                                  {/* Pulse glow effect */}
                                  <div 
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                      width: `${status.progress}%`,
                                      background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 100%)',
                                      animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                      filter: 'blur(4px)'
                                    }}
                                  ></div>
                                  {/* Animated dots at the end */}
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full bg-white shadow-lg"
                                    style={{
                                      right: `${100 - status.progress}%`,
                                      transform: 'translateY(-50%) translateX(50%)',
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }}
                                  ></div>
                                </div>
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
                      onClick={() => processDocument(template.file_name, template.name)}
                      disabled={isProcessing || !canDownload}
                      className={`group relative flex items-center gap-2 transition-all duration-300 ${
                        !canDownload 
                          ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                          : 'hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 active:scale-95 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600'
                      } text-white border-0`}
                      title={!canDownload ? 'This template is not available in your current plan' : ''}
                    >
                      {/* Animated background effect - only if enabled */}
                      {canDownload && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      )}
                      
                      {/* Button content */}
                      <div className="relative flex items-center gap-2">
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : !canDownload ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4 transition-all duration-300 group-hover:animate-bounce group-hover:scale-110" />
                        )}
                        <span className="transition-all duration-300 group-hover:font-semibold">
                          {isProcessing ? 'Downloading...' : !canDownload ? 'Locked' : 'Download'}
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
