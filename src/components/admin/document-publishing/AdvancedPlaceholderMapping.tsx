import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Database, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  RefreshCw,
  GripVertical,
  ArrowRight,
  Wand2,
  Ship,
  Anchor,
  Factory,
  Building2,
  Landmark,
  Droplets,
  FileSpreadsheet,
  Bot,
  Save,
  Eye,
  Undo2,
  Settings2
} from 'lucide-react';
import {
  BUCKET_DEFINITIONS,
  initializeBuckets,
  moveToAI,
  moveToDatabase,
  getPlaceholderMappings,
  detectBucket,
  getBucketIdFromTable,
  updatePlaceholderColumn,
  moveUnmatchedToAI,
  Bucket,
  PlaceholderItem
} from './hooks/useBucketMapping';
import { useTableSchema } from './hooks/useTableSchema';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getDocumentApiUrl } from '@/config/documentApi';
import BucketMappingEditor from './BucketMappingEditor';

interface Template {
  id: string;
  name: string;
  file_name: string;
  placeholders: string[];
}

interface AdvancedPlaceholderMappingProps {
  templates: Template[];
}

// Icon mapping for buckets
const bucketIcons: Record<string, React.ReactNode> = {
  vessel: <Ship className="h-4 w-4" />,
  ports: <Anchor className="h-4 w-4" />,
  refinery: <Factory className="h-4 w-4" />,
  seller_company: <Building2 className="h-4 w-4" />,
  buyer_company: <Building2 className="h-4 w-4" />,
  seller_bank: <Landmark className="h-4 w-4" />,
  buyer_bank: <Landmark className="h-4 w-4" />,
  product: <Droplets className="h-4 w-4" />,
  commercial: <FileSpreadsheet className="h-4 w-4" />,
  ai: <Bot className="h-4 w-4" />,
};

