import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Eye, Settings, CheckCircle, AlertCircle, Loader2, TestTube, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentTemplate {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  placeholders: any;
  field_mappings: any;
  analysis_result: any;
  is_active: boolean;
  template_status: string;
  mapping_confidence: number;
  auto_mapped_fields: any;
  supports_pdf: boolean;
  last_tested?: string;
  test_results: any;
  subscription_level: string;
  created_at: string;
}

interface TemplateReview {
  template_info: {
    title: string;
    description: string;
    total_placeholders: number;
  };
  placeholder_analysis: Array<{
    name: string;
    hasData: boolean;
    dataSource: string | null;
    value: string | null;
    willUseFallback: boolean;
    suggested_mapping: string[];
    auto_fix_suggestions: string[];
  }>;
  statistics: {
    total_placeholders: number;
    available_data: number;
    missing_data: number;
    completion_rate: string;
  };
  available_vessel_fields: string[];
  recommendations: string[];
}

export default function EnhancedDocumentTemplateManager() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateReview, setTemplateReview] = useState<TemplateReview | null>(null);
  const [testingTemplate, setTestingTemplate] = useState<string | null>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subscription_level: 'basic',
    file: null as File | null,
    skip_ai_analysis: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.docx')) {
        toast.error('Please select a Word document (.docx) file');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const analyzeDocument = async (skipAnalysis = false) => {
    if (!uploadForm.file || !uploadForm.title) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    if (!skipAnalysis) setAnalyzing(true);

    try {
      // Upload file to storage
      const fileName = `${Date.now()}_${uploadForm.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('word-templates')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('word-templates')
        .getPublicUrl(fileName);

      if (!skipAnalysis) {
        // Analyze with AI
        const { data, error } = await supabase.functions.invoke('analyze-word-template', {
          body: {
            file_url: publicUrl,
            file_name: fileName,
            title: uploadForm.title,
            description: uploadForm.description,
            subscription_level: uploadForm.subscription_level
          }
        });

        if (error) throw error;

        if (data.success) {
          toast.success('Template analyzed and uploaded successfully!');
          fetchTemplates();
          resetForm();
        } else {
          throw new Error(data.error || 'Analysis failed');
        }
      } else {
        // Quick upload without AI analysis
        const { error: insertError } = await supabase
          .from('document_templates')
          .insert({
            title: uploadForm.title,
            description: uploadForm.description,
            file_name: fileName,
            file_url: publicUrl,
            subscription_level: uploadForm.subscription_level,
            placeholders: [],
            field_mappings: {},
            analysis_result: {},
            template_status: 'draft',
            is_active: false,
            supports_pdf: true,
            mapping_confidence: 0
          });

        if (insertError) throw insertError;

        toast.success('Template uploaded successfully! You can review and activate it later.');
        fetchTemplates();
        resetForm();
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process document');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const reviewTemplate = async (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowReviewDialog(true);

    try {
      const { data, error } = await supabase.functions.invoke('template-review', {
        body: {
          templateId: template.id,
          vesselId: 1 // Use a sample vessel for review
        }
      });

      if (error) throw error;

        if (data.success) {
          setTemplateReview(data);
        } else {
          throw new Error(data.error || 'Review failed');
        }
    } catch (error) {
      console.error('Error reviewing template:', error);
      toast.error('Failed to review template');
    }
  };

  const testTemplate = async (template: DocumentTemplate) => {
    setTestingTemplate(template.id);

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-document-processor', {
        body: {
          templateId: template.id,
          vesselId: 1, // Use a sample vessel
          format: 'pdf'
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update test results
        await supabase
          .from('document_templates')
          .update({
            last_tested: new Date().toISOString(),
            test_results: data.processing_stats
          })
          .eq('id', template.id);

        toast.success('Template test completed successfully!');
        fetchTemplates();
      } else {
        throw new Error(data.error || 'Test failed');
      }
    } catch (error) {
      console.error('Error testing template:', error);
      toast.error('Template test failed');
    } finally {
      setTestingTemplate(null);
    }
  };

  const toggleActive = async (template: DocumentTemplate) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ 
          is_active: !template.is_active,
          template_status: !template.is_active ? 'active' : 'draft'
        })
        .eq('id', template.id);

      if (error) throw error;

      toast.success(`Template ${!template.is_active ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const deleteTemplate = async (template: DocumentTemplate) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setUploadForm({
      title: '',
      description: '',
      subscription_level: 'basic',
      file: null,
      skip_ai_analysis: true
    });
    setShowUploadDialog(false);
  };

  const reAnalyzeTemplate = async (templateId: string, fileUrl: string, title: string, description: string) => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-word-template', {
        body: {
          file_url: fileUrl,
          file_name: title,
          title: title,
          description: description,
          subscription_level: 'basic',
          template_id: templateId
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update the existing template with new analysis
        const { error: updateError } = await supabase
          .from('document_templates')
          .update({
            placeholders: data.placeholders,
            field_mappings: data.field_mappings,
            analysis_result: data.analysis_result,
            mapping_confidence: data.analysis_result?.confidence_score || 0,
            template_status: data.placeholders?.length > 0 ? 'analyzed' : 'needs_review'
          })
          .eq('id', templateId);

        if (updateError) throw updateError;

        toast.success(`Re-analysis complete! Found ${data.placeholders?.length || 0} placeholders with improved detection`);
        fetchTemplates();
      } else {
        throw new Error(data.error || 'Failed to re-analyze template');
      }
    } catch (error) {
      console.error('Error re-analyzing template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to re-analyze template');
    } finally {
      setAnalyzing(false);
    }
  };

  const validateTemplate = async (templateId: string) => {
    setTestingTemplate(templateId);
    try {
      const { data, error } = await supabase.functions.invoke('validate-template', {
        body: {
          templateId: templateId,
          testWithVesselId: 1 // Use first vessel for testing
        }
      });

      if (error) throw error;

      if (data.success) {
        const validation = data.validation;
        
        // Show validation results
        let message = `Validation Score: ${validation.final_score}/100`;
        if (validation.overall_status === 'success') {
          toast.success(message, {
            description: `Template passed all tests. ${validation.document_generation_test?.filled_from_data || 0} fields mapped successfully.`,
            duration: 5000
          });
        } else if (validation.overall_status === 'warning') {
          toast.warning(message, {
            description: `Template works but has ${validation.issues.length} issues to address.`,
            duration: 5000
          });
        } else {
          toast.error(message, {
            description: `Template has critical issues: ${validation.issues.join(', ')}`,
            duration: 7000
          });
        }

        // Update template with validation results
        await supabase
          .from('document_templates')
          .update({
            last_tested: new Date().toISOString(),
            test_results: validation
          })
          .eq('id', templateId);

        fetchTemplates();
      } else {
        throw new Error(data.error || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating template:', error);
      toast.error('Template validation failed');
    } finally {
      setTestingTemplate(null);
    }
  };

  const getStatusBadge = (template: DocumentTemplate) => {
    if (template.is_active) {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    if (template.template_status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    return <Badge variant="outline">{template.template_status}</Badge>;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-green-500">High</Badge>;
    if (confidence >= 60) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enhanced Document Templates</h2>
          <p className="text-muted-foreground">
            Upload, analyze, and manage Word document templates with smart placeholder detection
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload your first Word document template to get started
                </p>
                <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Document Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Placeholders</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Permission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Tested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </TableCell>
                         <TableCell>
                           <div className="flex flex-col gap-1">
                             <Badge variant="outline">
                               {Array.isArray(template.placeholders) ? template.placeholders.length : 0} placeholders
                             </Badge>
                             {template.analysis_result?.debugging_info && (
                               <div className="text-xs text-muted-foreground">
                                 Method: {template.analysis_result.debugging_info.extraction_method}
                               </div>
                             )}
                           </div>
                         </TableCell>
                        <TableCell>
                          {getConfidenceBadge(template.mapping_confidence || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge className={template.subscription_level === 'enterprise' ? 'bg-purple-500' : 
                            template.subscription_level === 'professional' ? 'bg-blue-500' : 'bg-gray-500'}>
                            {template.subscription_level}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(template)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {template.last_tested 
                              ? new Date(template.last_tested).toLocaleDateString()
                              : 'Never'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => reviewTemplate(template)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => testTemplate(template)}
                               disabled={testingTemplate === template.id}
                             >
                               {testingTemplate === template.id ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <TestTube className="h-4 w-4" />
                               )}
                             </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => reAnalyzeTemplate(template.id, template.file_url, template.title, template.description || '')}
                                disabled={analyzing}
                                title="Re-analyze with improved detection"
                              >
                                {analyzing ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Settings className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => validateTemplate(template.id)}
                                disabled={testingTemplate === template.id}
                                title="Full validation test"
                              >
                                {testingTemplate === template.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                             <Button
                               variant={template.is_active ? "destructive" : "default"}
                               size="sm"
                               onClick={() => toggleActive(template)}
                             >
                               {template.is_active ? 'Deactivate' : 'Activate'}
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => deleteTemplate(template)}
                             >
                               Delete
                             </Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {templates.filter(t => t.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {templates.length > 0 
                    ? Math.round(templates.reduce((sum, t) => sum + (t.mapping_confidence || 0), 0) / templates.length)
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document Template</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload Word documents (.docx) to create templates for vessel document generation
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Template title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Template description"
              />
            </div>
            <div>
              <Label htmlFor="subscription_level">Permission Level</Label>
              <Select
                value={uploadForm.subscription_level}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, subscription_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">Word Document *</Label>
              <Input
                id="file"
                type="file"
                accept=".docx"
                onChange={handleFileSelect}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Upload Options:</strong> You can upload templates with or without AI analysis. 
                Without analysis, templates will be saved as drafts for manual review.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              
              <Button
                variant="outline"
                onClick={() => analyzeDocument(true)}
                disabled={uploading || !uploadForm.file || !uploadForm.title}
              >
                {uploading && uploadForm.skip_ai_analysis ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Quick Upload Only
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => analyzeDocument(false)}
                disabled={uploading || !uploadForm.file || !uploadForm.title}
              >
                {uploading && !uploadForm.skip_ai_analysis ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Upload & Analyze with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Review: {selectedTemplate?.title}</DialogTitle>
          </DialogHeader>
          
          {templateReview && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{templateReview.statistics.total_placeholders}</div>
                    <div className="text-sm text-muted-foreground">Total Placeholders</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{templateReview.statistics.available_data}</div>
                    <div className="text-sm text-muted-foreground">Available Data</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">{templateReview.statistics.missing_data}</div>
                    <div className="text-sm text-muted-foreground">Will Use Random</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{templateReview.statistics.completion_rate}%</div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {templateReview.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Placeholder Analysis</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placeholder</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Source</TableHead>
                      <TableHead>Preview Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateReview.placeholder_analysis.map((placeholder, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{placeholder.name}</TableCell>
                        <TableCell>
                          {placeholder.hasData ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Available
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-500">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Random
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {placeholder.dataSource || 'Will generate random data'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {placeholder.value || 'Random maritime data'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                 </Table>
               </div>

               {/* Debug Information */}
               {selectedTemplate?.analysis_result?.debugging_info && (
                 <div>
                   <h4 className="font-semibold mb-3">Debugging Information</h4>
                   <div className="space-y-4">
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-lg">Text Extraction</CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-3">
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="text-sm font-medium">Extraction Method:</label>
                             <Badge variant="outline" className="ml-2">
                               {selectedTemplate.analysis_result.debugging_info.extraction_method}
                             </Badge>
                           </div>
                           <div>
                             <label className="text-sm font-medium">Text Length:</label>
                             <span className="ml-2 text-sm">{selectedTemplate.analysis_result.text_length} characters</span>
                           </div>
                         </div>
                         
                         {selectedTemplate.analysis_result.text_sample && (
                           <div>
                             <label className="text-sm font-medium">Extracted Text Sample:</label>
                             <div className="mt-2 p-3 bg-muted rounded-md">
                               <pre className="text-xs whitespace-pre-wrap">
                                 {selectedTemplate.analysis_result.text_sample}
                               </pre>
                             </div>
                           </div>
                         )}
                         
                         {selectedTemplate.analysis_result.pattern_breakdown && (
                           <div>
                             <label className="text-sm font-medium">Pattern Detection Results:</label>
                             <div className="mt-2 space-y-2">
                               {Object.entries(selectedTemplate.analysis_result.pattern_breakdown).map(([pattern, matches]) => (
                                 <div key={pattern} className="flex justify-between items-center p-2 bg-muted rounded">
                                   <span className="text-sm font-medium">{pattern}:</span>
                                   <Badge variant="outline">
                                     {Array.isArray(matches) ? matches.length : 0} found
                                   </Badge>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   </div>
                 </div>
               )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}