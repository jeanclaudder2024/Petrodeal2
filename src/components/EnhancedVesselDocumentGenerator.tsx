import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  BarChart3,
  Clock,
  Brain
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentTemplate {
  id: string;
  title: string;
  description?: string;
  placeholders: any;
  subscription_level: string;
  is_active: boolean;
  supports_pdf: boolean;
  mapping_confidence: number;
  last_tested?: string;
  test_results: any;
}

interface VesselDocumentGeneratorProps {
  vessel: any;
}

interface GenerationProgress {
  stage: 'initializing' | 'processing' | 'filling' | 'converting' | 'uploading' | 'complete';
  progress: number;
  message: string;
}

export default function EnhancedVesselDocumentGenerator({ vessel }: VesselDocumentGeneratorProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [generationProgress, setGenerationProgress] = useState<Record<string, GenerationProgress>>({});
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [templateReview, setTemplateReview] = useState<any>(null);
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [testingApi, setTestingApi] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch document templates');
    } finally {
      setLoading(false);
    }
  };

  // PDF conversion functionality removed

  const previewTemplateData = async (template: DocumentTemplate) => {
    setPreviewTemplate(template.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('template-review', {
        body: {
          templateId: template.id,
          vesselId: vessel.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setTemplateReview(data);
      } else {
        throw new Error(data.error || 'Preview failed');
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      toast.error('Failed to preview template data');
      setPreviewTemplate(null);
    }
  };

  const generateDocument = async (template: DocumentTemplate, format: 'docx' | 'pdf' | 'both') => {
    const templateId = template.id;
    setGenerating(prev => ({ ...prev, [templateId]: true }));

    // Initialize progress tracking
    const updateProgress = (stage: GenerationProgress['stage'], progress: number, message: string) => {
      setGenerationProgress(prev => ({
        ...prev,
        [templateId]: { stage, progress, message }
      }));
    };

    try {
      updateProgress('initializing', 10, 'Initializing document generation...');
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      updateProgress('processing', 25, 'Processing template...');

      const { data, error } = await supabase.functions.invoke('enhanced-document-processor', {
         body: {
           templateId: template.id,
           vesselId: vessel.id
         }
       });

      if (error) throw error;

      if (data.success) {
        updateProgress('converting', 75, 'Converting to PDF...');
        
        // Handle Word document from server
        if (data.docx_base64) {
          // Convert base64 to blob
          const binaryString = atob(data.docx_base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const docxBlob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          
          // Download the Word document
          const url = URL.createObjectURL(docxBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${template.title}_${vessel.name || 'vessel'}.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          updateProgress('complete', 100, 'Document ready!');
          
          // Show success message
          const filledCount = Object.keys(data.filled_placeholders || {}).length;
          toast.success(`Document generated successfully!`, {
            description: `${filledCount} placeholders filled. Word document downloaded with all fields populated.`,
            duration: 5000
          });
        } else {
          throw new Error('Document generation failed - no document data returned');
        }

        // Clear progress after delay
        setTimeout(() => {
          setGenerationProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[templateId];
            return newProgress;
          });
        }, 2000);

      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate document');
      setGenerationProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[templateId];
        return newProgress;
      });
    } finally {
      setGenerating(prev => ({ ...prev, [templateId]: false }));
    }
  };

  const getSubscriptionColor = (level: string) => {
    switch (level) {
      case 'enterprise': return 'bg-purple-500';
      case 'professional': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { color: 'bg-green-500', text: 'High Quality' };
    if (confidence >= 60) return { color: 'bg-yellow-500', text: 'Good Quality' };
    return { color: 'bg-orange-500', text: 'Basic Quality' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading document templates...</span>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Document Templates Available</h3>
          <p className="text-muted-foreground">
            Contact your administrator to add document templates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Download Documents for {vessel.name || 'Vessel'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Download professional maritime documents with vessel data automatically filled in
            </p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const isGenerating = generating[template.id];
              const progress = generationProgress[template.id];
              const confidenceBadge = getConfidenceBadge(template.mapping_confidence || 0);
              
              return (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm">{template.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <Badge className={getSubscriptionColor(template.subscription_level)}>
                        {template.subscription_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Template Quality & Stats */}
                      <div className="flex items-center justify-between text-xs">
                        <Badge className={confidenceBadge.color} variant="secondary">
                          {confidenceBadge.text}
                        </Badge>
                        <span className="text-muted-foreground">
                          {Array.isArray(template.placeholders) ? template.placeholders.length : 0} fields
                        </span>
                      </div>

                      {/* Last Tested */}
                      {template.last_tested && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Tested {new Date(template.last_tested).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Test Results Stats */}
                      {template.test_results && Object.keys(template.test_results).length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">
                              {Math.round((template.test_results.filled_from_data || 0) / (template.test_results.total_placeholders || 1) * 100)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      {progress && (
                        <div className="space-y-2">
                          <Progress value={progress.progress} className="h-2" />
                          <div className="flex items-center gap-2 text-xs">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-muted-foreground">{progress.message}</span>
                          </div>
                        </div>
                      )}

                      {/* Download PDF Button */}
                      <div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => generateDocument(template, 'pdf')}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download Word
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewTemplate && templateReview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Data Preview: {templates.find(t => t.id === previewTemplate)?.title}</span>
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="fields">Field Mapping</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{templateReview.statistics.total_placeholders}</div>
                    <div className="text-sm text-muted-foreground">Total Fields</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{templateReview.statistics.available_data}</div>
                    <div className="text-sm text-muted-foreground">From Vessel Data</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{templateReview.statistics.missing_data}</div>
                    <div className="text-sm text-muted-foreground">Realistic Random</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{templateReview.statistics.completion_rate}%</div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {templateReview.recommendations.map((rec: string, index: number) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="fields">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templateReview.placeholder_analysis.map((field: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        {field.hasData ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="font-mono text-sm">{field.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {field.hasData ? 'Available' : 'Random Data'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {field.dataSource || 'Generated'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}