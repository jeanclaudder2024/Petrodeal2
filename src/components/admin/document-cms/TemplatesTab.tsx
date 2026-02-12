import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Upload, Trash2, Edit2, Play, Search, 
  Loader2, Download, Calendar, HardDrive, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { useTemplates, useVessels, usePlans } from './hooks/useDocumentAPI';
import { Template } from './types';

const FONT_OPTIONS = [
  'Arial', 'Times New Roman', 'Calibri', 'Helvetica', 
  'Georgia', 'Verdana', 'Courier New'
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

interface TemplatesTabProps {
  onEditPlaceholders?: (template: Template) => void;
  onTestTemplate?: (template: Template) => void;
}

export default function TemplatesTab({ onEditPlaceholders, onTestTemplate }: TemplatesTabProps) {
  const { templates, loading, fetchTemplates, uploadTemplate, deleteTemplate, updateMetadata } = useTemplates();
  const { vessels, fetchVessels, processDocument } = useVessels();
  const { plans, fetchPlans } = usePlans();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    name: '',
    description: '',
    fontFamily: '',
    fontSize: 12,
    planIds: [] as string[],
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: '',
    description: '',
    fontFamily: '',
    fontSize: 12,
    planIds: [] as string[],
  });

  useEffect(() => {
    fetchTemplates();
    fetchVessels();
    fetchPlans();
  }, [fetchTemplates, fetchVessels, fetchPlans]);

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.name) {
      toast.error('Please fill in required fields');
      return;
    }

    setUploading(true);
    try {
      await uploadTemplate(
        uploadForm.file,
        uploadForm.name,
        uploadForm.description,
        uploadForm.fontFamily,
        uploadForm.fontSize,
        uploadForm.planIds
      );
      toast.success('Template uploaded successfully');
      setUploadDialogOpen(false);
      setUploadForm({ file: null, name: '', description: '', fontFamily: '', fontSize: 12, planIds: [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    
    try {
      await deleteTemplate(template.file_name || template.name);
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditForm({
      displayName: template.display_name || template.name,
      description: template.description || '',
      fontFamily: template.font_family || '',
      fontSize: template.font_size || 12,
      planIds: template.plan_ids || [],
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTemplate) return;
    
    try {
      await updateMetadata(selectedTemplate.id, {
        display_name: editForm.displayName,
        description: editForm.description,
        font_family: editForm.fontFamily,
        font_size: editForm.fontSize,
        plan_ids: editForm.planIds,
      });
      toast.success('Template updated');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  const handleTest = async (vesselImo: string) => {
    if (!selectedTemplate || !vesselImo) return;
    
    setProcessing(true);
    try {
      const result = await processDocument(selectedTemplate.file_name || selectedTemplate.name, vesselImo);
      if (result.success && result.document_url) {
        window.open(result.document_url, '_blank');
        toast.success('Document generated successfully');
      } else if (result.document_id) {
        window.open(`http://localhost:8000/download/${result.document_id}`, '_blank');
        toast.success('Document generated successfully');
      }
      setTestDialogOpen(false);
    } catch (error) {
      toast.error('Failed to generate document');
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label>Template File (.docx) *</Label>
                <Input
                  type="file"
                  accept=".docx"
                  onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Display Name *</Label>
                <Input
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Enter template name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={uploadForm.fontFamily}
                    onValueChange={(v) => setUploadForm(f => ({ ...f, fontFamily: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Size</Label>
                  <Select
                    value={uploadForm.fontSize.toString()}
                    onValueChange={(v) => setUploadForm(f => ({ ...f, fontSize: parseInt(v) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZES.map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}pt</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No templates found</p>
            <p className="text-sm text-muted-foreground/70">Upload your first template to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-semibold truncate">
                        {template.display_name || template.name}
                      </h3>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate">{template.file_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>{formatFileSize(template.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(template.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Settings2 className="h-3.5 w-3.5" />
                        <span>{template.placeholders?.length || 0} placeholders</span>
                      </div>
                    </div>

                    {template.placeholders && template.placeholders.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {template.placeholders.slice(0, 6).map((ph, i) => (
                          <Badge key={i} variant="outline" className="text-xs font-mono">
                            {ph}
                          </Badge>
                        ))}
                        {template.placeholders.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.placeholders.length - 6} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {template.font_family && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Font: {template.font_family} {template.font_size}pt
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(template)}
                      title="Edit metadata"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {onEditPlaceholders && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditPlaceholders(template)}
                        title="Configure placeholders"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setTestDialogOpen(true);
                      }}
                      title="Test generation"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template)}
                      className="text-destructive hover:text-destructive"
                      title="Delete"
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={editForm.displayName}
                onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Font Family</Label>
                <Select
                  value={editForm.fontFamily}
                  onValueChange={(v) => setEditForm(f => ({ ...f, fontFamily: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(font => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Size</Label>
                <Select
                  value={editForm.fontSize.toString()}
                  onValueChange={(v) => setEditForm(f => ({ ...f, fontSize: parseInt(v) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}pt</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Document Generation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Template: <strong>{selectedTemplate?.name}</strong>
            </p>
            <div>
              <Label>Select Vessel</Label>
              <Select onValueChange={(imo) => handleTest(imo)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a vessel..." />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map(vessel => (
                    <SelectItem key={vessel.id} value={vessel.imo}>
                      {vessel.name} ({vessel.imo}) - {vessel.vessel_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {processing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating document...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
