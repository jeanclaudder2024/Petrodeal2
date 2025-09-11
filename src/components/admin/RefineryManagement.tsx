import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Factory, Plus, Edit, Trash2, Search, MapPin, Sparkles, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, supabase } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import LocationPicker from '@/components/ui/location-picker';

interface Refinery {
  id: string;
  name?: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
  type?: string;
  capacity?: number;
  processing_capacity?: number;
  storage_capacity?: number;
  lat?: number;
  lng?: number;
  status?: string;
  description?: string;
  operator?: string;
  owner?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_year?: number;
  workforce_size?: number;
  annual_revenue?: number;
  products?: string;
  fuel_types?: string;
  processing_units?: string;
  crude_oil_sources?: string;
  pipeline_connections?: string;
  shipping_terminals?: string;
  rail_connections?: string;
  environmental_certifications?: string;
  complexity?: string;
  utilization?: number;
  annual_throughput?: number;
  daily_throughput?: number;
  operational_efficiency?: number;
  investment_cost?: number;
  operating_costs?: number;
  profit_margin?: number;
  market_share?: number;
  technical_specs?: string;
  created_at?: string;
}

const RefineryManagement = () => {
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRefinery, setEditingRefinery] = useState<Refinery | null>(null);
  const [formData, setFormData] = useState<Partial<Refinery>>({});
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRefineries();
  }, []);

  const fetchRefineries = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('refineries')
        .select('*')
        .order('name');

      if (error) throw error;
      setRefineries(data || []);
    } catch (error) {
      console.error('Failed to fetch refineries:', error);
      toast({
        title: "Error",
        description: "Failed to load refineries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRefinery) {
        const { error } = await db
          .from('refineries')
          .update(formData)
          .eq('id', editingRefinery.id);
        if (error) throw error;
        toast({ title: "Success", description: "Refinery updated successfully" });
      } else {
        const { error } = await db
          .from('refineries')
          .insert([formData]);
        if (error) throw error;
        toast({ title: "Success", description: "Refinery created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingRefinery(null);
      setFormData({});
      fetchRefineries();
    } catch (error) {
      console.error('Failed to save refinery:', error);
      toast({
        title: "Error",
        description: "Failed to save refinery",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this refinery?')) return;
    
    try {
      const { error } = await db
        .from('refineries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Refinery deleted successfully" });
      fetchRefineries();
    } catch (error) {
      console.error('Failed to delete refinery:', error);
      toast({
        title: "Error",
        description: "Failed to delete refinery",
        variant: "destructive"
      });
    }
  };

  const handleAutoFill = async () => {
    const refineryName = formData.name;
    if (!refineryName) {
      toast({
        title: "Error",
        description: "Please enter a refinery name first",
        variant: "destructive"
      });
      return;
    }

    setIsAutoFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('autofill-refinery-data', {
        body: { refineryName }
      });

      if (error) throw error;

      if (data?.refineryData) {
        setFormData(data.refineryData);
        toast({
          title: "Success",
          description: "Refinery data filled automatically",
        });
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast({
        title: "Error",
        description: "Failed to auto-fill refinery data",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const filteredRefineries = refineries.filter(refinery =>
    refinery.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refinery.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refinery.operator?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToXLSX = () => {
    const exportData = filteredRefineries.map(refinery => ({
      'Refinery Name': refinery.name || '',
      'Country': refinery.country || '',
      'Region': refinery.region || '',
      'City': refinery.city || '',
      'Type': refinery.type || '',
      'Status': refinery.status || '',
      'Capacity': refinery.capacity || '',
      'Processing Capacity': refinery.processing_capacity || '',
      'Storage Capacity': refinery.storage_capacity || '',
      'Latitude': refinery.lat || '',
      'Longitude': refinery.lng || '',
      'Operator': refinery.operator || '',
      'Owner': refinery.owner || '',
      'Established Year': refinery.established_year || '',
      'Workforce Size': refinery.workforce_size || '',
      'Annual Revenue': refinery.annual_revenue || '',
      'Products': refinery.products || '',
      'Fuel Types': refinery.fuel_types || '',
      'Phone': refinery.phone || '',
      'Email': refinery.email || '',
      'Website': refinery.website || '',
      'Utilization': refinery.utilization || '',
      'Annual Throughput': refinery.annual_throughput || '',
      'Daily Throughput': refinery.daily_throughput || '',
      'Operational Efficiency': refinery.operational_efficiency || '',
      'Created At': refinery.created_at || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Refineries');
    
    const fileName = `refineries_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} refineries to ${fileName}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            Refinery Management
          </CardTitle>
          <CardDescription>
            Add, edit, and manage refineries in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search refineries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={exportToXLSX}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export XLSX
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingRefinery(null);
                  setFormData({});
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Refinery
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingRefinery ? 'Edit Refinery' : 'Add New Refinery'}</DialogTitle>
                  <DialogDescription>
                    {editingRefinery ? 'Update refinery information' : 'Enter refinery details to add to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                      <TabsTrigger value="capacity">Capacity</TabsTrigger>
                      <TabsTrigger value="operations">Operations</TabsTrigger>
                      <TabsTrigger value="business">Business</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAutoFill}
                          disabled={isAutoFilling || !formData.name}
                          className="flex items-center gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {isAutoFilling ? 'Filling...' : 'AI Auto-Fill'}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Enter refinery name first, then click to auto-fill all fields
                        </span>
                      </div>
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country || ''}
                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="region">Region</Label>
                          <Input
                            id="region"
                            value={formData.region || ''}
                            onChange={(e) => setFormData({...formData, region: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={formData.city || ''}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="established_year">Established Year</Label>
                          <Input
                            id="established_year"
                            type="number"
                            value={formData.established_year || ''}
                            onChange={(e) => setFormData({...formData, established_year: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Input
                            id="type"
                            value={formData.type || ''}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Input
                            id="status"
                            value={formData.status || ''}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Label className="text-sm font-medium">Refinery Location</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsLocationPickerOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <MapPin className="h-4 w-4" />
                            {isLocationPickerOpen ? 'Close Map' : 'Select on Map'}
                          </Button>
                        </div>
                        
                        {isLocationPickerOpen && (
                          <div className="border rounded-lg p-4 bg-muted/10">
                            <LocationPicker
                              lat={formData.lat || 0}
                              lng={formData.lng || 0}
                              onLocationSelect={(lat, lng) => {
                                setFormData({...formData, lat, lng});
                                setIsLocationPickerOpen(false);
                                toast({
                                  title: "Success",
                                  description: "Location updated successfully",
                                });
                              }}
                              isOpen={true}
                              onClose={() => setIsLocationPickerOpen(false)}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lat">Latitude</Label>
                            <Input
                              id="lat"
                              type="number"
                              step="any"
                              value={formData.lat || ''}
                              onChange={(e) => setFormData({...formData, lat: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lng">Longitude</Label>
                            <Input
                              id="lng"
                              type="number"
                              step="any"
                              value={formData.lng || ''}
                              onChange={(e) => setFormData({...formData, lng: parseFloat(e.target.value)})}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            value={formData.website || ''}
                            onChange={(e) => setFormData({...formData, website: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="operator">Operator</Label>
                          <Input
                            id="operator"
                            value={formData.operator || ''}
                            onChange={(e) => setFormData({...formData, operator: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="owner">Owner</Label>
                          <Input
                            id="owner"
                            value={formData.owner || ''}
                            onChange={(e) => setFormData({...formData, owner: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="pipeline_connections">Pipeline Connections</Label>
                        <Textarea
                          id="pipeline_connections"
                          value={formData.pipeline_connections || ''}
                          onChange={(e) => setFormData({...formData, pipeline_connections: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping_terminals">Shipping Terminals</Label>
                        <Textarea
                          id="shipping_terminals"
                          value={formData.shipping_terminals || ''}
                          onChange={(e) => setFormData({...formData, shipping_terminals: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="rail_connections">Rail Connections</Label>
                        <Textarea
                          id="rail_connections"
                          value={formData.rail_connections || ''}
                          onChange={(e) => setFormData({...formData, rail_connections: e.target.value})}
                          rows={2}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="capacity" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="capacity">Total Capacity (bpd)</Label>
                          <Input
                            id="capacity"
                            type="number"
                            value={formData.capacity || ''}
                            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="processing_capacity">Processing Capacity (bpd)</Label>
                          <Input
                            id="processing_capacity"
                            type="number"
                            value={formData.processing_capacity || ''}
                            onChange={(e) => setFormData({...formData, processing_capacity: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="storage_capacity">Storage Capacity (barrels)</Label>
                          <Input
                            id="storage_capacity"
                            type="number"
                            value={formData.storage_capacity || ''}
                            onChange={(e) => setFormData({...formData, storage_capacity: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="annual_throughput">Annual Throughput (barrels)</Label>
                          <Input
                            id="annual_throughput"
                            type="number"
                            value={formData.annual_throughput || ''}
                            onChange={(e) => setFormData({...formData, annual_throughput: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="daily_throughput">Daily Throughput (bpd)</Label>
                          <Input
                            id="daily_throughput"
                            type="number"
                            value={formData.daily_throughput || ''}
                            onChange={(e) => setFormData({...formData, daily_throughput: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="utilization">Utilization (%)</Label>
                          <Input
                            id="utilization"
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={formData.utilization || ''}
                            onChange={(e) => setFormData({...formData, utilization: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="complexity">Complexity</Label>
                        <Input
                          id="complexity"
                          value={formData.complexity || ''}
                          onChange={(e) => setFormData({...formData, complexity: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="processing_units">Processing Units</Label>
                        <Textarea
                          id="processing_units"
                          value={formData.processing_units || ''}
                          onChange={(e) => setFormData({...formData, processing_units: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="technical_specs">Technical Specifications</Label>
                        <Textarea
                          id="technical_specs"
                          value={formData.technical_specs || ''}
                          onChange={(e) => setFormData({...formData, technical_specs: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="operations" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="workforce_size">Workforce Size</Label>
                          <Input
                            id="workforce_size"
                            type="number"
                            value={formData.workforce_size || ''}
                            onChange={(e) => setFormData({...formData, workforce_size: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="operational_efficiency">Operational Efficiency (%)</Label>
                          <Input
                            id="operational_efficiency"
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={formData.operational_efficiency || ''}
                            onChange={(e) => setFormData({...formData, operational_efficiency: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="products">Products</Label>
                        <Textarea
                          id="products"
                          value={formData.products || ''}
                          onChange={(e) => setFormData({...formData, products: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fuel_types">Fuel Types</Label>
                        <Textarea
                          id="fuel_types"
                          value={formData.fuel_types || ''}
                          onChange={(e) => setFormData({...formData, fuel_types: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="crude_oil_sources">Crude Oil Sources</Label>
                        <Textarea
                          id="crude_oil_sources"
                          value={formData.crude_oil_sources || ''}
                          onChange={(e) => setFormData({...formData, crude_oil_sources: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="environmental_certifications">Environmental Certifications</Label>
                        <Textarea
                          id="environmental_certifications"
                          value={formData.environmental_certifications || ''}
                          onChange={(e) => setFormData({...formData, environmental_certifications: e.target.value})}
                          rows={2}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="annual_revenue">Annual Revenue (USD)</Label>
                          <Input
                            id="annual_revenue"
                            type="number"
                            step="any"
                            value={formData.annual_revenue || ''}
                            onChange={(e) => setFormData({...formData, annual_revenue: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="investment_cost">Investment Cost (USD)</Label>
                          <Input
                            id="investment_cost"
                            type="number"
                            step="any"
                            value={formData.investment_cost || ''}
                            onChange={(e) => setFormData({...formData, investment_cost: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="operating_costs">Operating Costs (USD)</Label>
                          <Input
                            id="operating_costs"
                            type="number"
                            step="any"
                            value={formData.operating_costs || ''}
                            onChange={(e) => setFormData({...formData, operating_costs: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="profit_margin">Profit Margin (%)</Label>
                          <Input
                            id="profit_margin"
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={formData.profit_margin || ''}
                            onChange={(e) => setFormData({...formData, profit_margin: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="market_share">Market Share (%)</Label>
                        <Input
                          id="market_share"
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={formData.market_share || ''}
                          onChange={(e) => setFormData({...formData, market_share: parseFloat(e.target.value)})}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingRefinery ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{refineries.length}</div>
              <div className="text-sm text-muted-foreground">Total Refineries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {refineries.filter(r => r.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {new Set(refineries.map(r => r.country).filter(Boolean)).size}
              </div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {filteredRefineries.length}
              </div>
              <div className="text-sm text-muted-foreground">Filtered Results</div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredRefineries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No refineries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefineries.map((refinery) => (
                    <TableRow key={refinery.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{refinery.name || 'N/A'}</TableCell>
                      <TableCell>{refinery.country || 'N/A'}</TableCell>
                      <TableCell>{refinery.operator || 'N/A'}</TableCell>
                      <TableCell>
                        {refinery.capacity ? `${refinery.capacity.toLocaleString()} bpd` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          refinery.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {refinery.status || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRefinery(refinery);
                              setFormData(refinery);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(refinery.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LocationPicker
        lat={formData.lat}
        lng={formData.lng}
        onLocationSelect={(lat, lng) => {
          setFormData({...formData, lat, lng});
          setIsLocationPickerOpen(false);
        }}
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
      />
    </div>
  );
};

export default RefineryManagement;