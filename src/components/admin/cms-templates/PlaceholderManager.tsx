import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Settings2, 
  Database, 
  FileSpreadsheet, 
  PenLine, 
  Shuffle,
  Save,
  Trash2,
  Loader2,
  Code
} from 'lucide-react';
import type { TemplatePlaceholder, PlaceholderSource } from './types';
import { useDatabaseSchema } from './hooks/useDatabaseSchema';

interface PlaceholderManagerProps {
  templateId: string;
  templatePlaceholders: string[];
  savedPlaceholders: TemplatePlaceholder[];
  loading: boolean;
  onSave: (placeholder: Partial<TemplatePlaceholder> & { template_id: string; placeholder: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function PlaceholderManager({
  templateId,
  templatePlaceholders,
  savedPlaceholders,
  loading,
  onSave,
  onDelete
}: PlaceholderManagerProps) {
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [source, setSource] = useState<PlaceholderSource>('random');
  const [customValue, setCustomValue] = useState('');
  const [databaseTable, setDatabaseTable] = useState('');
  const [databaseField, setDatabaseField] = useState('');
  const [saving, setSaving] = useState(false);

  const { tableColumns, availableTables, getColumnsForTable } = useDatabaseSchema();

  const getSavedConfig = (placeholder: string) => {
    return savedPlaceholders.find(p => p.placeholder === placeholder);
  };

  const handleSelectPlaceholder = (placeholder: string) => {
    setSelectedPlaceholder(placeholder);
    const saved = getSavedConfig(placeholder);
    if (saved) {
      setSource(saved.source);
      setCustomValue(saved.custom_value || '');
      setDatabaseTable(saved.database_table || '');
      setDatabaseField(saved.database_field || '');
    } else {
      setSource('random');
      setCustomValue('');
      setDatabaseTable('');
      setDatabaseField('');
    }
  };

  const handleSave = async () => {
    if (!selectedPlaceholder) return;

    setSaving(true);
    try {
      await onSave({
        template_id: templateId,
        placeholder: selectedPlaceholder,
        source,
        custom_value: source === 'custom' ? customValue : null,
        database_table: source === 'database' ? databaseTable : null,
        database_field: source === 'database' ? databaseField : null,
        random_option: source === 'random' ? 'auto' : 'fixed'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlaceholder) return;
    const saved = getSavedConfig(selectedPlaceholder);
    if (saved) {
      await onDelete(saved.id);
      setSelectedPlaceholder(null);
    }
  };

  const getSourceBadge = (placeholder: string) => {
    const saved = getSavedConfig(placeholder);
    if (!saved) return null;
    
    const styles: Record<PlaceholderSource, string> = {
      custom: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      database: 'bg-green-500/10 text-green-600 border-green-500/20',
      csv: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      random: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    };

    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${styles[saved.source]}`}>
        {saved.source}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Placeholder List */}
      <div className="col-span-2">
        <div className="rounded-lg border bg-muted/20">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4 text-muted-foreground" />
              Placeholders
              <Badge variant="secondary" className="text-xs font-normal">
                {templatePlaceholders.length}
              </Badge>
            </h4>
          </div>
          <ScrollArea className="h-[380px]">
            <div className="p-2 space-y-0.5">
              {templatePlaceholders.map((placeholder) => {
                const isSelected = selectedPlaceholder === placeholder;
                const hasSavedConfig = !!getSavedConfig(placeholder);
                
                return (
                  <button
                    key={placeholder}
                    onClick={() => handleSelectPlaceholder(placeholder)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-md text-sm flex items-center justify-between gap-2 transition-colors
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : hasSavedConfig
                          ? 'bg-muted/50 hover:bg-muted'
                          : 'hover:bg-muted/50'
                      }
                    `}
                  >
                    <span className="font-mono text-xs truncate">{placeholder}</span>
                    {!isSelected && getSourceBadge(placeholder)}
                  </button>
                );
              })}
              {templatePlaceholders.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No placeholders detected
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="col-span-3">
        <div className="rounded-lg border">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h4 className="text-sm font-medium">
              {selectedPlaceholder 
                ? <span className="font-mono">{selectedPlaceholder}</span> 
                : 'Select a placeholder'
              }
            </h4>
          </div>
          
          {selectedPlaceholder ? (
            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Data Source</Label>
                <RadioGroup
                  value={source}
                  onValueChange={(v) => setSource(v as PlaceholderSource)}
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { value: 'random', label: 'Auto-generate', icon: Shuffle, desc: 'Random values' },
                    { value: 'database', label: 'Database', icon: Database, desc: 'From table field' },
                    { value: 'custom', label: 'Custom', icon: PenLine, desc: 'Fixed value' },
                    { value: 'csv', label: 'CSV File', icon: FileSpreadsheet, desc: 'From CSV column' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`
                        relative flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                        ${source === opt.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/30'
                        }
                      `}
                    >
                      <RadioGroupItem value={opt.value} className="mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <opt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {source === 'custom' && (
                <div className="space-y-2">
                  <Label className="text-sm">Fixed Value</Label>
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter the value to use"
                    className="h-9"
                  />
                </div>
              )}

              {source === 'database' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Table</Label>
                    <Select
                      value={databaseTable}
                      onValueChange={(v) => {
                        setDatabaseTable(v);
                        setDatabaseField('');
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map(table => (
                          <SelectItem key={table} value={table}>
                            {table}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Column</Label>
                    <Select
                      value={databaseField}
                      onValueChange={setDatabaseField}
                      disabled={!databaseTable}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getColumnsForTable(databaseTable).map(col => (
                          <SelectItem key={col.column_name} value={col.column_name}>
                            {col.column_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {source === 'csv' && (
                <div className="p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
                  CSV source configuration coming soon
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={!getSavedConfig(selectedPlaceholder)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Remove
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="min-w-[80px]"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Settings2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Select a placeholder to configure its data source
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
