import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Settings2, CreditCard, Database, FolderOpen } from 'lucide-react';

import { CMSTemplateList } from './CMSTemplateList';
import { CMSTemplateEditor } from './CMSTemplateEditor';
import { PlaceholderManager } from './PlaceholderManager';
import { PlanAssignment } from './PlanAssignment';
import { DatabaseExplorer } from './DatabaseExplorer';
import { TemplateUpload } from './TemplateUpload';

import { useTemplates, usePlaceholders, usePlanPermissions } from './hooks/useTemplates';
import type { DocumentTemplate } from './types';

export default function CMSTemplateManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  const {
    templates,
    loading: templatesLoading,
    fetchTemplates,
    updateTemplate,
    deleteTemplate,
    toggleActive
  } = useTemplates();

  const {
    placeholders,
    loading: placeholdersLoading,
    savePlaceholder,
    deletePlaceholder
  } = usePlaceholders(selectedTemplate?.id || null);

  const {
    permissions,
    plans,
    loading: permissionsLoading,
    togglePlanAccess,
    setDownloadLimit
  } = usePlanPermissions(selectedTemplate?.id || null);

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowUpload(false);
  };

  const handleCloseEditor = () => {
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = async (updates: Partial<DocumentTemplate>) => {
    if (!selectedTemplate) return false;
    const success = await updateTemplate(selectedTemplate.id, updates);
    if (success) {
      const updated = templates.find(t => t.id === selectedTemplate.id);
      if (updated) {
        setSelectedTemplate({ ...selectedTemplate, ...updates });
      }
    }
    return success;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Template List */}
        <div className="lg:col-span-4 xl:col-span-3">
          {showUpload ? (
            <TemplateUpload
              onClose={() => setShowUpload(false)}
              onSuccess={() => {
                setShowUpload(false);
                fetchTemplates();
              }}
            />
          ) : (
            <CMSTemplateList
              templates={templates}
              loading={templatesLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelectTemplate={handleSelectTemplate}
              onDeleteTemplate={deleteTemplate}
              onToggleActive={toggleActive}
              onRefresh={fetchTemplates}
              onUpload={() => setShowUpload(true)}
              selectedTemplateId={selectedTemplate?.id}
            />
          )}
        </div>

        {/* Right Column - Template Configuration */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedTemplate ? (
            <Card className="border-0 shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b bg-muted/30 px-4 pt-3">
                  <TabsList className="h-10 bg-transparent p-0 gap-1">
                    <TabsTrigger 
                      value="settings" 
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger 
                      value="placeholders" 
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Placeholders
                    </TabsTrigger>
                    <TabsTrigger 
                      value="plans" 
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Plans
                    </TabsTrigger>
                    <TabsTrigger 
                      value="database" 
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-4"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Database
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-6">
                  <TabsContent value="settings" className="mt-0">
                    <CMSTemplateEditor
                      template={selectedTemplate}
                      onSave={handleSaveTemplate}
                      onClose={handleCloseEditor}
                    />
                  </TabsContent>

                  <TabsContent value="placeholders" className="mt-0">
                    <PlaceholderManager
                      templateId={selectedTemplate.id}
                      templatePlaceholders={selectedTemplate.placeholders || []}
                      savedPlaceholders={placeholders}
                      loading={placeholdersLoading}
                      onSave={savePlaceholder}
                      onDelete={deletePlaceholder}
                    />
                  </TabsContent>

                  <TabsContent value="plans" className="mt-0">
                    <PlanAssignment
                      templateId={selectedTemplate.id}
                      permissions={permissions}
                      plans={plans}
                      loading={permissionsLoading}
                      onToggleAccess={togglePlanAccess}
                      onSetLimit={setDownloadLimit}
                    />
                  </TabsContent>

                  <TabsContent value="database" className="mt-0">
                    <DatabaseExplorer />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          ) : (
            <Card className="border-dashed border-2 bg-muted/10">
              <CardContent className="flex flex-col items-center justify-center h-[500px]">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-1">
                  No template selected
                </h3>
                <p className="text-sm text-muted-foreground/70">
                  Select a template from the list to view and edit its settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
