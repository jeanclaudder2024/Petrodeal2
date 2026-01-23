import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Trash2, Database, FileSpreadsheet, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from './types';

interface DataSourcesTabProps {
  isAuthenticated: boolean;
}

interface DataSource {
  display_name?: string;
  filename: string;
  exists: boolean;
  size?: number;
  row_count?: number;
}

export default function DataSourcesTab({ isAuthenticated }: DataSourcesTabProps) {
  const [dataSources, setDataSources] = useState<Record<string, DataSource>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataType, setDataType] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadDataSources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadDataSources = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/data/all`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load data sources');
      }

      const data = await response.json();
      if (data && data.data_sources) {
        setDataSources(data.data_sources);
      }
    } catch (error) {
      toast.error('Load Error', {
        description: error instanceof Error ? error.message : 'Failed to load data sources',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }
    if (!selectedFile) {
      toast.error('No File', { description: 'Please select a CSV file first' });
      return;
    }
    if (!dataType.trim()) {
      toast.error('Upload Failed', { description: 'Please enter a dataset name (letters and numbers only).' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('data_type', dataType.trim());

      const response = await fetch(`${API_BASE_URL}/upload-csv`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Upload failed');
      }

      const data = await response.json();
      toast.success('Upload Success', {
        description: `Dataset "${data.display_name || data.dataset_id}" uploaded`,
      });

      // Reset form
      setSelectedFile(null);
      setDataType('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload data sources
      loadDataSources();
    } catch (error) {
      toast.error('Upload Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (csvId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }
    if (!confirm(`Delete dataset "${csvId}"?`)) return;

    setDeleting(csvId);
    try {
      const response = await fetch(`${API_BASE_URL}/csv-files/${encodeURIComponent(csvId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
        throw new Error(error.detail || 'Delete failed');
      }

      const data = await response.json();
      toast.success('Deleted', {
        description: `Dataset "${data.dataset_id || csvId}" deleted`,
      });

      loadDataSources();
    } catch (error) {
      toast.error('Delete Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const entries = Object.entries(dataSources || {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column - Upload Form */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV Data
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Dataset Name</Label>
              <Input
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                placeholder="e.g. buyers_sellers"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Letters and numbers only. We'll convert spaces to underscores.
              </p>
            </div>
            <div
              onClick={handleUploadAreaClick}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {selectedFile ? (
                <>
                  <FileSpreadsheet className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h5 className="text-green-600 font-semibold">{selectedFile.name}</h5>
                  <p className="text-sm text-muted-foreground mt-1">Ready to upload</p>
                </>
              ) : (
                <>
                  <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h5>Drop CSV file here</h5>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !isAuthenticated}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Data Sources List */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading data sources...
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No CSV datasets uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(([id, source]) => {
                  const displayName = source.display_name || id.replace('_', ' ').toUpperCase();
                  const exists = source.exists;
                  const size = exists ? formatBytes(source.size || 0) : 'n/a';
                  const rows = exists ? source.row_count : 0;

                  return (
                    <Card key={id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h6 className="font-semibold flex items-center gap-2 mb-1">
                              <Database className="h-4 w-4" />
                              {displayName}
                            </h6>
                            <div className="text-sm text-muted-foreground mb-1">
                              Dataset ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{id}</code>
                            </div>
                            <div className="text-sm space-y-1">
                              <div><strong>File:</strong> {source.filename}</div>
                              <div>
                                <strong>Status:</strong>{' '}
                                {exists ? (
                                  <Badge variant="default" className="bg-green-600">✓ Available</Badge>
                                ) : (
                                  <Badge variant="destructive">✗ Missing</Badge>
                                )}
                              </div>
                              {exists && (
                                <>
                                  <div><strong>Size:</strong> {size}</div>
                                  <div><strong>Rows:</strong> {rows}</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div>
                            {exists && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(id)}
                                disabled={deleting === id}
                              >
                                {deleting === id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
