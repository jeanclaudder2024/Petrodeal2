import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, FileText, Download, Trash2, Plus, Eye, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  placeholders: string[];
  placeholder_mappings: Record<string, string>;
  subscription_level: string; // basic, premium, enterprise
  is_active: boolean;
  created_at: string;
}

interface UserPermissions {
  can_upload_templates: boolean;
  can_edit_templates: boolean;
  can_delete_templates: boolean;
  can_process_documents: boolean;
  max_templates: number;
  max_documents_per_month: number;
  plan: string;
}

interface VesselInfo {
  id: string;
  name: string;
  imo: string;
  vessel_type?: string;
  flag?: string;
}

const API_BASE_URL = 'https://auto-fill-1nk9.onrender.com';

export default function DocumentTemplateManager() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [vessels, setVessels] = useState<VesselInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    subscription_level: 'basic',
    is_active: true
  });
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    subscription_level: 'basic',
    file: null as File | null
  });

  useEffect(() => {
    fetchTemplates();
    fetchVessels();
    fetchUserPermissions();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      toast.error('Error fetching templates');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vessels`);
      if (response.ok) {
        const data = await response.json();
        setVessels(data);
      }
    } catch (error) {
      console.error('Error fetching vessels:', error);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-permissions`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description,
      subscription_level: template.subscription_level,
      is_active: template.is_active
    });
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('subscription_level', editForm.subscription_level);
      formData.append('is_active', editForm.is_active.toString());

      const response = await fetch(`${API_BASE_URL}/templates/${editingTemplate.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        toast.success('Template updated successfully');
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        toast.error('Failed to update template');
      }
    } catch (error) {
      toast.error('Error updating template');
      console.error('Error:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Error deleting template');
      console.error('Error:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('description', newTemplate.description);
      formData.append('subscription_level', newTemplate.subscription_level);
      formData.append('template_file', newTemplate.file);

      const response = await fetch(`${API_BASE_URL}/upload-template`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Template uploaded successfully');
        setNewTemplate({ name: '', description: '', subscription_level: 'basic', file: null });
        setShowUploadForm(false);
        fetchTemplates();
      } else {
        toast.error('Failed to upload template');
      }
    } catch (error) {
      toast.error('Error uploading template');
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewTemplate(prev => ({ ...prev, file }));
    }
  };

  const processDocument = async (templateId: string, vesselImo: string) => {
    try {
      setLoading(true);
      
      // First, get the template file (in a real implementation, you'd fetch this from your database)
      const templateFile = new File([''], 'template.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
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
          // Download the processed document
          window.open(`${API_BASE_URL}/download/${result.document_id}`, '_blank');
          toast.success('Document processed and downloaded successfully');
        } else {
          toast.error(result.message || 'Document processing failed');
        }
      } else {
        toast.error('Failed to process document');
      }
    } catch (error) {
      toast.error('Error processing document');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Template Manager</h2>
          {permissions && (
            <p className="text-sm text-muted-foreground">
              Plan: {permissions.plan} | Templates: {templates.length}/{permissions.max_templates}
            </p>
          )}
        </div>
        <Button 
          onClick={() => setShowUploadForm(true)} 
          className="flex items-center gap-2"
          disabled={!permissions?.can_upload_templates || (permissions && templates.length >= permissions.max_templates)}
        >
          <Plus className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label htmlFor="subscription_level">Subscription Level</Label>
                <select
                  id="subscription_level"
                  value={newTemplate.subscription_level}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subscription_level: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="basic">Basic Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>
              <div>
                <Label htmlFor="file">Template File (.docx)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Template'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates found. Upload your first template to get started.
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {template.subscription_level}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {permissions?.can_edit_templates && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {permissions?.can_delete_templates && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{template.name}" ({template.subscription_level} plan)? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Placeholders:</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.placeholders.map((placeholder) => (
                        <Badge key={placeholder} variant="outline">
                          {placeholder}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Test with Vessel:</h4>
                    <div className="flex gap-2">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => {
                          if (e.target.value) {
                            processDocument(template.id, e.target.value);
                          }
                        }}
                      >
                        <option value="">Select a vessel to test...</option>
                        {vessels.map((vessel) => (
                          <option key={vessel.id} value={vessel.imo}>
                            {vessel.name} (IMO: {vessel.imo})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Template Details Modal */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Template Details: {selectedTemplate.name}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Description:</h4>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
              <div>
                <h4 className="font-medium">Placeholders:</h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {selectedTemplate.placeholders.map((placeholder) => (
                    <div key={placeholder} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-mono text-sm">{placeholder}</span>
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplate.placeholder_mappings[placeholder] || 'Not mapped'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Template: {editingTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label htmlFor="edit-subscription-level">Subscription Level</Label>
                <select
                  id="edit-subscription-level"
                  value={editForm.subscription_level}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subscription_level: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="basic">Basic Plan</option>
                  <option value="premium">Premium Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateTemplate} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
