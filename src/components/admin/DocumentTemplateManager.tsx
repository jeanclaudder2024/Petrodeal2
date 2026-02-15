import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, Plus, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getDocumentApiUrl } from '@/config/documentApi';

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
  plan_name?: string;
  plan_tier?: string;
}

interface VesselInfo {
  id: string;
  name: string;
  imo: string;
  vessel_type?: string;
  flag?: string;
}

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
      const response = await fetch(`${getDocumentApiUrl()}/templates`);
      if (response.ok) {
        const data = await response.json();
        let templatesList = data.templates || [];
        
        // Enrich templates with plan information from database
        try {
          // Get all templates from database to match by file_name
          const { data: dbTemplates } = await supabase
            .from('document_templates')
            .select('id, file_name, title, description')
            .eq('is_active', true);
          
          if (dbTemplates) {
            // Get plan permissions for templates
            const templateIds = dbTemplates.map(t => t.id);
            const { data: permissions } = await supabase
              .from('plan_template_permissions')
              .select('template_id, plan_id, can_download')
              .in('template_id', templateIds)
              .eq('can_download', true);
            
            // Get plan details
            let planDetails: Record<string, any> = {};
            if (permissions && permissions.length > 0) {
              const planIds = [...new Set(permissions.map(p => p.plan_id))];
              const { data: plans } = await supabase
                .from('subscription_plans')
                .select('id, plan_name, plan_tier')
                .in('id', planIds);
              
              if (plans) {
                planDetails = Object.fromEntries(
                  plans.map(p => [p.id, { plan_name: p.plan_name, plan_tier: p.plan_tier }])
                );
              }
            }
            
            // Create a map of file_name to template info
            const templateMap = new Map<string, any>();
            dbTemplates.forEach(t => {
              const fileName = t.file_name?.replace('.docx', '').toLowerCase() || '';
              if (fileName) {
                templateMap.set(fileName, {
                  id: t.id,
                  title: t.title,
                  description: t.description
                });
              }
            });
            
            // Enrich templates with plan information
            templatesList = templatesList.map((t: DocumentTemplate) => {
              const fileName = (t.file_name || t.name || '').replace('.docx', '').toLowerCase();
              const dbTemplate = templateMap.get(fileName);
              
              if (dbTemplate && permissions) {
                // Find plan permission for this template
                const templatePerm = permissions.find(p => p.template_id === dbTemplate.id);
                if (templatePerm && planDetails[templatePerm.plan_id]) {
                  const plan = planDetails[templatePerm.plan_id];
                  return {
                    ...t,
                    id: dbTemplate.id || t.id,
                    plan_name: plan.plan_name,
                    plan_tier: plan.plan_tier
                  };
                }
              }
              
              return t;
            });
          }
        } catch (planError) {
          // If plan enrichment fails, just use templates without plan info
        }
        
        setTemplates(templatesList);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      toast.error('Error fetching templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const response = await fetch(`${getDocumentApiUrl()}/vessels`);
      if (response.ok) {
        const data = await response.json();
        setVessels(data.vessels || []);
      }
    } catch (error) {
      // Error handled silently for security
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.file) {
      toast.error('Please select a file');
      return;
    }

    if (!newTemplate.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('description', newTemplate.description);
      formData.append('file', newTemplate.file);

      const response = await fetch(`${getDocumentApiUrl()}/upload-template`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await response.json();
        toast.success('Template uploaded successfully');
        setNewTemplate({ name: '', description: '', file: null });
        setShowUploadForm(false);
        fetchTemplates();
      } else {
        await response.text();
        toast.error(`Failed to upload template: ${response.status}`);
      }
    } catch (error) {
      toast.error('Error uploading template');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith('.docx')) {
        toast.error('Please select a .docx file');
        return;
      }
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

      const response = await fetch(`${getDocumentApiUrl()}/process-document`, {
        method: 'POST',
        body: formData,
      });

      console.log('Process response status:', response.status);
      const responseText = await response.text();
      console.log('Process response text:', responseText);

      if (response.ok) {
        const result = JSON.parse(responseText);
        
        if (result.success) {
          toast.success('Document processed successfully');
          
          // Auto-download the document
          setTimeout(() => {
            window.open(`${getDocumentApiUrl()}/download/${result.document_id}`, '_blank');
          }, 1000);
        } else {
          toast.error(result.message || 'Document processing failed');
        }
      } else {
        toast.error(`Failed to process document (${response.status})`);
      }
    } catch (error) {
      toast.error('Error processing document');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`${getDocumentApiUrl()}/templates/${templateId}`, {
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
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-muted-foreground">
              Manage Word document templates with placeholders for automatic data filling
            </p>
            <Button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload Template
            </Button>
          </div>

          {showUploadForm && (
            <Card className="mb-6">
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
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="file">Word Document (.docx)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".docx"
                      onChange={handleFileChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a Word document with placeholders like {`{{vessel_name}}`}, {`{{imo}}`}, etc.
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={uploading || !newTemplate.file}>
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Template
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowUploadForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates uploaded yet.</p>
              <p className="text-sm">Upload your first template to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">File:</span>
                            <p className="text-muted-foreground">{template.file_name}</p>
                          </div>
                          <div>
                            <span className="font-medium">Size:</span>
                            <p className="text-muted-foreground">
                              {template.file_size ? formatFileSize(template.file_size) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>
                            <p className="text-muted-foreground">{formatDate(template.created_at)}</p>
                          </div>
                          <div>
                            <span className="font-medium">Placeholders:</span>
                            <p className="text-muted-foreground">{template.placeholders?.length || 0}</p>
                          </div>
                        </div>
                        {template.plan_name && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Plan: {template.plan_name}
                            </Badge>
                          </div>
                        )}
                        
                        {template.placeholders && template.placeholders.length > 0 && (
                          <div className="mt-3">
                            <span className="font-medium text-sm">Placeholders:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {template.placeholders.slice(0, 10).map((placeholder, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {placeholder}
                                </Badge>
                              ))}
                              {template.placeholders.length > 10 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.placeholders.length - 10} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Template Modal */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Test Template: {selectedTemplate.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-vessel">Select Vessel to Test</Label>
                <select
                  id="test-vessel"
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => {
                    const vesselImo = e.target.value;
                    if (vesselImo) {
                      processDocument(selectedTemplate.id, vesselImo);
                    }
                  }}
                >
                  <option value="">Choose a vessel...</option>
                  {vessels.map((vessel) => (
                    <option key={vessel.id} value={vessel.imo}>
                      {vessel.name} ({vessel.imo}) - {vessel.vessel_type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}