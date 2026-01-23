import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Upload, Trash2, Edit2, Play, Search, 
  Loader2, RefreshCw, CloudUpload
} from 'lucide-react';
import { toast } from 'sonner';
import { useTemplates } from './hooks/useDocumentAPI';
import { Template, API_BASE_URL, normalizeTemplateName } from './types';

// Sentinel value for "Use document default" - Radix Select forbids empty string
const FONT_NONE = '__none__';

interface TemplatesTabProps {
  isAuthenticated: boolean;
  onRefresh?: () => void;
}

export default function TemplatesTab({ isAuthenticated, onRefresh }: TemplatesTabProps) {
  const { templates, loading, fetchTemplates, uploadTemplate, deleteTemplate, updateMetadata } = useTemplates();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [placeholdersDialogOpen, setPlaceholdersDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Upload form state
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [fontFamily, setFontFamily] = useState(FONT_NONE);
  const [fontSize, setFontSize] = useState('');
  
  // Metadata edit form state
  const [metaDisplayName, setMetaDisplayName] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaFontFamily, setMetaFontFamily] = useState('');
  const [metaFontSize, setMetaFontSize] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (displayName) formData.append('name', displayName);
      if (description) formData.append('description', description);
      if (fontFamily && fontFamily !== FONT_NONE) formData.append('font_family', fontFamily);
      if (fontSize) formData.append('font_size', fontSize);

      const response = await fetch(`${API_BASE_URL}/upload-template`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();
      if (data.warnings && Array.isArray(data.warnings)) {
        data.warnings.forEach((msg: string) => {
          toast.warning('Upload Warning', { description: msg });
        });
      }

      toast.success('Upload Success', {
        description: `Template "${data.filename}" uploaded with ${data.placeholder_count} placeholders`,
      });

      // Reset form
      setSelectedFile(null);
      setDisplayName('');
      setDescription('');
      setFontFamily(FONT_NONE);
      setFontSize('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload templates
      setTimeout(() => {
        fetchTemplates();
        onRefresh?.();
      }, 500);
    } catch (error) {
      toast.error('Upload Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateName: string) => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }
    // Normalize template name for deletion
    const normalizedName = normalizeTemplateName(templateName);
    if (!confirm(`Delete template "${normalizedName}"?`)) return;

    setDeleting(normalizedName);
    try {
      await deleteTemplate(normalizedName);
      toast.success('Deleted', { description: `Template "${normalizedName}" deleted` });
      setTimeout(() => {
        fetchTemplates();
      }, 1000);
    } catch (error) {
      toast.error('Delete Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDeleting(null);
    }
  };

  const openMetadataModal = (template: Template) => {
    setSelectedTemplate(template);
    const meta = template.metadata || {};
    setMetaDisplayName(meta.display_name || template.display_name || template.title || template.name || '');
    setMetaDescription(meta.description || template.description || '');
    const font = meta.font_family || template.font_family || '';
    setMetaFontFamily(font || FONT_NONE);
    setMetaFontSize((meta.font_size || template.font_size)?.toString() || '');
    setMetadataDialogOpen(true);
  };

  const saveMetadata = async () => {
    if (!selectedTemplate) return;

    setUploading(true);
    try {
      const payload = {
        display_name: metaDisplayName,
        description: metaDescription,
        font_family: (metaFontFamily && metaFontFamily !== FONT_NONE) ? metaFontFamily : undefined,
        font_size: metaFontSize ? parseInt(metaFontSize) : undefined,
      };

      // Use template name (normalized) for the endpoint
      const templateName = normalizeTemplateName(selectedTemplate.name || selectedTemplate.file_name || '');
      await updateMetadata(templateName, payload);
      toast.success('Metadata Saved', { description: 'Template details updated successfully' });
      setMetadataDialogOpen(false);
      setTimeout(() => {
        fetchTemplates();
      }, 500);
    } catch (error) {
      toast.error('Save Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
    }
  };

  const viewPlaceholders = (template: Template) => {
    setSelectedTemplate(template);
    setPlaceholdersDialogOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Upload Form */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Template
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Optional friendly name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the template for other admins"
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Default Font Family</Label>
                <Select value={fontFamily || FONT_NONE} onValueChange={(v) => setFontFamily(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Use document default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FONT_NONE}>Use document default</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Calibri">Calibri</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Size (pt)</Label>
                <Input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  placeholder="Auto"
                  min={8}
                  max={72}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <div
                onClick={handleUploadAreaClick}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {selectedFile ? (
                  <>
                    <FileText className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h5 className="text-green-600 font-semibold">{selectedFile.name}</h5>
                    <p className="text-sm text-muted-foreground mt-1">Ready to upload</p>
                  </>
                ) : (
                  <>
                    <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <h5>Drop DOCX file here</h5>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !isAuthenticated}
              className="w-full"
            >
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
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Templates List */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => fetchTemplates()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No templates found
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => {
                  const meta = template.metadata || {};
                  const placeholderList = template.placeholders || [];
                  const preview = placeholderList.slice(0, 12);
                  const extraCount = Math.max(0, placeholderList.length - 12);
                  const templateDescription = meta.description || template.description || 'No description provided';
                  const fontFamily = meta.font_family || template.font_family || 'Default';
                  const fontSize = (meta.font_size || template.font_size) ? `${meta.font_size || template.font_size}pt` : '';
                  const fontSummary = fontSize ? `${fontFamily} · ${fontSize}` : fontFamily;
                  const templateSize = template.size || template.file_size || 0;
                  const templateDisplayName = meta.display_name || template.display_name || template.title || template.name;
                  const templateId = template.id || template.template_id || template.name;
                  const templateName = normalizeTemplateName(template.name || template.file_name || '');

                  // Construct editor URL - remove /api if present, ensure proper base URL
                  const editorBaseUrl = API_BASE_URL.replace('/api', '').replace(/\/$/, '');
                  const editorUrl = `${editorBaseUrl}/cms/editor.html?template_id=${templateId}`;

                  return (
                    <Card key={template.name || template.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h5 className="font-semibold flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-primary" />
                              {templateDisplayName}
                            </h5>
                            <div className="text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {formatBytes(templateSize)} · 
                                <span className="ml-1">{placeholderList.length} placeholders</span>
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{templateDescription}</p>
                            <div className="text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {fontSummary}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {preview.map((ph, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {ph}
                                </Badge>
                              ))}
                              {extraCount > 0 && (
                                <span className="text-xs text-muted-foreground">+{extraCount} more</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 min-w-[120px]">
                            <Button
                              size="sm"
                              variant="default"
                              className="w-full"
                              onClick={() => {
                                window.open(editorUrl, '_blank');
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Test
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="w-full"
                              onClick={() => {
                                window.open(editorUrl, '_blank');
                              }}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit Rules
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => viewPlaceholders(template)}
                            >
                              <Search className="h-3 w-3 mr-1" />
                              Placeholders
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => openMetadataModal(template)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Metadata
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="w-full"
                              onClick={() => handleDelete(templateName)}
                              disabled={deleting === templateName}
                            >
                              {deleting === templateName ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata Modal */}
      <Dialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template Metadata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={metaDisplayName}
                onChange={(e) => setMetaDisplayName(e.target.value)}
                placeholder="Display name in CMS"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Visible to CMS admins"
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Default Font</Label>
                <Select value={metaFontFamily || FONT_NONE} onValueChange={(v) => setMetaFontFamily(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Use document default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FONT_NONE}>Use document default</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Calibri">Calibri</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Font Size (pt)</Label>
                <Input
                  type="number"
                  value={metaFontSize}
                  onChange={(e) => setMetaFontSize(e.target.value)}
                  placeholder="Auto"
                  min={8}
                  max={72}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMetadataDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMetadata} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Metadata'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placeholders Modal */}
      <Dialog open={placeholdersDialogOpen} onOpenChange={setPlaceholdersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Placeholders · {selectedTemplate ? (selectedTemplate.metadata?.display_name || selectedTemplate.display_name || selectedTemplate.title || selectedTemplate.name) : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {selectedTemplate && selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 ? (
              <div className="space-y-2">
                {selectedTemplate.placeholders.map((ph, index) => (
                  <div key={index} className="flex justify-between items-center border-b py-2">
                    <code className="text-sm">{ph}</code>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4">
                No placeholders detected in this template.
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setPlaceholdersDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
