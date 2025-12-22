import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, Mail, Settings, Zap, CheckCircle2, XCircle, Inbox, 
  Send, Upload, Megaphone, Loader2, RefreshCw, Sparkles, 
  Users, Eye, Trash2, Edit, Plus 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AutoReplyRule {
  id?: string;
  name: string;
  enabled: boolean;
  keywords: string[];
  ai_enabled: boolean;
  template_id?: string;
  custom_response?: string;
  priority: number;
  created_at?: string;
}

interface IncomingEmail {
  id: string;
  from_email: string;
  subject: string;
  body: string;
  received_at: string | null;
  processed: boolean | null;
  auto_replied: boolean | null;
  reply_body?: string | null;
}

interface EmailAccount {
  id: string;
  account_name: string;
  email_address: string;
  is_active: boolean | null;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

interface CampaignRecipient {
  id?: string;
  email: string;
  name?: string;
}

export default function AutoReplySystem() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [incomingEmails, setIncomingEmails] = useState<IncomingEmail[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedInboxAccount, setSelectedInboxAccount] = useState<string>('');
  
  // Reply dialog
  const [selectedEmail, setSelectedEmail] = useState<IncomingEmail | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [generatingReply, setGeneratingReply] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Rule dialog
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [ruleForm, setRuleForm] = useState<AutoReplyRule>({
    name: '',
    enabled: true,
    keywords: [],
    ai_enabled: false,
    priority: 0,
    custom_response: ''
  });
  const [keywordsInput, setKeywordsInput] = useState('');

  // Campaign wizard
  const [campaignWizardOpen, setCampaignWizardOpen] = useState(false);
  const [campaignStep, setCampaignStep] = useState(1);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    email_account_id: '',
    subject: '',
    body: '',
    html_content: ''
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [manualRecipient, setManualRecipient] = useState({ email: '', name: '' });
  const [sendingCampaign, setSendingCampaign] = useState(false);

