import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2, CheckCircle, XCircle, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  placeholders: string[];
  is_active: boolean;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  can_download?: boolean;
  max_downloads?: number;
  current_downloads?: number;
  remaining_downloads?: number;
}

interface ProcessingStatus {
  document_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  download_url?: string;
}

interface VesselDocumentDownloaderProps {
  vesselImo: string;
  vesselName: string;
}

const API_BASE_URL = 'http://localhost:8000';

export default function VesselDocumentDownloader({ vesselImo, vesselName }: VesselDocumentDownloaderProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // If user is logged in, get templates with permissions and download limits
      if (user?.id) {
        try {
          const response = await fetch(`${API_BASE_URL}/user-downloadable-templates`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: user.id })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('User downloadable templates:', data);
            
            if (data.templates && Array.isArray(data.templates)) {
              setTemplates(data.templates);
              return;
            }
          } else {
            const errorText = await response.text();
            console.warn('User templates endpoint failed:', response.status, errorText);
          }
        } catch (e) {
          console.warn('Failed to fetch user templates, falling back to all templates:', e);
        }
      }
      
      // Fallback: Get all templates
      console.log('Fetching templates from:', `${API_BASE_URL}/templates`);
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Templates response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Templates data:', data);
        
        // Filter only active templates and set default permissions
        const templatesList = data.templates || [];
        const activeTemplates = templatesList
          .filter((template: DocumentTemplate) => template.is_active !== false)
          .map((template: DocumentTemplate) => ({
            ...template,
            can_download: true, // Default to true if no permission check
            max_downloads: 10,
            current_downloads: 0,
            remaining_downloads: 10
          }));
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
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        toast.error('Cannot connect to API server. Make sure it is running on http://localhost:8000');
      }
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (templateName: string, templateDisplayName: string) => {
    try {
      console.log('Processing document:', { templateName, templateDisplayName, vesselImo });
      
      // Check if user can download this template
      if (user?.id) {
        try {
          const permissionResponse = await fetch(`${API_BASE_URL}/check-download-permission-db`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              template_name: templateName
            })
          });
          
          if (permissionResponse.ok) {
            const permissionData = await permissionResponse.json();
            
            if (!permissionData.can_download || !permissionData.has_permission) {
              toast.error('You do not have permission to download this template');
              return;
            }
            
            if (permissionData.limit_reached) {
              toast.error(`Download limit reached. You have used ${permissionData.current_downloads}/${permissionData.max_downloads} downloads this month.`);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to check permissions, proceeding anyway:', e);
        }
      }
      
      // Set processing status
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          document_id: '',
          status: 'processing',
          message: 'Processing document...'
        }
      }));

      console.log('Sending request to:', `${API_BASE_URL}/generate-document`);

      const response = await fetch(`${API_BASE_URL}/generate-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_name: templateName,
          vessel_imo: vesselImo,
          user_id: user?.id || null
        })
      });

      console.log('Process response status:', response.status);

      if (response.ok) {
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `generated_${templateName.replace('.docx', '')}_${vesselImo}.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=(.+?)(?:;|$)/);
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/"/g, '');
          }
        }
        
        // Download the file
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
            document_id: 'direct',
            status: 'completed',
            message: 'Document downloaded successfully'
          }
        }));
        
        toast.success('Document processed and downloaded successfully');
        
        // Refresh templates to update download counts
        fetchTemplates();
      } else {
        const responseText = await response.text();
        setProcessingStatus(prev => ({
          ...prev,
          [templateName]: {
            document_id: '',
            status: 'failed',
            message: `Failed to process document (${response.status})`
          }
        }));
        toast.error(`Failed to process document (${response.status})`);
        console.error('HTTP Error:', response.status, responseText);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          document_id: '',
          status: 'failed',
          message: 'Error processing document'
        }
      }));
      toast.error('Error processing document');
    }
  };

  const downloadDocument = (templateName: string) => {
    const status = processingStatus[templateName];
    if (status?.download_url) {
      console.log('Downloading document:', `${API_BASE_URL}/download/${status.document_id}`);
      window.open(`${API_BASE_URL}/download/${status.document_id}`, '_blank');
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
            <span>Loading document templates...</span>
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
          Document Downloads
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate and download documents for {vesselName} (IMO: {vesselImo})
        </p>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No document templates available.</p>
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
              const status = processingStatus[template.file_name || template.name];
              const isProcessing = status?.status === 'processing';
              const isCompleted = status?.status === 'completed';
              const isFailed = status?.status === 'failed';

              const canDownload = template.can_download !== false;
              const limitReached = template.remaining_downloads !== undefined && template.remaining_downloads <= 0;
              const showLimit = template.max_downloads !== undefined && template.max_downloads > 0;
              
              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status?.status || 'pending')}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                          {!canDownload && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              View Only
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {template.placeholders && template.placeholders.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.placeholders.length} placeholders available
                          </p>
                        )}
                        {showLimit && (
                          <p className="text-xs mt-1">
                            Downloads: {template.current_downloads || 0}/{template.max_downloads} 
                            {limitReached && (
                              <span className="text-red-500 ml-1">(Limit reached)</span>
                            )}
                          </p>
                        )}
                        {status && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(status.status)}>
                              {status.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {status.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <Button
                        onClick={() => downloadDocument(template.file_name || template.name)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    ) : (
                      <Button
                        onClick={() => processDocument(template.file_name || template.name, template.name)}
                        disabled={isProcessing || !canDownload || limitReached}
                        className="flex items-center gap-2"
                        title={!canDownload ? 'You do not have permission to download this template' : limitReached ? 'Download limit reached for this month' : ''}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : !canDownload ? (
                          <Lock className="h-4 w-4" />
                        ) : limitReached ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {isProcessing ? 'Processing...' : !canDownload ? 'View Only' : limitReached ? 'Limit Reached' : 'Generate'}
                      </Button>
                    )}
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