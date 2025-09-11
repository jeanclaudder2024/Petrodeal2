import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Clock, CheckCircle, AlertCircle, Lock, Search, Filter } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VesselDocument {
  id: string;
  title: string;
  description: string;
  subscription_level: string;
  broker_membership_required: boolean;
}

interface DocumentGenerationLog {
  id: string;
  status: string;
  generated_at: string;
  file_size: number;
  error_message: string;
}

interface VesselDocumentsProps {
  vesselId: number;
  vesselData: any;
}

const VesselDocuments: React.FC<VesselDocumentsProps> = ({ vesselId, vesselData }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VesselDocument[]>([]);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [brokerMembership, setBrokerMembership] = useState<any>(null);
  const [generatingDocs, setGeneratingDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
    fetchUserSubscription();
    fetchBrokerMembership();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('vessel_documents')
        .select('id, title, description, subscription_level, broker_membership_required')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('subscription_tier, subscribed')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchBrokerMembership = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('broker_memberships')
        .select('membership_status, payment_status')
        .eq('user_id', user.id)
        .eq('membership_status', 'active')
        .eq('payment_status', 'completed')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching broker membership:', error);
        return;
      }
      setBrokerMembership(data);
    } catch (error) {
      console.error('Error fetching broker membership:', error);
      setBrokerMembership(null);
    }
  };

  const canAccessDocument = (docLevel: string, brokerRequired: boolean) => {
    // Check broker membership requirement first
    if (brokerRequired && !brokerMembership) return false;
    
    // Then check subscription level
    if (docLevel === 'basic') return true;
    if (!userSubscription?.subscribed) return false;
    
    if (docLevel === 'premium') {
      return ['premium', 'enterprise'].includes(userSubscription.subscription_tier);
    }
    
    if (docLevel === 'enterprise') {
      return userSubscription.subscription_tier === 'enterprise';
    }
    
    return false;
  };

  const saveToUserDocumentStorage = async (documentId: string, fileUrl: string, fileName: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if document already exists for this user
      const { data: existingDoc } = await supabase
        .from('user_document_storage')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_id', documentId)
        .eq('vessel_id', vesselId)
        .single();

      if (existingDoc) {
        console.log('Document already exists in user storage');
        return;
      }

      // Get document details
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Save to user document storage
       const { error } = await supabase
         .from('user_document_storage')
         .insert({
           user_id: user.id,
           document_id: documentId,
           vessel_id: vesselId,
           file_url: fileUrl,
           document_title: document.title,
           vessel_name: vesselData?.name || 'Unknown Vessel',
           downloaded_at: new Date().toISOString()
         });

      if (error) {
        throw error;
      }

      console.log('Document saved to user storage successfully');
    } catch (error) {
      console.error('Error saving to user document storage:', error);
      throw error;
    }
  };

  const generateDocument = async (documentId: string) => {
    console.log('Generate document clicked', { documentId, user: !!user, vesselId, vesselData });
    
    if (!user) {
      console.error('User not authenticated');
      toast.error('Please sign in to generate documents');
      return;
    }

    if (!vesselData) {
      console.error('No vessel data available');
      toast.error('Vessel data not available');
      return;
    }

    console.log('Setting generating state for document:', documentId);
    setGeneratingDocs(prev => new Set([...prev, documentId]));

    try {
      console.log('Starting document generation...', {
        documentId,
        vesselId,
        vesselName: vesselData?.name,
        userEmail: user.email
      });

      // Call the edge function to generate the PDF
      // Find the document being generated to show its details
      const selectedDocument = documents.find(doc => doc.id === documentId);
      console.log('=== FRONTEND DOCUMENT GENERATION DEBUG ===');
      console.log('Document being generated:', {
        id: documentId,
        title: selectedDocument?.title || 'Unknown',
        description: selectedDocument?.description || 'Unknown',
        subscription_level: selectedDocument?.subscription_level || 'Unknown'
      });
      console.log('Calling edge function with data:', {
        documentId,
        vesselId,
        vesselData: {
          name: vesselData?.name,
          imo: vesselData?.imo,
          mmsi: vesselData?.mmsi
        }
      });
      console.log('=== END FRONTEND DEBUG ===');

      const { data, error } = await supabase.functions.invoke('generate-vessel-document', {
        body: {
          documentId,
          vesselId,
          vesselData
        }
      });

      console.log('Function response:', { data, error });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (error) {
        console.error('Function error details:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from function');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data?.content) {
        console.log('PDF content received, length:', data.content.length);
        
        try {
          // Create PDF blob directly from base64
          const byteCharacters = atob(data.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const pdfBlob = new Blob([byteArray], { type: data.contentType || 'application/pdf' });
          
          console.log('Created PDF blob with size:', pdfBlob.size, 'bytes');

          if (pdfBlob.size === 0) {
            throw new Error('PDF blob is empty');
          }

          // Save PDF to project folder and database
          try {
            const fileName = data.fileName || `vessel-document-${vesselId}-${Date.now()}`;
            
            const saveResponse = await supabase.functions.invoke('save-vessel-document', {
              body: {
                documentId: documentId,
                vesselId: vesselId,
                vesselName: vesselData?.name || 'Unknown Vessel',
                documentTitle: data.fileName || 'Vessel Document',
                pdfBase64: data.content,
                fileName: fileName
              }
            });

            if (saveResponse.error) {
              throw new Error(saveResponse.error.message || 'Failed to save document');
            }

            console.log('Document saved successfully:', saveResponse.data);
            toast.success(`Document saved successfully! You can view or download it from the "My Downloaded Documents" section below.`);
            
          } catch (saveError) {
            console.error('Error saving document:', saveError);
            toast.error(`Document generated but failed to save: ${saveError.message}`);
          }
          
          // Also trigger immediate download
          const blobUrl = URL.createObjectURL(pdfBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = `${data.fileName || `vessel-document-${vesselId}-${Date.now()}`}.pdf`;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          URL.revokeObjectURL(blobUrl);
          
        } catch (blobError) {
          console.error('Error creating PDF blob:', blobError);
          throw new Error(`Failed to create PDF file: ${blobError.message}`);
        }
      } else {
        console.error('No PDF data in response:', data);
        throw new Error('No PDF data received from server');
      }
    } catch (error: any) {
      console.error('Error generating document - Full error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      
      let errorMessage = 'Failed to download document. Please try again.';
      
      if (error.message?.includes('OpenAI API')) {
        errorMessage = 'AI service error. Please check your API configuration.';
      } else if (error.message?.includes('subscription')) {
        errorMessage = 'Insufficient subscription level for this document type.';
      } else if (error.message?.includes('authentication')) {
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error.message?.includes('not configured')) {
        errorMessage = 'AI service not configured. Please contact support.';
      } else if (error.message?.includes('Invalid parameter')) {
        errorMessage = 'AI model configuration issue. Please contact support.';
      } else if (error.message?.includes('broker membership')) {
        errorMessage = 'Active broker membership required for this document.';
      } else {
        errorMessage = `Download failed: ${error?.message || 'Unknown error'}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setGeneratingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const getSubscriptionBadgeColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'enterprise': return 'bg-accent/20 text-accent border-accent/30';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter documents based on search query and subscription level
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = searchQuery === '' || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = subscriptionFilter === 'all' || 
      doc.subscription_level === subscriptionFilter;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          Available Documents
        </CardTitle>
        <CardDescription>
          Available documents for this vessel based on its data and specifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[180px]">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        {(searchQuery || subscriptionFilter !== 'all') && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDocuments.length} of {documents.length} documents
              {searchQuery && (
                <span> matching "{searchQuery}"</span>
              )}
              {subscriptionFilter !== 'all' && (
                <span> for {subscriptionFilter} level</span>
              )}
            </p>
          </div>
        )}

        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || subscriptionFilter !== 'all' 
                ? 'No documents match your search criteria' 
                : 'No documents available'
              }
            </p>
            {(searchQuery || subscriptionFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSearchQuery('');
                  setSubscriptionFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => {
              const canAccess = canAccessDocument(doc.subscription_level, doc.broker_membership_required);
              const isGenerating = generatingDocs.has(doc.id);

              return (
                <div
                  key={doc.id}
                  className="p-4 border rounded-lg transition-all duration-200 border-border hover:border-primary/30 hover:shadow-elegant"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{doc.title}</h3>
                        <Badge className={getSubscriptionBadgeColor(doc.subscription_level)}>
                          {doc.subscription_level}
                        </Badge>
                        {doc.broker_membership_required && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            Broker Only
                          </Badge>
                        )}
                        {!canAccess && (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {canAccess ? (
                        <Button
                          onClick={() => generateDocument(doc.id)}
                          disabled={isGenerating}
                          className="flame-button"
                          size="sm"
                        >
                          {isGenerating ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>                              <Download className="h-4 w-4 mr-2" />                              Download                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Lock className="h-4 w-4" />
                          <span>Upgrade Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!canAccess && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {doc.broker_membership_required && !brokerMembership 
                          ? 'Requires active broker membership to download'
                          : doc.subscription_level === 'premium' 
                            ? 'Requires Premium or Enterprise subscription to download'
                            : 'Requires Enterprise subscription to download'
                        }
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {!userSubscription?.subscribed && (
          <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              <h4 className="font-medium">Upgrade for More Documents</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Get access to premium and enterprise document templates with a subscription.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/subscription'}
            >
              View Subscription Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VesselDocuments;