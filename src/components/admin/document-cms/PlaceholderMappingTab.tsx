import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings2, Database, FileSpreadsheet, Shuffle, Type,
  Loader2, Save, ChevronRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTemplates, usePlaceholderSettings, useDatabaseSchema, useDataSources } from './hooks/useDocumentAPI';
import { Template, PlaceholderSetting, DatabaseColumn } from './types';

const SOURCE_OPTIONS = [
  { value: 'database', label: 'Database', icon: Database, description: 'Map to Supabase table field' },
  { value: 'csv', label: 'CSV File', icon: FileSpreadsheet, description: 'Map to uploaded CSV data' },
  { value: 'random', label: 'Random/AI', icon: Shuffle, description: 'Auto-generate or AI-fill' },
  { value: 'custom', label: 'Custom Value', icon: Type, description: 'Enter static text' },
];

const RANDOM_OPTIONS = [
  { value: 'auto', label: 'Auto-generate' },
  { value: 'fixed', label: 'Fixed value' },
  { value: 'ai-generated', label: 'AI-generated' },
];

export default function PlaceholderMappingTab() {
  const { templates, loading: templatesLoading, fetchTemplates } = useTemplates();
  const { settings, loading: settingsLoading, fetchSettings, saveSettings } = usePlaceholderSettings();
  const { tables, fetchTables, fetchColumns } = useDatabaseSchema();
  const { csvFiles, fetchCsvFiles, getCsvFields } = useDataSources();
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [placeholderSettings, setPlaceholderSettings] = useState<Record<string, PlaceholderSetting>>({});
  const [tableColumns, setTableColumns] = useState<Record<string, DatabaseColumn[]>>({});
  const [csvFieldsCache, setCsvFieldsCache] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchTables();
    fetchCsvFiles();
  }, [fetchTemplates, fetchTables, fetchCsvFiles]);

  useEffect(() => {
    if (selectedTemplate) {
      const templateSettings = settings[selectedTemplate.name];
      if (templateSettings) {
        // Ensure all values are properly formatted (strings, not objects)
        const normalizedSettings: Record<string, PlaceholderSetting> = {};
        Object.entries(templateSettings.settings || {}).forEach(([key, setting]) => {
          const s = setting as Record<string, unknown>;
          normalizedSettings[key] = {
            source: (s.source as PlaceholderSetting['source']) || 'database',
            value: typeof s.customValue === 'string' ? s.customValue : String(s.value ?? s.customValue ?? ''),
            table: typeof s.databaseTable === 'string' ? s.databaseTable : String(s.table ?? s.databaseTable ?? ''),
            field: typeof s.databaseField === 'string' ? s.databaseField : String(s.field ?? s.databaseField ?? ''),
            csv_id: typeof s.csvId === 'string' ? s.csvId : String(s.csv_id ?? s.csvId ?? ''),
            csv_field: typeof s.csvField === 'string' ? s.csvField : String(s.csv_field ?? s.csvField ?? ''),
            csv_row: typeof s.csvRow === 'number' ? s.csvRow : (s.csv_row ?? s.csvRow ? Number(s.csv_row ?? s.csvRow) : undefined),
            random_option: (s.randomOption as PlaceholderSetting['random_option']) || (s.random_option as PlaceholderSetting['random_option']) || 'auto',
          };
        });
        setPlaceholderSettings(normalizedSettings);
      } else {
        // Initialize empty settings for each placeholder — default source: database
        const initialSettings: Record<string, PlaceholderSetting> = {};
        selectedTemplate.placeholders?.forEach(ph => {
          initialSettings[ph] = { source: 'database', value: '' };
        });
        setPlaceholderSettings(initialSettings);
      }
      setHasChanges(false);
    }
  }, [selectedTemplate, settings]);

  const handleSelectTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    await fetchSettings(template.name);
  };

  const handleLoadColumns = async (tableName: string) => {
    if (tableColumns[tableName]) return;
    const columns = await fetchColumns(tableName);
    setTableColumns(prev => ({ ...prev, [tableName]: columns }));
  };

  const handleLoadCsvFields = async (csvId: string) => {
    if (csvFieldsCache[csvId]) return;
    try {
      const result = await getCsvFields(csvId);
      setCsvFieldsCache(prev => ({ ...prev, [csvId]: result.fields }));
    } catch (error) {
      console.error('Failed to load CSV fields:', error);
    }
  };

  const updatePlaceholder = (placeholder: string, updates: Partial<PlaceholderSetting>) => {
    setPlaceholderSettings(prev => ({
      ...prev,
      [placeholder]: { ...prev[placeholder], ...updates }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    
    setSaving(true);
    try {
      await saveSettings({
        template_name: selectedTemplate.name,
        template_id: String(selectedTemplate.id ?? selectedTemplate.template_id ?? ''),
        settings: placeholderSettings,
      });
      toast.success('Placeholder settings saved');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getSourceIcon = (source: string) => {
    const option = SOURCE_OPTIONS.find(o => o.value === source);
    return option ? <option.icon className="h-4 w-4" /> : null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Template Selector */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Template</CardTitle>
          <CardDescription>Choose a template to configure placeholders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4 pt-0 space-y-1">
              {templatesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No templates available
                </p>
              ) : (
                templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {template.display_name || template.name}
                      </span>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                        selectedTemplate?.id === template.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.placeholders?.length || 0} placeholders
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Placeholder Editor */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Placeholder Configuration
              </CardTitle>
              {selectedTemplate && (
                <CardDescription className="mt-1">
                  Configuring: {selectedTemplate.display_name || selectedTemplate.name}
                </CardDescription>
              )}
            </div>
            {selectedTemplate && hasChanges && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Save Changes</>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedTemplate ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select a template to configure its placeholders</p>
            </div>
          ) : settingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedTemplate.placeholders?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No placeholders found in this template</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-4">
                {selectedTemplate.placeholders.map(placeholder => {
                  const setting = placeholderSettings[placeholder] || { source: 'database' };
                  
                  return (
                    <Card key={placeholder} className="border-dashed">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Badge variant="outline" className="font-mono text-xs shrink-0 mt-1">
                            {placeholder}
                          </Badge>
                          
                          <div className="flex-1 space-y-3">
                            {/* Source Selector */}
                            <div className="grid grid-cols-4 gap-2">
                              {SOURCE_OPTIONS.map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => updatePlaceholder(placeholder, { source: option.value as PlaceholderSetting['source'] })}
                                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                                    setting.source === option.value
                                      ? 'border-primary bg-primary/5 text-primary'
                                      : 'border-border hover:bg-muted/50'
                                  }`}
                                >
                                  <option.icon className="h-4 w-4" />
                                  {option.label}
                                </button>
                              ))}
                            </div>

                            {/* Source-specific options */}
                            {setting.source === 'database' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Table</Label>
                                  <Select
                                    value={String(setting.table || '')}
                                    onValueChange={(v) => {
                                      updatePlaceholder(placeholder, { table: v, field: '' });
                                      handleLoadColumns(v);
                                    }}
                                  >
                                    <SelectTrigger className="mt-1 h-8 text-xs">
                                      <SelectValue placeholder="Select table" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tables.map((t, idx) => (
                                        <SelectItem key={t.name || `table-${idx}`} value={t.name || ''}>
                                          {t.name || 'Unknown'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Field</Label>
                                  <Select
                                    value={String(setting.field || '')}
                                    onValueChange={(v) => updatePlaceholder(placeholder, { field: v })}
                                    disabled={!setting.table}
                                  >
                                    <SelectTrigger className="mt-1 h-8 text-xs">
                                      <SelectValue placeholder="Select field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(tableColumns[setting.table || ''] || []).map((col, idx) => (
                                        <SelectItem key={col.name || `col-${idx}`} value={col.name || ''}>
                                          {col.name || 'Unknown'} <span className="text-muted-foreground">({col.type || 'unknown'})</span>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {setting.source === 'csv' && (
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">CSV File</Label>
                                  <Select
                                    value={String(setting.csv_id || '')}
                                    onValueChange={(v) => {
                                      updatePlaceholder(placeholder, { csv_id: v, csv_field: '' });
                                      handleLoadCsvFields(v);
                                    }}
                                  >
                                    <SelectTrigger className="mt-1 h-8 text-xs">
                                      <SelectValue placeholder="Select file" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {csvFiles.map((csv, idx) => (
                                        <SelectItem key={csv.id || `csv-${idx}`} value={csv.id || ''}>
                                          {csv.name || csv.display_name || csv.id || 'Unknown'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Field</Label>
                                  <Select
                                    value={String(setting.csv_field || '')}
                                    onValueChange={(v) => updatePlaceholder(placeholder, { csv_field: v })}
                                    disabled={!setting.csv_id}
                                  >
                                    <SelectTrigger className="mt-1 h-8 text-xs">
                                      <SelectValue placeholder="Select field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(csvFieldsCache[setting.csv_id || ''] || []).map((field, idx) => (
                                        <SelectItem key={field || `field-${idx}`} value={field || ''}>
                                          {field || 'Unknown'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-xs">Row Index</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={setting.csv_row ?? 0}
                                    onChange={(e) => updatePlaceholder(placeholder, { csv_row: parseInt(e.target.value) || 0 })}
                                    className="mt-1 h-8 text-xs"
                                  />
                                </div>
                              </div>
                            )}

                            {setting.source === 'random' && (
                              <div>
                                <Label className="text-xs">Generation Method</Label>
                                <Select
                                  value={String(setting.random_option || 'auto')}
                                  onValueChange={(v) => updatePlaceholder(placeholder, { random_option: v as PlaceholderSetting['random_option'] })}
                                >
                                  <SelectTrigger className="mt-1 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RANDOM_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {setting.source === 'custom' && (
                              <div>
                                <Label className="text-xs">Custom Value</Label>
                                <Input
                                  value={setting.value || ''}
                                  onChange={(e) => updatePlaceholder(placeholder, { value: e.target.value })}
                                  placeholder="Enter static value"
                                  className="mt-1 h-8 text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
