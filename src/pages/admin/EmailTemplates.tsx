import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Edit, Trash2, Eye, Send, Clock, History, Loader2, Code, TestTube, Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  html_source?: string;
  category: string;
  active: boolean;
  email_account_id?: string | null;
  variables?: any;
  created_at?: string;
  updated_at?: string;
}

interface AutomationRule {
  id?: string;
  name: string;
  trigger_event: string;
  template_id: string | null;
  delay_minutes: number;
  is_enabled: boolean;
  email_account_id?: string | null;
  conditions?: any;
  created_at?: string;
}

interface EmailHistory {
  id: string;
  template_id: string | null;
  template_name?: string;
  recipient_email: string;
  subject: string;
  body?: string;
  status: string;
  source?: string;
  error_message?: string;
  sent_at: string;
  metadata?: any;
}

interface EmailAccount {
  id: string;
  account_name: string;
  email_address: string;
}

const PLATFORM_PLACEHOLDERS = {
  'User': [
    { key: '{{user_name}}', description: 'User full name' },
    { key: '{{user_email}}', description: 'User email address' },
  ],
  'Subscription': [
    { key: '{{plan_name}}', description: 'Subscription plan name' },
    { key: '{{amount}}', description: 'Payment amount' },
    { key: '{{billing_cycle}}', description: 'Billing cycle' },
    { key: '{{trial_end_date}}', description: 'Trial end date' },
  ],
  'Broker': [
    { key: '{{broker_name}}', description: 'Broker name' },
    { key: '{{membership_status}}', description: 'Membership status' },
  ],
  'System': [
    { key: '{{platform_name}}', description: 'Platform name' },
    { key: '{{platform_url}}', description: 'Platform URL' },
    { key: '{{current_date}}', description: 'Current date' },
    { key: '{{current_year}}', description: 'Current year' },
    { key: '{{confirmation_url}}', description: 'Confirmation/Action URL' },
  ],
};

