import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Pencil, Trash2, Eye, Download, BarChart3 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface VesselDocument {
  id: string;
  title: string;
  description: string;
  ai_prompt: string;
  subscription_level: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  template_file_url?: string;
  uses_custom_template?: boolean;
}

interface DocumentLog {
  id: string;
  document_id: string;
  vessel_id: number;
  status: string;
  generated_at: string;
  file_size: number;
  error_message: string;
  vessel_documents: {
    title: string;
  };
  vessels: {
    name: string;
  };
}

const DocumentManagement = () => {
  const [documents, setDocuments] = useState<VesselDocument[]>([]);
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<VesselDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ai_prompt: '',
    subscription_level: 'basic',
    is_active: true,
    uses_custom_template: false,
    template_file_url: ''
  });
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchLogs();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('vessel_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('document_generation_logs')
        .select(`
          *,
          vessel_documents(title),
          vessels(name)
        `)
        .order('generated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let templateFileUrl = formData.template_file_url;
      
      // Upload template file if provided
      if (templateFile) {
        const fileName = `${Date.now()}-${templateFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('document-templates')
          .upload(fileName, templateFile);

        if (uploadError) {
          console.error('Template upload error:', uploadError);
          toast.error('Failed to upload template file');
          return;
        }

        templateFileUrl = uploadData.path;
      }

      const documentData = {
        ...formData,
        template_file_url: templateFileUrl || null,
        uses_custom_template: !!templateFileUrl
      };

      if (editingDocument) {
        const { error } = await supabase
          .from('vessel_documents')
          .update(documentData)
          .eq('id', editingDocument.id);

        if (error) throw error;
        toast.success('Document updated successfully');
      } else {
        const { error } = await supabase
          .from('vessel_documents')
          .insert([documentData]);

        if (error) throw error;
        toast.success('Document created successfully');
      }

      setIsDialogOpen(false);
      setEditingDocument(null);
      setTemplateFile(null);
      setFormData({
        title: '',
        description: '',
        ai_prompt: '',
        subscription_level: 'basic',
        is_active: true,
        uses_custom_template: false,
        template_file_url: ''
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (document: VesselDocument) => {
    setEditingDocument(document);
    setTemplateFile(null);
    setFormData({
      title: document.title,
      description: document.description || '',
      ai_prompt: document.ai_prompt,
      subscription_level: document.subscription_level,
      is_active: document.is_active,
      uses_custom_template: document.uses_custom_template || false,
      template_file_url: document.template_file_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('vessel_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vessel_documents')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Document ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status');
    }
  };

  const getSubscriptionBadgeColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'enterprise': return 'bg-gold/20 text-gold border-gold/30';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Document Management</h2>
          <p className="text-muted-foreground">Manage AI-generated vessel documents</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flame-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Edit Document' : 'Add New Document'}
              </DialogTitle>
              <DialogDescription>
                Create a document template that will be generated using AI based on vessel data
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Vessel Inspection Report"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription_level">Access Level</Label>
                  <Select 
                    value={formData.subscription_level} 
                    onValueChange={(value) => setFormData({ ...formData, subscription_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this document contains..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ai_prompt">AI Generation Prompt</Label>
                <Textarea
                  id="ai_prompt"
                  value={formData.ai_prompt}
                  onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                  placeholder="Generate a comprehensive vessel inspection report based on the following vessel data: {vessel_data}. Include technical specifications, operational status, and compliance information..."
                  rows={6}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Use {'{vessel_data}'} as a placeholder where vessel information should be inserted
                </p>
              </div>
              
              <div className="space-y-4">
                <Label>PDF Template (Optional)</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="uses_custom_template"
                      checked={formData.uses_custom_template}
                      onChange={(e) => {
                        setFormData({ ...formData, uses_custom_template: e.target.checked });
                        if (!e.target.checked) {
                          setTemplateFile(null);
                          setFormData(prev => ({ ...prev, template_file_url: '' }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="uses_custom_template" className="text-sm">
                      Use custom PDF template
                    </Label>
                  </div>
                  
                  {formData.uses_custom_template && (
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== 'application/pdf') {
                              toast.error('Please select a PDF file');
                              e.target.value = '';
                              return;
                            }
                            setTemplateFile(file);
                          }
                        }}
                      />
                      {editingDocument?.template_file_url && !templateFile && (
                        <p className="text-sm text-muted-foreground">
                          Current template: {editingDocument.template_file_url.split('/').pop()}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a PDF template file. The AI will fill in vessel data on top of this template.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingDocument(null);
                    setTemplateFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="hero-button" disabled={isLoading}>
                  {editingDocument ? 'Update' : 'Create'} Document
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Generation Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Manage document templates that can be generated for vessels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Access Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>
                          <Badge className={doc.uses_custom_template ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                            {doc.uses_custom_template ? 'Custom PDF' : 'Default'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSubscriptionBadgeColor(doc.subscription_level)}>
                            {doc.subscription_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={doc.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
                          >
                            {doc.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(doc)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleStatus(doc.id, doc.is_active)}
                            >
                              <Eye className={`h-4 w-4 ${doc.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Document Generation Logs</CardTitle>
              <CardDescription>
                Track document generation requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Vessel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>File Size</TableHead>
                      <TableHead>Generated At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.vessel_documents?.title || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {log.vessels?.name || `Vessel #${log.vessel_id}`}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(log.status)}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.file_size ? `${Math.round(log.file_size / 1024)} KB` : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(log.generated_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.error_message && (
                            <p className="text-destructive text-sm truncate">
                              {log.error_message}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentManagement;