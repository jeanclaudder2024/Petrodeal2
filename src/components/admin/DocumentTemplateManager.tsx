import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  placeholders: string[];
  placeholder_mappings: Record<string, string>;
  is_active: boolean;
  created_at: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
}

interface VesselInfo {
  id: string;
  name: string;
  imo: string;
  vessel_type?: string;
  flag?: string;
}

const API_BASE_URL = 'http://localhost:8000';

export default function DocumentTemplateManager() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [vessels, setVessels] = useState<VesselInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchTemplates();
    fetchVessels();
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
      formData.append('template_file', newTemplate.file);

      const response = await fetch(`${API_BASE_URL}/upload-template`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Template uploaded successfully');
        setNewTemplate({ name: '', description: '', file: null });
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
          // Download the processed document
          window.open(`${API_BASE_URL}/download/${result.document_id}`, '_blank');
          toast.success('Document processed and downloaded successfully');
        } else {
          toast.error(result.message || 'Document processing failed');
          console.error('Processing failed:', result);
        }
      } else {
        toast.error(`Failed to process document (${response.status})`);
        console.error('HTTP Error:', response.status, responseText);
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
        <h2 className="text-2xl font-bold">Document Template Manager</h2>
        <Button onClick={() => setShowUploadForm(true)} className="flex items-center gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
    </div>
  );
}
