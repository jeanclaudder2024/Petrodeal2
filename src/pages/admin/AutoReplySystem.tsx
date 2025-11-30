import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bot, Mail, Settings, Zap, CheckCircle2, XCircle } from 'lucide-react';
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
  from: string;
  subject: string;
  body: string;
  received_at: string;
  processed: boolean;
  auto_replied: boolean;
}

export default function AutoReplySystem() {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [incomingEmails, setIncomingEmails] = useState<IncomingEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    loadRules();
    loadIncomingEmails();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_reply_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load auto-reply rules",
        variant: "destructive",
      });
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
      // Silently fail - emails might not be synced yet
    }
  };

  const syncEmails = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/email/sync-imap', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Emails Synced",
          description: `Synced ${data.count || 0} new emails`,
        });
        loadIncomingEmails();
      } else {
        throw new Error(data.error || 'Failed to sync emails');
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync emails from IMAP",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const processEmailWithAI = async (email: IncomingEmail) => {
    try {
      const response = await fetch('/api/email/ai-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: email.id,
          from: email.from,
          subject: email.subject,
          body: email.body,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "AI Reply Generated",
          description: "Auto-reply has been sent successfully",
        });
        loadIncomingEmails();
      } else {
        throw new Error(data.error || 'Failed to generate AI reply');
      }
    } catch (error: any) {
      toast({
        title: "AI Reply Failed",
        description: error.message || "Failed to generate AI reply",
        variant: "destructive",
      });
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auto-Reply System</h1>
          <p className="text-muted-foreground mt-2">
            Configure AI-powered auto-replies for incoming emails
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={syncEmails}
            disabled={syncing}
          >
            <Mail className="w-4 h-4 mr-2" />
            {syncing ? 'Syncing...' : 'Sync Emails'}
          </Button>
        </div>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Auto-Reply Settings
          </CardTitle>
          <CardDescription>
            Enable AI-powered automatic email responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>AI Auto-Reply</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate contextual replies using AI
              </p>
            </div>
            <Switch
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Incoming Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Incoming Emails</CardTitle>
          <CardDescription>
            Recent emails received via IMAP ({incomingEmails.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incomingEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No emails synced yet. Click "Sync Emails" to fetch from IMAP.
              </div>
            ) : (
              incomingEmails.map((email) => (
                <div
                  key={email.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <strong>{email.from}</strong>
                        {email.auto_replied && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Replied
                          </Badge>
                        )}
                        {!email.processed && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1">{email.subject}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {email.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(email.received_at).toLocaleString()}
                      </p>
                    </div>
                    {!email.auto_replied && aiEnabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => processEmailWithAI(email)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        AI Reply
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auto-Reply Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Reply Rules</CardTitle>
          <CardDescription>
            Configure rules for automatic email responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No auto-reply rules configured. Create rules to automatically respond to emails.
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
                          <Bot className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Keywords: {rule.keywords.join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Priority: {rule.priority}
                    </p>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

