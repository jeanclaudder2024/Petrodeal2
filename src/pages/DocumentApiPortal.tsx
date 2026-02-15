import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Server } from 'lucide-react';
import DocPublishingSettings from '@/components/admin/document-publishing/DocPublishingSettings';
import { getDocumentApiUrl } from '@/config/documentApi';

export default function DocumentApiPortal() {
  const apiUrl = getDocumentApiUrl();
  const portalUrl = apiUrl.replace(/\/$/, '') + '/portal';

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document API Portal</h1>
        <p className="text-muted-foreground mt-1">
          Connect this app to the Python Document Processor API. Set the <strong>API base URL</strong> to <code className="text-xs bg-muted px-1 rounded">https://petrodealhub.com/api</code> (not the /portal page).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Backend portal
          </CardTitle>
          <CardDescription>
            Open the API&apos;s own portal page to see its status (health, Supabase, OpenAI) and connection instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href={portalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open API portal
            </a>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Opens: <code className="bg-muted px-1 rounded">{portalUrl}</code>
          </p>
        </CardContent>
      </Card>

      <DocPublishingSettings />
    </div>
  );
}
