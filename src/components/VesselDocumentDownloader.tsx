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

const API_BASE_URL = 'https://auto-fill-1nk9.onrender.com';

export default function VesselDocumentDownloader({ vesselImo, vesselName }: VesselDocumentDownloaderProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, ProcessingStatus>>({});

  useEffect(() => {
    fetchTemplates();
    // Test API connectivity
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('API Health Check:', data);
      } else {
        console.error('API Health Check Failed:', response.status);
      }
    } catch (error) {
      console.error('API Connection Error:', error);
    }
  };

  // Handle download attempt
  const handleDownloadAttempt = (template: DocumentTemplate) => {
    processDocument(template.id, template.name);
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/templates`);
      if (response.ok) {
        const data = await response.json();
        // Show all active templates
        const activeTemplates = data.filter((template: DocumentTemplate) => template.is_active);
        setTemplates(activeTemplates);
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

      // Create a sample template file (in real implementation, fetch from database)
      const templateContent = `Vessel Report for ${vesselName}
      
Vessel Name: {vessel_name}
IMO: {imo}
Vessel Type: {vessel_type}
Flag: {flag}
Owner: {owner}
Operator: {operator}

Generated on: {current_date}`;

      const templateFile = new File([templateContent], `${templateName}.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const formData = new FormData();
      formData.append('template_id', templateId);
      formData.append('vessel_imo', vesselImo);
      formData.append('template_file', templateFile);

      const response = await fetch(`${API_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
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
            const downloadUrl = `${API_BASE_URL}/download/${result.document_id}`;
            console.log('Attempting to download from:', downloadUrl);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `vessel_report_${result.document_id}.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
        }
      } else {
        setProcessingStatus(prev => ({
          ...prev,
          [templateId]: {
            document_id: '',
            status: 'failed',
            message: 'Failed to process document'
          }
        }));
        toast.error('Failed to process document');
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

  const downloadDocument = (templateId: string, format: string = 'pdf') => {
    const status = processingStatus[templateId];
    if (status?.download_url) {
      const downloadUrl = `${API_BASE_URL}/download/${status.document_id}?format=${format}`;
      console.log('Manual download from:', downloadUrl);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `vessel_report_${status.document_id}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    <>
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{template.name}</h4>
                        </div>
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
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => downloadDocument(template.id, 'docx')}
                            className="flex items-center gap-2"
                            variant="default"
                          >
                            <FileText className="h-4 w-4" />
                            Word (.docx)
                          </Button>
                          <Button
                            onClick={() => downloadDocument(template.id, 'pdf')}
                            className="flex items-center gap-2"
                            variant="outline"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Word file has exact template design
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleDownloadAttempt(template)}
                        disabled={isProcessing}
                        className="flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {isProcessing ? 'Processing...' : 'Download'}
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
    </>
  );
}
