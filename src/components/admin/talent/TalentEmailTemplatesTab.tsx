import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Eye, Mail, Code, Loader2 } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_name: string;
  language_code: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  placeholders: string[];
  is_active: boolean;
  created_at: string;
}

const templateTypes = [
  { value: 'assessment_invitation', label: 'Assessment Invitation' },
  { value: 'assessment_reminder', label: 'Assessment Reminder' },
  { value: 'assessment_completed', label: 'Assessment Completed' },
  { value: 'assessment_passed', label: 'Assessment Passed' },
  { value: 'assessment_failed', label: 'Assessment Failed' },
  { value: 'welcome_talent_pool', label: 'Welcome to Talent Pool' },
];

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Chinese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'et', name: 'Estonian' },
];

const placeholdersList = [
  '{{full_name}}',
  '{{email}}',
  '{{assessment_link}}',
  '{{expiry_hours}}',
  '{{company_name}}',
  '{{score}}',
  '{{stage_name}}',
  '{{current_date}}',
];

const TalentEmailTemplatesTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');

  const [formData, setFormData] = useState({
    template_name: 'assessment_invitation',
    language_code: 'en',
    subject: '',
    body_html: '',
    body_text: '',
    is_active: true,
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['talent-email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_email_templates')
        .select('*')
        .order('template_name')
        .order('language_code');

      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        template_name: formData.template_name,
        language_code: formData.language_code,
        subject: formData.subject,
        body_html: formData.body_html,
        body_text: formData.body_text || null,
        is_active: formData.is_active,
        placeholders: extractPlaceholders(formData.body_html + formData.subject),
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('talent_email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('talent_email_templates')
          .upsert(templateData, { onConflict: 'template_name,language_code' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-email-templates'] });
      toast.success(editingTemplate ? 'Template updated' : 'Template saved');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const extractPlaceholders = (text: string): string[] => {
    const matches = text.match(/\{\{[^}]+\}\}/g);
    return matches ? [...new Set(matches)] : [];
  };

  const resetForm = () => {
    setFormData({
      template_name: 'assessment_invitation',
      language_code: 'en',
      subject: '',
      body_html: '',
      body_text: '',
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      language_code: template.language_code,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text || '',
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const insertPlaceholder = (placeholder: string) => {
    setFormData({
      ...formData,
      body_html: formData.body_html + placeholder,
    });
  };

  // Group templates by type
  const groupedTemplates = templates?.reduce((acc, template) => {
    if (!acc[template.template_name]) {
      acc[template.template_name] = [];
    }
    acc[template.template_name].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const getLanguageFlag = (code: string) => {
    const flags: Record<string, string> = {
      en: '🇺🇸',
      ar: '🇸🇦',
      es: '🇪🇸',
      fr: '🇫🇷',
      zh: '🇨🇳',
      nl: '🇳🇱',
      et: '🇪🇪',
    };
    return flags[code] || '🌐';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Email Templates</span>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </CardTitle>
        <CardDescription>
          Manage multilingual email templates for candidate communications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {templateTypes.map((type) => {
              const typeTemplates = groupedTemplates?.[type.value] || [];
              return (
                <div key={type.value} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-semibold">{type.label}</h4>
                      <Badge variant="outline">{typeTemplates.length} languages</Badge>
                    </div>
                  </div>

                  {typeTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No templates created yet for this type.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {typeTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`flex items-center gap-2 border rounded-lg p-2 ${
                            template.is_active ? '' : 'opacity-50'
                          }`}
                        >
                          <span className="text-lg">{getLanguageFlag(template.language_code)}</span>
                          <span className="text-sm font-medium uppercase">
                            {template.language_code}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handlePreview(template)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Type *</Label>
                <Select
                  value={formData.template_name}
                  onValueChange={(v) => setFormData({ ...formData, template_name: v })}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language *</Label>
                <Select
                  value={formData.language_code}
                  onValueChange={(v) => setFormData({ ...formData, language_code: v })}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {getLanguageFlag(l.code)} {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Invitation to Remote Growth Assessment"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Body (HTML) *</Label>
                <div className="flex flex-wrap gap-1">
                  {placeholdersList.map((p) => (
                    <Button
                      key={p}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => insertPlaceholder(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                value={formData.body_html}
                onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                rows={12}
                className="font-mono text-sm"
                placeholder="<p>Hello {{full_name}},</p>..."
              />
            </div>

            <div>
              <Label>Plain Text Version (Optional)</Label>
              <Textarea
                value={formData.body_text}
                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                rows={6}
                placeholder="Hello {{full_name}},..."
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{editingTemplate.subject}</p>
              </div>

              <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'html' | 'text')}>
                <TabsList>
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Preview
                  </TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="mt-4">
                  <div
                    className="border rounded-lg p-4 bg-white prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: editingTemplate.body_html }}
                  />
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                  <pre className="border rounded-lg p-4 bg-muted text-sm whitespace-pre-wrap">
                    {editingTemplate.body_text || 'No plain text version'}
                  </pre>
                </TabsContent>
              </Tabs>

              {editingTemplate.placeholders && editingTemplate.placeholders.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Placeholders Used</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {editingTemplate.placeholders.map((p, i) => (
                      <Badge key={i} variant="secondary">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TalentEmailTemplatesTab;
