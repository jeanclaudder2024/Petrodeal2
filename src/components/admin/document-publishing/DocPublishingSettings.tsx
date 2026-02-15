import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Settings,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { getDocumentApiUrl, setDocumentApiUrl, resetDocumentApiUrl, checkApiHealth } from '@/config/documentApi';

export default function DocPublishingSettings() {
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const [currentUrl, setCurrentUrl] = useState(getDocumentApiUrl());
  const [inputUrl, setInputUrl] = useState(getDocumentApiUrl());
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const testConnection = async (url?: string) => {
    const testUrl = url || inputUrl;
    setTesting(true);
    setConnectionStatus(null);
    try {
      const healthy = await checkApiHealth(testUrl);
      setConnectionStatus(healthy);
      if (healthy) {
        toast.success('Connection successful');
      } else {
        toast.error('Connection failed — endpoint not reachable');
      }
    } catch {
      setConnectionStatus(false);
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      setDocumentApiUrl(inputUrl);
      setCurrentUrl(inputUrl);
      toast.success('API endpoint saved. Reload the page for changes to take full effect.');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetDocumentApiUrl();
    const defaultUrl = getDocumentApiUrl();
    setInputUrl(defaultUrl);
    setCurrentUrl(defaultUrl);
    setConnectionStatus(null);
    toast.success('Reset to default endpoint');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          API Endpoint Settings
        </CardTitle>
        <CardDescription>
          Configure the FastAPI document processing backend URL. Changes persist in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* On production: use same domain, not localhost */}
        {isProduction && (
          <Alert className="border-primary/50 bg-primary/5">
            <Globe className="h-4 w-4" />
            <AlertTitle>You are on the live site</AlertTitle>
            <AlertDescription>
              Use <strong>same domain</strong> so the app calls this site&apos;s API. Do not use localhost here.
              Click <strong>&quot;Use site API (/api)&quot;</strong> below, then Test and Save.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Connection */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Current Active Endpoint</Label>
          </div>
          <code className="text-xs text-muted-foreground break-all">{currentUrl}</code>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="api-url">API Endpoint URL</Label>
          <div className="flex gap-2">
            <Input
              id="api-url"
              placeholder={isProduction ? '/api or https://petrodealhub.com/api' : 'http://localhost:5000'}
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setConnectionStatus(null);
              }}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => testConnection()}
              disabled={testing || !inputUrl.trim()}
            >
              {testing ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Wifi className="h-4 w-4 mr-1.5" />}
              Test
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus !== null && (
          <Alert variant={connectionStatus ? 'default' : 'destructive'} className={connectionStatus ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : ''}>
            {connectionStatus ? <CheckCircle className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4" />}
            <AlertTitle>{connectionStatus ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
            <AlertDescription className="text-xs">
              {connectionStatus
                ? 'The endpoint is reachable and responding correctly.'
                : isProduction && (inputUrl.startsWith('http://localhost') || inputUrl.startsWith('http://127.0.0.1'))
                  ? 'localhost does not work from the live site. Use "Use site API (/api)" above, then Test.'
                  : isProduction && (inputUrl === '/api' || inputUrl.startsWith('/api'))
                    ? 'The document API on this server is not responding. On the VPS, check: (1) Python API is running: pm2 status python-api. (2) Test locally: curl http://localhost:8000/health. (3) Nginx must proxy /api/ to localhost:8000. See UPLOAD_UPDATE_TO_VPS.md for restart steps.'
                    : 'Could not reach the endpoint. Check the URL and ensure CORS is configured.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {isProduction && (
            <Button
              variant="default"
              onClick={() => {
                setInputUrl('/api');
                setDocumentApiUrl('/api');
                setCurrentUrl('/api');
                toast.success('Set to /api (same domain). Click Test to verify.');
              }}
            >
              <Wifi className="h-4 w-4 mr-1.5" />
              Use site API (/api)
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !inputUrl.trim()}>
            <Shield className="h-4 w-4 mr-1.5" />
            Save Endpoint
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
        </div>

        {/* Migration Guide */}
        <div className="p-4 rounded-lg bg-muted/30 border text-sm space-y-2">
          <p className="font-medium">Migration Guide for Replit:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li>Update CORS to allow your new domain origin</li>
            <li>Ensure all endpoints remain at the same paths (/health, /templates, /generate-document, etc.)</li>
            <li>Update the Supabase URL/key environment variables if using a different project</li>
            <li>Install the same fonts on the new server for accurate PDF conversion</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
