import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Wand2, FileText, ChevronRight, ChevronLeft, Save, Copy, AlertCircle, CheckCircle, Download, FileDown, Edit3, Eye, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DOMPurify from 'dompurify';
import { copyFormattedHtml, downloadAsDocx, downloadAsPdf } from '@/utils/documentExport';
import RichTextEditor from './RichTextEditor';

interface DocumentTemplate {
  id: string;
  name: string;
  short_code: string;
  description: string | null;
  default_prompt: string | null;
  recommended_entity_types: string[] | null;
  typical_page_range: string | null;
  legal_sections: any;
}

const ENTITY_TYPES = [
  { value: 'company_real', label: 'Real Company', description: 'Verified business entities' },
  { value: 'company_buyer', label: 'Buyer Company', description: 'Purchasing entities' },
  { value: 'company_seller', label: 'Seller Company', description: 'Selling entities' },
  { value: 'vessel', label: 'Vessel', description: 'Ships and tankers' },
  { value: 'port', label: 'Port', description: 'Shipping terminals' },
  { value: 'refinery', label: 'Refinery', description: 'Processing facilities' },
];

const DocIdeaGenerator: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [entities, setEntities] = useState<any[]>([]);
  
  // Generated document state
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentFormat, setContentFormat] = useState<'html' | 'markdown'>('html');
  const [placeholdersFromDb, setPlaceholdersFromDb] = useState<string[]>([]);
  const [placeholdersGenerated, setPlaceholdersGenerated] = useState<string[]>([]);
  const [estimatedPages, setEstimatedPages] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetchDocumentTemplates();
  }, []);

  useEffect(() => {
    if (selectedEntityTypes.length > 0) {
      fetchEntities();
    } else {
      setEntities([]);
    }
  }, [selectedEntityTypes]);

  useEffect(() => {
    // Auto-populate prompt when document type is selected
    const template = documentTemplates.find(t => t.short_code === selectedDocType);
    if (template && template.default_prompt) {
      setAiPrompt(template.default_prompt);
    }
  }, [selectedDocType, documentTemplates]);

  const fetchDocumentTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_type_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDocumentTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load document templates');
    }
  };

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const allEntities: any[] = [];
      
      for (const entityType of selectedEntityTypes) {
        let query;
        if (entityType.startsWith('company_')) {
          const companyType = entityType.replace('company_', '');
          query = supabase.from('companies').select('id, name').eq('company_type', companyType);
        } else if (entityType === 'vessel') {
          query = supabase.from('vessels').select('id, name');
        } else if (entityType === 'port') {
          query = supabase.from('ports').select('id, name');
        } else if (entityType === 'refinery') {
          query = supabase.from('refineries').select('id, name');
        }

        if (query) {
          const { data, error } = await query;
          if (error) throw error;
          if (data) {
            allEntities.push(...data.map(e => ({ ...e, entityType })));
          }
        }
      }
      
      setEntities(allEntities);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const toggleEntityType = (value: string) => {
    setSelectedEntityTypes(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
    setSelectedEntityId('');
  };

  const handleGenerate = async () => {
    if (!title || !selectedDocType || selectedEntityTypes.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-legal-document', {
        body: {
          title,
          documentType: selectedDocType,
          entityTypes: selectedEntityTypes,
          entityId: selectedEntityId === 'none' ? '' : selectedEntityId,
          prompt: aiPrompt,
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      setGeneratedContent(result.content);
      setContentFormat(result.contentFormat || 'html');
      setPlaceholdersFromDb(result.placeholdersFromDb || []);
      setPlaceholdersGenerated(result.placeholdersGenerated || []);
      setEstimatedPages(result.estimatedPages || 10);
      setStep(4);
      toast.success('Document generated successfully!');
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error('Failed to generate document. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) {
      toast.error('No content to save');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('generated_documents').insert({
        title,
        document_type: selectedDocType,
        entity_type: selectedEntityTypes.join(','),
        selected_entity_id: selectedEntityId === 'none' ? null : selectedEntityId,
        ai_prompt: aiPrompt,
        generated_content: generatedContent,
        placeholders_from_db: placeholdersFromDb,
        placeholders_generated: placeholdersGenerated,
        estimated_pages: estimatedPages,
        status: 'draft',
        created_by: user?.id
      });

      if (error) throw error;
      toast.success('Document saved successfully!');
      
      // Reset form
      setStep(1);
      setTitle('');
      setSelectedDocType('');
      setSelectedEntityTypes([]);
      setSelectedEntityId('');
      setAiPrompt('');
      setGeneratedContent('');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Content copied to clipboard');
  };

  const handleCopyFormatted = () => {
    copyFormattedHtml(generatedContent);
  };

  const handleDownloadDocx = () => {
    downloadAsDocx(generatedContent, title || 'document');
  };

  const handleDownloadPdf = () => {
    downloadAsPdf(generatedContent, title || 'document');
  };

  const handleSaveAsTemplate = async () => {
    if (!generatedContent) {
      toast.error('No content to save as template');
      return;
    }

    setSavingTemplate(true);
    try {
      const { error } = await supabase.from('document_saved_templates' as any).insert({
        name: title,
        description: `Template based on ${selectedDocType}`,
        document_type: selectedDocType,
        entity_types: selectedEntityTypes,
        content: generatedContent,
        content_format: 'html',
        placeholders: [...placeholdersFromDb, ...placeholdersGenerated],
        is_public: false,
        created_by: user?.id
      });

      if (error) throw error;
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const selectedTemplate = documentTemplates.find(t => t.short_code === selectedDocType);

  // Sanitize HTML for safe rendering
  const sanitizedContent = DOMPurify.sanitize(generatedContent);

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step >= s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`w-16 h-1 ${
                  step > s ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Document Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 1: Document Information
            </CardTitle>
            <CardDescription>
              Enter the basic information about your document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., ICPO for Crude Oil Purchase - Q1 2024"
              />
            </div>

            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTemplates.map((template) => (
                    <SelectItem key={template.short_code} value={template.short_code}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{template.short_code}</span>
                        <span className="text-muted-foreground">- {template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTemplate.description} • {selectedTemplate.typical_page_range}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!title || !selectedDocType}>
                Next Step
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Entity Selection - Multi-select */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 2: Select Entity Types
            </CardTitle>
            <CardDescription>
              Choose one or more entity types to use for placeholders (select multiple for combined placeholders)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ENTITY_TYPES.map((entity) => (
                <div 
                  key={entity.value} 
                  className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedEntityTypes.includes(entity.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleEntityType(entity.value)}
                >
                  <Checkbox 
                    id={entity.value}
                    checked={selectedEntityTypes.includes(entity.value)}
                    onCheckedChange={() => toggleEntityType(entity.value)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={entity.value} className="font-medium cursor-pointer">
                      {entity.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{entity.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedEntityTypes.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Selected Entity Types:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEntityTypes.map(type => {
                    const entity = ENTITY_TYPES.find(e => e.value === type);
                    return (
                      <Badge key={type} variant="secondary">
                        {entity?.label || type}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedEntityTypes.length > 0 && entities.length > 0 && (
              <div className="space-y-2 pt-4">
                <Label>Select Specific Entity (Optional)</Label>
                <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an entity for placeholder preview" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (use all placeholders)</SelectItem>
                    {entities.map((entity) => (
                      <SelectItem key={`${entity.entityType}-${entity.id}`} value={String(entity.id)}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={() => setStep(3)} disabled={selectedEntityTypes.length === 0}>
                Next Step
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: AI Prompt */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Step 3: AI Prompt & Generation
            </CardTitle>
            <CardDescription>
              Customize the AI prompt and generate your legal document template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">AI Instructions</Label>
              <Textarea
                id="prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter specific instructions for the AI..."
                className="min-h-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                The AI will generate a professional legal document (8-25 pages) in formal law firm style,
                following international oil trading standards. Output will be in HTML format for proper Word compatibility.
              </p>
            </div>

            {selectedTemplate?.legal_sections && selectedTemplate.legal_sections.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Recommended Sections:</Label>
                <div className="flex flex-wrap gap-2">
                  {(selectedTemplate.legal_sections as string[]).map((section, idx) => (
                    <Badge key={idx} variant="outline">{section}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Save */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Step 4: Review & Save
            </CardTitle>
            <CardDescription>
              Review the generated document and export or save it to your library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    Database Placeholders ({placeholdersFromDb.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {placeholdersFromDb.slice(0, 10).map((p) => (
                    <Badge key={p} variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30">
                      {`{{${p}}}`}
                    </Badge>
                  ))}
                  {placeholdersFromDb.length > 10 && (
                    <Badge variant="secondary">+{placeholdersFromDb.length - 10} more</Badge>
                  )}
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-700 dark:text-orange-400">
                    Generated Placeholders ({placeholdersGenerated.length})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  These are NOT from your database - manual input required
                </p>
                <div className="flex flex-wrap gap-1">
                  {placeholdersGenerated.slice(0, 10).map((p) => (
                    <Badge key={p} variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900/30">
                      {`{{${p}}}`}
                    </Badge>
                  ))}
                  {placeholdersGenerated.length > 10 && (
                    <Badge variant="secondary">+{placeholdersGenerated.length - 10} more</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg">
              <span className="text-sm font-medium mr-2">Export Options:</span>
              <Button variant="outline" size="sm" onClick={handleCopyFormatted}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Formatted (for Word)
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadDocx}>
                <FileDown className="h-4 w-4 mr-2" />
                Download DOCX
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Raw
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveAsTemplate}
                  disabled={savingTemplate}
                >
                  <Library className="h-4 w-4 mr-2" />
                  {savingTemplate ? 'Saving...' : 'Save as Template'}
                </Button>
              </div>
            </div>

            {/* Edit Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Content Editor</Label>
                <Badge variant="secondary">{estimatedPages} pages estimated</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Preview</span>
                </div>
                <Switch
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                />
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Edit</span>
                </div>
              </div>
            </div>

            {/* Document Editor / Preview */}
            {isEditMode ? (
              <RichTextEditor
                content={generatedContent}
                onChange={setGeneratedContent}
                editable={true}
              />
            ) : (
              <ScrollArea className="h-[500px] border rounded-lg bg-white dark:bg-gray-950">
                <div 
                  className="p-8 prose prose-sm dark:prose-invert max-w-none"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12pt',
                    lineHeight: '1.6'
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </ScrollArea>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocIdeaGenerator;
