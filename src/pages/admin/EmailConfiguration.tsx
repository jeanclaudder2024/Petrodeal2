import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Inbox, CheckCircle2, XCircle, Loader2, Trash2, Edit, Star, Settings } from 'lucide-react';
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

interface EmailAccount {
  id: string;
  account_name: string;
  email_address: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username?: string | null;
  smtp_password?: string | null;
  imap_host: string | null;
  imap_port: number | null;
  imap_username?: string | null;
  imap_password?: string | null;
  enable_tls?: boolean | null;
  is_default: boolean | null;
  is_active: boolean | null;
  test_status: string | null;
  last_tested_at: string | null;
}

export default function EmailConfiguration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);
  
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

  // Auto-port detection based on host and TLS settings
  const getAutoPort = (type: 'smtp' | 'imap', enableTLS: boolean) => {
    if (type === 'smtp') {
      return enableTLS ? 465 : 587;
    } else {
      return enableTLS ? 993 : 143;
    }
  };

  // Handle SMTP TLS change with auto-port
  const handleSmtpTlsChange = (enableTLS: boolean) => {
    setSmtpConfig(prev => ({
      ...prev,
      enableTLS,
      port: getAutoPort('smtp', enableTLS)
    }));
  };

  // Handle IMAP TLS change with auto-port
  const handleImapTlsChange = (enableTLS: boolean) => {
    setImapConfig(prev => ({
      ...prev,
      enableTLS,
      port: getAutoPort('imap', enableTLS)
    }));
  };

  useEffect(() => {
    loadConfigurations();
    loadEmailAccounts();
  }, []);

  const loadEmailAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      setEmailAccounts(data || []);
    } catch (error) {
      console.error('Error loading email accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const deleteEmailAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email account?')) return;
    try {
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Account Deleted" });
      loadEmailAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      // First, unset all defaults
      await supabase.from('email_accounts').update({ is_default: false }).neq('id', 'none');
      // Then set the selected one as default
      const { error } = await supabase.from('email_accounts').update({ is_default: true }).eq('id', id);
      if (error) throw error;
      toast({ title: "Default Updated" });
      loadEmailAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const cancelTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTesting(null);
    setTestingAccountId(null);
    toast({ title: "Test Cancelled", description: "Connection test was cancelled" });
  };

  const openEditDialog = (account: EmailAccount) => {
    setEditingAccount(account);
    setIsEditDialogOpen(true);
  };

  const saveEditedAccount = async () => {
    if (!editingAccount) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('email_accounts')
        .update({
          account_name: editingAccount.account_name,
          email_address: editingAccount.email_address,
          smtp_host: editingAccount.smtp_host,
          smtp_port: editingAccount.smtp_port,
          smtp_username: editingAccount.smtp_username,
          smtp_password: editingAccount.smtp_password,
          imap_host: editingAccount.imap_host,
          imap_port: editingAccount.imap_port,
          imap_username: editingAccount.imap_username,
          imap_password: editingAccount.imap_password,
          enable_tls: editingAccount.enable_tls,
          is_active: editingAccount.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAccount.id);

      if (error) throw error;
      toast({ title: "Account Updated", description: "Email account has been updated successfully." });
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      loadEmailAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testEmailAccount = async (account: EmailAccount) => {
    if (!account.smtp_host || !account.smtp_username) {
      toast({ title: "Missing SMTP", description: "This account has no SMTP configuration to test.", variant: "destructive" });
      return;
    }
    
    setTestingAccountId(account.id);
    try {
      const { data, error } = await supabase.functions.invoke('test-email-connection', {
        body: {
          type: 'smtp',
          host: account.smtp_host,
          port: account.smtp_port || 587,
          username: account.smtp_username,
          password: account.smtp_password || '',
          enableTLS: account.enable_tls ?? true,
        },
      });

      if (error) throw error;

      // Update test status in database
      await supabase
        .from('email_accounts')
        .update({ 
          test_status: data?.success ? 'success' : 'failed',
          last_tested_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (data?.success) {
        toast({ title: "Connection Successful", description: data.message || "SMTP test passed!" });
      } else {
        toast({ title: "Connection Failed", description: data?.message || "SMTP test failed", variant: "destructive" });
      }
      loadEmailAccounts();
    } catch (error: any) {
      toast({ title: "Test Failed", description: error.message, variant: "destructive" });
    } finally {
      setTestingAccountId(null);
    }
  };

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
      // Save to email_configurations table
      const { error } = await supabase
        .from('email_configurations')
        .upsert({
          type: 'smtp',
          host: smtpConfig.host,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: smtpConfig.password,
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

      // Also save to email_accounts table for the accounts list
      const accountName = smtpConfig.fromName || smtpConfig.username.split('@')[0] || 'SMTP Account';
      const emailAddress = smtpConfig.fromEmail || smtpConfig.username;
      
      const { error: accountError } = await supabase
        .from('email_accounts')
        .upsert({
          account_name: accountName,
          email_address: emailAddress,
          smtp_host: smtpConfig.host,
          smtp_port: smtpConfig.port,
          smtp_username: smtpConfig.username,
          smtp_password: smtpConfig.password,
          enable_tls: smtpConfig.enableTLS,
          is_active: smtpConfig.active,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'email_address'
        });

      if (accountError) {
        console.error('Error saving to email_accounts:', accountError);
      }

      // Reload accounts list
      await loadEmailAccounts();

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
          password: imapConfig.password,
          enable_tls: imapConfig.enableTLS,
          check_interval: imapConfig.checkInterval,
          enable_auto_reply: imapConfig.enableAutoReply,
          active: imapConfig.active,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'type'
        });

      if (error) throw error;

      // Also update email_accounts table with IMAP config
      const emailAddress = imapConfig.username;
      if (emailAddress) {
        const { error: accountError } = await supabase
          .from('email_accounts')
          .upsert({
            account_name: imapConfig.username.split('@')[0] || 'IMAP Account',
            email_address: emailAddress,
            imap_host: imapConfig.host,
            imap_port: imapConfig.port,
            imap_username: imapConfig.username,
            imap_password: imapConfig.password,
            enable_tls: imapConfig.enableTLS,
            is_active: imapConfig.active,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'email_address'
          });

        if (accountError) {
          console.error('Error saving IMAP to email_accounts:', accountError);
        }
      }

      // Reload accounts list
      await loadEmailAccounts();

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
      // Validate only essential connection fields (not From Name/Email)
      if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in SMTP Host, Username, and Password before testing",
          variant: "destructive",
        });
        setTesting(null);
        return;
      }

      // Only send connection test fields, not From Name/Email (those are for sending, not testing connection)
      const testConfig = {
        type: 'smtp' as const,
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: smtpConfig.password,
        enableTLS: smtpConfig.enableTLS,
      };

      console.log('Testing SMTP connection with config:', {
        host: testConfig.host,
        port: testConfig.port,
        username: testConfig.username,
        enableTLS: testConfig.enableTLS,
        password: '***hidden***'
      });

      // Try Python backend first (for VPS), then fall back to Supabase Edge Function
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const backendUrl = `${apiUrl}/email/test-smtp`;
      
      let data, error;
      
      // First, try Python backend (for VPS deployment)
      try {
        console.log('Trying Python backend first:', backendUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for backend check
        
        try {
          const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: testConfig.host,
              port: testConfig.port,
              username: testConfig.username,
              password: testConfig.password,
              enableTLS: testConfig.enableTLS,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const responseData = await response.json();
            
            // Check if backend returned success: false
            if (responseData.success === false) {
              const errorMsg = responseData.message || responseData.error || 'SMTP connection test failed';
              throw new Error(errorMsg);
            }
            
            data = responseData;
            error = null;
            console.log('✅ Using Python backend (VPS)');
          } else {
            // Try to get error message from response
            let errorText = `Backend returned status ${response.status}`;
            try {
              const errorData = await response.json();
              errorText = errorData.message || errorData.detail || errorText;
            } catch {
              // Couldn't parse error response
            }
            throw new Error(errorText);
          }
        } catch (backendError: any) {
          clearTimeout(timeoutId);
          if (backendError.name === 'AbortError') {
            throw new Error('Backend timeout - request took longer than 5 seconds');
          }
          throw backendError;
        }
      } catch (backendError: any) {
        // Backend not available, use Supabase Edge Function instead
        console.log('⚠️ Python backend not available, using test-email-connection Edge Function');
        
        try {
          const edgeFunctionResult = await supabase.functions.invoke('test-email-connection', {
            body: {
              type: 'smtp',
              ...testConfig,
            },
          });
          
          data = edgeFunctionResult.data;
          error = edgeFunctionResult.error;
          
          // Handle Supabase function errors
          if (error) {
            console.error('Supabase function error:', error);
            const errorMsg = error.message || 'Edge Function error occurred';
            throw new Error(`Edge Function error: ${errorMsg}`);
          }
          
          // Check Supabase function response
          if (data && data.success === true) {
            console.log('SMTP connection test successful via Edge Function!');
            toast({
              title: "Connection Successful",
              description: data.message || "SMTP connection test passed!",
            });
            setTesting(null);
            return;
          } else if (data && data.success === false) {
            const errorMsg = data.message || data.error || 'Connection test failed';
            console.error('SMTP connection test failed:', errorMsg);
            toast({
              title: "Connection Failed",
              description: errorMsg,
              variant: "destructive",
              duration: 10000,
            });
            setTesting(null);
            return;
          } else if (!data) {
            throw new Error('No response from Edge Function. Please check if the function is deployed.');
          }
        } catch (edgeFunctionError: any) {
          console.error('Edge function error:', edgeFunctionError);
          throw new Error(edgeFunctionError.message || 'Failed to connect to email test service');
        }
      }

      // Handle successful backend response
      if (data && !error) {
        console.log('Response data:', data);

        // Check if response indicates success
        if (data.success === true) {
          console.log('SMTP connection test successful!');
          toast({
            title: "Connection Successful",
            description: data.message || "SMTP connection test passed!",
          });
        } else {
          // Function returned success: false with error message
          const errorMsg = data.message || data.error || 'Connection test failed';
          console.error('SMTP connection test failed:', errorMsg);
          toast({
            title: "Connection Failed",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('SMTP test error:', error);
      
      // Provide more specific error messages
      let errorMsg = "Failed to test SMTP connection. ";
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
          errorMsg = "Network error: Unable to reach the server. Please check your internet connection and try again.";
        } else if (msg.includes('timeout')) {
          errorMsg = "Request timed out. The server may be slow or unreachable. Please try again.";
        } else if (msg.includes('backend timeout')) {
          errorMsg = "Backend server is not responding. Please ensure the Python backend is running on port 8000.";
        } else if (msg.includes('edge function') || msg.includes('not found') || msg.includes('404')) {
          errorMsg = error.message;
        } else if (msg.includes('no response from smtp server')) {
          errorMsg = "Unable to connect to SMTP server. Please check:\n• SMTP host and port are correct\n• Server is accessible from your network\n• Firewall allows connections on this port\n• TLS/SSL settings match your server configuration";
        } else if (msg.includes('authentication failed') || msg.includes('auth')) {
          errorMsg = "Authentication failed. Please check your username and password are correct.";
        } else if (msg.includes('connection failed') || msg.includes('connection error')) {
          errorMsg = "Connection failed. Please verify:\n• SMTP server address is correct\n• Port number is correct (587 for TLS, 465 for SSL, 25 for no encryption)\n• Your network allows SMTP connections";
        } else {
          errorMsg += error.message;
        }
      } else {
        errorMsg += "Check browser console for details.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMsg,
        variant: "destructive",
        duration: 8000, // Show longer for detailed error messages
      });
    } finally {
      setTesting(null);
    }
  };

  const testIMAPConnection = async () => {
    setTesting('imap');
    try {
      // Validate only essential connection fields
      if (!imapConfig.host || !imapConfig.username || !imapConfig.password) {
        toast({
          title: "Missing Information",
          description: "Please fill in IMAP Host, Username, and Password before testing",
          variant: "destructive",
        });
        setTesting(null);
        return;
      }

      // Only send connection test fields
      const testConfig = {
        type: 'imap' as const,
        host: imapConfig.host,
        port: imapConfig.port,
        username: imapConfig.username,
        password: imapConfig.password,
        enableTLS: imapConfig.enableTLS,
      };

      console.log('Testing IMAP connection with config:', {
        host: testConfig.host,
        port: testConfig.port,
        username: testConfig.username,
        enableTLS: testConfig.enableTLS,
        password: '***hidden***'
      });

      // Try Python backend first (for VPS), then fall back to Supabase Edge Function
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const backendUrl = `${apiUrl}/email/test-imap`;
      
      let data, error;
      
      // First, try Python backend (for VPS deployment)
      try {
        console.log('Trying Python backend first:', backendUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for backend check
        
        try {
          const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: testConfig.host,
              port: testConfig.port,
              username: testConfig.username,
              password: testConfig.password,
              enableTLS: testConfig.enableTLS,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const responseData = await response.json();
            
            // Check if backend returned success: false (even with 200 status)
            if (responseData.success === false) {
              const errorMsg = responseData.message || responseData.error || 'SMTP connection test failed';
              throw new Error(errorMsg);
            }
            
            data = responseData;
            error = null;
            console.log('✅ Using Python backend (VPS)');
          } else {
            // Try to get error message from response
            let errorText = `Backend returned status ${response.status}`;
            try {
              const errorData = await response.json();
              errorText = errorData.message || errorData.detail || errorText;
            } catch {
              // Couldn't parse error response
            }
            throw new Error(errorText);
          }
        } catch (backendError: any) {
          clearTimeout(timeoutId);
          if (backendError.name === 'AbortError') {
            throw new Error('Backend timeout');
          }
          throw backendError;
        }
      } catch (backendError) {
        // Backend not available, use Supabase Edge Function instead
        console.log('⚠️ Python backend not available, using test-email-connection Edge Function');
        
        const edgeFunctionResult = await supabase.functions.invoke('test-email-connection', {
          body: {
            type: 'imap',
            ...testConfig,
          },
        });
        
        data = edgeFunctionResult.data;
        error = edgeFunctionResult.error;
      }

      if (error) {
        console.error('Email function error:', error);
        throw error;
      }

      console.log('Response data:', data);

      // Check if response indicates success
      if (data && data.success === true) {
        console.log('IMAP connection test successful!');
        toast({
          title: "Connection Successful",
          description: data.message || "IMAP connection test passed!",
        });
      } else {
        // Function returned success: false with error message
        const errorMsg = data?.message || data?.error || 'Connection test failed';
        console.error('IMAP connection test failed:', errorMsg);
        toast({
          title: "Connection Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('IMAP test error:', error);
      
      // Provide more specific error messages
      let errorMsg = "Failed to test IMAP connection. ";
      
      if (error.message) {
        errorMsg += error.message;
      } else {
        errorMsg += "Check browser console for details.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMsg,
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

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">
            <Settings className="w-4 h-4 mr-2" />
            Email Accounts
          </TabsTrigger>
          <TabsTrigger value="smtp">
            <Send className="w-4 h-4 mr-2" />
            SMTP - Email Sending
          </TabsTrigger>
          <TabsTrigger value="imap">
            <Inbox className="w-4 h-4 mr-2" />
            IMAP - Email Import
          </TabsTrigger>
        </TabsList>

        {/* Email Accounts Tab */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Saved Email Accounts</CardTitle>
              <CardDescription>View and manage your configured email accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : emailAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email accounts configured yet.</p>
                  <p className="text-sm">Configure SMTP or IMAP settings in the tabs above to add an account.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>SMTP</TableHead>
                      <TableHead>IMAP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          {account.account_name}
                          {account.is_default && (
                            <Badge variant="secondary" className="ml-2">Default</Badge>
                          )}
                        </TableCell>
                        <TableCell>{account.email_address}</TableCell>
                        <TableCell>
                          {account.smtp_host ? (
                            <span className="text-sm">{account.smtp_host}:{account.smtp_port}</span>
                          ) : (
                            <span className="text-muted-foreground">Not configured</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {account.imap_host ? (
                            <span className="text-sm">{account.imap_host}:{account.imap_port}</span>
                          ) : (
                            <span className="text-muted-foreground">Not configured</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.is_active ? 'default' : 'secondary'}>
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {account.test_status && (
                            <Badge variant={account.test_status === 'success' ? 'default' : 'destructive'} className="ml-1">
                              {account.test_status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditDialog(account)} 
                              title="Edit account"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => testEmailAccount(account)}
                              disabled={testingAccountId === account.id}
                              title="Test SMTP connection"
                            >
                              {testingAccountId === account.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                            {!account.is_default && (
                              <Button variant="ghost" size="sm" onClick={() => setAsDefault(account.id)} title="Set as default">
                                <Star className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => deleteEmailAccount(account.id)} title="Delete account">
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
                    onCheckedChange={handleSmtpTlsChange}
                  />
                  <Label htmlFor="smtp-tls">Enable TLS/SSL (auto-sets port: {smtpConfig.enableTLS ? '465' : '587'})</Label>
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
                {testing === 'smtp' ? (
                  <Button
                    variant="destructive"
                    onClick={cancelTest}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Test
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={testSMTPConnection}
                    disabled={testing !== null}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                )}
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
                    onCheckedChange={handleImapTlsChange}
                  />
                  <Label htmlFor="imap-tls">Enable TLS/SSL (auto-sets port: {imapConfig.enableTLS ? '993' : '143'})</Label>
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

      {/* Edit Account Dialog */}
      {editingAccount && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Email Account</DialogTitle>
              <DialogDescription>Update email account configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={editingAccount.account_name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, account_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    value={editingAccount.email_address}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email_address: e.target.value })}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">SMTP Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                      value={editingAccount.smtp_host || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, smtp_host: e.target.value })}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input
                      type="number"
                      value={editingAccount.smtp_port || 587}
                      onChange={(e) => setEditingAccount({ ...editingAccount, smtp_port: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input
                      value={editingAccount.smtp_username || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, smtp_username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input
                      type="password"
                      value={editingAccount.smtp_password || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, smtp_password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">IMAP Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IMAP Host</Label>
                    <Input
                      value={editingAccount.imap_host || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, imap_host: e.target.value })}
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IMAP Port</Label>
                    <Input
                      type="number"
                      value={editingAccount.imap_port || 993}
                      onChange={(e) => setEditingAccount({ ...editingAccount, imap_port: parseInt(e.target.value) || 993 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IMAP Username</Label>
                    <Input
                      value={editingAccount.imap_username || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, imap_username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IMAP Password</Label>
                    <Input
                      type="password"
                      value={editingAccount.imap_password || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, imap_password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingAccount.enable_tls ?? true}
                    onCheckedChange={(checked) => setEditingAccount({ ...editingAccount, enable_tls: checked })}
                  />
                  <Label>Enable TLS</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingAccount.is_active ?? true}
                    onCheckedChange={(checked) => setEditingAccount({ ...editingAccount, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveEditedAccount} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
