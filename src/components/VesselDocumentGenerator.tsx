import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
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

const API_BASE_URL = 'https://document-processor-production-8a35.up.railway.app';

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

  const createCustomViewer = (documentUrl: string, documentName: string) => {
    // Create a data URL with HTML content that embeds the document
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentName} - Document Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 18px;
        }
        .print-btn {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .print-btn:hover {
            background-color: #2980b9;
        }
        .viewer-container {
            height: calc(100vh - 70px);
            width: 100%;
            border: none;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: #666;
        }
        .error {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #e74c3c;
            text-align: center;
            padding: 20px;
        }
        .error h2 {
            margin-bottom: 10px;
        }
        .error p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📄 ${documentName}</h1>
        <button class="print-btn" onclick="window.print()">🖨️ Print Document</button>
    </div>
    
    <div id="viewer-container">
        <div class="loading">Loading document...</div>
    </div>

    <script>
        const documentUrl = '${documentUrl}';
        const container = document.getElementById('viewer-container');
        
        // Try multiple viewer approaches
        function tryViewers() {
            // Method 1: Try Google Docs viewer
            const googleViewer = \`https://docs.google.com/viewer?url=\${encodeURIComponent(documentUrl)}&embedded=true&toolbar=0&navpanes=0&scrollbar=1&print=1\`;
            
            const iframe = document.createElement('iframe');
            iframe.src = googleViewer;
            iframe.className = 'viewer-container';
            iframe.onload = function() {
                // Check if Google Docs viewer loaded successfully
                setTimeout(() => {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc.body && iframeDoc.body.innerHTML.includes('Unable to display')) {
                            throw new Error('Google Docs viewer failed');
                        }
                    } catch (e) {
                        tryMicrosoftViewer();
                    }
                }, 3000);
            };
            iframe.onerror = tryMicrosoftViewer;
            
            container.innerHTML = '';
            container.appendChild(iframe);
        }
        
        function tryMicrosoftViewer() {
            // Method 2: Try Microsoft Office Online viewer
            const officeViewer = \`https://view.officeapps.live.com/op/embed.aspx?src=\${encodeURIComponent(documentUrl)}\`;
            
            const iframe = document.createElement('iframe');
            iframe.src = officeViewer;
            iframe.className = 'viewer-container';
            iframe.onload = function() {
                setTimeout(() => {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc.body && iframeDoc.body.innerHTML.includes('error') || iframeDoc.body.innerHTML.includes('Error')) {
                            throw new Error('Microsoft viewer failed');
                        }
                    } catch (e) {
                        showError();
                    }
                }, 3000);
            };
            iframe.onerror = showError;
            
            container.innerHTML = '';
            container.appendChild(iframe);
        }
        
        function showError() {
            container.innerHTML = \`
                <div class="error">
                    <h2>⚠️ Unable to preview document</h2>
                    <p>The document cannot be displayed in the browser.</p>
                    <p>This may be due to server restrictions or document format.</p>
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        Please try refreshing the page or contact support for assistance.
                    </p>
                    <p style="margin-top: 10px; font-size: 12px; color: #999;">
                        Note: Documents are view-only and cannot be downloaded for security reasons.
                    </p>
                </div>
            \`;
        }
        
        // Start trying viewers
        tryViewers();
    </script>
</body>
</html>`;

    // Create a blob URL for the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  const viewDocument = async (templateName: string, templateDisplayName: string) => {
    try {
      console.log('Viewing document:', { templateName, templateDisplayName, vesselImo });
      
      // Set processing status
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'processing',
          message: 'Generating and uploading document...',
          progress: 30
        }
      }));

      // First, generate and upload document to Supabase storage
      const response = await fetch(`${API_BASE_URL}/view-document/${encodeURIComponent(templateName)}?vessel_imo=${encodeURIComponent(vesselImo)}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate document');
      }
      
      const result = await response.json();
      
      if (!result.success || !result.document_id) {
        throw new Error('Failed to get document ID');
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'processing',
          message: 'Opening secure viewer...',
          progress: 80
        }
      }));

      // Now open the document from Supabase storage
      const viewerUrl = `${API_BASE_URL}/view-document-storage/${result.document_id}`;
      window.open(viewerUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'completed',
          message: 'Document opened in secure viewer',
          progress: 100
        }
      }));
      
      toast.success('Document opened in secure viewer - view and print only, no downloads allowed');
      
    } catch (error) {
      console.error('Error viewing document:', error);
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'failed',
          message: 'Failed to open document',
          progress: 0
        }
      }));
      toast.error('Failed to open document');
    }
  };

  const viewPDF = async (templateName: string, templateDisplayName: string) => {
    try {
      console.log('Viewing PDF:', { templateName, templateDisplayName, vesselImo });
      
      // Set processing status
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'processing',
          message: 'Generating PDF document...',
          progress: 50
        }
      }));

      // Generate PDF document URL
      const pdfUrl = `${API_BASE_URL}/generate-pdf/${encodeURIComponent(templateName)}?vessel_imo=${encodeURIComponent(vesselImo)}`;
      
      // Open PDF document
      window.open(pdfUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'completed',
          message: 'PDF document opened',
          progress: 100
        }
      }));
      
      toast.success('PDF document opened');
      
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setProcessingStatus(prev => ({
        ...prev,
        [templateName]: {
          status: 'failed',
          message: 'Failed to open PDF',
          progress: 0
        }
      }));
      toast.error('Failed to open PDF document');
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
          if (current && current.status === 'processing' && current.progress && current.progress < 90) {
            return {
              ...prev,
              [templateName]: {
                ...current,
                progress: Math.min(current.progress + 10, 90),
                message: current.progress < 30 ? 'Extracting placeholders...' :
                        current.progress < 60 ? 'Filling data...' :
                        current.progress < 90 ? 'Protecting document...' : 'Finalizing...'
              }
            };
          }
          return prev;
        });
      }, 500);

      // Create a dummy file for the template_file parameter (required by API)
      const dummyFile = new File(['dummy'], 'dummy.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const formData = new FormData();
      formData.append('template_name', templateName);
      formData.append('vessel_imo', vesselImo);
      formData.append('template_file', dummyFile);

      console.log('Sending request to:', `${API_BASE_URL}/process-document`);

      const response = await fetch(`${API_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
      });

      // Clear progress interval
      clearInterval(progressInterval);

      console.log('Process response status:', response.status);

      if (response.ok) {
        // Check if response is DOCX (direct download)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          // Handle direct DOCX download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `processed_${vesselImo}_${Date.now()}.docx`;
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
          
          toast.success('Password-protected document downloaded successfully');
        } else {
          // Handle JSON response (fallback)
          const responseText = await response.text();
          const result = JSON.parse(responseText);
          console.log('Process result:', result);
          
          if (result.success) {
            setProcessingStatus(prev => ({
              ...prev,
              [templateName]: {
                status: 'completed',
                message: 'Ready for download',
                progress: 100
              }
            }));
            
            toast.success('File processed successfully');
          } else {
            setProcessingStatus(prev => ({
              ...prev,
              [templateName]: {
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
            status: 'failed',
            message: `Failed to process (${response.status})`
          }
        }));
        toast.error(`Failed to process file (${response.status})`);
        console.error('HTTP Error:', response.status, responseText);
      }
    } catch (error) {
      console.error('Error processing document:', error);
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
          <FileText className="h-5 w-5" />
          Document Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate and view documents for {vesselName} (IMO: {vesselImo}) - Documents stored securely in Supabase, view and print only (no downloads)
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
                      onClick={() => viewDocument(template.file_name, template.name)}
                      disabled={isProcessing}
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {isProcessing ? 'Opening...' : 'View & Print Only'}
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