// Status colors and labels
const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
  resolved_db: { color: 'text-green-600', label: 'Resolved (Database)', bg: 'bg-green-50 dark:bg-green-900/20' },
  resolved_ai: { color: 'text-amber-600', label: 'Resolved (AI)', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  auto_mapped: { color: 'text-blue-600', label: 'Auto-Mapped', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  manual_override: { color: 'text-purple-600', label: 'Manual Override', bg: 'bg-purple-50 dark:bg-purple-900/20' },
};

// Placeholder chip component
function PlaceholderChip({ 
  placeholder, 
  onMoveToAI, 
  onMoveToDatabase,
  availableBuckets,
  isInAIBucket 
}: { 
  placeholder: PlaceholderItem;
  onMoveToAI: () => void;
  onMoveToDatabase: (bucketId: string) => void;
  availableBuckets: { id: string; name: string }[];
  isInAIBucket: boolean;
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const status = statusConfig[placeholder.status] || statusConfig.auto_mapped;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`group relative flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${status.bg}`}
            onClick={() => setShowMoveMenu(!showMoveMenu)}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100" />
            
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono font-medium truncate block">
                {placeholder.name}
              </code>
              <div className="flex items-center gap-1 mt-0.5">
                {placeholder.source === 'database' ? (
                  <Database className="h-3 w-3 text-green-600" />
                ) : (
                  <Sparkles className="h-3 w-3 text-amber-500" />
                )}
                <span className={`text-[10px] ${status.color}`}>
                  {placeholder.source === 'database' && placeholder.resolvedColumn 
                    ? `→ ${placeholder.resolvedColumn}`
                    : status.label
                  }
                </span>
              </div>
            </div>
            
            {placeholder.confidence < 0.8 && placeholder.source === 'database' && (
              <Badge variant="outline" className="text-[9px] px-1 h-4 border-amber-300 text-amber-600">
                {Math.round(placeholder.confidence * 100)}%
              </Badge>
            )}
            
            {/* Move menu */}
            {showMoveMenu && (
              <div 
                className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg p-2 min-w-[180px]"
                onClick={(e) => e.stopPropagation()}
              >
                {isInAIBucket ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2 px-2">Move to Database Bucket:</p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {availableBuckets.map(bucket => (
                        <Button
                          key={bucket.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-7"
                          onClick={() => {
                            onMoveToDatabase(bucket.id);
                            setShowMoveMenu(false);
                          }}
                        >
                          {bucketIcons[bucket.id]}
                          <span className="ml-2">{bucket.name}</span>
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-7 text-amber-600"
                    onClick={() => {
                      onMoveToAI();
                      setShowMoveMenu(false);
                    }}
                  >
                    <Bot className="h-3 w-3 mr-2" />
                    Move to AI Bucket
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7 mt-1 text-muted-foreground"
                  onClick={() => setShowMoveMenu(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-1">
            <p><strong>Placeholder:</strong> {placeholder.name}</p>
            <p><strong>Source:</strong> {placeholder.source.toUpperCase()}</p>
            {placeholder.resolvedTable && (
              <p><strong>Table:</strong> {placeholder.resolvedTable}</p>
            )}
            {placeholder.resolvedColumn && (
              <p><strong>Column:</strong> {placeholder.resolvedColumn}</p>
            )}
            <p><strong>Confidence:</strong> {Math.round(placeholder.confidence * 100)}%</p>
            <p className="text-muted-foreground italic mt-2">Click to move between buckets</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Bucket card component with action buttons
function BucketCard({ 
  bucket, 
  onMoveToAI,
  onMoveToDatabase,
  onShowMatched,
  onReturnUnmatched,
  onEditMappings,
  availableBuckets
}: { 
  bucket: Bucket;
  onMoveToAI: (placeholderName: string) => void;
  onMoveToDatabase: (placeholderName: string, bucketId: string) => void;
  onShowMatched: () => void;
  onReturnUnmatched: () => void;
  onEditMappings: () => void;
  availableBuckets: { id: string; name: string }[];
}) {
  const isAIBucket = bucket.id === 'ai';
  const icon = bucketIcons[bucket.id] || <FileText className="h-4 w-4" />;
  
  // Calculate stats for this bucket
  const matchedCount = bucket.placeholders.filter(p => p.confidence >= 0.8).length;
  const lowConfidenceCount = bucket.placeholders.filter(p => p.confidence < 0.5).length;
  
  return (
    <Card className={`${isAIBucket ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${isAIBucket ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-primary/10'}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{bucket.name}</CardTitle>
              {bucket.table && (
                <CardDescription className="text-[10px]">
                  Table: <code className="bg-muted px-1 rounded">{bucket.table}</code>
                </CardDescription>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {bucket.placeholders.length} items
          </Badge>
        </div>
        
        {/* Action buttons for database buckets only */}
        {!isAIBucket && bucket.placeholders.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={onShowMatched}
                  >
                    <Eye className="h-3 w-3" />
                    Matched ({matchedCount})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Show placeholders with high confidence matches (&gt;80%)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={onReturnUnmatched}
                    disabled={lowConfidenceCount === 0}
                  >
                    <Undo2 className="h-3 w-3" />
                    Return ({lowConfidenceCount})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Move low confidence (&lt;50%) placeholders to AI bucket</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={onEditMappings}
                  >
                    <Settings2 className="h-3 w-3" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Manually edit placeholder-to-column mappings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardHeader>
      <CardContent className="py-2 px-4">
        {bucket.placeholders.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            {isAIBucket ? (
              <p>Drag placeholders here to use AI generation</p>
            ) : (
              <p>No placeholders detected for this bucket</p>
            )}
          </div>
        ) : (
          <div className="grid gap-2 max-h-[250px] overflow-y-auto pr-1">
            {bucket.placeholders.map((placeholder) => (
              <PlaceholderChip
                key={placeholder.name}
                placeholder={placeholder}
                onMoveToAI={() => onMoveToAI(placeholder.name)}
                onMoveToDatabase={(bucketId) => onMoveToDatabase(placeholder.name, bucketId)}
                availableBuckets={availableBuckets}
                isInAIBucket={isAIBucket}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdvancedPlaceholderMapping({ templates }: AdvancedPlaceholderMappingProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const { columns: tableColumns, loading: schemaLoading } = useTableSchema();
  
  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);
  
  // Load existing mappings from database when template changes
  useEffect(() => {
    if (!selectedTemplateData || Object.keys(tableColumns).length === 0) return;
    
    const loadMappings = async () => {
      setLoadingMappings(true);
      
      try {
        // First try to load from document_template_fields (preferred - uses file_name)
        const { data: savedMappings } = await supabase
          .from('document_template_fields')
          .select('*')
          .eq('template_file_name', selectedTemplateData.file_name);
        
        if (savedMappings && savedMappings.length > 0) {
          console.log('✅ Loaded saved mappings from document_template_fields:', savedMappings.length);
          
          // Apply saved mappings to buckets
          const initialized = initializeBuckets(selectedTemplateData.placeholders, tableColumns);
          
          // Override with saved mappings
          savedMappings.forEach(mapping => {
            const targetBucketId = mapping.source === 'ai' ? 'ai' : getBucketIdFromTable(mapping.database_table);
            initialized.forEach(bucket => {
              const placeholderIndex = bucket.placeholders.findIndex(p => p.name === mapping.placeholder_name);
              if (placeholderIndex >= 0) {
                // Remove from current bucket
                bucket.placeholders.splice(placeholderIndex, 1);
              }
            });
            
            // Add to correct bucket
            const targetBucket = initialized.find(b => b.id === targetBucketId) || initialized.find(b => b.id === 'ai');
            if (targetBucket) {
              targetBucket.placeholders.push({
                name: mapping.placeholder_name,
                source: mapping.source as 'database' | 'ai',
                status: 'resolved_db',
                confidence: 1.0,
                resolvedTable: mapping.database_table || null,
                resolvedColumn: mapping.database_column || null,
                originalBucket: targetBucketId,
              });
            }
          });
          
          setBuckets(initialized);
          toast.success(`Loaded ${savedMappings.length} saved mappings`);
        } else {
          // No saved mappings, initialize fresh
          const initialized = initializeBuckets(selectedTemplateData.placeholders, tableColumns);
          setBuckets(initialized);
        }
      } catch (error) {
        console.error('Failed to load saved mappings:', error);
        // Fallback to fresh initialization
        const initialized = initializeBuckets(selectedTemplateData.placeholders, tableColumns);
        setBuckets(initialized);
      } finally {
        setLoadingMappings(false);
      }
    };
    
    loadMappings();
  }, [selectedTemplateData, tableColumns]);
  
  // Handler to move placeholder to AI bucket
  const handleMoveToAI = useCallback((placeholderName: string) => {
    setBuckets(prev => moveToAI(prev, placeholderName));
  }, []);
  
  // Handler to move placeholder to a database bucket
  const handleMoveToDatabase = useCallback((placeholderName: string, bucketId: string) => {
    setBuckets(prev => moveToDatabase(prev, placeholderName, bucketId));
  }, []);
  
  // Re-auto map all placeholders
  const handleReAutoMap = useCallback(() => {
    if (selectedTemplateData && Object.keys(tableColumns).length > 0) {
      const reinitialized = initializeBuckets(selectedTemplateData.placeholders, tableColumns);
      setBuckets(reinitialized);
      toast.success('Placeholders re-mapped to original buckets');
    }
  }, [selectedTemplateData, tableColumns]);

  // Auto-detect and move placeholders from AI bucket to database buckets
  const handleAutoDetectFromAI = useCallback(() => {
    const aiBucket = buckets.find(b => b.id === 'ai');
    if (!aiBucket || aiBucket.placeholders.length === 0) {
      toast.info('No placeholders in AI bucket to detect');
      return;
    }
    
    let movedCount = 0;
    let newBuckets = [...buckets.map(b => ({ ...b, placeholders: [...b.placeholders] }))];
    
    // For each placeholder in AI bucket, try to detect a database bucket
    for (const placeholder of [...aiBucket.placeholders]) {
      const detectedBucketId = detectBucket(placeholder.name);
      
      // Only move if detected a non-AI bucket
      if (detectedBucketId !== 'ai') {
        newBuckets = moveToDatabase(newBuckets, placeholder.name, detectedBucketId);
        movedCount++;
      }
    }
    
    setBuckets(newBuckets);
    
    if (movedCount > 0) {
      toast.success(`Moved ${movedCount} placeholder(s) to database buckets`);
    } else {
      toast.info('No matching database buckets found for AI placeholders');
    }
  }, [buckets]);

  // Handler to show matched placeholders (high confidence)
  const handleShowMatched = useCallback((bucketId: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    
    const matched = bucket.placeholders.filter(p => p.confidence >= 0.8);
    const unmatched = bucket.placeholders.filter(p => p.confidence < 0.8);
    
    toast.info(
      `${bucket.name}: ${matched.length} high-confidence matches, ${unmatched.length} need review`,
      { duration: 4000 }
    );
  }, [buckets]);

  // Handler to return unmatched placeholders to AI bucket
  const handleReturnUnmatched = useCallback((bucketId: string) => {
    const result = moveUnmatchedToAI(buckets, bucketId, 0.5);
    setBuckets(result.buckets);
    
    if (result.movedCount > 0) {
      toast.success(`Moved ${result.movedCount} low-confidence placeholder(s) to AI bucket`);
    } else {
      toast.info('No low-confidence placeholders to move');
    }
  }, [buckets]);

  // Handler to open edit mappings modal
  const handleEditMappings = useCallback((bucketId: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (bucket) {
      setEditingBucket(bucket);
    }
  }, [buckets]);

  // Handler to save manual mapping changes from editor
  const handleSaveMappingChanges = useCallback((updates: { placeholderName: string; column: string }[]) => {
    let newBuckets = [...buckets.map(b => ({ ...b, placeholders: [...b.placeholders] }))];
    
    for (const update of updates) {
      newBuckets = updatePlaceholderColumn(newBuckets, update.placeholderName, update.column);
    }
    
    setBuckets(newBuckets);
    toast.success(`Updated ${updates.length} placeholder mapping(s)`);
  }, [buckets]);

  // Save mappings to Supabase and optionally sync with Replit API
  const handleSaveMappings = useCallback(async () => {
    if (!selectedTemplateData) {
      toast.error('Please select a template first');
      return;
    }

    setSaving(true);
    try {
      const mappings = getPlaceholderMappings(buckets);
      
      // Step 1: Get the actual Supabase UUID for this template
      // The template ID from API might be a string like "aml", not a UUID
      let actualTemplateId = selectedTemplateData.id;
      
      // Always try to find by file_name first (even if it looks like UUID)
      const { data: dbTemplates } = await supabase
        .from('document_templates')
        .select('id, file_name, name');
      
      const fileNameToUuid = new Map<string, string>();
      const nameToUuid = new Map<string, string>();
      const fullFileNameToUuid = new Map<string, string>();
      
      (dbTemplates || []).forEach(t => {
        const baseName = t.file_name?.replace(/\.(docx|pdf|doc)$/i, '') || '';
        if (baseName) fileNameToUuid.set(baseName.toLowerCase(), t.id);
        if (t.name) nameToUuid.set(t.name.toLowerCase(), t.id);
        if (t.file_name) fullFileNameToUuid.set(t.file_name.toLowerCase(), t.id);
      });
      
      // Try to find the UUID using multiple matching strategies
      const mappedId = 
        // Try full file_name first (e.g., "VERY NEW AML TEDST 2026.docx")
        fullFileNameToUuid.get(selectedTemplateData.file_name?.toLowerCase()) ||
        // Try base name without extension
        fileNameToUuid.get(selectedTemplateData.id.toLowerCase()) ||
        fileNameToUuid.get(selectedTemplateData.file_name?.replace(/\.(docx|pdf|doc)$/i, '').toLowerCase()) ||
        // Try by display name
        nameToUuid.get(selectedTemplateData.name?.toLowerCase()) ||
        nameToUuid.get(selectedTemplateData.id.toLowerCase());
      
      if (mappedId) {
        actualTemplateId = mappedId;
      } else {
        // Template doesn't exist in Supabase - create it
        console.log('Creating new template record for:', selectedTemplateData.name);
        
        const { data: newTemplate, error: createError } = await supabase
          .from('document_templates')
          .insert({
            name: selectedTemplateData.name || selectedTemplateData.file_name,
            file_name: selectedTemplateData.file_name,
            file_url: selectedTemplateData.file_name || '', // Use file_name as reference
            file_type: 'docx',
            category: 'general',
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Failed to create template record:', createError);
          
          // If duplicate error, try to find it again
          if (createError.code === '23505') { // Unique constraint violation
            const { data: existingTemplate } = await supabase
              .from('document_templates')
              .select('id')
              .eq('file_name', selectedTemplateData.file_name)
              .single();
            
            if (existingTemplate) {
              actualTemplateId = existingTemplate.id;
            } else {
              toast.error('Template already exists but could not be found.');
              setSaving(false);
              return;
            }
          } else {
            toast.error(`Could not create template: ${createError.message}`);
            setSaving(false);
            return;
          }
        } else if (newTemplate) {
          actualTemplateId = newTemplate.id;
          console.log('Created new template record:', actualTemplateId);
          toast.success('Template registered in database');
        }
      }
      
      // Prepare records for template_placeholders table WITH file_name for Replit lookup
      // source must be lowercase ('database' or 'ai') to match check constraint
      const placeholderRecords = Object.entries(mappings).map(([key, value]) => ({
        template_id: actualTemplateId,
        template_file_name: selectedTemplateData.file_name, // For direct Replit lookup
        placeholder: key,
        source: value.source === 'database' ? 'database' : 'ai',
        database_table: value.table || null,
        database_field: value.column || null,
        random_option: value.source === 'database' ? null : 'auto',
      }));

      // Prepare records for document_template_fields (comprehensive per-template registry)
      const fieldRecords = Object.entries(mappings).map(([key, value], index) => ({
        template_file_name: selectedTemplateData.file_name,
        placeholder_name: key,
        source: value.source === 'database' ? 'database' : 'ai',
        database_table: value.table || null,
        database_column: value.column || null,
        ai_prompt: value.source === 'ai' ? `Generate appropriate value for ${key}` : null,
        is_required: true,
        display_order: index,
      }));

      // Delete existing placeholders for this template (both tables)
      const [deleteResult1, deleteResult2] = await Promise.all([
        supabase
          .from('template_placeholders')
          .delete()
          .eq('template_id', actualTemplateId),
        supabase
          .from('document_template_fields')
          .delete()
          .eq('template_file_name', selectedTemplateData.file_name),
      ]);
      
      if (deleteResult1.error) {
        console.warn('Delete template_placeholders error (may be ok if no existing records):', deleteResult1.error);
      }
      if (deleteResult2.error) {
        console.warn('Delete document_template_fields error (may be ok if no existing records):', deleteResult2.error);
      }

      // Insert new records into both tables
      if (placeholderRecords.length > 0) {
        const { error: insertError1 } = await supabase
          .from('template_placeholders')
          .insert(placeholderRecords);
        
        if (insertError1) {
          console.error('Failed to save template_placeholders:', insertError1);
          throw insertError1;
        }

        const { error: insertError2 } = await supabase
          .from('document_template_fields')
          .insert(fieldRecords);
        
        if (insertError2) {
          console.error('Failed to save document_template_fields:', insertError2);
          throw insertError2;
        }
      }

      // Sync with Replit FastAPI - include complete mapping info for Replit to use
      try {
        const replitMappings = Object.entries(mappings).reduce((acc, [key, value]) => {
          acc[key] = {
            source: value.source,
            table: value.table || null,
            column: value.column || null,
            // Replit will use this to prioritize database queries
            priority: value.source === 'database' ? 1 : 2,
          };
          return acc;
        }, {} as Record<string, any>);

        await fetch(`${getDocumentApiUrl()}/save-placeholder-mappings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template_file_name: selectedTemplateData.file_name,
            template_name: selectedTemplateData.name,
            mappings: replitMappings,
            total_placeholders: Object.keys(mappings).length,
            database_count: Object.values(mappings).filter(m => m.source === 'database').length,
            ai_count: Object.values(mappings).filter(m => m.source === 'ai').length,
          }),
        });
        console.log('✅ Replit API sync successful');
      } catch (apiError) {
        // API sync is optional, don't fail if it's not available
        console.log('Replit API sync skipped (endpoint may not exist):', apiError);
      }

      toast.success(`Mappings saved! ${Object.values(mappings).filter(m => m.source === 'database').length} database, ${Object.values(mappings).filter(m => m.source === 'ai').length} AI`);
    } catch (error) {
      console.error('Failed to save mappings:', error);
      toast.error('Failed to save mappings');
    } finally {
      setSaving(false);
    }
  }, [buckets, selectedTemplateData]);
  
  // Get available database buckets for move menu
  const availableDatabaseBuckets = useMemo(() => {
    return BUCKET_DEFINITIONS
      .filter(b => b.id !== 'ai')
      .map(b => ({ id: b.id, name: b.name }));
  }, []);
  
  // Calculate summary stats
  const summary = useMemo(() => {
    const allPlaceholders = buckets.flatMap(b => b.placeholders);
    const dbCount = allPlaceholders.filter(p => p.source === 'database').length;
    const aiCount = allPlaceholders.filter(p => p.source === 'ai').length;
    const autoMapped = allPlaceholders.filter(p => p.status === 'auto_mapped').length;
    const manualOverride = allPlaceholders.filter(p => p.status === 'manual_override').length;
    const highConfidence = allPlaceholders.filter(p => p.confidence >= 0.8).length;
    
    return {
      total: allPlaceholders.length,
      database: dbCount,
      ai: aiCount,
      autoMapped,
      manualOverride,
      highConfidence,
      dbPercent: allPlaceholders.length > 0 ? Math.round((dbCount / allPlaceholders.length) * 100) : 0,
    };
  }, [buckets]);
  
  // Separate database buckets and AI bucket
  const databaseBuckets = buckets.filter(b => b.id !== 'ai');
  const aiBucket = buckets.find(b => b.id === 'ai');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Enterprise Placeholder Mapping
            </CardTitle>
            <CardDescription>
              Intelligent bucket-based mapping with drag & drop controls
            </CardDescription>
          </div>
          {selectedTemplate && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReAutoMap}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Re-Auto Map
              </Button>
              <Button
                size="sm"
                onClick={handleSaveMappings}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Mappings
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a template to analyze..." />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((template) => template.id && template.id.trim() !== '')
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.placeholders.length} placeholders)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Stats */}
            {selectedTemplateData && buckets.length > 0 && (
              <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-sm">{summary.database}</span>
                  <span className="text-xs text-muted-foreground">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-sm">{summary.ai}</span>
                  <span className="text-xs text-muted-foreground">AI Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">{summary.autoMapped}</span>
                  <span className="text-xs text-muted-foreground">Auto-Mapped</span>
                </div>
                {summary.manualOverride > 0 && (
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold text-sm">{summary.manualOverride}</span>
                    <span className="text-xs text-muted-foreground">Manual Override</span>
                  </div>
                )}
                <div className="ml-auto">
                  <Badge variant={summary.dbPercent >= 80 ? 'default' : 'secondary'}>
                    {summary.dbPercent}% from Database
                  </Badge>
                </div>
              </div>
            )}

            {/* Bucket Grid */}
            {selectedTemplateData && buckets.length > 0 && (
              <div className="space-y-4">
                {/* Database Buckets Grid */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    Database Buckets ({databaseBuckets.length})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {databaseBuckets.map((bucket) => (
                      <BucketCard
                        key={bucket.id}
                        bucket={bucket}
                        onMoveToAI={handleMoveToAI}
                        onMoveToDatabase={handleMoveToDatabase}
                        onShowMatched={() => handleShowMatched(bucket.id)}
                        onReturnUnmatched={() => handleReturnUnmatched(bucket.id)}
                        onEditMappings={() => handleEditMappings(bucket.id)}
                        availableBuckets={availableDatabaseBuckets}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Bucket */}
                {aiBucket && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Bot className="h-4 w-4 text-amber-500" />
                        AI Bucket (Manual Overrides)
                      </h4>
                      {aiBucket.placeholders.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAutoDetectFromAI}
                          className="gap-2 text-xs h-7"
                        >
                          <Wand2 className="h-3 w-3" />
                          Auto-Detect & Move to Database
                        </Button>
                      )}
                    </div>
                    <div className="max-w-md">
                      <BucketCard
                        bucket={aiBucket}
                        onMoveToAI={handleMoveToAI}
                        onMoveToDatabase={handleMoveToDatabase}
                        onShowMatched={() => {}}
                        onReturnUnmatched={() => {}}
                        onEditMappings={() => {}}
                        availableBuckets={availableDatabaseBuckets}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Placeholders in this bucket will be generated by AI only. 
                      Click on a placeholder to move it back to a database bucket.
                    </p>
                  </div>
                )}

                {/* Rules Notice */}
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-1">
                  <p className="font-medium text-primary">Resolution Rules:</p>
                  <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li><strong>DATABASE</strong> source: Always resolves from database, never empty, never falls back to AI</li>
                    <li><strong>AI</strong> source: Generated only by AI, no database queries</li>
                    <li>Click on any placeholder to move it between buckets</li>
                    <li>Use <strong>Re-Auto Map</strong> to reset all mappings to original state</li>
                  </ul>
                </div>
              </div>
            )}

            {schemaLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading database schema...
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Bucket Mapping Editor Dialog */}
      {editingBucket && (
        <BucketMappingEditor
          open={!!editingBucket}
          onOpenChange={(open) => !open && setEditingBucket(null)}
          bucket={editingBucket}
          onSave={handleSaveMappingChanges}
        />
      )}
    </Card>
  );
}
