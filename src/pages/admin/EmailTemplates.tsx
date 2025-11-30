import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Edit, Trash2, Eye, Copy, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const AVAILABLE_PLACEHOLDERS = {
  'Author/User': [
    { key: '{{author_name}}', description: 'Author or user full name' },
    { key: '{{user_email}}', description: 'User email address' },
    { key: '{{member_id}}', description: 'Member ID' },
  ],
  'Manuscript': [
    { key: '{{manuscript_title}}', description: 'Manuscript title' },
    { key: '{{manuscript_id}}', description: 'Manuscript ID' },
    { key: '{{submission_id}}', description: 'Submission ID' },
    { key: '{{doi}}', description: 'DOI number' },
    { key: '{{status}}', description: 'Current status' },
  ],
  'Review': [
    { key: '{{reviewer_name}}', description: 'Reviewer name' },
    { key: '{{review_link}}', description: 'Review link URL' },
    { key: '{{deadline}}', description: 'Review deadline date' },
    { key: '{{decision}}', description: 'Review decision' },
  ],
  'Payment': [
    { key: '{{amount}}', description: 'Payment amount' },
    { key: '{{currency}}', description: 'Currency code' },
    { key: '{{invoice_number}}', description: 'Invoice number' },
    { key: '{{transaction_id}}', description: 'Transaction ID' },
    { key: '{{payment_method}}', description: 'Payment method' },
  ],
  'Support': [
    { key: '{{support_subject}}', description: 'Support ticket subject' },
    { key: '{{support_id}}', description: 'Support ticket ID' },
    { key: '{{ticket_url}}', description: 'Support ticket URL' },
  ],
  'System': [
    { key: '{{current_date}}', description: 'Current date' },
    { key: '{{current_year}}', description: 'Current year' },
    { key: '{{platform_name}}', description: 'Platform name' },
    { key: '{{platform_url}}', description: 'Platform URL' },
  ],
};

export default function EmailTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string>('');

  const [formData, setFormData] = useState<EmailTemplate>({
    name: '',
    subject: '',
    body: '',
    category: 'General',
    active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingTemplate?.id) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({
          title: "Template Updated",
          description: "Email template has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            ...templateData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        toast({
          title: "Template Created",
          description: "Email template has been created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
      });
      loadTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      category: 'General',
      active: true,
    });
  };

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.body;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setFormData({ ...formData, body: newText });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      setFormData({ ...formData, body: formData.body + placeholder });
    }
  };

  const replacePlaceholders = (text: string, data: Record<string, any> = {}) => {
    let result = text;
    
    // System placeholders
    result = result.replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString());
    result = result.replace(/\{\{current_year\}\}/g, new Date().getFullYear().toString());
    result = result.replace(/\{\{platform_name\}\}/g, data.platform_name || 'PetroDealHub');
    result = result.replace(/\{\{platform_url\}\}/g, data.platform_url || 'https://petrodealhub.com');
    
    // User placeholders
    result = result.replace(/\{\{author_name\}\}/g, data.author_name || data.user_name || 'User');
    result = result.replace(/\{\{user_email\}\}/g, data.user_email || 'user@example.com');
    result = result.replace(/\{\{member_id\}\}/g, data.member_id || 'N/A');
    
    // Custom data placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, data[key] || '');
    });
    
    return result;
  };

  const handlePreview = (template: EmailTemplate) => {
    const previewData = {
      author_name: 'John Doe',
      user_email: 'john.doe@example.com',
      member_id: 'MEM-12345',
      platform_name: 'PetroDealHub',
      platform_url: 'https://petrodealhub.com',
    };
    
    setPreviewTemplate({
      ...template,
      subject: replacePlaceholders(template.subject, previewData),
      body: replacePlaceholders(template.body, previewData),
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage reusable email templates with placeholders
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Available Placeholders */}
      <Card>
        <CardHeader>
          <CardTitle>Available Placeholders</CardTitle>
          <CardDescription>
            Click on any placeholder to insert it into your template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(AVAILABLE_PLACEHOLDERS).map(([category, placeholders]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {placeholders.map(({ key, description }) => (
                    <Badge
                      key={key}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => insertPlaceholder(key)}
                      title={description}
                    >
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            {templates.length} template(s) available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No templates found. Create your first template to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.category}</TableCell>
                    <TableCell className="max-w-md truncate">{template.subject}</TableCell>
                    <TableCell>
                      <Badge variant={template.active ? 'default' : 'secondary'}>
                        {template.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
            </DialogTitle>
            <DialogDescription>
              Create a reusable email template with placeholders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name *</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Input
                  id="template-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="General"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject *</Label>
              <Input
                id="template-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Important Notification from {{platform_name}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body">Body *</Label>
              <Textarea
                id="template-body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Dear {{author_name}},&#10;&#10;This is a notification regarding your account (Member ID: {{member_id}}).&#10;&#10;Date: {{current_date}}&#10;Year: {{current_year}}&#10;Platform: {{platform_name}}"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use placeholders from above. Click on any placeholder badge to insert it.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="template-active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="template-active">Active</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of how the email will look with sample data
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Subject:</Label>
                <div className="p-2 bg-muted rounded">{previewTemplate.subject}</div>
              </div>
              <div>
                <Label>Body:</Label>
                <div className="p-4 bg-muted rounded whitespace-pre-wrap">
                  {previewTemplate.body}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

