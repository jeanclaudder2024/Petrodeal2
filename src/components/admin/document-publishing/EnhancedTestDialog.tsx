import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, Ship, Building2, Anchor, Package, Landmark, Factory } from 'lucide-react';
import { useDocumentEntities } from './useDocumentEntities';
import { getDocumentApiUrl } from '@/config/documentApi';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  file_name: string;
  placeholders: string[];
}

interface EnhancedTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

export default function EnhancedTestDialog({ open, onOpenChange, template }: EnhancedTestDialogProps) {
  const { vessels, buyers, sellers, ports, products, buyerBanks, sellerBanks, refineries, loading } = useDocumentEntities();
  
  // Selection state
  const [selectedVessel, setSelectedVessel] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('');
  const [selectedDeparturePort, setSelectedDeparturePort] = useState('');
  const [selectedDestinationPort, setSelectedDestinationPort] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBuyerBank, setSelectedBuyerBank] = useState('');
  const [selectedSellerBank, setSelectedSellerBank] = useState('');
  const [selectedRefinery, setSelectedRefinery] = useState('');
  const [generating, setGenerating] = useState(false);

  // Filter bank accounts based on selected company
  const filteredBuyerBanks = selectedBuyer 
    ? buyerBanks.filter(b => b.company_id === selectedBuyer)
    : buyerBanks;
  
  const filteredSellerBanks = selectedSeller 
    ? sellerBanks.filter(b => b.company_id === selectedSeller)
    : sellerBanks;

  // Auto-select primary bank when company changes
  React.useEffect(() => {
    if (selectedBuyer) {
      const companyBanks = buyerBanks.filter(b => b.company_id === selectedBuyer);
      if (companyBanks.length === 1) {
        setSelectedBuyerBank(companyBanks[0].id);
      } else if (companyBanks.length > 0 && !filteredBuyerBanks.find(b => b.id === selectedBuyerBank)) {
        setSelectedBuyerBank(companyBanks[0].id);
      }
    }
  }, [selectedBuyer, buyerBanks]);

  React.useEffect(() => {
    if (selectedSeller) {
      const companyBanks = sellerBanks.filter(b => b.company_id === selectedSeller);
      if (companyBanks.length === 1) {
        setSelectedSellerBank(companyBanks[0].id);
      } else if (companyBanks.length > 0 && !filteredSellerBanks.find(b => b.id === selectedSellerBank)) {
        setSelectedSellerBank(companyBanks[0].id);
      }
    }
  }, [selectedSeller, sellerBanks]);

  // Helper to handle "none" selection - converts __none__ back to empty string
  const handleSelectChange = (setter: (value: string) => void) => (value: string) => {
    setter(value === '__none__' ? '' : value);
  };
  
  // Helper to convert empty string to __none__ for Select value prop
  const getSelectValue = (value: string) => value || '__none__';

  const handleGenerate = async () => {
    if (!template) return;

    setGenerating(true);
    try {
      const response = await fetch(`${getDocumentApiUrl()}/process-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: template.file_name,
          vessel_id: selectedVessel ? parseInt(selectedVessel) : undefined,
          buyer_id: selectedBuyer || undefined,
          seller_id: selectedSeller || undefined,
          departure_port_id: selectedDeparturePort ? parseInt(selectedDeparturePort) : undefined,
          destination_port_id: selectedDestinationPort ? parseInt(selectedDestinationPort) : undefined,
          product_id: selectedProduct || undefined,
          buyer_bank_id: selectedBuyerBank || undefined,
          seller_bank_id: selectedSellerBank || undefined,
          refinery_id: selectedRefinery || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let detail = `Request failed (${response.status})`;
        try {
          const err = JSON.parse(text);
          detail = err.detail || err.message || detail;
        } catch {
          if (text && !text.trimStart().startsWith('<')) detail = text.slice(0, 200);
        }
        throw new Error(detail);
      }

      const result = await response.json();

      if (result.success && result.docx_base64) {
        // Download the generated document
        const byteCharacters = atob(result.docx_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file_name || `${template.name}_generated.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const dbCount = result.from_database || 0;
        const aiCount = result.from_ai || 0;
        toast.success(`Document generated! ${dbCount} from DB, ${aiCount} from AI`);
        onOpenChange(false);
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

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Generate Document: {template.name}
          </DialogTitle>
          <DialogDescription>
            Select data sources for each entity type. Only selected entities will be included.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="entities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entities">Select Entities</TabsTrigger>
            <TabsTrigger value="placeholders">Placeholders ({template.placeholders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="entities">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4 py-4">
                {/* Vessel */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-blue-500" />
                    Vessel
                  </Label>
                  <Select value={getSelectValue(selectedVessel)} onValueChange={handleSelectChange(setSelectedVessel)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select vessel (${vessels.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {vessels.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.name} {v.imo && `(IMO: ${v.imo})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Buyer */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-green-500" />
                    Buyer Company
                  </Label>
                  <Select value={getSelectValue(selectedBuyer)} onValueChange={handleSelectChange(setSelectedBuyer)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select buyer (${buyers.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {buyers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} {b.country && `(${b.country})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seller */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-500" />
                    Seller Company
                  </Label>
                  <Select value={getSelectValue(selectedSeller)} onValueChange={handleSelectChange(setSelectedSeller)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select seller (${sellers.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {sellers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.country && `(${s.country})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Departure Port */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-cyan-500" />
                    Departure Port
                  </Label>
                  <Select value={getSelectValue(selectedDeparturePort)} onValueChange={handleSelectChange(setSelectedDeparturePort)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select port (${ports.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {ports.map((p) => (
                        <SelectItem key={`dep-${p.id}`} value={String(p.id)}>
                          {p.name} {p.country && `(${p.country})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Destination Port */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-purple-500" />
                    Destination Port
                  </Label>
                  <Select value={getSelectValue(selectedDestinationPort)} onValueChange={handleSelectChange(setSelectedDestinationPort)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select port (${ports.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {ports.map((p) => (
                        <SelectItem key={`dest-${p.id}`} value={String(p.id)}>
                          {p.name} {p.country && `(${p.country})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" />
                    Product
                  </Label>
                  <Select value={getSelectValue(selectedProduct)} onValueChange={handleSelectChange(setSelectedProduct)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select product (${products.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.commodity_name || p.product_code || 'Unnamed Product'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Refinery */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-red-500" />
                    Refinery
                  </Label>
                  <Select value={getSelectValue(selectedRefinery)} onValueChange={handleSelectChange(setSelectedRefinery)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select refinery (${refineries.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {refineries.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} {r.country && `(${r.country})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Buyer Bank */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-emerald-500" />
                    Buyer Bank
                    {selectedBuyer && filteredBuyerBanks.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        Auto-filtered
                      </Badge>
                    )}
                  </Label>
                  <Select value={getSelectValue(selectedBuyerBank)} onValueChange={handleSelectChange(setSelectedBuyerBank)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select bank (${filteredBuyerBanks.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {filteredBuyerBanks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bank_name} - {b.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seller Bank */}
                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                  <Label className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-rose-500" />
                    Seller Bank
                    {selectedSeller && filteredSellerBanks.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] ml-1">
                        Auto-filtered
                      </Badge>
                    )}
                  </Label>
                  <Select value={getSelectValue(selectedSellerBank)} onValueChange={handleSelectChange(setSelectedSellerBank)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select bank (${filteredSellerBanks.length} available)`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None --</SelectItem>
                      {filteredSellerBanks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bank_name} - {b.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="placeholders">
            <ScrollArea className="h-[400px]">
              <div className="flex flex-wrap gap-1 p-4">
                {template.placeholders.map((p, i) => {
                  // Color code based on detected source
                  const isVessel = p.toLowerCase().startsWith('vessel_');
                  const isBuyer = p.toLowerCase().startsWith('buyer_') && !p.toLowerCase().includes('bank');
                  const isSeller = p.toLowerCase().startsWith('seller_') && !p.toLowerCase().includes('bank');
                  const isPort = p.toLowerCase().includes('port_');
                  const isProduct = p.toLowerCase().startsWith('product_');
                  const isBank = p.toLowerCase().includes('bank_');
                  
                  let variant: 'default' | 'secondary' | 'outline' = 'outline';
                  if (isVessel || isBuyer || isSeller || isPort || isProduct || isBank) {
                    variant = 'default';
                  }

                  return (
                    <Badge 
                      key={i} 
                      variant={variant}
                      className={`text-xs ${
                        isVessel ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        isBuyer ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        isSeller ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        isPort ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' :
                        isProduct ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                        isBank ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                        ''
                      }`}
                    >
                      {p}
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating || loading}>
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