const TRIGGER_EVENTS = [
  { value: 'user_registered', label: 'User Registered' },
  { value: 'subscription_started', label: 'Subscription Started' },
  { value: 'subscription_renewed', label: 'Subscription Renewed' },
  { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
  { value: 'trial_started', label: 'Trial Started' },
  { value: 'trial_ending', label: 'Trial Ending (1 day)' },
  { value: 'payment_successful', label: 'Payment Successful' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'broker_approved', label: 'Broker Approved' },
  { value: 'deal_created', label: 'Deal Created' },
  { value: 'support_ticket_created', label: 'Support Ticket Created' },
];

const CATEGORIES = ['subscription', 'newsletter', 'payment', 'support', 'deal', 'vessel', 'broker', 'custom'];

const SAMPLE_DATA: Record<string, string> = {
  user_name: 'John Smith',
  user_email: 'john@example.com',
  plan_name: 'Professional Plan',
  amount: '$99.00',
  billing_cycle: 'Monthly',
  trial_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  broker_name: 'ABC Trading Co.',
  membership_status: 'Active',
  platform_name: 'PetroDealHub',
  platform_url: 'https://petrodealhub.com',
  current_date: new Date().toLocaleDateString(),
  current_year: new Date().getFullYear().toString(),
  confirmation_url: 'https://petrodealhub.com/auth/confirm?token=xxx',
};

export default function EmailTemplates() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [history, setHistory] = useState<EmailHistory[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isTestEmailDialogOpen, setIsTestEmailDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isViewEmailDialogOpen, setIsViewEmailDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testEmailAccountId, setTestEmailAccountId] = useState<string>('');
  const [testingTemplateId, setTestingTemplateId] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [viewingEmail, setViewingEmail] = useState<EmailHistory | null>(null);

  const [templateForm, setTemplateForm] = useState<EmailTemplate>({
    name: '', subject: '', body: '', html_source: '', category: 'custom', active: true, email_account_id: null,
  });

  const [ruleForm, setRuleForm] = useState<AutomationRule>({
    name: '', trigger_event: '', template_id: null, delay_minutes: 0, is_enabled: true, email_account_id: null,
  });

  useEffect(() => {
    loadTemplates();
    loadRules();
    loadHistory();
    loadEmailAccounts();
  }, []);

  const loadEmailAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id, account_name, email_address')
        .eq('is_active', true);
      if (error) throw error;
      setEmailAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading email accounts:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('email_automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error('Error loading rules:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('email_sending_history')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
    }
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = { 
        ...templateForm, 
        email_account_id: templateForm.email_account_id || null,
        updated_at: new Date().toISOString() 
      };
      if (editingTemplate?.id) {
        await supabase.from('email_templates').update(data).eq('id', editingTemplate.id);
        toast({ title: "Updated", description: "Template updated successfully" });
      } else {
        await supabase.from('email_templates').insert({ ...data, created_at: new Date().toISOString() });
        toast({ title: "Created", description: "Template created successfully" });
      }
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
      loadTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveRule = async () => {
    if (!ruleForm.name || !ruleForm.trigger_event) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = { ...ruleForm, email_account_id: ruleForm.email_account_id || null };
      if (editingRule?.id) {
        await supabase.from('email_automation_rules').update(data).eq('id', editingRule.id);
        toast({ title: "Updated", description: "Rule updated successfully" });
      } else {
        await supabase.from('email_automation_rules').insert({ ...data, created_at: new Date().toISOString() });
        toast({ title: "Created", description: "Rule created successfully" });
      }
      setIsRuleDialogOpen(false);
      resetRuleForm();
      loadRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await supabase.from('email_templates').delete().eq('id', id);
      toast({ title: "Deleted" });
      loadTemplates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await supabase.from('email_automation_rules').delete().eq('id', id);
      toast({ title: "Deleted" });
      loadRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && !email.includes(',');
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testingTemplateId) return;
    
    // Validate email before sending
    if (!isValidEmail(testEmail)) {
      toast({ 
        title: "Invalid Email", 
        description: "Please enter a valid email address (e.g., example@domain.com)", 
        variant: "destructive" 
      });
      return;
    }
    
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email-template', {
        body: { templateId: testingTemplateId, recipientEmail: testEmail.trim(), emailAccountId: testEmailAccountId || null }
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: "Test Email Sent", description: `Email sent to ${testEmail}` });
        setIsTestEmailDialogOpen(false);
        setTestEmail('');
        setTestEmailAccountId('');
        loadHistory();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({ name: '', subject: '', body: '', html_source: '', category: 'custom', active: true, email_account_id: null });
    setEditingTemplate(null);
    setShowHtmlSource(false);
  };

  const resetRuleForm = () => {
    setRuleForm({ name: '', trigger_event: '', template_id: null, delay_minutes: 0, is_enabled: true, email_account_id: null });
    setEditingRule(null);
  };

  const openPreviewDialog = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const openViewEmailDialog = (email: EmailHistory) => {
    setViewingEmail(email);
    setIsViewEmailDialogOpen(true);
  };

  const getPreviewHtml = () => {
    if (!previewTemplate) return '';
    let html = previewTemplate.html_source || previewTemplate.body;
    Object.keys(SAMPLE_DATA).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, SAMPLE_DATA[key]);
    });
    return html;
  };

  const getLinkedRules = (templateId: string) => {
    return rules.filter(r => r.template_id === templateId);
  };

  const getAccountName = (accountId: string | null | undefined) => {
    if (!accountId) return 'Default';
    const account = emailAccounts.find(a => a.id === accountId);
    return account ? account.account_name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage email templates, automation rules, and sending history</p>
        </div>
        <Button variant="outline" onClick={() => { loadTemplates(); loadRules(); loadHistory(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> Templates ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Automation ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Create and manage email templates with placeholders</CardDescription>
                </div>
                <Button onClick={() => { resetTemplateForm(); setIsTemplateDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Available Placeholders</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(PLATFORM_PLACEHOLDERS).map(([category, placeholders]) => (
                    <div key={category}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{category}</p>
                      <div className="flex flex-wrap gap-1">
                        {placeholders.slice(0, 2).map(p => (
                          <Badge key={p.key} variant="outline" className="text-xs">{p.key}</Badge>
                        ))}
                        {placeholders.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{placeholders.length - 2}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No templates yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SMTP Account</TableHead>
                      <TableHead>Linked Rules</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {getAccountName(t.email_account_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getLinkedRules(t.id!).length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {getLinkedRules(t.id!).map(rule => (
                                <Badge key={rule.id} variant="secondary" className="text-xs w-fit">
                                  {TRIGGER_EVENTS.find(e => e.value === rule.trigger_event)?.label || rule.trigger_event}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No automation</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.active ? 'default' : 'secondary'}>
                            {t.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openPreviewDialog(t)} title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setTestingTemplateId(t.id!); setIsTestEmailDialogOpen(true); }} title="Send Test">
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingTemplate(t); setTemplateForm(t); setIsTemplateDialogOpen(true); }} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteTemplate(t.id!)} title="Delete">
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Automation Rules</CardTitle>
                  <CardDescription>Define when emails are automatically sent</CardDescription>
                </div>
                <Button onClick={() => { resetRuleForm(); setIsRuleDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Create Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No automation rules yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Trigger Event</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>SMTP Override</TableHead>
                      <TableHead>Delay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TRIGGER_EVENTS.find(e => e.value === r.trigger_event)?.label || r.trigger_event}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.template_id ? templates.find(t => t.id === r.template_id)?.name || 'Unknown' : 'None'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {r.email_account_id ? getAccountName(r.email_account_id) : 'Use Template Default'}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.delay_minutes > 0 ? `${r.delay_minutes} min` : 'Immediate'}</TableCell>
                        <TableCell>
                          <Badge variant={r.is_enabled ? 'default' : 'secondary'}>
                            {r.is_enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingRule(r); setRuleForm(r); setIsRuleDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteRule(r.id!)}>
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sending History</CardTitle>
              <CardDescription>Last 100 emails sent (all sources)</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No emails sent yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs">{new Date(h.sent_at).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{h.recipient_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {h.template_name || 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {h.source || 'manual'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{h.subject}</TableCell>
                        <TableCell>
                          <Badge variant={h.status === 'sent' ? 'default' : 'destructive'}>
                            {h.status === 'sent' ? '✓ Sent' : '✗ Failed'}
                          </Badge>
                          {h.error_message && (
                            <p className="text-xs text-destructive mt-1 truncate max-w-[150px]">{h.error_message}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {h.body && (
                            <Button variant="ghost" size="sm" onClick={() => openViewEmailDialog(h)} title="View Email">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>SMTP Account (leave empty for default)</Label>
              <Select value={templateForm.email_account_id || 'default'} onValueChange={(v) => setTemplateForm({ ...templateForm, email_account_id: v === 'default' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Use default account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use default account</SelectItem>
                  {emailAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.account_name} ({acc.email_address})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input value={templateForm.subject} onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="Welcome to {{platform_name}}" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Body *</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowHtmlSource(!showHtmlSource)}>
                  <Code className="h-4 w-4 mr-2" /> {showHtmlSource ? 'Plain Text' : 'HTML Source'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => openPreviewDialog(templateForm)}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>
              </div>
            </div>
            {showHtmlSource ? (
              <Textarea
                value={templateForm.html_source || templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, html_source: e.target.value })}
                rows={12}
                className="font-mono text-sm"
                placeholder="<html>...</html>"
              />
            ) : (
              <Textarea
                value={templateForm.body}
                onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                rows={8}
                placeholder="Dear {{user_name}},&#10;&#10;Thank you for joining {{platform_name}}..."
              />
            )}
            <div className="flex items-center gap-2">
              <Switch checked={templateForm.active} onCheckedChange={(v) => setTemplateForm({ ...templateForm, active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveTemplate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Trigger Event *</Label>
              <Select value={ruleForm.trigger_event} onValueChange={(v) => setRuleForm({ ...ruleForm, trigger_event: v })}>
                <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email Template</Label>
              <Select value={ruleForm.template_id || 'none'} onValueChange={(v) => setRuleForm({ ...ruleForm, template_id: v === 'none' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {templates.map(t => <SelectItem key={t.id} value={t.id!}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SMTP Account Override (optional)</Label>
              <Select value={ruleForm.email_account_id || 'template'} onValueChange={(v) => setRuleForm({ ...ruleForm, email_account_id: v === 'template' ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Use template's account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Use template's default</SelectItem>
                  {emailAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.account_name} ({acc.email_address})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Delay (minutes)</Label>
              <Input type="number" min="0" value={ruleForm.delay_minutes} onChange={(e) => setRuleForm({ ...ruleForm, delay_minutes: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ruleForm.is_enabled} onCheckedChange={(v) => setRuleForm({ ...ruleForm, is_enabled: v })} />
              <Label>Enabled</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveRule} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={isTestEmailDialogOpen} onOpenChange={setIsTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send a test email with sample data</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Send From (SMTP Account)</Label>
              <Select value={testEmailAccountId || 'default'} onValueChange={(v) => setTestEmailAccountId(v === 'default' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Use default account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Use default account</SelectItem>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>{account.account_name} ({account.email_address})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipient Email *</Label>
              <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTestEmailDialogOpen(false)}>Cancel</Button>
              <Button onClick={sendTestEmail} disabled={sendingTest || !testEmail}>
                {sendingTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview with sample data. Subject: {previewTemplate?.subject && previewTemplate.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_DATA[key] || `{{${key}}}`)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button variant={previewMode === 'desktop' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewMode('desktop')}>
              <Monitor className="h-4 w-4 mr-2" /> Desktop
            </Button>
            <Button variant={previewMode === 'mobile' ? 'default' : 'outline'} size="sm" onClick={() => setPreviewMode('mobile')}>
              <Smartphone className="h-4 w-4 mr-2" /> Mobile
            </Button>
          </div>
          <div className={`border rounded-lg overflow-hidden mx-auto bg-background ${previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'}`}>
            <ScrollArea className="h-[60vh]">
              <iframe
                srcDoc={getPreviewHtml()}
                className="w-full h-full min-h-[500px] border-0"
                title="Email Preview"
              />
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Email Dialog */}
      <Dialog open={isViewEmailDialogOpen} onOpenChange={setIsViewEmailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Email Content</DialogTitle>
            <DialogDescription>
              Sent to: {viewingEmail?.recipient_email} at {viewingEmail?.sent_at && new Date(viewingEmail.sent_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-background">
            <ScrollArea className="h-[60vh]">
              <iframe
                srcDoc={viewingEmail?.body || ''}
                className="w-full h-full min-h-[500px] border-0"
                title="Email Content"
              />
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}