import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Wand2, FileText, Library } from 'lucide-react';
import DataExplorer from './database-doc/DataExplorer';
import DocIdeaGenerator from './database-doc/DocIdeaGenerator';
import GeneratedDocsList from './database-doc/GeneratedDocsList';
import TemplateLibrary from './database-doc/TemplateLibrary';

const DatabaseDocManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Database Doc</h2>
        <p className="text-muted-foreground">
          Explore entity data, generate legal document templates with AI, and manage your document library
        </p>
      </div>

      <Tabs defaultValue="explorer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explorer" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Explorer
          </TabsTrigger>
          <TabsTrigger value="doc-idea" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Doc Idea
          </TabsTrigger>
          <TabsTrigger value="generated" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generated Docs
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="mt-6">
          <DataExplorer />
        </TabsContent>

        <TabsContent value="doc-idea" className="mt-6">
          <DocIdeaGenerator />
        </TabsContent>

        <TabsContent value="generated" className="mt-6">
          <GeneratedDocsList />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplateLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseDocManagement;