  // Campaign recipients dialog
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<any[]>([]);
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadRules(),
      loadIncomingEmails(),
      loadEmailAccounts(),
      loadCampaigns()
    ]);
  };

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_reply_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error('Error loading rules:', error);
    }
  };

  const loadIncomingEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('incoming_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setIncomingEmails(data || []);
    } catch (error: any) {
      console.error('Error loading emails:', error);
    }
  };

  const loadEmailAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id, account_name, email_address, is_active')
        .eq('is_active', true);

      if (error) throw error;
      setEmailAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
    }
  };

  const syncEmails = async () => {
    // Require account selection for IMAP sync
    if (!selectedInboxAccount || selectedInboxAccount === 'all') {
      toast({
        title: "Select Account",
        description: "Please select a specific email account to sync via IMAP",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-imap-emails', {
        body: { account_id: selectedInboxAccount }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sync Complete",
          description: data.message || `Synced ${data.count || 0} emails from ${data.account || 'account'}`,
        });
        loadIncomingEmails();
      } else {
        toast({
          title: "Sync Info",
          description: data.error || data.hint || 'Check IMAP configuration',
          variant: data.hint ? 'default' : 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync emails",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const openReplyDialog = (email: IncomingEmail) => {
    setSelectedEmail(email);
    setReplyContent('');
    setReplyDialogOpen(true);
  };

  const generateAIReply = async () => {
    if (!selectedEmail) return;
    
    setGeneratingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-reply', {
        body: {
          email_id: selectedEmail.id,
          from_email: selectedEmail.from_email,
          subject: selectedEmail.subject,
          body: selectedEmail.body,
          send_reply: false
        }
      });

      if (error) throw error;

      if (data.success && data.reply) {
        setReplyContent(data.reply.reply_body);
        toast({ title: "AI Reply Generated", description: `Intent: ${data.reply.detected_intent}` });
      } else {
        throw new Error(data.error || 'Failed to generate reply');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI reply",
        variant: "destructive",
      });
    } finally {
      setGeneratingReply(false);
    }
  };

  const sendReply = async () => {
    if (!selectedEmail || !replyContent) return;

    setSendingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-smtp-email', {
        body: {
          to: selectedEmail.from_email,
          subject: `Re: ${selectedEmail.subject}`,
          html: replyContent
        }
      });

      if (error) throw error;

      // Update email as replied
      await supabase
        .from('incoming_emails')
        .update({
          processed: true,
          auto_replied: true,
          reply_body: replyContent,
          replied_at: new Date().toISOString()
        })
        .eq('id', selectedEmail.id);

      toast({ title: "Reply Sent", description: `Email sent to ${selectedEmail.from_email}` });
      setReplyDialogOpen(false);
      loadIncomingEmails();
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  const openRuleDialog = (rule?: AutoReplyRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm(rule);
      setKeywordsInput(rule.keywords?.join(', ') || '');
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        enabled: true,
        keywords: [],
        ai_enabled: false,
        priority: 0,
        custom_response: ''
      });
      setKeywordsInput('');
    }
    setIsRuleDialogOpen(true);
  };

  const saveRule = async () => {
    if (!ruleForm.name.trim()) {
      toast({ title: "Error", description: "Rule name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const keywordsArray = keywordsInput.split(',').map(k => k.trim()).filter(k => k);
      const ruleData = {
        ...ruleForm,
        keywords: keywordsArray,
        updated_at: new Date().toISOString()
      };

      if (editingRule?.id) {
        const { error } = await supabase
          .from('auto_reply_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        if (error) throw error;
        toast({ title: "Rule Updated" });
      } else {
        const { error } = await supabase
          .from('auto_reply_rules')
          .insert({ ...ruleData, created_at: new Date().toISOString() });
        if (error) throw error;
        toast({ title: "Rule Created" });
      }

      setIsRuleDialogOpen(false);
      loadRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const { error } = await supabase
        .from('auto_reply_rules')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Rule Deleted" });
      loadRules();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleRule = async (rule: AutoReplyRule) => {
    try {
      const { error } = await supabase
        .from('auto_reply_rules')
        .update({ enabled: !rule.enabled })
        .eq('id', rule.id);

      if (error) throw error;
      loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update rule",
        variant: "destructive",
      });
    }
  };

  const viewCampaignRecipients = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setLoadingRecipients(true);
    setRecipientsDialogOpen(true);
    
    try {
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('status', { ascending: true });

      if (error) throw error;
      setCampaignRecipients(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? This will also delete all recipient records.')) return;
    try {
      // Delete recipients first
      await supabase.from('campaign_recipients').delete().eq('campaign_id', id);
      // Delete campaign
      const { error } = await supabase.from('email_campaigns').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Campaign Deleted" });
      loadCampaigns();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Campaign functions
  const generateMarketingEmail = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a prompt", variant: "destructive" });
      return;
    }

    setGeneratingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-email', {
        body: {
          prompt: aiPrompt,
          type: 'promotional',
          tone: 'professional',
          include_placeholders: true
        }
      });

      if (error) throw error;

      if (data.success && data.email) {
        setCampaignForm(prev => ({
          ...prev,
          subject: data.email.subject,
          body: data.email.preview_text || '',
          html_content: data.email.html_content
        }));
        toast({ title: "Email Generated", description: "AI has generated your marketing email" });
      } else {
        throw new Error(data.error || 'Failed to generate email');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate email",
        variant: "destructive",
      });
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const newRecipients: CampaignRecipient[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
          return; // Skip header
        }
        const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
        if (parts[0] && parts[0].includes('@')) {
          newRecipients.push({ email: parts[0], name: parts[1] || '' });
        }
      });

      setRecipients(prev => [...prev, ...newRecipients]);
      toast({ title: "CSV Imported", description: `Added ${newRecipients.length} recipients` });
    };
    reader.readAsText(file);
  };

  const addManualRecipient = () => {
    if (!manualRecipient.email || !manualRecipient.email.includes('@')) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return;
    }
    setRecipients(prev => [...prev, { ...manualRecipient }]);
    setManualRecipient({ email: '', name: '' });
  };

  const removeRecipient = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const saveCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || recipients.length === 0) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSendingCampaign(true);
    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaignForm.name,
          email_account_id: campaignForm.email_account_id || null,
          subject: campaignForm.subject,
          body: campaignForm.body,
          html_content: campaignForm.html_content,
          status: 'draft',
          total_recipients: recipients.length
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Add recipients
      const recipientRows = recipients.map(r => ({
        campaign_id: campaign.id,
        email: r.email,
        name: r.name || null,
        status: 'pending'
      }));

      const { error: recipientsError } = await supabase
        .from('campaign_recipients')
        .insert(recipientRows);

      if (recipientsError) throw recipientsError;

      toast({ title: "Campaign Created", description: "Campaign saved as draft" });
      setCampaignWizardOpen(false);
      resetCampaignForm();
      loadCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setSendingCampaign(false);
    }
  };

  const sendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign-emails', {
        body: { campaign_id: campaignId }
      });

      if (error) throw error;

      toast({
        title: "Campaign Sent",
        description: `Sent: ${data.sent}, Failed: ${data.failed}`,
      });
      loadCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({ name: '', email_account_id: '', subject: '', body: '', html_content: '' });
    setRecipients([]);
    setAiPrompt('');
    setCampaignStep(1);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Email Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Manage inbox, auto-replies, and marketing campaigns
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="inbox" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
            <Inbox className="h-4 w-4" /> 
            <span className="hidden sm:inline">Inbox</span>
            <span className="sm:hidden">Inbox</span>
            <Badge variant="secondary" className="text-xs ml-1">{incomingEmails.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
            <Bot className="h-4 w-4" /> 
            <span className="hidden sm:inline">Auto-Reply</span>
            <span className="sm:hidden">Rules</span>
            <Badge variant="secondary" className="text-xs ml-1">{rules.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
            <Megaphone className="h-4 w-4" /> 
            <span className="hidden sm:inline">Marketing</span>
            <span className="sm:hidden">Campaign</span>
            <Badge variant="secondary" className="text-xs ml-1">{campaigns.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Incoming Emails</CardTitle>
                  <CardDescription className="text-sm">Synced emails from IMAP server</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full lg:w-auto">
                  <Select value={selectedInboxAccount} onValueChange={setSelectedInboxAccount}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Select account to sync" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts (view only)</SelectItem>
                      {emailAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm whitespace-nowrap">AI Reply</Label>
                      <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                    </div>
                    <Button variant="outline" size="sm" onClick={syncEmails} disabled={syncing || !selectedInboxAccount || selectedInboxAccount === 'all'}>
                      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Sync</span>
                    </Button>
                  </div>
                </div>
              </div>
              {(!selectedInboxAccount || selectedInboxAccount === 'all') && (
                <p className="text-xs text-amber-600 mt-2">Select a specific email account to sync emails via IMAP</p>
              )}
            </CardHeader>
            <CardContent>
              {incomingEmails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emails synced yet.</p>
                  <p className="text-sm">Configure IMAP in Email Configuration and click "Sync Emails"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingEmails.map((email) => (
                    <div
                      key={email.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{email.from_email}</span>
                            {email.auto_replied && (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Replied
                              </Badge>
                            )}
                            {!email.processed && (
                              <Badge variant="secondary" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{email.subject}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{email.body}</p>
                          {email.received_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(email.received_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openReplyDialog(email)}>
                            <Send className="h-4 w-4 mr-1" /> Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auto-Reply Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Auto-Reply Rules</CardTitle>
                  <CardDescription>Configure automatic email responses</CardDescription>
                </div>
                <Button onClick={() => openRuleDialog()}>
                  <Plus className="h-4 w-4 mr-2" /> Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No auto-reply rules configured yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                          {rule.ai_enabled && (
                            <Badge variant="outline">
                              <Bot className="w-3 h-3 mr-1" /> AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Keywords: {rule.keywords?.join(', ') || 'None'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Priority: {rule.priority}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openRuleDialog(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketing Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Marketing Campaigns</CardTitle>
                  <CardDescription>Create and manage email marketing campaigns</CardDescription>
                </div>
                <Button onClick={() => { resetCampaignForm(); setCampaignWizardOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No campaigns created yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                        <TableCell>{campaign.total_recipients}</TableCell>
                        <TableCell>
                          <Badge variant={
                            campaign.status === 'sent' ? 'default' :
                            campaign.status === 'sending' ? 'secondary' : 'outline'
                          }>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.status === 'sent' ? (
                            <span className="text-sm">
                              {campaign.sent_count}/{campaign.total_recipients}
                              {campaign.failed_count > 0 && (
                                <span className="text-destructive ml-1">({campaign.failed_count} failed)</span>
                              )}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {campaign.status === 'draft' && (
                              <>
                                <Button size="sm" onClick={() => sendCampaign(campaign.id)} disabled={loading}>
                                  <Send className="h-4 w-4 mr-1" /> Send
                                </Button>
                                <Button size="sm" variant="outline" onClick={async () => {
                                  // Load full campaign data including body/html content
                                  try {
                                    const { data: fullCampaign, error } = await supabase
                                      .from('email_campaigns')
                                      .select('*')
                                      .eq('id', campaign.id)
                                      .single();
                                    
                                    if (error) throw error;
                                    
                                    // Load recipients too
                                    const { data: recipientsData } = await supabase
                                      .from('campaign_recipients')
                                      .select('email, name')
                                      .eq('campaign_id', campaign.id);
                                    
                                    setCampaignForm({
                                      name: fullCampaign.name || '',
                                      email_account_id: fullCampaign.email_account_id || '',
                                      subject: fullCampaign.subject || '',
                                      body: fullCampaign.body || '',
                                      html_content: fullCampaign.html_content || ''
                                    });
                                    setRecipients(recipientsData || []);
                                    setCampaignStep(2); // Go to compose step
                                    setCampaignWizardOpen(true);
                                    
                                    toast({ title: "Campaign Loaded", description: "Edit and resave or send" });
                                  } catch (err: any) {
                                    toast({ title: "Error", description: err.message, variant: "destructive" });
                                  }
                                }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => viewCampaignRecipients(campaign)}>
                              <Eye className="h-4 w-4 mr-1" /> Recipients
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteCampaign(campaign.id)}>
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
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Email</DialogTitle>
            <DialogDescription>
              From: {selectedEmail?.from_email}<br />
              Subject: {selectedEmail?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-auto">
              {selectedEmail?.body}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateAIReply} disabled={generatingReply}>
                {generatingReply ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate AI Reply
              </Button>
            </div>
            <Textarea
              placeholder="Enter your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={8}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
              <Button onClick={sendReply} disabled={sendingReply || !replyContent}>
                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Wizard Dialog */}
      <Dialog open={campaignWizardOpen} onOpenChange={setCampaignWizardOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Marketing Campaign</DialogTitle>
            <DialogDescription>
              Step {campaignStep} of 4 - {
                campaignStep === 1 ? 'Basic Info' :
                campaignStep === 2 ? 'Email Content' :
                campaignStep === 3 ? 'Recipients' : 'Review & Send'
              }
            </DialogDescription>
          </DialogHeader>

          <Progress value={(campaignStep / 4) * 100} className="mb-4" />

          {campaignStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="e.g., December Newsletter"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Send From</Label>
                <Select
                  value={campaignForm.email_account_id}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, email_account_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email account" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} ({account.email_address})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {campaignStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <Label className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" /> Generate with AI
                </Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Describe your marketing email... e.g., 'Create a promotional email for our new oil trading premium membership with 20% discount'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button 
                  className="mt-2" 
                  variant="outline" 
                  onClick={generateMarketingEmail}
                  disabled={generatingEmail}
                >
                  {generatingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Email
                </Button>
              </div>

              <div>
                <Label>Subject Line *</Label>
                <Input
                  placeholder="Email subject"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <Label>Email Content (HTML)</Label>
                <Textarea
                  placeholder="HTML email content..."
                  value={campaignForm.html_content}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, html_content: e.target.value }))}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {campaignForm.html_content && (
                <div>
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-white">
                    <div dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(campaignForm.html_content, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'div', 'span', 'blockquote', 'pre', 'code', 'hr'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'width', 'height', 'colspan', 'rowspan'],
                        ALLOW_DATA_ATTR: false
                      })
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {campaignStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Upload CSV</Label>
                  <Input type="file" accept=".csv" onChange={handleCSVUpload} />
                  <p className="text-xs text-muted-foreground mt-1">CSV with columns: email, name</p>
                </div>
                <div>
                  <Label>Add Manually</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email"
                      value={manualRecipient.email}
                      onChange={(e) => setManualRecipient(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      placeholder="Name (optional)"
                      value={manualRecipient.name}
                      onChange={(e) => setManualRecipient(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Button onClick={addManualRecipient} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Recipients ({recipients.length})</Label>
                <div className="border rounded-lg max-h-48 overflow-auto">
                  {recipients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recipients added yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipients.map((r, index) => (
                          <TableRow key={index}>
                            <TableCell>{r.email}</TableCell>
                            <TableCell>{r.name || '-'}</TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={() => removeRecipient(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </div>
          )}

          {campaignStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Campaign Name:</strong> {campaignForm.name}</div>
                <div><strong>Subject:</strong> {campaignForm.subject}</div>
                <div><strong>Recipients:</strong> {recipients.length}</div>
                <div><strong>Send From:</strong> {
                  emailAccounts.find(a => a.id === campaignForm.email_account_id)?.email_address || 'Default'
                }</div>
              </div>

              {campaignForm.html_content && (
                <div>
                  <Label>Email Preview</Label>
                  <div className="border rounded-lg p-4 bg-white max-h-64 overflow-auto">
                    <div dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(campaignForm.html_content, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'div', 'span', 'blockquote', 'pre', 'code', 'hr'],
                        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'width', 'height', 'colspan', 'rowspan'],
                        ALLOW_DATA_ATTR: false
                      })
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCampaignStep(prev => Math.max(1, prev - 1))}
              disabled={campaignStep === 1}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCampaignWizardOpen(false)}>
                Cancel
              </Button>
              {campaignStep < 4 ? (
                <Button onClick={() => setCampaignStep(prev => prev + 1)}>
                  Next
                </Button>
              ) : (
                <Button onClick={saveCampaign} disabled={sendingCampaign}>
                  {sendingCampaign ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Campaign
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add Auto-Reply Rule'}</DialogTitle>
            <DialogDescription>Configure automatic response triggers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input
                value={ruleForm.name}
                onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                placeholder="e.g., Support Inquiry"
              />
            </div>
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="e.g., help, support, question"
              />
              <p className="text-xs text-muted-foreground mt-1">Emails containing these keywords will trigger this rule</p>
            </div>
            <div>
              <Label>Priority (higher = runs first)</Label>
              <Input
                type="number"
                value={ruleForm.priority}
                onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Custom Response</Label>
              <Textarea
                value={ruleForm.custom_response || ''}
                onChange={(e) => setRuleForm({ ...ruleForm, custom_response: e.target.value })}
                placeholder="Auto-reply message..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={ruleForm.enabled}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
                />
                <Label>Enabled</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={ruleForm.ai_enabled}
                  onCheckedChange={(checked) => setRuleForm({ ...ruleForm, ai_enabled: checked })}
                />
                <Label>Use AI for response</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveRule} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Recipients Dialog */}
      <Dialog open={recipientsDialogOpen} onOpenChange={setRecipientsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Recipients: {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              View delivery status for each recipient
            </DialogDescription>
          </DialogHeader>
          {loadingRecipients ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : campaignRecipients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recipients found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignRecipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        r.status === 'sent' ? 'default' :
                        r.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.sent_at ? new Date(r.sent_at).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-red-500 text-xs">
                      {r.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-between mt-4 text-sm">
            <span>Total: {campaignRecipients.length}</span>
            <span className="text-green-600">Sent: {campaignRecipients.filter(r => r.status === 'sent').length}</span>
            <span className="text-red-600">Failed: {campaignRecipients.filter(r => r.status === 'failed').length}</span>
            <span className="text-muted-foreground">Pending: {campaignRecipients.filter(r => r.status === 'pending').length}</span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
