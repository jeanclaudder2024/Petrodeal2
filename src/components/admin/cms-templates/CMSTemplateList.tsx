import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Search, 
  Settings, 
  Trash2, 
  Upload, 
  RefreshCw,
  Shield,
  FileType
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocumentTemplate } from './types';

interface CMSTemplateListProps {
  templates: DocumentTemplate[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSelectTemplate: (template: DocumentTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onRefresh: () => void;
  onUpload: () => void;
  selectedTemplateId?: string;
}

export function CMSTemplateList({
  templates,
  loading,
  searchTerm,
  onSearchChange,
  onSelectTemplate,
  onDeleteTemplate,
  onToggleActive,
  onRefresh,
  onUpload,
  selectedTemplateId
}: CMSTemplateListProps) {
  const filteredTemplates = templates.filter(t => 
    (t.title || t.name || t.file_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Templates
            <Badge variant="secondary" className="ml-1 font-normal">
              {filteredTemplates.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRefresh}
              className="h-8 w-8"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="sm" 
              onClick={onUpload}
              className="h-8 gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-muted/30 border-0 focus-visible:ring-1"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-[calc(100vh-340px)] min-h-[400px]">
          <div className="space-y-1.5 pr-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileType className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {templates.length === 0 
                    ? "No templates yet" 
                    : "No results found"
                  }
                </p>
                {templates.length === 0 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={onUpload}
                    className="mt-2 text-primary"
                  >
                    Upload your first template
                  </Button>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const displayName = template.title || template.name || template.file_name;
                
                return (
                  <div
                    key={template.id}
                    className={`
                      group relative p-3 rounded-lg border cursor-pointer transition-all duration-150
                      ${isSelected 
                        ? 'bg-primary/5 border-primary/30 shadow-sm' 
                        : 'bg-background hover:bg-muted/50 border-transparent hover:border-border'
                      }
                    `}
                    onClick={() => onSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : ''}`}>
                            {displayName}
                          </span>
                          {template.requires_broker_membership && (
                            <Shield className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {formatFileSize(template.file_size) && (
                            <span>{formatFileSize(template.file_size)}</span>
                          )}
                          <span>•</span>
                          <span>{formatDate(template.created_at)}</span>
                          {template.placeholders && template.placeholders.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{template.placeholders.length} fields</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={(checked) => {
                            onToggleActive(template.id, checked);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="scale-75"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this template?')) {
                              onDeleteTemplate(template.id);
                            }
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Active indicator */}
                    {!template.is_active && (
                      <Badge variant="outline" className="absolute top-2 right-2 text-[10px] opacity-60">
                        Inactive
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
