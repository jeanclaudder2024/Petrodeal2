import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Library, Eye, Copy, Trash2, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  document_type: string;
  entity_types: string[];
  content: string;
  placeholders: string[];
  is_public: boolean;
  created_at: string;
}

const TemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_saved_templates' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data as unknown as DocumentTemplate[]) || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setIsViewOpen(true);
  };

  const handleDuplicate = async (template: DocumentTemplate) => {
    try {
      const { error } = await supabase.from('document_saved_templates' as any).insert({
        name: `${template.name} (Copy)`,
        description: template.description,
        document_type: template.document_type,
        entity_types: template.entity_types,
        content: template.content,
        placeholders: template.placeholders,
        is_public: false
      });

      if (error) throw error;
      toast.success('Template duplicated successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('document_saved_templates' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.document_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEntityTypeLabel = (types: string[]) => {
    if (!types || types.length === 0) return 'N/A';
    return types.map(t => {
      const labels: Record<string, string> = {
        company_real: 'Real Company',
        company_buyer: 'Buyer',
        company_seller: 'Seller',
        vessel: 'Vessel',
        port: 'Port',
        refinery: 'Refinery'
      };
      return labels[t] || t;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Template Library
          </CardTitle>
          <CardDescription>
            Save and reuse document templates for quick document generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entity Types</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {templates.length === 0 
                      ? "No templates saved yet. Generate a document and save it as a template!"
                      : "No templates match your search"
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {template.name}
                      {template.is_public && (
                        <Badge variant="outline" className="ml-2 text-xs">Public</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.document_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getEntityTypeLabel(template.entity_types)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(template.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(template)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleCopyContent(template.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the template.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(template.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.document_type} • {getEntityTypeLabel(selectedTemplate?.entity_types || [])}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] border rounded-lg bg-white dark:bg-gray-950">
            <div 
              className="p-8 prose prose-sm dark:prose-invert max-w-none"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: '12pt',
                lineHeight: '1.6'
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTemplate?.content || '') }}
            />
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCopyContent(selectedTemplate?.content || '')}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateLibrary;
