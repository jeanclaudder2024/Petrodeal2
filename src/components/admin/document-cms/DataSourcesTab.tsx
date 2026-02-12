import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileSpreadsheet, Upload, Trash2, Search, 
  Loader2, Table, FileText, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useDataSources } from './hooks/useDocumentAPI';
import { DataSource } from './types';

const DATA_TYPES = [
  { value: 'vessels', label: 'Vessels' },
  { value: 'ports', label: 'Ports' },
  { value: 'companies', label: 'Companies' },
  { value: 'products', label: 'Products' },
  { value: 'brokers', label: 'Brokers' },
  { value: 'custom', label: 'Custom' },
];

export default function DataSourcesTab() {
  const { dataSources, csvFiles, loading, fetchDataSources, fetchCsvFiles, uploadCsv, deleteCsv } = useDataSources();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState<DataSource | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    dataType: '',
  });

  useEffect(() => {
    fetchDataSources();
    fetchCsvFiles();
  }, [fetchDataSources, fetchCsvFiles]);

  const filteredSources = dataSources.filter(source =>
    source.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.dataType) {
      toast.error('Please select a file and data type');
      return;
    }

    setUploading(true);
    try {
      await uploadCsv(uploadForm.file, uploadForm.dataType);
      toast.success('CSV uploaded successfully');
      setUploadDialogOpen(false);
      setUploadForm({ file: null, dataType: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (sourceId: string, sourceName: string) => {
    if (!confirm(`Delete data source "${sourceName}"?`)) return;
    
    try {
      await deleteCsv(sourceId);
      toast.success('Data source deleted');
    } catch (error) {
      toast.error('Failed to delete data source');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search data sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload CSV
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload CSV Data Source</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label>CSV File *</Label>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Data Type *</Label>
                <Select
                  value={uploadForm.dataType}
                  onValueChange={(v) => setUploadForm(f => ({ ...f, dataType: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Categorize this CSV for easier mapping
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Sources Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No data sources found</p>
            <p className="text-sm text-muted-foreground/70">Upload CSV files to use as data sources</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <Card key={source.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{source.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">{source.type}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(source.id, source.name)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Table className="h-3.5 w-3.5" />
                      Rows
                    </span>
                    <span className="font-medium text-foreground">{source.row_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Columns
                    </span>
                    <span className="font-medium text-foreground">{source.headers?.length || 0}</span>
                  </div>
                </div>
                
                {source.headers && source.headers.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Columns:</p>
                    <div className="flex flex-wrap gap-1">
                      {source.headers.slice(0, 4).map((header, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {header}
                        </Badge>
                      ))}
                      {source.headers.length > 4 && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          +{source.headers.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => setPreviewSource(source)}
                >
                  Preview Data
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewSource} onOpenChange={() => setPreviewSource(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              {previewSource?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {previewSource?.data && previewSource.data.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {previewSource.headers?.map((header, i) => (
                      <th key={i} className="text-left p-2 border-b font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewSource.data.slice(0, 50).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-muted/30">
                      {previewSource.headers?.map((header, colIndex) => (
                        <td key={colIndex} className="p-2 border-b border-border/50 max-w-[200px] truncate">
                          {String(row[header] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </div>
          {previewSource?.data && previewSource.data.length > 50 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing first 50 of {previewSource.row_count} rows
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
