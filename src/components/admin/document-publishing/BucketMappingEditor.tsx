import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Save, Database, Wand2, RotateCcw, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Bucket, PlaceholderItem } from './hooks/useBucketMapping';

interface BucketMappingEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bucket: Bucket;
  onSave: (updates: { placeholderName: string; column: string }[]) => void;
}

export function BucketMappingEditor({
  open,
  onOpenChange,
  bucket,
  onSave,
}: BucketMappingEditorProps) {
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    bucket.placeholders.forEach(p => {
      initial[p.name] = p.resolvedColumn || '';
    });
    return initial;
  });

  const handleColumnChange = (placeholderName: string, column: string) => {
    setMappings(prev => ({
      ...prev,
      [placeholderName]: column,
    }));
  };

  const handleSave = () => {
    const updates = Object.entries(mappings)
      .filter(([name, column]) => {
        const original = bucket.placeholders.find(p => p.name === name);
        return column && column !== original?.resolvedColumn;
      })
      .map(([placeholderName, column]) => ({ placeholderName, column }));
    
    onSave(updates);
    onOpenChange(false);
  };

  // Fixed Matching Logic - multi-tier matching
  const findMatchingColumn = useCallback((placeholder: string, columns: string[]): string | null => {
    const normalizedPlaceholder = placeholder.toLowerCase().replace(/[_-]/g, '');
    
    // 1. Exact match
    const exact = columns.find(c => c.toLowerCase() === placeholder.toLowerCase());
    if (exact) return exact;
    
    // 2. Suffix match (e.g., buyer_bank_name → bank_name)
    const suffix = columns.find(c => placeholder.toLowerCase().endsWith('_' + c.toLowerCase()));
    if (suffix) return suffix;
    
    // 3. Word overlap matching
    const placeholderWords = placeholder.toLowerCase().split(/[_-]/).filter(w => w.length > 2);
    for (const column of columns) {
      const columnWords = column.toLowerCase().split(/[_-]/).filter(w => w.length > 2);
      const overlap = placeholderWords.filter(w => columnWords.includes(w));
      if (overlap.length >= 2) return column;
    }
    
    // 4. Single word match for short placeholders
    for (const column of columns) {
      const columnWords = column.toLowerCase().split(/[_-]/);
      const match = placeholderWords.some(pw => columnWords.includes(pw));
      if (match && placeholderWords.length <= 2) return column;
    }
    
    return null;
  }, []);

  // Apply Fixed Matching to all placeholders
  const handleFixedMatching = useCallback(() => {
    let matchedCount = 0;
    const newMappings: Record<string, string> = { ...mappings };
    
    bucket.placeholders.forEach(placeholder => {
      const matchedColumn = findMatchingColumn(placeholder.name, bucket.columns);
      if (matchedColumn) {
        newMappings[placeholder.name] = matchedColumn;
        matchedCount++;
      }
    });
    
    setMappings(newMappings);
    toast.success(`Fixed Matching applied: ${matchedCount}/${bucket.placeholders.length} placeholders matched`);
  }, [bucket, mappings, findMatchingColumn]);

  // Clear all mappings
  const handleClearAll = useCallback(() => {
    const clearedMappings: Record<string, string> = {};
    bucket.placeholders.forEach(p => {
      clearedMappings[p.name] = '';
    });
    setMappings(clearedMappings);
    toast.info('All mappings cleared');
  }, [bucket]);

  const getConfidenceBadge = (placeholder: PlaceholderItem) => {
    if (placeholder.confidence >= 0.8) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          {Math.round(placeholder.confidence * 100)}%
        </Badge>
      );
    }
    if (placeholder.confidence >= 0.5) {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          {Math.round(placeholder.confidence * 100)}%
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <AlertCircle className="h-3 w-3 mr-1" />
        {Math.round(placeholder.confidence * 100)}%
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Edit Mappings: {bucket.name}
          </DialogTitle>
          <DialogDescription>
            Manually map each placeholder to a specific database column from the <code className="bg-muted px-1 rounded">{bucket.table}</code> table.
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 py-2 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFixedMatching}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Fixed Matching
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Clear All
          </Button>
          <div className="flex-1" />
          <Badge variant="secondary" className="text-xs">
            {Object.values(mappings).filter(Boolean).length}/{bucket.placeholders.length} mapped
          </Badge>
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {bucket.placeholders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No placeholders in this bucket
              </div>
            ) : (
              bucket.placeholders.map((placeholder) => (
                <div
                  key={placeholder.name}
                  className="p-3 border rounded-lg space-y-2 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono font-medium bg-muted px-2 py-0.5 rounded">
                        {placeholder.name}
                      </code>
                      {getConfidenceBadge(placeholder)}
                    </div>
                    {placeholder.status === 'manual_override' && (
                      <Badge variant="outline" className="text-purple-600 border-purple-300">
                        Manual
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-muted-foreground w-20">
                      Column:
                    </Label>
                    <Select
                      value={mappings[placeholder.name] || ''}
                      onValueChange={(value) => handleColumnChange(placeholder.name, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select database column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bucket.columns.map((column) => (
                          <SelectItem key={column} value={column}>
                            {column}
                            {column === placeholder.resolvedColumn && (
                              <span className="ml-2 text-muted-foreground">(current)</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {placeholder.resolvedColumn && mappings[placeholder.name] !== placeholder.resolvedColumn && (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Changed from: <code>{placeholder.resolvedColumn}</code>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {bucket.columns.length} columns available • {bucket.placeholders.length} placeholders
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BucketMappingEditor;
