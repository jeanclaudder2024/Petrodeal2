import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Settings2, FileSpreadsheet, CreditCard, 
  LayoutDashboard, Play, Database
} from 'lucide-react';

import TemplatesTab from './TemplatesTab';
import PlaceholderMappingTab from './PlaceholderMappingTab';
import DataSourcesTab from './DataSourcesTab';
import PlansManagementTab from './PlansManagementTab';
import EnhancedPlaceholderMapping from './EnhancedPlaceholderMapping';
import TemplatePlanAccess from './TemplatePlanAccess';
import TestGenerationDialog from './TestGenerationDialog';
import { Template } from './types';
import { useTemplates } from './hooks/useDocumentAPI';

export default function DocumentProcessingCMS() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplateForPlaceholders, setSelectedTemplateForPlaceholders] = useState<Template | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplateForTest, setSelectedTemplateForTest] = useState<Template | null>(null);
  
  const { templates, loading, fetchTemplates } = useTemplates();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEditPlaceholders = (template: Template) => {
    setSelectedTemplateForPlaceholders(template);
    setSelectedTemplateId(template.id);
    setActiveTab('enhanced-placeholders');
  };

  const handleTestTemplate = (template: Template) => {
    setSelectedTemplateForTest(template);
    setTestDialogOpen(true);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Document Processing CMS</CardTitle>
            <CardDescription>
              Manage document templates, placeholders, data sources, and subscription access
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="placeholders" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Placeholders</span>
            </TabsTrigger>
            <TabsTrigger value="enhanced-placeholders" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Mapping</span>
            </TabsTrigger>
            <TabsTrigger value="datasources" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Data Sources</span>
            </TabsTrigger>
            <TabsTrigger value="plan-access" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Plan Access</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <TemplatesTab 
              onEditPlaceholders={handleEditPlaceholders}
              onTestTemplate={handleTestTemplate}
            />
          </TabsContent>

          <TabsContent value="placeholders" className="mt-6">
            <PlaceholderMappingTab />
          </TabsContent>

          <TabsContent value="enhanced-placeholders" className="mt-6">
            <EnhancedPlaceholderMapping 
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={setSelectedTemplateId}
            />
          </TabsContent>

          <TabsContent value="datasources" className="mt-6">
            <DataSourcesTab />
          </TabsContent>

          <TabsContent value="plan-access" className="mt-6">
            <TemplatePlanAccess templates={templates} />
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <PlansManagementTab />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Test Generation Dialog */}
      <TestGenerationDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        template={selectedTemplateForTest}
      />
    </Card>
  );
}
