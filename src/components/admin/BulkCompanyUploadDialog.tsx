import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Sparkles, Trash2, CheckCircle, XCircle, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { BulkUploadState, GeneratedCompanyData, UploadedCompany } from '@/hooks/useBulkCompanyUpload';

interface BulkCompanyUploadDialogProps {
  open: boolean;
  onClose: () => void;
  state: BulkUploadState;
  companyType: 'buyer' | 'seller';
  onFileUpload: (file: File) => void;
  onRemoveCompany: (index: number) => void;
  onGenerateAll: () => void;
  onRemoveGenerated: (index: number) => void;
  onGoBack: () => void;
  onSaveCompany: (company: GeneratedCompanyData) => Promise<void>;
  onSaveAll: () => Promise<void>;
}

export function BulkCompanyUploadDialog({
  open,
  onClose,
  state,
  companyType,
  onFileUpload,
  onRemoveCompany,
  onGenerateAll,
  onRemoveGenerated,
  onGoBack,
  onSaveCompany,
  onSaveAll,
}: BulkCompanyUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingAll, setSavingAll] = React.useState(false);
  const [savedIndices, setSavedIndices] = React.useState<Set<number>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    await onSaveAll();
    setSavingAll(false);
  };

  const handleSaveIndividual = async (company: GeneratedCompanyData, index: number) => {
    await onSaveCompany(company);
    setSavedIndices(prev => new Set([...prev, index]));
  };

  const progressPercent = state.generationProgress.total > 0
    ? (state.generationProgress.current / state.generationProgress.total) * 100
    : 0;

  const validCompanies = state.generatedCompanies.filter(c => !c._error);
  const errorCompanies = state.generatedCompanies.filter(c => c._error);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Upload {companyType === 'buyer' ? 'Buyer' : 'Seller'} Companies
          </DialogTitle>
          <DialogDescription>
            Upload an XLS/CSV file with company_name and country columns to bulk create companies
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          {/* Step 1: Upload */}
          {state.step === 'upload' && (
            <div className="space-y-4 p-4">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Accepts: .xls, .xlsx, .csv
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Required Columns:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <code className="bg-muted px-1 rounded">company_name</code> (or "name") - Company legal name</li>
                  <li>• <code className="bg-muted px-1 rounded">country</code> - Company country</li>
                </ul>
              </div>

              {state.validationErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Validation Errors</span>
                  </div>
                  <ul className="text-sm text-destructive/80 space-y-1">
                    {state.validationErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                    {state.validationErrors.length > 5 && (
                      <li>...and {state.validationErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {state.step === 'preview' && (
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{state.uploadedCompanies.length} Companies Ready</h3>
                  <p className="text-sm text-muted-foreground">Review and generate AI data for all companies</p>
                </div>
                <Button onClick={onGenerateAll} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Company Data with AI
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.uploadedCompanies.map((company, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{company.company_name}</TableCell>
                      <TableCell>{company.country}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveCompany(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Step 3: Generating */}
          {state.step === 'generating' && (
            <div className="space-y-6 p-8 text-center">
              <div className="animate-pulse">
                <Sparkles className="h-16 w-16 mx-auto text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Generating Company Data with AI</h3>
                <p className="text-muted-foreground">
                  Processing {state.generationProgress.current} of {state.generationProgress.total} companies...
                </p>
              </div>
              <Progress value={progressPercent} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground">
                Please don't close this dialog. This may take a few minutes.
              </p>
            </div>
          )}

          {/* Step 4: Review */}
          {state.step === 'review' && (
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={onGoBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div>
                    <h3 className="font-medium">
                      {validCompanies.length} Companies Generated
                      {errorCompanies.length > 0 && (
                        <span className="text-destructive ml-2">({errorCompanies.length} failed)</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">Review and save to database</p>
                  </div>
                </div>
                {validCompanies.length > 0 && (
                  <Button onClick={handleSaveAll} disabled={savingAll} className="gap-2">
                    <Save className="h-4 w-4" />
                    {savingAll ? 'Saving...' : `Save All ${validCompanies.length} Companies`}
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.generatedCompanies.map((company, index) => (
                    <TableRow key={index} className={company._error ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.country}</TableCell>
                      <TableCell>
                        {company._error ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        ) : savedIndices.has(index) ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Saved
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ready
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!company._error && !savedIndices.has(index) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveIndividual(company, index)}
                              title="Save this company"
                            >
                              <Save className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveGenerated(index)}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {errorCompanies.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Failed Companies</span>
                  </div>
                  <ul className="text-sm text-destructive/80 space-y-1">
                    {errorCompanies.map((c, i) => (
                      <li key={i}>• {c.name}: {c._errorMessage}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
