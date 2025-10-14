import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  file_name: string;
  placeholders: string[];
  is_active: boolean;
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

const API_BASE_URL = 'http://161.97.103.172:8000';

export default function VesselDocumentGenerator({ vesselImo, vesselName }: VesselDocumentGeneratorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      console.log('Fetching templates from:', `${API_BASE_URL}/templates`);
      
      const response = await fetch(`${API_BASE_URL}/templates`);
      console.log('Templates response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Templates data:', data);
        
        // Filter only active templates
        const activeTemplates = (data.templates || []).filter((template: DocumentTemplate) => template.is_active);
        setTemplates(activeTemplates);
        
        console.log('Active templates:', activeTemplates);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch templates:', response.status, errorText);
        toast.error('Failed to fetch document templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error fetching document templates');
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (templateName: string, templateDisplayName: string) => {
    try {
      console.log('Processing document:', { templateName, templateDisplayName, vesselImo });
      
      // Set processing status with progress
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'processing',
          message: 'Initializing...',
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
                message: current.progress < 25 ? 'Extracting placeholders...' :
                        current.progress < 50 ? 'Filling data...' :
                        current.progress < 75 ? 'Converting to PDF...' :
                        current.progress < 95 ? 'Preparing download...' : 'Finalizing...'
              }
            };
          }
          return prev;
        });
      }, 400);

      // Add timeout to prevent stuck progress
      const timeoutId = setTimeout(() => {
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

      // Create a dummy file for the template_file parameter (required by API)
      const dummyFile = new File(['dummy'], 'dummy.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const formData = new FormData();
      formData.append('template_name', templateName);
      formData.append('vessel_imo', vesselImo);
      formData.append('template_file', dummyFile);

      console.log('Sending request to:', `${API_BASE_URL}/process-document`);
      console.log('Request data:', { templateName, vesselImo });

      const response = await fetch(`${API_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', response.status, response.statusText);

      // Clear progress interval and timeout
      clearInterval(progressInterval);
      clearTimeout(timeoutId);

      console.log('Process response status:', response.status);

      if (response.ok) {
        // Check if response is PDF (direct download)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
          // Handle direct PDF download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `processed_${vesselImo}_${Date.now()}.pdf`;
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
          
          toast.success('PDF document downloaded successfully');
        } else {
          // Handle any other response format (treat as file download)
          console.log('Response is not PDF, treating as file download');
          
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `processed_${vesselImo}_${Date.now()}.pdf`;
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
        }
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

              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status?.status || 'idle')}
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {status && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(status.status)}>
                                {status.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {status.message}
                              </span>
                            </div>
                            {status.status === 'processing' && status.progress !== undefined && (
                              <div className="space-y-1">
                                <Progress value={status.progress} className="h-2" />
                                <p className="text-xs text-muted-foreground text-center">
                                  {status.progress}% complete
                                </p>
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
                      disabled={isProcessing}
                      className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 animate-pulse" />
                      )}
                      {isProcessing ? 'Processing...' : 'Download'}
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
