import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Ship, Building2, Factory, Anchor, Package, CreditCard, RefreshCw, 
  Download, Database, Sparkles, CheckCircle, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { documentApiFetch } from '@/config/documentApi';
import { useSupabaseData } from './hooks/useSupabaseData';
import { Template } from './types';

interface TestGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

interface GenerationResult {
  success: boolean;
  docx_base64?: string;
  file_name?: string;
  replacements_made?: number;
  from_database?: number;
  from_ai?: number;
  from_custom?: number;
  unmapped?: string[];
}

export default function TestGenerationDialog({
  open,
  onOpenChange,
  template,
}: TestGenerationDialogProps) {
  const {
    loading: dataLoading,
    buyerCompanies,
    sellerCompanies,
    ports,
    products,
    buyerBankAccounts,
    sellerBankAccounts,
    vessels,
    fetchAllData,
    fetchBuyerBankAccounts,
    fetchSellerBankAccounts,
  } = useSupabaseData();

  // Selection state
  const [selectedVessel, setSelectedVessel] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedDeparturePort, setSelectedDeparturePort] = useState('');
  const [selectedDestinationPort, setSelectedDestinationPort] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBuyerBank, setSelectedBuyerBank] = useState('');
  const [selectedSellerBank, setSelectedSellerBank] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  // Load data when dialog opens
  useEffect(() => {
    if (open && template) {
      fetchAllData();
      setResult(null);
    }
  }, [open, template, fetchAllData]);

  // Update bank accounts when company changes
  useEffect(() => {
    if (selectedBuyer) {
      fetchBuyerBankAccounts(selectedBuyer);
      setSelectedBuyerBank('');
    }
  }, [selectedBuyer, fetchBuyerBankAccounts]);

  useEffect(() => {
    if (selectedSeller) {
      fetchSellerBankAccounts(selectedSeller);
      setSelectedSellerBank('');
    }
  }, [selectedSeller, fetchSellerBankAccounts]);

  const handleGenerate = async () => {
    if (!template) return;
    
    if (!selectedVessel) {
      toast.error('Please select at least a vessel');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await documentApiFetch<GenerationResult>('/process-document', {
        method: 'POST',
        body: JSON.stringify({
          template_name: template.file_name,
          vessel_id: parseInt(selectedVessel),
          buyer_id: selectedBuyer || undefined,
          seller_id: selectedSeller || undefined,
          departure_port_id: selectedDeparturePort ? parseInt(selectedDeparturePort) : undefined,
          destination_port_id: selectedDestinationPort ? parseInt(selectedDestinationPort) : undefined,
          product_id: selectedProduct || undefined,
          buyer_bank_id: selectedBuyerBank || undefined,
          seller_bank_id: selectedSellerBank || undefined,
        }),
      });

      setResult(response);

      if (response.success && response.docx_base64) {
        // Download the generated document
        const byteCharacters = atob(response.docx_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.file_name || `${template.name}_generated.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          `Document generated! ${response.replacements_made || 0} placeholders replaced`
        );
      } else {
        toast.error('Failed to generate document');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const resetSelections = () => {
    setSelectedVessel('');
    setSelectedBuyer('');
    setSelectedSeller('');
    setSelectedDeparturePort('');
    setSelectedDestinationPort('');
    setSelectedProduct('');
    setSelectedBuyerBank('');
    setSelectedSellerBank('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Test Document Generation
          </DialogTitle>
          <DialogDescription>
            Generate a test document using "{template?.display_name || template?.name}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Template Placeholders Preview */}
            {template && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Template Placeholders ({template.placeholders.length})
                </Label>
                <div className="flex flex-wrap gap-1">
                  {template.placeholders.slice(0, 10).map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                  {template.placeholders.length > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.placeholders.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Data Source Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Select Data Sources
              </Label>

              {dataLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vessel - Required */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Ship className="h-3 w-3" />
                      Vessel *
                    </Label>
                    <Select value={selectedVessel} onValueChange={setSelectedVessel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vessel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vessels.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name} ({v.imo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Buyer Company */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Buyer Company
                    </Label>
                    <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select buyer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {buyerCompanies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seller Company */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Seller Company
                    </Label>
                    <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select seller..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sellerCompanies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Product
                    </Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.commodity_name || p.product_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Departure Port */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Anchor className="h-3 w-3" />
                      Departure Port
                    </Label>
                    <Select value={selectedDeparturePort} onValueChange={setSelectedDeparturePort}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select port..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ports.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}, {p.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destination Port */}
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Anchor className="h-3 w-3" />
                      Destination Port
                    </Label>
                    <Select value={selectedDestinationPort} onValueChange={setSelectedDestinationPort}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select port..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ports.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}, {p.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Buyer Bank Account */}
                  {selectedBuyer && (
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Buyer Bank Account
                      </Label>
                      <Select value={selectedBuyerBank} onValueChange={setSelectedBuyerBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank..." />
                        </SelectTrigger>
                        <SelectContent>
                          {buyerBankAccounts.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.bank_name} - {b.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Seller Bank Account */}
                  {selectedSeller && (
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        Seller Bank Account
                      </Label>
                      <Select value={selectedSellerBank} onValueChange={setSelectedSellerBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sellerBankAccounts.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.bank_name} - {b.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generation Result */}
            {result && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Generation Report</Label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <Database className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">From Database</p>
                        <p className="font-semibold text-green-600">{result.from_database || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">AI Generated</p>
                        <p className="font-semibold text-yellow-600">{result.from_ai || 0}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Replaced</p>
                        <p className="font-semibold text-blue-600">{result.replacements_made || 0}</p>
                      </div>
                    </div>
                  </div>

                  {result.unmapped && result.unmapped.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">Unmapped placeholders:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.unmapped.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={resetSelections}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !selectedVessel}>
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {generating ? 'Generating...' : 'Generate & Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
