import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailTestRequest {
  type: 'smtp' | 'imap';
  host: string;
  port: number;
  username: string;
  password: string;
  enableTLS: boolean;
}

// Helper to read from connection with timeout
async function readFromConnection(conn: Deno.TcpConn | Deno.TlsConn, timeout = 10000): Promise<string> {
  const buffer = new Uint8Array(4096);
  const deadline = Date.now() + timeout;
  
  while (Date.now() < deadline) {
    try {
      const bytesRead = await conn.read(buffer);
      if (bytesRead && bytesRead > 0) {
        return new TextDecoder().decode(buffer.slice(0, bytesRead));
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('Connection timeout - no response from server within 10 seconds');
}

// Helper to write to connection
function writeToConnection(conn: Deno.TcpConn | Deno.TlsConn, data: string): Promise<number> {
  return conn.write(new TextEncoder().encode(data));
}

// Simple SMTP connection test with overall timeout
async function testSMTP(config: Omit<EmailTestRequest, 'type'>): Promise<{ success: boolean; message: string }> {
  let conn: Deno.TcpConn | null = null;
  
  // Create an abort controller for overall timeout (10 seconds)
  const overallTimeout = setTimeout(() => {
    if (conn) {
      try { conn.close(); } catch {}
    }
  }, 10000);
  
  try {
    // Connect to SMTP server with timeout
    const connectPromise = Deno.connect({
      hostname: config.host,
      port: config.port,
    });
    
    // Race between connect and timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Connection timeout: Unable to connect to ${config.host}:${config.port} within 10 seconds`)), 10000)
    );
    
    conn = await Promise.race([connectPromise, timeoutPromise]);

    // Read welcome message (should start with 220)
    const welcome = await readFromConnection(conn);
    if (!welcome || !welcome.trim()) {
      conn.close();
      return { success: false, message: "No response from SMTP server" };
    }

    // Send EHLO
    await writeToConnection(conn, `EHLO ${config.host}\r\n`);
    const ehloResponse = await readFromConnection(conn);

    // If TLS is enabled, test STARTTLS
    if (config.enableTLS) {
      await writeToConnection(conn, `STARTTLS\r\n`);
      const tlsResponse = await readFromConnection(conn);
      
      if (tlsResponse.includes('220') || tlsResponse.includes('Ready')) {
        conn.close();
        return { success: true, message: "SMTP connection successful - TLS upgrade supported" };
      }
      
      conn.close();
      return { success: false, message: "SMTP STARTTLS failed or not supported" };
    }

    // Test authentication (AUTH LOGIN)
    await writeToConnection(conn, `AUTH LOGIN\r\n`);
    await readFromConnection(conn);

    // Send username (base64)
    const usernameB64 = btoa(config.username);
    await writeToConnection(conn, `${usernameB64}\r\n`);
    await readFromConnection(conn);

    // Send password (base64)
    const passwordB64 = btoa(config.password);
    await writeToConnection(conn, `${passwordB64}\r\n`);
    const authResponse = await readFromConnection(conn);
    
    conn.close();

    clearTimeout(overallTimeout);
    
    // Check if authentication was successful (235 = Authentication successful)
    if (authResponse.includes('235') || authResponse.toLowerCase().includes('authentication successful')) {
      return { success: true, message: "SMTP authentication successful" };
    }

    return { 
      success: false, 
      message: `SMTP authentication failed: ${authResponse.substring(0, 200)}` 
    };
  } catch (error: any) {
    clearTimeout(overallTimeout);
    if (conn) {
      try { conn.close(); } catch {}
    }
    
    const errorMessage = error.message || 'Unable to connect to server';
    
    // Provide detailed error messages
    if (errorMessage.includes('timeout')) {
      return { 
        success: false, 
        message: `Connection timeout: Server ${config.host}:${config.port} did not respond within 10 seconds. Check if the server address and port are correct.`
      };
    }
    
    if (errorMessage.includes('No such host') || errorMessage.includes('dns') || errorMessage.includes('getaddrinfo')) {
      return { 
        success: false, 
        message: `DNS error: Cannot resolve hostname "${config.host}". Please check the server address.`
      };
    }
    
    if (errorMessage.includes('Connection refused')) {
      return { 
        success: false, 
        message: `Connection refused: Server ${config.host}:${config.port} is not accepting connections. Check if the port is correct.`
      };
    }
    
    return { 
      success: false, 
      message: `SMTP connection error: ${errorMessage}` 
    };
  }
}

// Simple IMAP connection test
async function testIMAP(config: Omit<EmailTestRequest, 'type'>): Promise<{ success: boolean; message: string }> {
  let conn: Deno.TcpConn | Deno.TlsConn | null = null;
  
  try {
    // Connect to IMAP server
    if (config.enableTLS) {
      conn = await Deno.connectTls({
        hostname: config.host,
        port: config.port,
      });
    } else {
      conn = await Deno.connect({
        hostname: config.host,
        port: config.port,
      });
    }

    // Read welcome message (should start with * OK)
    const welcome = await readFromConnection(conn);
    if (!welcome || !welcome.trim()) {
      conn.close();
      return { success: false, message: "No response from IMAP server" };
    }

    // Send LOGIN command
    const loginCmd = `A1 LOGIN ${config.username} ${config.password}\r\n`;
    await writeToConnection(conn, loginCmd);
    
    // Read response
    const response = await readFromConnection(conn);
    conn.close();

    // Check if login was successful
    if (response.includes('A1 OK') || (response.includes('OK') && !response.includes('A1 NO'))) {
      return { success: true, message: "IMAP authentication successful" };
    } else if (response.includes('A1 NO') || response.includes('NO') || response.includes('BAD')) {
      return { 
        success: false, 
        message: `IMAP authentication failed: ${response.substring(0, 200)}` 
      };
    }

    return { success: false, message: "IMAP connection test incomplete or unexpected response" };
  } catch (error: any) {
    if (conn) conn.close();
    return { 
      success: false, 
      message: `IMAP connection error: ${error.message || 'Unable to connect to server'}` 
    };
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  try {
    const config: EmailTestRequest = await req.json();

    // Validate required fields
    if (!config.type || !config.host || !config.username || !config.password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required fields: type, host, username, password" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate type
    if (config.type !== 'smtp' && config.type !== 'imap') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Type must be 'smtp' or 'imap'" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Set default port if not provided
    if (!config.port) {
      config.port = config.type === 'smtp' ? 587 : 993;
    }

    // Set default TLS
    if (config.enableTLS === undefined) {
      config.enableTLS = true;
    }

    console.log(`Testing ${config.type.toUpperCase()} connection to ${config.host}:${config.port} (TLS: ${config.enableTLS})`);

    // Test the connection
    let result;
    if (config.type === 'smtp') {
      result = await testSMTP(config);
    } else {
      result = await testIMAP(config);
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Error testing email connection:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Failed to test email connection" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
