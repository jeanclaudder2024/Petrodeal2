import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Database, 
  Table2, 
  Loader2,
  Copy,
  Columns
} from 'lucide-react';
import { toast } from 'sonner';
import { useDatabaseSchema } from './hooks/useDatabaseSchema';

export function DatabaseExplorer() {
  const { tableColumns, loading, availableTables, getColumnsForTable } = useDatabaseSchema();

  const copyFieldPath = (table: string, field: string) => {
    navigator.clipboard.writeText(`{{${table}.${field}}}`);
    toast.success(`Copied: {{${table}.${field}}}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          Database Schema
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          Click any field to copy the placeholder syntax
        </p>
      </div>

      <ScrollArea className="h-[380px]">
        <Accordion type="multiple" className="space-y-1.5 pr-3">
          {availableTables.map((tableName) => {
            const columns = getColumnsForTable(tableName);
            return (
              <AccordionItem 
                key={tableName} 
                value={tableName} 
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{tableName}</span>
                    <Badge variant="secondary" className="text-[10px] font-normal ml-1">
                      {columns.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-muted/10">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-3">
                    {columns.map((col) => (
                      <Button
                        key={col.column_name}
                        variant="ghost"
                        size="sm"
                        className="justify-between text-xs h-8 font-mono hover:bg-primary/10 hover:text-primary px-2"
                        onClick={() => copyFieldPath(tableName, col.column_name)}
                      >
                        <span className="truncate">{col.column_name}</span>
                        <Copy className="h-3 w-3 opacity-40 flex-shrink-0 ml-1" />
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
