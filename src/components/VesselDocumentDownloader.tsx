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
      const response = await fetch(`${API_BASE_URL}/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.filter((template: DocumentTemplate) => template.is_active));
      } else {
        toast.error('Failed to fetch document templates');
      }
    } catch (error) {
      toast.error('Error fetching document templates');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (templateId: string, templateName: string) => {
    try {
      // Set processing status
      setProcessingStatus(prev => ({
        ...prev,
        [templateId]: {
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
      formData.append('template_id', templateId);
      formData.append('vessel_imo', vesselImo);
      formData.append('template_file', dummyFile);

      console.log('Processing document with template ID:', templateId, 'for vessel:', vesselImo);

      const response = await fetch(`${API_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        
        if (result.success) {
          setProcessingStatus(prev => ({
            ...prev,
            [templateId]: {
              document_id: result.document_id,
              status: 'completed',
              message: 'Document ready for download',
              download_url: result.download_url
            }
          }));
          
          toast.success('Document processed successfully');
          
          // Auto-download the document
          setTimeout(() => {
            window.open(`${API_BASE_URL}/download/${result.document_id}`, '_blank');
          }, 1000);
        } else {
          setProcessingStatus(prev => ({
            ...prev,
            [templateId]: {
              document_id: '',
              status: 'failed',
              message: result.message || 'Processing failed'
            }
          }));
          toast.error(result.message || 'Document processing failed');
          console.error('Processing failed:', result);
        }
      } else {
        setProcessingStatus(prev => ({
          ...prev,
          [templateId]: {
            document_id: '',
            status: 'failed',
            message: `Failed to process document (${response.status})`
          }
        }));
        toast.error(`Failed to process document (${response.status})`);
        console.error('HTTP Error:', response.status, responseText);
      }
    } catch (error) {
      setProcessingStatus(prev => ({
        ...prev,
        [templateId]: {
          document_id: '',
          status: 'failed',
          message: 'Error processing document'
        }
      }));
      toast.error('Error processing document');
      console.error('Error:', error);
    }
  };

  const downloadDocument = (templateId: string) => {
    const status = processingStatus[templateId];
    if (status?.download_url) {
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
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => {
              const status = processingStatus[template.id];
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
                        onClick={() => downloadDocument(template.id)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    ) : (
                      <Button
                        onClick={() => processDocument(template.id, template.name)}
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
