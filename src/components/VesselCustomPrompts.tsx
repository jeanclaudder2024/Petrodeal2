import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VesselDocument {
  id: string;
  title: string;
  description: string;
  subscription_level: string;
}

interface VesselCustomPrompt {
  id: string;
  document_id: string;
  custom_prompt: string;
  created_at: string;
  updated_at: string;
}

interface VesselCustomPromptsProps {
  vesselId: number;
  vesselData: any;
}

const VesselCustomPrompts: React.FC<VesselCustomPromptsProps> = ({ vesselId, vesselData }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VesselDocument[]>([]);
  const [customPrompts, setCustomPrompts] = useState<VesselCustomPrompt[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [promptText, setPromptText] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<VesselCustomPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchCustomPrompts();
  }, [vesselId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('vessel_documents')
        .select('id, title, description, subscription_level')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load document templates');
    }
  };

  const fetchCustomPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('vessel_document_prompts')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomPrompts(data || []);
    } catch (error) {
      console.error('Error fetching custom prompts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedDocumentId || !promptText.trim()) {
      toast.error('Please select a document and enter a prompt');
      return;
    }

    if (!user) {
      toast.error('Please sign in to save custom prompts');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPrompt) {
        // Update existing prompt
        const { error } = await supabase
          .from('vessel_document_prompts')
          .update({
            custom_prompt: promptText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPrompt.id);

        if (error) throw error;
        toast.success('Custom prompt updated successfully');
      } else {
        // Create new prompt
        const { error } = await supabase
          .from('vessel_document_prompts')
          .insert({
            vessel_id: vesselId,
            document_id: selectedDocumentId,
            custom_prompt: promptText.trim(),
            created_by: user.id
          });

        if (error) throw error;
        toast.success('Custom prompt saved successfully');
      }

      // Reset form
      setSelectedDocumentId('');
      setPromptText('');
      setEditingPrompt(null);
      
      // Refresh data
      await fetchCustomPrompts();
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      if (error.code === '23505') {
        toast.error('A custom prompt already exists for this document. Please edit the existing one.');
      } else {
        toast.error('Failed to save custom prompt');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPrompt = (prompt: VesselCustomPrompt) => {
    setEditingPrompt(prompt);
    setSelectedDocumentId(prompt.document_id);
    setPromptText(prompt.custom_prompt);
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this custom prompt?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vessel_document_prompts')
        .delete()
        .eq('id', promptId);

      if (error) throw error;
      toast.success('Custom prompt deleted successfully');
      await fetchCustomPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error('Failed to delete custom prompt');
    }
  };

  const handleCancelEdit = () => {
    setEditingPrompt(null);
    setSelectedDocumentId('');
    setPromptText('');
  };

  const getDocumentTitle = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc?.title || 'Unknown Document';
  };

  const getSubscriptionBadgeColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'enterprise': return 'bg-accent/20 text-accent border-accent/30';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Document Prompts
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
          Custom Document Prompts
        </CardTitle>
        <CardDescription>
          Override default document generation prompts with vessel-specific instructions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create/Edit Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          <h4 className="font-semibold flex items-center gap-2">
            {editingPrompt ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingPrompt ? 'Edit Custom Prompt' : 'Add Custom Prompt'}
          </h4>
          
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Document Template</label>
              <Select 
                value={selectedDocumentId} 
                onValueChange={setSelectedDocumentId}
                disabled={!!editingPrompt}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a document template" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center gap-2">
                        <span>{doc.title}</span>
                        <Badge className={getSubscriptionBadgeColor(doc.subscription_level)}>
                          {doc.subscription_level}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Prompt</label>
              <Textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your custom prompt for document generation..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This prompt will override the default template. You can use placeholders like {'{vessel_name}'}, {'{vessel_type}'}, {'{mmsi}'}, etc.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSavePrompt}
                disabled={isSaving || !selectedDocumentId || !promptText.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : editingPrompt ? 'Update Prompt' : 'Save Prompt'}
              </Button>
              {editingPrompt && (
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Existing Custom Prompts */}
        <div className="space-y-4">
          <h4 className="font-semibold">Existing Custom Prompts</h4>
          
          {customPrompts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No custom prompts created yet</p>
              <p className="text-sm">Create your first custom prompt above to override default document generation</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {customPrompts.map((prompt) => (
                <div key={prompt.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium">{getDocumentTitle(prompt.document_id)}</h5>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(prompt.created_at).toLocaleDateString()}
                        {prompt.updated_at !== prompt.created_at && (
                          <span> • Updated: {new Date(prompt.updated_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPrompt(prompt)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    <p className="line-clamp-3">{prompt.custom_prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VesselCustomPrompts;
