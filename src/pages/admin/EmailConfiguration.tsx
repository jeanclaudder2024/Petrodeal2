import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Inbox, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  enableTLS: boolean;
  fromEmail: string;
  fromName: string;
  enableAutoReply: boolean;
  active: boolean;
}

interface IMAPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  enableTLS: boolean;
  checkInterval: number;
  enableAutoReply: boolean;
  active: boolean;
}

export default function EmailConfiguration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    host: 'smtp.hostinger.com',
    port: 587,
    username: '',
    password: '',
    enableTLS: true,
    fromEmail: '',
    fromName: '',
    enableAutoReply: false,
    active: false,
  });

  const [imapConfig, setImapConfig] = useState<IMAPConfig>({
    host: '',
    port: 993,
    username: '',
    password: '',
    enableTLS: true,
    checkInterval: 5,
    enableAutoReply: false,
    active: false,
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Load SMTP config
      const { data: smtpData } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('type', 'smtp')
        .single();

      if (smtpData) {
        setSmtpConfig({
          host: smtpData.host || 'smtp.hostinger.com',
          port: smtpData.port || 587,
          username: smtpData.username || '',
          password: '', // Don't load password for security
          enableTLS: smtpData.enable_tls ?? true,
          fromEmail: smtpData.from_email || '',
          fromName: smtpData.from_name || '',
          enableAutoReply: smtpData.enable_auto_reply ?? false,
          active: smtpData.active ?? false,
        });
      }

      // Load IMAP config
      const { data: imapData } = await supabase
        .from('email_configurations')
        .select('*')
        .eq('type', 'imap')
        .single();

      if (imapData) {
        setImapConfig({
          host: imapData.host || '',
          port: imapData.port || 993,
          username: imapData.username || '',
          password: '', // Don't load password for security
          enableTLS: imapData.enable_tls ?? true,
          checkInterval: imapData.check_interval || 5,
          enableAutoReply: imapData.enable_auto_reply ?? false,
          active: imapData.active ?? false,
        });
      }
    } catch (error) {
      // Configurations not found, use defaults
    }
  };

  const saveSMTPConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('email_configurations')
        .upsert({
          type: 'smtp',
          host: smtpConfig.host,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: smtpConfig.password, // Should be encrypted in production
          enable_tls: smtpConfig.enableTLS,
          from_email: smtpConfig.fromEmail,
          from_name: smtpConfig.fromName,
          enable_auto_reply: smtpConfig.enableAutoReply,
          active: smtpConfig.active,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'type'
        });

      if (error) throw error;

      toast({
        title: "SMTP Configuration Saved",
        description: "Your SMTP settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save SMTP configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveIMAPConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('email_configurations')
        .upsert({
          type: 'imap',
          host: imapConfig.host,
          port: imapConfig.port,
          username: imapConfig.username,
          password: imapConfig.password, // Should be encrypted in production
          enable_tls: imapConfig.enableTLS,
          check_interval: imapConfig.checkInterval,
          enable_auto_reply: imapConfig.enableAutoReply,
          active: imapConfig.active,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'type'
        });

      if (error) throw error;

      toast({
        title: "IMAP Configuration Saved",
        description: "Your IMAP settings have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save IMAP configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSMTPConnection = async () => {
    setTesting('smtp');
    try {
      // Call backend API to test SMTP connection
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/email/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Connection test failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Connection test failed`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: data.message || "SMTP connection test passed!",
        });
      } else {
        throw new Error(data.message || 'Connection test failed');
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to SMTP server",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const testIMAPConnection = async () => {
    setTesting('imap');
    try {
      // Call backend API to test IMAP connection
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/email/test-imap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imapConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Connection test failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Connection test failed`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: data.message || "IMAP connection test passed!",
        });
      } else {
        throw new Error(data.message || 'Connection test failed');
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to IMAP server",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure SMTP for sending emails and IMAP for receiving emails
          </p>
        </div>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp">
            <Send className="w-4 h-4 mr-2" />
            SMTP - Email Sending
          </TabsTrigger>
          <TabsTrigger value="imap">
            <Inbox className="w-4 h-4 mr-2" />
            IMAP - Email Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SMTP Configuration</CardTitle>
                  <CardDescription>
                    Configure SMTP server settings for sending emails
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={smtpConfig.active}
                    onCheckedChange={(checked) =>
                      setSmtpConfig({ ...smtpConfig, active: checked })
                    }
                  />
                  <Label>SMTP Active</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={smtpConfig.host}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, host: e.target.value })
                    }
                    placeholder="smtp.hostinger.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={smtpConfig.port}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })
                    }
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    value={smtpConfig.username}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, username: e.target.value })
                    }
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-email">From Email</Label>
                  <Input
                    id="smtp-from-email"
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })
                    }
                    placeholder="noreply@petrodealhub.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-name">From Name</Label>
                  <Input
                    id="smtp-from-name"
                    value={smtpConfig.fromName}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, fromName: e.target.value })
                    }
                    placeholder="PetroDealHub"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp-tls"
                    checked={smtpConfig.enableTLS}
                    onCheckedChange={(checked) =>
                      setSmtpConfig({ ...smtpConfig, enableTLS: checked })
                    }
                  />
                  <Label htmlFor="smtp-tls">Enable TLS/SSL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp-auto-reply"
                    checked={smtpConfig.enableAutoReply}
                    onCheckedChange={(checked) =>
                      setSmtpConfig({ ...smtpConfig, enableAutoReply: checked })
                    }
                  />
                  <Label htmlFor="smtp-auto-reply">Enable auto-reply</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveSMTPConfig}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={testSMTPConnection}
                  disabled={testing === 'smtp'}
                >
                  {testing === 'smtp' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="imap">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IMAP Configuration</CardTitle>
                  <CardDescription>
                    Configure IMAP server settings for receiving emails
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={imapConfig.active}
                    onCheckedChange={(checked) =>
                      setImapConfig({ ...imapConfig, active: checked })
                    }
                  />
                  <Label>IMAP Active</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-host">IMAP Host</Label>
                  <Input
                    id="imap-host"
                    value={imapConfig.host}
                    onChange={(e) =>
                      setImapConfig({ ...imapConfig, host: e.target.value })
                    }
                    placeholder="imap.hostinger.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-port">IMAP Port</Label>
                  <Input
                    id="imap-port"
                    type="number"
                    value={imapConfig.port}
                    onChange={(e) =>
                      setImapConfig({ ...imapConfig, port: parseInt(e.target.value) || 993 })
                    }
                    placeholder="993"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-username">Username</Label>
                  <Input
                    id="imap-username"
                    value={imapConfig.username}
                    onChange={(e) =>
                      setImapConfig({ ...imapConfig, username: e.target.value })
                    }
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-password">Password</Label>
                  <Input
                    id="imap-password"
                    type="password"
                    value={imapConfig.password}
                    onChange={(e) =>
                      setImapConfig({ ...imapConfig, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imap-interval">Check Interval (minutes)</Label>
                <Input
                  id="imap-interval"
                  type="number"
                  value={imapConfig.checkInterval}
                  onChange={(e) =>
                    setImapConfig({ ...imapConfig, checkInterval: parseInt(e.target.value) || 5 })
                  }
                  placeholder="5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imap-tls"
                    checked={imapConfig.enableTLS}
                    onCheckedChange={(checked) =>
                      setImapConfig({ ...imapConfig, enableTLS: checked })
                    }
                  />
                  <Label htmlFor="imap-tls">Enable TLS/SSL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="imap-auto-reply"
                    checked={imapConfig.enableAutoReply}
                    onCheckedChange={(checked) =>
                      setImapConfig({ ...imapConfig, enableAutoReply: checked })
                    }
                  />
                  <Label htmlFor="imap-auto-reply">Enable auto-reply</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveIMAPConfig}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={testIMAPConnection}
                  disabled={testing === 'imap'}
                >
                  {testing === 'imap' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

