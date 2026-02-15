import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Trash2,
  AlertTriangle,
  Database,
  Crown,
  LayoutGrid,
  Bot,
  XCircle,
  Sparkles
} from 'lucide-react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { getDocumentApiUrl, checkApiHealth, documentApiFetch, checkAIStatus, AIStatus } from '@/config/documentApi';
import EnhancedTestDialog from './document-publishing/EnhancedTestDialog';
import DataSourcesTab from './document-publishing/DataSourcesTab';
import AdvancedPlaceholderMapping from './document-publishing/AdvancedPlaceholderMapping';
import EnhancedPlanAccess from './document-publishing/EnhancedPlanAccess';
import DocPublishingSettings from './document-publishing/DocPublishingSettings';

interface Template {
  id: string;
  name: string;
  file_name: string;
  description?: string;
  display_name?: string;
  placeholders: string[];
  placeholder_count?: number;
  file_size?: number;
  created_at: string;
  is_active: boolean;
  plan_ids?: string[];
}

export default function DocumentPublishing() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // AI Status state
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [isCheckingAI, setIsCheckingAI] = useState(false);

  // Check API connection
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const healthy = await checkApiHealth();
      setIsConnected(healthy);
      if (healthy) {
        fetchTemplates();
        // Also check AI status
        checkAIAvailability();
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check AI availability
  const checkAIAvailability = useCallback(async () => {
    setIsCheckingAI(true);
    try {
      const status = await checkAIStatus();
      setAiStatus(status);
    } catch {
      setAiStatus({ available: false, message: 'Failed to check AI status' });
    } finally {
      setIsCheckingAI(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await documentApiFetch<{ templates: Template[] }>('/templates');
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadName) {
      toast.error('Please select a file and enter a name');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName);
      formData.append('description', uploadDescription);

      const response = await fetch(`${getDocumentApiUrl()}/upload-template`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      toast.success(`Template uploaded! Detected ${result.placeholder_count || 0} placeholders`);
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDescription('');
      fetchTemplates();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Delete template
  const handleDelete = async (template: Template) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      await documentApiFetch(`/templates/${encodeURIComponent(template.file_name)}`, {
        method: 'DELETE',
      });
      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      <Alert variant={isConnected ? 'default' : 'destructive'} className={isConnected ? 'border-primary/50 bg-primary/5' : ''}>
        {isConnected === null ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isConnected ? (
          <Wifi className="h-4 w-4 text-primary" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertTitle className="flex items-center gap-2">
          {isConnected === null ? 'Checking connection...' : isConnected ? 'Connected to Document API' : 'API Disconnected'}
          {isConnected && <CheckCircle className="h-4 w-4 text-primary" />}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground break-all">{getDocumentApiUrl()}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkConnection} 
            disabled={isChecking}
            className="ml-2"
          >
            {isChecking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Retry
          </Button>
        </AlertDescription>
      </Alert>

      {/* Connection help when API is unreachable (e.g. Lovable deploy) */}
      {isConnected === false && (
        <Alert variant="default" className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle>Document API unreachable</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>
              This app is hosted on a different domain than your Python backend. Set the <strong>Document API URL</strong> to your backend&apos;s full URL (VPS or Replit).
            </p>
            <ul className="list-disc list-inside text-xs mt-2 space-y-1">
              <li>VPS: <code className="bg-muted px-1 rounded">https://yourdomain.com/api</code></li>
              <li>Replit: your Replit backend URL (e.g. <code className="bg-muted px-1 rounded">https://xxx.replit.dev</code>)</li>
            </ul>
            <p className="text-xs mt-2">
              Open the <strong>Settings</strong> tab on this page, set the Document API URL to your backend (e.g. <code className="bg-muted px-1 rounded">https://yourdomain.com/api</code>), then click <strong>Retry</strong> above. Your backend must allow CORS from this origin: <code className="bg-muted px-1 rounded break-all">{typeof window !== 'undefined' ? window.location.origin : ''}</code>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Generation Status Card */}
      {isConnected && (
        <Card className={aiStatus?.available 
          ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/50 to-background dark:from-emerald-900/10' 
          : 'border-destructive/30 bg-gradient-to-r from-destructive/5 to-background'
        }>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Status Indicator */}
                <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  aiStatus?.available 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                    : 'bg-destructive/10'
                }`}>
                  {isCheckingAI ? (
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : aiStatus?.available ? (
                    <>
                      <Sparkles className="h-6 w-6 text-emerald-600" />
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-pulse border-2 border-background" />
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-destructive" />
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full border-2 border-background" />
                    </>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">AI Document Generation</h3>
                    <Badge variant={aiStatus?.available ? 'default' : 'destructive'} className="text-[10px] h-5">
                      {isCheckingAI ? 'Checking...' : aiStatus?.available ? 'Operational' : 'Service Interrupted'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {isCheckingAI ? 'Verifying AI service availability...' : aiStatus?.message || 'Unknown status'}
                  </p>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-4 mt-2">
                    {aiStatus?.credits_remaining !== undefined && aiStatus?.credits_remaining !== null && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Credits: </span>
                        <span className={`font-semibold ${(aiStatus.credits_remaining || 0) < 10 ? 'text-amber-600' : 'text-foreground'}`}>
                          {aiStatus.credits_remaining}
                        </span>
                      </div>
                    )}
                    {aiStatus?.last_error && (
                      <div className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {aiStatus.last_error}
                      </div>
                    )}
                  </div>

                  {/* Guidance when AI is down */}
                  {!isCheckingAI && !aiStatus?.available && (
                    <div className="mt-3 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">What's affected:</p>
                      <p>• AI-powered placeholder replacement in documents will not work</p>
                      <p>• Database-mapped placeholders will still function normally</p>
                      <p className="font-medium text-foreground mt-2">What to do:</p>
                      <p>• Check your OpenAI API key and credit balance</p>
                      <p>• Verify your document API backend (VPS or Replit) is running and reachable</p>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkAIAvailability} 
                disabled={isCheckingAI}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isCheckingAI ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabbed Interface */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Mapping
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Plan Access
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Document Templates
                  </CardTitle>
                  <CardDescription>
                    Upload DOCX templates, manage placeholders, and generate documents
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={fetchTemplates} 
                    disabled={!isConnected || loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button disabled={!isConnected}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Document Template</DialogTitle>
                        <DialogDescription>
                          Upload a DOCX file with placeholders like {'{{vessel_name}}'} or {'{{buyer_company}}'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="file">DOCX File</Label>
                          <Input
                            id="file"
                            type="file"
                            accept=".docx"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Template Name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Sales Purchase Agreement"
                            value={uploadName}
                            onChange={(e) => setUploadName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Brief description of this template..."
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadName}>
                          {uploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Templates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : templates.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates uploaded yet</p>
                  <p className="text-sm mt-1">Upload a DOCX template to get started</p>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{template.display_name || template.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{template.file_name}</p>
                      </div>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.placeholders.slice(0, 4).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {template.placeholders.length > 4 && (
                        <Badge variant="secondary" className="text-xs">
                          +{template.placeholders.length - 4} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{template.placeholders.length} placeholders</span>
                      <span>{formatSize(template.file_size)}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setTestDialogOpen(true);
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Placeholder Mapping Tab */}
        <TabsContent value="mapping">
          <AdvancedPlaceholderMapping templates={templates} />
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="sources">
          <DataSourcesTab />
        </TabsContent>

        {/* Plan Access Tab */}
        <TabsContent value="plans">
          <EnhancedPlanAccess templates={templates} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <DocPublishingSettings />
        </TabsContent>
      </Tabs>

      {/* Enhanced Test Generation Dialog */}
      <EnhancedTestDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
