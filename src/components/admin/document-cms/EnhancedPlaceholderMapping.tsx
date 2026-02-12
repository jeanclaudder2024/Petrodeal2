import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, Sparkles, FileText, Save, RefreshCw, 
  CheckCircle, AlertTriangle, Search, Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { Template, PlaceholderSetting } from './types';
import { useSupabaseData, AVAILABLE_TABLES, detectTableFromPlaceholder } from './hooks/useSupabaseData';
import { documentApiFetch } from '@/config/documentApi';

interface EnhancedPlaceholderMappingProps {
  templates: Template[];
  selectedTemplateId?: string;
  onTemplateSelect?: (templateId: string) => void;
}

type MappingSource = 'database' | 'ai' | 'custom' | 'unmapped';

interface PlaceholderMapping {
  placeholder: string;
  source: MappingSource;
  table?: string;
  field?: string;
  customValue?: string;
}

const SOURCE_COLORS: Record<MappingSource, { bg: string; text: string; border: string }> = {
  database: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  ai: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  custom: { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  unmapped: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
};

const SOURCE_ICONS: Record<MappingSource, React.ReactNode> = {
  database: <Database className="h-3 w-3" />,
  ai: <Sparkles className="h-3 w-3" />,
  custom: <FileText className="h-3 w-3" />,
  unmapped: <AlertTriangle className="h-3 w-3" />,
};

export default function EnhancedPlaceholderMapping({
  templates,
  selectedTemplateId,
  onTemplateSelect,
}: EnhancedPlaceholderMappingProps) {
  const { getTableColumns } = useSupabaseData();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [mappings, setMappings] = useState<PlaceholderMapping[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [tableColumns, setTableColumns] = useState<Record<string, string[]>>({});

  // Load template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      setSelectedTemplate(template || null);
    }
  }, [selectedTemplateId, templates]);

  // Initialize mappings when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const existingMappings = selectedTemplate.placeholder_mappings || {};
      
      const newMappings: PlaceholderMapping[] = selectedTemplate.placeholders.map(placeholder => {
        const existing = existingMappings[placeholder];
        
        if (existing) {
          return {
            placeholder,
            source: existing.source as MappingSource,
            table: existing.table,
            field: existing.field,
            customValue: existing.value,
          };
        }

        // Auto-detect from placeholder name
        const detected = detectTableFromPlaceholder(placeholder);
        if (detected) {
          return {
            placeholder,
            source: 'database',
            table: detected.table,
            field: detected.field,
          };
        }

        return {
          placeholder,
          source: 'unmapped',
        };
      });

      setMappings(newMappings);
    }
  }, [selectedTemplate]);

  // Load table columns
  useEffect(() => {
    const loadColumns = async () => {
      const columns: Record<string, string[]> = {};
      for (const table of AVAILABLE_TABLES) {
        columns[table.id] = await getTableColumns(table.id);
      }
      setTableColumns(columns);
    };
    loadColumns();
  }, [getTableColumns]);

  // Filter mappings by search
  const filteredMappings = useMemo(() => {
    if (!searchQuery) return mappings;
    const query = searchQuery.toLowerCase();
    return mappings.filter(m => 
      m.placeholder.toLowerCase().includes(query) ||
      m.table?.toLowerCase().includes(query) ||
      m.field?.toLowerCase().includes(query)
    );
  }, [mappings, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const counts = { database: 0, ai: 0, custom: 0, unmapped: 0 };
    mappings.forEach(m => counts[m.source]++);
    return counts;
  }, [mappings]);

  const updateMapping = (index: number, updates: Partial<PlaceholderMapping>) => {
    setMappings(prev => {
      const newMappings = [...prev];
      newMappings[index] = { ...newMappings[index], ...updates };
      return newMappings;
    });
  };

  const autoMapAll = () => {
    setMappings(prev => prev.map(mapping => {
      if (mapping.source === 'unmapped') {
        const detected = detectTableFromPlaceholder(mapping.placeholder);
        if (detected) {
          return {
            ...mapping,
            source: 'database',
            table: detected.table,
            field: detected.field,
          };
        }
      }
      return mapping;
    }));
    toast.success('Auto-mapping applied');
  };

  const saveMappings = async () => {
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const settings: Record<string, PlaceholderSetting> = {};
      
      mappings.forEach(m => {
        settings[m.placeholder] = {
          source: m.source === 'unmapped' ? 'random' : m.source as PlaceholderSetting['source'],
          table: m.table,
          field: m.field,
          value: m.customValue,
          random_option: m.source === 'ai' ? 'ai-generated' : undefined,
        };
      });

      await documentApiFetch('/placeholder-settings', {
        method: 'POST',
        body: JSON.stringify({
          template_name: selectedTemplate.file_name,
          template_id: selectedTemplate.id,
          settings,
        }),
      });

      toast.success('Placeholder mappings saved');
    } catch (error) {
      console.error('Failed to save mappings:', error);
      toast.error('Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    onTemplateSelect?.(templateId);
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Placeholder Mapping
          </CardTitle>
          <CardDescription>
            Configure data sources for each placeholder in your templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm mb-2 block">Select Template</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.display_name || t.name} ({t.placeholders.length} placeholders)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="flex gap-2 items-end">
                <Button variant="outline" size="sm" onClick={autoMapAll}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Auto-Map
                </Button>
                <Button size="sm" onClick={saveMappings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats).map(([source, count]) => (
              <Card key={source} className={SOURCE_COLORS[source as MappingSource].bg}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {SOURCE_ICONS[source as MappingSource]}
                    <span className="text-sm capitalize">{source}</span>
                  </div>
                  <Badge variant="secondary" className={SOURCE_COLORS[source as MappingSource].text}>
                    {count}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search placeholders..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Placeholder Mappings List */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {filteredMappings.map((mapping, index) => {
                    const colors = SOURCE_COLORS[mapping.source];
                    const actualIndex = mappings.findIndex(m => m.placeholder === mapping.placeholder);
                    
                    return (
                      <div
                        key={mapping.placeholder}
                        className={`p-4 ${colors.bg} transition-colors`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Placeholder Name */}
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <Badge variant="outline" className={`${colors.border} ${colors.text}`}>
                              {SOURCE_ICONS[mapping.source]}
                            </Badge>
                            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                              {mapping.placeholder}
                            </code>
                          </div>

                          {/* Source Selector */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Select
                              value={mapping.source}
                              onValueChange={(value: MappingSource) => 
                                updateMapping(actualIndex, { source: value, table: undefined, field: undefined })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="database">Database</SelectItem>
                                <SelectItem value="ai">AI Generated</SelectItem>
                                <SelectItem value="custom">Custom Value</SelectItem>
                                <SelectItem value="unmapped">Unmapped</SelectItem>
                              </SelectContent>
                            </Select>

                            {mapping.source === 'database' && (
                              <>
                                <Select
                                  value={mapping.table || ''}
                                  onValueChange={(value) => 
                                    updateMapping(actualIndex, { table: value, field: undefined })
                                  }
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Table..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_TABLES.map((t) => (
                                      <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={mapping.field || ''}
                                  onValueChange={(value) => updateMapping(actualIndex, { field: value })}
                                  disabled={!mapping.table}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Field..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(tableColumns[mapping.table || ''] || []).map((col) => (
                                      <SelectItem key={col} value={col}>
                                        {col}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}

                            {mapping.source === 'custom' && (
                              <Input
                                className="h-8 text-xs col-span-2"
                                placeholder="Enter custom value..."
                                value={mapping.customValue || ''}
                                onChange={(e) => updateMapping(actualIndex, { customValue: e.target.value })}
                              />
                            )}

                            {mapping.source === 'ai' && (
                              <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                Will be generated by AI based on context
                              </div>
                            )}

                            {mapping.source === 'unmapped' && (
                              <div className="col-span-2 flex items-center gap-2 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                No mapping configured
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Warning for unmapped */}
          {stats.unmapped > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {stats.unmapped} placeholder(s) are unmapped. These will either use AI generation or remain unreplaced.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
