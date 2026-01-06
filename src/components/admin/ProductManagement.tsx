import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Plus, Edit, Trash2, Search, Sparkles, Beaker, FileText, Globe, DollarSign, Truck, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OilProduct {
  id: string;
  product_code?: string;
  commodity_name: string;
  commodity_type?: string;
  grade?: string;
  sulphur_content_ppm?: number;
  origin?: string;
  origin_country?: string;
  destination_ports?: string[];
  loading_ports?: string[];
  discharge_ports?: string[];
  quantity_min_mt?: number;
  quantity_max_mt?: number;
  quantity_unit?: string;
  contract_type?: string;
  contract_duration_months?: number;
  option_months?: number;
  delivery_terms?: string;
  incoterms?: string;
  price_type?: string;
  price_basis?: string;
  price_reference?: string;
  premium_discount?: number;
  currency?: string;
  payment_terms?: string;
  payment_condition?: string;
  payment_days?: number;
  density_kg_m3?: number;
  flash_point_min_c?: number;
  viscosity_cst?: number;
  cetane_number_min?: number;
  cloud_point_c?: number;
  pour_point_c?: number;
  water_content_max_ppm?: number;
  ash_content_max?: number;
  carbon_residue_max?: number;
  distillation_range?: string;
  color_max?: number;
  oxidation_stability?: number;
  lubricity_um?: number;
  fame_content_max?: number;
  test_method?: string;
  lab_name?: string;
  lab_certificate_url?: string;
  analysis_date?: string;
  q88_document_url?: string;
  msds_url?: string;
  coa_url?: string;
  refinery_id?: string;
  supplier_company_id?: string;
  is_active?: boolean;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

const COMMODITY_TYPES = [
  'ULSD', 'Diesel', 'Gasoline', 'Jet Fuel', 'Crude Oil', 'LPG', 'Fuel Oil', 'Naphtha', 'Kerosene', 'Bitumen'
];

const GRADES = [
  'EN 590', 'EN 228', 'ASTM D975', 'ASTM D1655', 'Brent', 'WTI', 'Dubai', 'HSFO', 'VLSFO', 'MGO'
];

const DELIVERY_TERMS = ['FOB', 'CIF', 'CFR', 'DES', 'DAP', 'DDP', 'EXW', 'FCA'];

const PORTS = [
  'Rotterdam', 'Houston', 'Singapore', 'Fujairah', 'Jurong', 'Amsterdam', 'Antwerp', 'New York', 'Los Angeles', 'Jeddah', 'Dubai', 'Mumbai'
];

const ProductManagement = () => {
  const [products, setProducts] = useState<OilProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OilProduct | null>(null);
  const [formData, setFormData] = useState<Partial<OilProduct>>({
    is_active: true,
    status: 'available',
    currency: 'USD',
    quantity_unit: 'MT'
  });
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('oil_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as OilProduct[]);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const cleanData = {
        product_code: formData.product_code || null,
        commodity_name: formData.commodity_name || '',
        commodity_type: formData.commodity_type || null,
        grade: formData.grade || null,
        sulphur_content_ppm: formData.sulphur_content_ppm || null,
        origin: formData.origin || null,
        origin_country: formData.origin_country || null,
        destination_ports: formData.destination_ports || null,
        loading_ports: formData.loading_ports || null,
        discharge_ports: formData.discharge_ports || null,
        quantity_min_mt: formData.quantity_min_mt || null,
        quantity_max_mt: formData.quantity_max_mt || null,
        quantity_unit: formData.quantity_unit || 'MT',
        contract_type: formData.contract_type || null,
        contract_duration_months: formData.contract_duration_months || null,
        option_months: formData.option_months || null,
        delivery_terms: formData.delivery_terms || null,
        incoterms: formData.incoterms || null,
        price_type: formData.price_type || null,
        price_basis: formData.price_basis || null,
        price_reference: formData.price_reference || null,
        premium_discount: formData.premium_discount || null,
        currency: formData.currency || 'USD',
        payment_terms: formData.payment_terms || null,
        payment_condition: formData.payment_condition || null,
        payment_days: formData.payment_days || null,
        density_kg_m3: formData.density_kg_m3 || null,
        flash_point_min_c: formData.flash_point_min_c || null,
        viscosity_cst: formData.viscosity_cst || null,
        cetane_number_min: formData.cetane_number_min || null,
        cloud_point_c: formData.cloud_point_c || null,
        pour_point_c: formData.pour_point_c || null,
        water_content_max_ppm: formData.water_content_max_ppm || null,
        ash_content_max: formData.ash_content_max || null,
        carbon_residue_max: formData.carbon_residue_max || null,
        distillation_range: formData.distillation_range || null,
        color_max: formData.color_max || null,
        oxidation_stability: formData.oxidation_stability || null,
        lubricity_um: formData.lubricity_um || null,
        fame_content_max: formData.fame_content_max || null,
        test_method: formData.test_method || null,
        lab_name: formData.lab_name || null,
        lab_certificate_url: formData.lab_certificate_url || null,
        analysis_date: formData.analysis_date || null,
        q88_document_url: formData.q88_document_url || null,
        msds_url: formData.msds_url || null,
        coa_url: formData.coa_url || null,
        is_active: formData.is_active ?? true,
        status: formData.status || 'available',
        notes: formData.notes || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('oil_products')
          .update(cleanData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('oil_products')
          .insert([cleanData]);
        if (error) throw error;
      }

      toast({ title: "Success", description: editingProduct ? "Product updated successfully" : "Product created successfully" });
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      is_active: true,
      status: 'available',
      currency: 'USD',
      quantity_unit: 'MT'
    });
    setActiveTab('basic');
  };

  const handleAutoFill = async () => {
    if (!formData.commodity_name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a commodity name first",
        variant: "destructive"
      });
      return;
    }

    setIsAutoFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('autofill-product-data', {
        body: { 
          commodityName: formData.commodity_name,
          commodityType: formData.commodity_type,
          grade: formData.grade
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.data) {
        const aiData = data.data;
        setFormData(prev => ({
          ...prev,
          ...aiData,
          commodity_name: prev.commodity_name,
        }));
        
        toast({
          title: "Success",
          description: "Product specifications auto-filled successfully!",
        });
      } else {
        throw new Error(data?.error || 'Failed to auto-fill data');
      }
    } catch (error: any) {
      console.error('Auto-fill error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast({
        title: "Auto-fill Error",
        description: `Failed to auto-fill: ${errorMessage}. Please fill manually.`,
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('oil_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Product deleted successfully" });
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: OilProduct) => {
    setEditingProduct(product);
    setFormData(product);
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    return product.commodity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.commodity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.grade?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Oil Products Management
          </CardTitle>
          <CardDescription>
            Add, edit, and manage oil/petroleum products with detailed specifications (Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[95vh]">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Update product information' : 'Enter product details with specifications'}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[75vh] pr-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-4">
                        <TabsTrigger value="basic" className="text-xs"><FileText className="h-3 w-3 mr-1" />Basic</TabsTrigger>
                        <TabsTrigger value="origin" className="text-xs"><Globe className="h-3 w-3 mr-1" />Origin</TabsTrigger>
                        <TabsTrigger value="quantity" className="text-xs"><ClipboardList className="h-3 w-3 mr-1" />Quantity</TabsTrigger>
                        <TabsTrigger value="pricing" className="text-xs"><DollarSign className="h-3 w-3 mr-1" />Pricing</TabsTrigger>
                        <TabsTrigger value="specs" className="text-xs"><Beaker className="h-3 w-3 mr-1" />Specs</TabsTrigger>
                        <TabsTrigger value="analysis" className="text-xs"><FileText className="h-3 w-3 mr-1" />Analysis</TabsTrigger>
                        <TabsTrigger value="trading" className="text-xs"><Truck className="h-3 w-3 mr-1" />Trading</TabsTrigger>
                      </TabsList>

                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="commodity_name">Commodity Name *</Label>
                            <Input
                              id="commodity_name"
                              value={formData.commodity_name || ''}
                              onChange={(e) => setFormData({...formData, commodity_name: e.target.value})}
                              placeholder="e.g., ULSD EN 590 10ppm"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="product_code">Product Code</Label>
                            <Input
                              id="product_code"
                              value={formData.product_code || ''}
                              onChange={(e) => setFormData({...formData, product_code: e.target.value})}
                              placeholder="Unique product code"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="commodity_type">Commodity Type</Label>
                            <Select value={formData.commodity_type || ''} onValueChange={(value) => setFormData({...formData, commodity_type: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMODITY_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="grade">Grade/Specification</Label>
                            <Select value={formData.grade || ''} onValueChange={(value) => setFormData({...formData, grade: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {GRADES.map(grade => (
                                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="sulphur_content_ppm">Sulphur Content (ppm)</Label>
                          <Input
                            id="sulphur_content_ppm"
                            type="number"
                            value={formData.sulphur_content_ppm || ''}
                            onChange={(e) => setFormData({...formData, sulphur_content_ppm: parseInt(e.target.value)})}
                            placeholder="e.g., 10, 50, 500"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAutoFill}
                            disabled={!formData.commodity_name?.trim() || isAutoFilling}
                            className="w-full"
                          >
                            {isAutoFilling ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {isAutoFilling ? 'Auto-filling...' : 'AI Auto-Fill Specifications'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          AI will generate realistic product specifications based on the commodity name and type.
                        </p>
                      </TabsContent>

                      {/* Origin & Destination Tab */}
                      <TabsContent value="origin" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="origin">Origin</Label>
                            <Input
                              id="origin"
                              value={formData.origin || ''}
                              onChange={(e) => setFormData({...formData, origin: e.target.value})}
                              placeholder="e.g., NON-SANCTIONED"
                            />
                          </div>
                          <div>
                            <Label htmlFor="origin_country">Origin Country</Label>
                            <Input
                              id="origin_country"
                              value={formData.origin_country || ''}
                              onChange={(e) => setFormData({...formData, origin_country: e.target.value})}
                              placeholder="Source country"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="destination_ports">Destination Ports</Label>
                          <Input
                            id="destination_ports"
                            value={formData.destination_ports?.join(', ') || ''}
                            onChange={(e) => setFormData({...formData, destination_ports: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            placeholder="Rotterdam, Houston, Jurong, Fujairah (comma separated)"
                          />
                        </div>

                        <div>
                          <Label htmlFor="loading_ports">Loading Ports</Label>
                          <Input
                            id="loading_ports"
                            value={formData.loading_ports?.join(', ') || ''}
                            onChange={(e) => setFormData({...formData, loading_ports: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            placeholder="Available loading ports (comma separated)"
                          />
                        </div>

                        <div>
                          <Label htmlFor="discharge_ports">Discharge Ports</Label>
                          <Input
                            id="discharge_ports"
                            value={formData.discharge_ports?.join(', ') || ''}
                            onChange={(e) => setFormData({...formData, discharge_ports: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            placeholder="Available discharge ports (comma separated)"
                          />
                        </div>
                      </TabsContent>

                      {/* Quantity & Contract Tab */}
                      <TabsContent value="quantity" className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="quantity_min_mt">Min Quantity</Label>
                            <Input
                              id="quantity_min_mt"
                              type="number"
                              value={formData.quantity_min_mt || ''}
                              onChange={(e) => setFormData({...formData, quantity_min_mt: parseFloat(e.target.value)})}
                              placeholder="e.g., 50000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quantity_max_mt">Max Quantity</Label>
                            <Input
                              id="quantity_max_mt"
                              type="number"
                              value={formData.quantity_max_mt || ''}
                              onChange={(e) => setFormData({...formData, quantity_max_mt: parseFloat(e.target.value)})}
                              placeholder="e.g., 500000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quantity_unit">Unit</Label>
                            <Select value={formData.quantity_unit || 'MT'} onValueChange={(value) => setFormData({...formData, quantity_unit: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MT">MT (Metric Tons)</SelectItem>
                                <SelectItem value="BBL">BBL (Barrels)</SelectItem>
                                <SelectItem value="KG">KG (Kilograms)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contract_type">Contract Type</Label>
                            <Select value={formData.contract_type || ''} onValueChange={(value) => setFormData({...formData, contract_type: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SPOT">SPOT</SelectItem>
                                <SelectItem value="SPOT TRIAL">SPOT TRIAL</SelectItem>
                                <SelectItem value="LONG TERM">LONG TERM</SelectItem>
                                <SelectItem value="OPTION">OPTION</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="contract_duration_months">Contract Duration (Months)</Label>
                            <Input
                              id="contract_duration_months"
                              type="number"
                              value={formData.contract_duration_months || ''}
                              onChange={(e) => setFormData({...formData, contract_duration_months: parseInt(e.target.value)})}
                              placeholder="e.g., 12"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="option_months">Option Period (Months)</Label>
                          <Input
                            id="option_months"
                            type="number"
                            value={formData.option_months || ''}
                            onChange={(e) => setFormData({...formData, option_months: parseInt(e.target.value)})}
                            placeholder="Optional extension period"
                          />
                        </div>
                      </TabsContent>

                      {/* Pricing & Payment Tab */}
                      <TabsContent value="pricing" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="delivery_terms">Delivery Terms</Label>
                            <Select value={formData.delivery_terms || ''} onValueChange={(value) => setFormData({...formData, delivery_terms: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                              <SelectContent>
                                {DELIVERY_TERMS.map(term => (
                                  <SelectItem key={term} value={term}>{term}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="incoterms">Incoterms Version</Label>
                            <Select value={formData.incoterms || ''} onValueChange={(value) => setFormData({...formData, incoterms: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select version" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Incoterms 2020">Incoterms 2020</SelectItem>
                                <SelectItem value="Incoterms 2010">Incoterms 2010</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="price_type">Price Type</Label>
                            <Select value={formData.price_type || ''} onValueChange={(value) => setFormData({...formData, price_type: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TBD">TBD</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                                <SelectItem value="Platts+">Platts+</SelectItem>
                                <SelectItem value="Argus+">Argus+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="price_reference">Price Reference</Label>
                            <Select value={formData.price_reference || ''} onValueChange={(value) => setFormData({...formData, price_reference: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reference" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Platts">Platts</SelectItem>
                                <SelectItem value="Argus">Argus</SelectItem>
                                <SelectItem value="OPIS">OPIS</SelectItem>
                                <SelectItem value="ICE Brent">ICE Brent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="price_basis">Price Basis</Label>
                          <Input
                            id="price_basis"
                            value={formData.price_basis || ''}
                            onChange={(e) => setFormData({...formData, price_basis: e.target.value})}
                            placeholder="e.g., Based On Procedure & Source Refinery"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="payment_terms">Payment Terms</Label>
                            <Select value={formData.payment_terms || ''} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MT103/TT">MT103/TT</SelectItem>
                                <SelectItem value="LC">Letter of Credit (LC)</SelectItem>
                                <SelectItem value="SBLC">SBLC</SelectItem>
                                <SelectItem value="CAD">CAD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="payment_condition">Payment Condition</Label>
                            <Input
                              id="payment_condition"
                              value={formData.payment_condition || ''}
                              onChange={(e) => setFormData({...formData, payment_condition: e.target.value})}
                              placeholder="e.g., AFTER SUCCESSFUL DELIVERY"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={formData.currency || 'USD'} onValueChange={(value) => setFormData({...formData, currency: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="premium_discount">Premium/Discount</Label>
                            <Input
                              id="premium_discount"
                              type="number"
                              step="0.01"
                              value={formData.premium_discount || ''}
                              onChange={(e) => setFormData({...formData, premium_discount: parseFloat(e.target.value)})}
                              placeholder="Per unit"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Specifications Tab */}
                      <TabsContent value="specs" className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg mb-4">
                          <p className="text-sm text-muted-foreground">
                            Product specifications for EN 590 ULSD or similar products
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="density_kg_m3">Density (kg/m³ at 15°C)</Label>
                            <Input
                              id="density_kg_m3"
                              type="number"
                              step="0.1"
                              value={formData.density_kg_m3 || ''}
                              onChange={(e) => setFormData({...formData, density_kg_m3: parseFloat(e.target.value)})}
                              placeholder="820-845"
                            />
                          </div>
                          <div>
                            <Label htmlFor="flash_point_min_c">Flash Point Min (°C)</Label>
                            <Input
                              id="flash_point_min_c"
                              type="number"
                              value={formData.flash_point_min_c || ''}
                              onChange={(e) => setFormData({...formData, flash_point_min_c: parseFloat(e.target.value)})}
                              placeholder="55"
                            />
                          </div>
                          <div>
                            <Label htmlFor="viscosity_cst">Viscosity (cSt at 40°C)</Label>
                            <Input
                              id="viscosity_cst"
                              type="number"
                              step="0.1"
                              value={formData.viscosity_cst || ''}
                              onChange={(e) => setFormData({...formData, viscosity_cst: parseFloat(e.target.value)})}
                              placeholder="2.0-4.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="cetane_number_min">Cetane Number Min</Label>
                            <Input
                              id="cetane_number_min"
                              type="number"
                              value={formData.cetane_number_min || ''}
                              onChange={(e) => setFormData({...formData, cetane_number_min: parseFloat(e.target.value)})}
                              placeholder="51"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cloud_point_c">Cloud Point (°C)</Label>
                            <Input
                              id="cloud_point_c"
                              type="number"
                              value={formData.cloud_point_c || ''}
                              onChange={(e) => setFormData({...formData, cloud_point_c: parseFloat(e.target.value)})}
                              placeholder="-10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pour_point_c">Pour Point (°C)</Label>
                            <Input
                              id="pour_point_c"
                              type="number"
                              value={formData.pour_point_c || ''}
                              onChange={(e) => setFormData({...formData, pour_point_c: parseFloat(e.target.value)})}
                              placeholder="-15"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="water_content_max_ppm">Water Content Max (ppm)</Label>
                            <Input
                              id="water_content_max_ppm"
                              type="number"
                              value={formData.water_content_max_ppm || ''}
                              onChange={(e) => setFormData({...formData, water_content_max_ppm: parseFloat(e.target.value)})}
                              placeholder="200"
                            />
                          </div>
                          <div>
                            <Label htmlFor="ash_content_max">Ash Content Max (%)</Label>
                            <Input
                              id="ash_content_max"
                              type="number"
                              step="0.001"
                              value={formData.ash_content_max || ''}
                              onChange={(e) => setFormData({...formData, ash_content_max: parseFloat(e.target.value)})}
                              placeholder="0.01"
                            />
                          </div>
                          <div>
                            <Label htmlFor="carbon_residue_max">Carbon Residue Max (%)</Label>
                            <Input
                              id="carbon_residue_max"
                              type="number"
                              step="0.01"
                              value={formData.carbon_residue_max || ''}
                              onChange={(e) => setFormData({...formData, carbon_residue_max: parseFloat(e.target.value)})}
                              placeholder="0.30"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="distillation_range">Distillation Range</Label>
                            <Input
                              id="distillation_range"
                              value={formData.distillation_range || ''}
                              onChange={(e) => setFormData({...formData, distillation_range: e.target.value})}
                              placeholder="e.g., 250-350°C"
                            />
                          </div>
                          <div>
                            <Label htmlFor="color_max">Color Max (ASTM)</Label>
                            <Input
                              id="color_max"
                              type="number"
                              step="0.5"
                              value={formData.color_max || ''}
                              onChange={(e) => setFormData({...formData, color_max: parseFloat(e.target.value)})}
                              placeholder="2.0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="oxidation_stability">Oxidation Stability (min)</Label>
                            <Input
                              id="oxidation_stability"
                              type="number"
                              value={formData.oxidation_stability || ''}
                              onChange={(e) => setFormData({...formData, oxidation_stability: parseFloat(e.target.value)})}
                              placeholder="25"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lubricity_um">Lubricity (μm HFRR)</Label>
                            <Input
                              id="lubricity_um"
                              type="number"
                              value={formData.lubricity_um || ''}
                              onChange={(e) => setFormData({...formData, lubricity_um: parseFloat(e.target.value)})}
                              placeholder="460"
                            />
                          </div>
                          <div>
                            <Label htmlFor="fame_content_max">FAME Content Max (%)</Label>
                            <Input
                              id="fame_content_max"
                              type="number"
                              step="0.1"
                              value={formData.fame_content_max || ''}
                              onChange={(e) => setFormData({...formData, fame_content_max: parseFloat(e.target.value)})}
                              placeholder="7.0"
                            />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Analysis & Documents Tab */}
                      <TabsContent value="analysis" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="test_method">Test Method</Label>
                            <Select value={formData.test_method || ''} onValueChange={(value) => setFormData({...formData, test_method: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ASTM">ASTM</SelectItem>
                                <SelectItem value="IP">IP</SelectItem>
                                <SelectItem value="ISO">ISO</SelectItem>
                                <SelectItem value="EN">EN</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="lab_name">Laboratory Name</Label>
                            <Select value={formData.lab_name || ''} onValueChange={(value) => setFormData({...formData, lab_name: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lab" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SGS">SGS</SelectItem>
                                <SelectItem value="Intertek">Intertek</SelectItem>
                                <SelectItem value="Bureau Veritas">Bureau Veritas</SelectItem>
                                <SelectItem value="Saybolt">Saybolt</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="analysis_date">Analysis Date</Label>
                          <Input
                            id="analysis_date"
                            type="date"
                            value={formData.analysis_date || ''}
                            onChange={(e) => setFormData({...formData, analysis_date: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label htmlFor="lab_certificate_url">Lab Certificate URL</Label>
                          <Input
                            id="lab_certificate_url"
                            value={formData.lab_certificate_url || ''}
                            onChange={(e) => setFormData({...formData, lab_certificate_url: e.target.value})}
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="q88_document_url">Q88 Document URL</Label>
                          <Input
                            id="q88_document_url"
                            value={formData.q88_document_url || ''}
                            onChange={(e) => setFormData({...formData, q88_document_url: e.target.value})}
                            placeholder="https://..."
                          />
                        </div>

                        <div>
                          <Label htmlFor="msds_url">MSDS URL</Label>
                          <Input
                            id="msds_url"
                            value={formData.msds_url || ''}
                            onChange={(e) => setFormData({...formData, msds_url: e.target.value})}
                            placeholder="Material Safety Data Sheet URL"
                          />
                        </div>

                        <div>
                          <Label htmlFor="coa_url">Certificate of Analysis URL</Label>
                          <Input
                            id="coa_url"
                            value={formData.coa_url || ''}
                            onChange={(e) => setFormData({...formData, coa_url: e.target.value})}
                            placeholder="https://..."
                          />
                        </div>
                      </TabsContent>

                      {/* Trading Tab */}
                      <TabsContent value="trading" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status || 'available'} onValueChange={(value) => setFormData({...formData, status: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="reserved">Reserved</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                            <input
                              type="checkbox"
                              id="is_active"
                              checked={formData.is_active ?? true}
                              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="is_active">Active Product</Label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            placeholder="Additional notes about the product..."
                            rows={4}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingProduct ? 'Update Product' : 'Create Product'}
                      </Button>
                    </div>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold">{products.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-xl font-bold">{products.filter(p => p.status === 'available').length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="text-xl font-bold">{products.filter(p => p.status === 'reserved').length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{products.filter(p => p.is_active).length}</p>
            </Card>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{product.commodity_name}</p>
                              {product.product_code && <p className="text-xs text-muted-foreground">{product.product_code}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.commodity_type || '-'}</TableCell>
                        <TableCell>{product.grade || '-'}</TableCell>
                        <TableCell>
                          {product.quantity_min_mt && product.quantity_max_mt ? (
                            <span className="text-sm">
                              {product.quantity_min_mt.toLocaleString()} - {product.quantity_max_mt.toLocaleString()} {product.quantity_unit}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            product.status === 'available' ? 'default' :
                            product.status === 'reserved' ? 'secondary' :
                            product.status === 'sold' ? 'outline' : 'destructive'
                          }>
                            {product.status || 'available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductManagement;
