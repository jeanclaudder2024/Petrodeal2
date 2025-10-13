import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  placeholders: string[];
  is_active: boolean;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
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
      
      // Set processing status
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          document_id: '',
          status: 'processing',
          message: 'Processing document...'
        }
      }));

      // Create a dummy file for the template_file parameter (required by API but not used)
      const dummyFile = new File(['dummy'], 'dummy.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const formData = new FormData();
      formData.append('template_name', templateName);  // Use filename instead of ID
      formData.append('vessel_imo', vesselImo);
      formData.append('template_file', dummyFile);

      console.log('Sending request to:', `${API_BASE_URL}/process-document`);

      const response = await fetch(`${API_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
      });

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
              document_id: 'direct',
              status: 'completed',
              message: 'Document downloaded successfully'
            }
          }));
          
          toast.success('Document processed and downloaded successfully');
        } else {
          // Handle JSON response (fallback)
          const responseText = await response.text();
          const result = JSON.parse(responseText);
          console.log('Process result:', result);
          
          if (result.success) {
            setProcessingStatus(prev => ({
              ...prev,
              [templateName]: {
                document_id: result.document_id,
                status: 'completed',
                message: 'Document ready for download',
                download_url: result.download_url
              }
            }));
            
            toast.success('Document processed successfully');
            
            // Auto-download the document
            setTimeout(() => {
              console.log('Auto-downloading document:', `${API_BASE_URL}/download/${result.document_id}`);
              window.open(`${API_BASE_URL}/download/${result.document_id}`, '_blank');
            }, 1000);
          } else {
            setProcessingStatus(prev => ({
              ...prev,
              [templateName]: {
                document_id: '',
                status: 'failed',
                message: result.message || 'Processing failed'
              }
            }));
            toast.error(result.message || 'Document processing failed');
            console.error('Processing failed:', result);
          }
        }
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

              return (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status?.status || 'pending')}
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {template.placeholders && template.placeholders.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.placeholders.length} placeholders available
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
                        disabled={isProcessing}
                        className="flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {isProcessing ? 'Processing...' : 'Generate'}
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