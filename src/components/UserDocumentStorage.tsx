import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download, Clock, AlertCircle } from 'lucide-react';
import { db } from "@/lib/supabase-helper";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StoredDocument {
  id: string;
  document_title: string;
  vessel_name: string;
  file_url: string;
  file_size: number;
  downloaded_at: string;
  last_viewed_at: string;
  view_count: number;
}

interface UserDocumentStorageProps {
  vesselId: number;
}

const UserDocumentStorage: React.FC<UserDocumentStorageProps> = ({ vesselId }) => {
  const { user } = useAuth();
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStoredDocuments();
      fetchUserSubscription();
    }
  }, [user, vesselId]);

  // Add a function to refresh the documents
  const refreshDocuments = () => {
    if (user) {
      fetchStoredDocuments();
    }
  };

  // Expose refresh function globally for debugging
  (window as any).refreshUserDocuments = refreshDocuments;

  const fetchStoredDocuments = async () => {
    try {
      const { data, error } = await db
        .from('user_document_storage')
        .select('*')
        .eq('user_id', user!.id)
        .eq('vessel_id', vesselId);

      if (error) {
        console.error('Error fetching stored documents:', error);
        throw error;
      }
      
      setStoredDocuments(data || []);
    } catch (error) {
      console.error('Error fetching stored documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const { data } = await db.from('subscribers').select('*').eq('user_id', user!.id).single();
      setUserSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDocument = async (doc: StoredDocument) => {
    try {
      // Update view count
      await db
        .from('user_document_storage')
        .update({
          last_viewed_at: new Date().toISOString(),
          view_count: (doc.view_count || 0) + 1
        })
        .eq('id', doc.id);

      // Open document in new tab for viewing
      window.open(doc.file_url, '_blank');
      
      // Update local state
      setStoredDocuments(prev => 
        prev.map(document => 
          document.id === doc.id 
            ? { ...document, view_count: (document.view_count || 0) + 1, last_viewed_at: new Date().toISOString() }
            : document
        )
      );

      toast.success('Document opened for viewing');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    }
  };

  const handleDownloadDocument = async (doc: StoredDocument) => {
    if (!userSubscription?.subscribed) {
      toast.error('Download requires an active subscription. Free trial users can only view documents.');
      return;
    }

    try {
      // Create a temporary link to download the file
      const link = window.document.createElement('a');
      link.href = doc.file_url;
      link.download = `${doc.document_title}_${doc.vessel_name}.pdf`;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast.success(`Document downloaded: ${doc.document_title}`);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const canDownload = userSubscription?.subscribed;

  if (loading) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Document Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Please sign in to view your stored documents
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Your Document Storage
            <Button
              variant="outline" 
              size="sm"
              onClick={refreshDocuments}
              className="ml-auto"
            >
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Generated documents for this vessel are stored here. {!canDownload && 'Free trial users can view but not download documents.'}
          </CardDescription>
        </CardHeader>
      <CardContent>
        {storedDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No documents generated yet for this vessel
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate documents using the vessel documents section above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {storedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">{doc.document_title}</h4>
                    {!canDownload && (
                      <Badge variant="outline" className="text-xs">
                        View Only
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Generated: {formatDate(doc.downloaded_at)}</p>
                    <p>Size: {formatFileSize(doc.file_size)}</p>
                    {doc.view_count > 0 && (
                      <p>Viewed: {doc.view_count} times</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  
                  <Button
                    variant={canDownload ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDownloadDocument(doc)}
                    disabled={!canDownload}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    {canDownload ? 'Download' : 'Subscription Required'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserDocumentStorage;