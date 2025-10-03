import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAccess } from '@/contexts/AccessContext';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  placeholders: string[];
  subscription_level: string; // basic, premium, enterprise
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
  const { accessType, isSubscribed } = useAccess();
  
  // Determine user plan based on access context
  const getUserPlan = () => {
    if (isSubscribed) {
      return 'enterprise'; // If subscribed, give highest access
    }
    if (accessType === 'trial') {
      return 'premium'; // Trial users get premium access
    }
    return 'basic'; // Default to basic
  };
  
  const userPlan = getUserPlan();

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
        console.log('✅ API Health Check:', data);
        toast.success('API connection successful');
      } else {
        console.error('❌ API Health Check Failed:', response.status);
        toast.error(`API Health Check Failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ API Connection Error:', error);
      toast.error(`API Connection Error: ${error}`);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching templates from:', `${API_BASE_URL}/templates`);
      
      const response = await fetch(`${API_BASE_URL}/templates`);
      console.log('📡 Templates response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Raw templates data:', data);
        console.log('👤 User plan:', userPlan, 'Access type:', accessType, 'Is subscribed:', isSubscribed);
        
        // Filter templates based on user's subscription level
        const filteredTemplates = data.filter((template: DocumentTemplate) => {
          console.log(`🔍 Checking template "${template.name}":`, {
            is_active: template.is_active,
            subscription_level: template.subscription_level,
            userPlan: userPlan,
            hasAccess: (
              !template.is_active ? false :
              template.subscription_level === 'basic' ? true :
              template.subscription_level === 'premium' && ['premium', 'enterprise'].includes(userPlan) ? true :
              template.subscription_level === 'enterprise' && userPlan === 'enterprise' ? true :
              false
            )
          });
          
          if (!template.is_active) return false;
          
          // TEMPORARY: Show all active templates for debugging
          // TODO: Remove this override once subscription system is working properly
          console.log('🚨 TEMPORARY OVERRIDE: Showing all active templates');
          return true;
          
          // Check subscription level access (commented out for debugging)
          // if (template.subscription_level === 'basic') return true; // Everyone can access basic
          // if (template.subscription_level === 'premium' && ['premium', 'enterprise'].includes(userPlan)) return true;
          // if (template.subscription_level === 'enterprise' && userPlan === 'enterprise') return true;
          // 
          // return false;
        });
        
        console.log('✅ Filtered templates:', filteredTemplates);
        setTemplates(filteredTemplates);
        
        if (filteredTemplates.length === 0) {
          toast.warning('No templates available for your subscription level');
        } else {
          toast.success(`Loaded ${filteredTemplates.length} template(s)`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Templates fetch failed:', response.status, errorText);
        toast.error(`Failed to fetch templates: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Templates fetch error:', error);
      toast.error(`Error fetching templates: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (templateId: string, templateName: string) => {
    try {
      console.log('🚀 Starting document processing for:', templateName, 'ID:', templateId);
      
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

      console.log('📤 Sending request to:', `${API_BASE_URL}/process-document`);
      console.log('📋 Form data:', {
        template_id: templateId,
        vessel_imo: vesselImo,
        template_file: templateFile.name
      });

      const response = await fetch(`${API_BASE_URL}/process-document`, {
        method: 'POST',
        body: formData,
      });

      console.log('📡 Process document response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Process document result:', result);
        
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
            downloadDocumentFromAPI(result.document_id, `vessel_report_${result.document_id}.pdf`);
          }, 1000);
        } else {
          console.error('❌ Document processing failed:', result);
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
        const errorText = await response.text();
        console.error('❌ Process document failed:', response.status, errorText);
        setProcessingStatus(prev => ({
          ...prev,
          [templateId]: {
            document_id: '',
            status: 'failed',
            message: `Failed to process document (${response.status})`
          }
        }));
        toast.error(`Failed to process document: ${response.status}`);
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

  const downloadDocumentFromAPI = async (documentId: string, filename: string) => {
    try {
      const downloadUrl = `${API_BASE_URL}/download/${documentId}`;
      console.log('🔄 Fetching document from:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      console.log('📡 Download response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📄 Document blob size:', blob.size, 'bytes');
      console.log('📄 Document blob type:', blob.type);
      
      // Ensure proper filename with extension
      const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      
      // Create download link with proper attributes
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up immediately
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('✅ Document downloaded successfully:', finalFilename);
      toast.success(`Document downloaded: ${finalFilename}`);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      toast.error(`Download failed: ${error}`);
    }
  };

  const downloadDocument = (templateId: string) => {
    const status = processingStatus[templateId];
    if (status?.document_id) {
      downloadDocumentFromAPI(status.document_id, `vessel_report_${status.document_id}.pdf`);
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
         <div className="flex gap-2 mt-2">
           <Button 
             onClick={testApiConnection} 
             variant="outline" 
             size="sm"
             className="text-xs"
           >
             Test API Connection
           </Button>
           <Button 
             onClick={fetchTemplates} 
             variant="outline" 
             size="sm"
             className="text-xs"
           >
             Refresh Templates
           </Button>
           <Button 
             onClick={() => downloadDocumentFromAPI('test-doc-id', 'test-document.pdf')} 
             variant="outline" 
             size="sm"
             className="text-xs"
           >
             Test Download
           </Button>
         </div>
         <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
           <strong>Debug Info:</strong> User Plan: {userPlan} | Access Type: {accessType} | Subscribed: {isSubscribed ? 'Yes' : 'No'}
         </div>
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
                          <Badge variant="outline" className="capitalize text-xs">
                            {template.subscription_level}
                          </Badge>
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
  );
}
