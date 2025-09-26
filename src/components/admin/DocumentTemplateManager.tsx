import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Eye, Trash2, CheckCircle, AlertCircle } from "lucide-react";

interface DocumentTemplate {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  placeholders: any; // Changed from string[] to any to handle Json type
  field_mappings: any; // Changed from Record<string, string> to any to handle Json type
  analysis_result: any; // Changed to any to handle Json type
  subscription_level: string;
  is_active: boolean;
  created_at: string;
}

const DocumentTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subscription_level: 'basic'
  });
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to fetch document templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        toast({
          title: "Invalid File Type",
          description: "Please select a Word document (.docx)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const analyzeDocument = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    try {
      // Upload file to storage first
      const fileName = `template_${Date.now()}_${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('document-templates')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('document-templates')
        .getPublicUrl(fileName);

      // Call edge function to analyze the document
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-word-template', {
        body: {
          file_url: publicUrl,
          file_name: selectedFile.name,
          title: formData.title,
          description: formData.description,
          subscription_level: formData.subscription_level
        }
      });

      if (analysisError) throw analysisError;

      const aiAnalysis = analysisData.ai_analysis;
      const suggestions = aiAnalysis?.suggestions || [];
      
      toast({
        title: "AI Analysis Complete", 
        description: `Found ${analysisData.placeholders?.length || 0} placeholders. AI confidence: ${aiAnalysis?.confidence_score || 0}%. ${suggestions.length} intelligent suggestions provided.`,
      });

      // Refresh templates list
      fetchTemplates();
      setShowUploadDialog(false);
      resetForm();

    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the document template",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "Document template has been deleted successfully",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Template ${!currentActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subscription_level: 'basic'
    });
    setSelectedFile(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading document templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Templates</h2>
          <p className="text-muted-foreground">
            Manage Word document templates with placeholder analysis and data mapping
          </p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Word Template</DialogTitle>
              <DialogDescription>
                Upload a Word document with placeholders. The system will analyze it and map placeholders to database fields.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Template Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter template title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Template description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="subscription_level">Subscription Level</Label>
                <Select
                  value={formData.subscription_level}
                  onValueChange={(value) => setFormData({ ...formData, subscription_level: value })}
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
                <Label htmlFor="file">Word Document (.docx)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".docx"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={analyzeDocument}
                  disabled={!selectedFile || !formData.title || analyzing}
                  className="flex-1"
                >
                  {analyzing ? "Analyzing..." : "Analyze & Upload"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Placeholders</TableHead>
              <TableHead>Analysis</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">{template.title}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                    <div className="text-xs text-muted-foreground">{template.file_name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {Array.isArray(template.placeholders) ? template.placeholders.length : 0} placeholders
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(template.placeholders) && template.placeholders.slice(0, 3).map((placeholder: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {placeholder}
                        </Badge>
                      ))}
                      {Array.isArray(template.placeholders) && template.placeholders.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.placeholders.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {template.analysis_result?.matched_fields?.length || 0} matched
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">
                        {template.analysis_result?.missing_fields?.length || 0} missing
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {template.subscription_level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(template.id, template.is_active)}
                    >
                      {template.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {templates.length === 0 && (
          <Card>
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No templates yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your first Word document template to get started
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentTemplateManager;