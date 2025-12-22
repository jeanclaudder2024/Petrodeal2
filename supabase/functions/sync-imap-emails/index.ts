import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  account_id?: string;
  // Webhook payload fields
  from?: string;
  fromName?: string;
  to?: string;
  subject?: string;
  text?: string;
  body?: string;
  html?: string;
}

// Simple IMAP connection using raw TCP
async function connectIMAP(host: string, port: number, secure: boolean, username: string, password: string): Promise<{ success: boolean; emails: any[]; error?: string }> {
  const emails: any[] = [];
  
  try {
    console.log(`[IMAP] Connecting to ${host}:${port} (secure: ${secure})`);
    
    // For secure connections (port 993), use TLS
    const conn = secure 
      ? await Deno.connectTls({ hostname: host, port })
      : await Deno.connect({ hostname: host, port });
    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);
    
    // Helper to read response
    const readResponse = async (): Promise<string> => {
      const n = await conn.read(buffer);
      if (n === null) return '';
      return decoder.decode(buffer.subarray(0, n));
    };
    
    // Helper to send command
    const sendCommand = async (tag: string, command: string): Promise<string> => {
      const fullCommand = `${tag} ${command}\r\n`;
      await conn.write(encoder.encode(fullCommand));
      
      let response = '';
      let attempts = 0;
      while (attempts < 10) {
        const chunk = await readResponse();
        response += chunk;
        if (chunk.includes(`${tag} OK`) || chunk.includes(`${tag} NO`) || chunk.includes(`${tag} BAD`)) {
          break;
        }
        attempts++;
      }
      return response;
    };
    
    // Read greeting
    const greeting = await readResponse();
    console.log('[IMAP] Server greeting:', greeting.substring(0, 100));
    
    if (!greeting.includes('OK')) {
      conn.close();
      return { success: false, emails: [], error: 'Server did not send OK greeting' };
    }
    
    // Login
    const loginResponse = await sendCommand('A001', `LOGIN "${username}" "${password}"`);
    console.log('[IMAP] Login response:', loginResponse.substring(0, 100));
    
    if (!loginResponse.includes('A001 OK')) {
      conn.close();
      return { success: false, emails: [], error: 'Login failed - check username/password' };
    }
    
    // Select INBOX
    const selectResponse = await sendCommand('A002', 'SELECT INBOX');
    console.log('[IMAP] Select response:', selectResponse.substring(0, 200));
    
    // Extract message count
    const existsMatch = selectResponse.match(/\* (\d+) EXISTS/);
    const messageCount = existsMatch ? parseInt(existsMatch[1]) : 0;
    console.log(`[IMAP] Found ${messageCount} messages in INBOX`);
    
    if (messageCount > 0) {
      // Fetch last 20 messages (headers only for speed)
      const start = Math.max(1, messageCount - 19);
      const fetchResponse = await sendCommand('A003', `FETCH ${start}:${messageCount} (ENVELOPE)`);
      
      // Parse envelope data (simplified)
      const envelopeMatches = fetchResponse.matchAll(/ENVELOPE \(([^)]+(?:\([^)]*\))*[^)]*)\)/g);
      
      for (const match of envelopeMatches) {
        try {
          const envelope = match[1];
          // Extract basic info
          const subjectMatch = envelope.match(/"([^"]*)" (?:NIL|\()/);
          const fromMatch = envelope.match(/\(\("([^"]*)" NIL "([^"]*)" "([^"]*)"\)\)/);
          
          if (fromMatch) {
            emails.push({
              from_name: fromMatch[1] || fromMatch[2],
              from_email: `${fromMatch[2]}@${fromMatch[3]}`,
              subject: subjectMatch?.[1] || '(No Subject)',
              received_at: new Date().toISOString()
            });
          }
        } catch (e) {
          // Skip malformed entries
        }
      }
    }
    
    // Logout
    await sendCommand('A004', 'LOGOUT');
    conn.close();
    
    return { success: true, emails };
    
  } catch (error: any) {
    console.error('[IMAP] Connection error:', error);
    return { success: false, emails: [], error: error.message };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('[SYNC-IMAP] Starting email sync...');

    if (req.method === "POST") {
      const body: SyncRequest = await req.json().catch(() => ({}));
      
      // Handle webhook from email forwarding service
      if (body.from && body.subject) {
        console.log('[SYNC-IMAP] Received email via webhook');
        
        const { error: insertError } = await supabaseClient
          .from('incoming_emails')
          .insert({
            from_email: body.from,
            from_name: body.fromName || body.from.split('@')[0],
            to_email: body.to || 'inbox@petrodealhub.com',
            subject: body.subject,
            body_text: body.text || body.body || '',
            body_html: body.html,
            received_at: new Date().toISOString(),
            is_read: false,
            is_replied: false,
          });
        
        if (insertError) {
          return new Response(
            JSON.stringify({ success: false, error: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: "Email received and stored", count: 1 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle manual IMAP sync request with account_id
      if (body.account_id) {
        console.log('[SYNC-IMAP] Manual sync requested for account:', body.account_id);

        const { data: account, error: accountError } = await supabaseClient
          .from('email_accounts')
          .select('*')
          .eq('id', body.account_id)
          .single();

        if (accountError || !account) {
          return new Response(
            JSON.stringify({ success: false, error: 'Email account not found' }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!account.imap_host || !account.imap_username || !account.imap_password) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'IMAP not configured for this account',
              hint: 'Please configure IMAP settings (host, username, password) in Email Configuration'
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Try IMAP connection
        const imapResult = await connectIMAP(
          account.imap_host,
          account.imap_port || 993,
          account.enable_tls !== false,
          account.imap_username,
          account.imap_password
        );

        if (!imapResult.success) {
          await supabaseClient
            .from('email_accounts')
            .update({ 
              last_tested_at: new Date().toISOString(),
              test_status: `error: ${imapResult.error}`
            })
            .eq('id', body.account_id);

          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `IMAP sync failed: ${imapResult.error}`,
              hint: 'Check your IMAP credentials and server settings'
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert new emails
        let syncedCount = 0;
        for (const email of imapResult.emails) {
          const { data: existing } = await supabaseClient
            .from('incoming_emails')
            .select('id')
            .eq('from_email', email.from_email)
            .eq('subject', email.subject)
            .maybeSingle();

          if (!existing) {
            await supabaseClient
              .from('incoming_emails')
              .insert({
                from_email: email.from_email,
                from_name: email.from_name,
                to_email: account.email_address,
                subject: email.subject,
                body_text: email.body_text || '',
                received_at: email.received_at,
                is_read: false,
                is_replied: false,
              });
            syncedCount++;
          }
        }

        await supabaseClient
          .from('email_accounts')
          .update({ 
            last_tested_at: new Date().toISOString(),
            test_status: 'success'
          })
          .eq('id', body.account_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Synced ${syncedCount} new emails from ${account.email_address}`,
            count: syncedCount,
            account: account.account_name
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // GET request - return info
    const { count } = await supabaseClient
      .from('incoming_emails')
      .select('*', { count: 'exact', head: true });

    const { data: accounts } = await supabaseClient
      .from('email_accounts')
      .select('id, account_name, email_address, is_active, imap_host, last_tested_at, test_status')
      .eq('is_active', true);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Select an email account to sync emails via IMAP",
        email_count: count || 0,
        configured_accounts: accounts || [],
        note: "IMAP sync available. Select an account with IMAP configured."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[SYNC-IMAP] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, count: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
