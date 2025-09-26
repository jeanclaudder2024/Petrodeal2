import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Edit, Trash2, Search, Sparkles, Eye, EyeOff, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Port {
  id: number;
  name?: string;
  country?: string;
  region?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  port_type?: string;
  type?: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  status?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  owner?: string;
  operator?: string;
  port_authority?: string;
  facilities?: string;
  services?: string;
  operating_hours?: string;
  cargo_types?: string;
  berth_count?: number;
  terminal_count?: number;
  max_vessel_length?: number;
  max_vessel_beam?: number;
  max_draught?: number;
  max_deadweight?: number;
  channel_depth?: number;
  berth_depth?: number;
  anchorage_depth?: number;
  pilotage_required?: boolean;
  tug_assistance?: boolean;
  customs_office?: boolean;
  quarantine_station?: boolean;
  free_trade_zone?: boolean;
  rail_connection?: boolean;
  road_connection?: boolean;
  security_level?: string;
  environmental_certifications?: string;
  port_charges?: number;
  average_wait_time?: number;
  tidal_range?: number;
  airport_distance?: number;
  established?: number;
  annual_throughput?: number;
  vessel_count?: number;
  total_cargo?: number;
  created_at?: string;
}

const PortManagement = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [formData, setFormData] = useState<Partial<Port>>({});
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [mapContainer, setMapContainer] = useState<L.Map | null>(null);
  const { toast } = useToast();

  const portTypes = [
    'container',
    'oil',
    'gas', 
    'cargo',
    'fishing',
    'cruise',
    'military',
    'industrial',
    'bulk',
    'general'
  ];

  useEffect(() => {
    fetchPorts();
  }, []);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('ports')
        .select('*')
        .order('name');

      if (error) throw error;
      setPorts(data || []);
    } catch (error) {
      console.error('Failed to fetch ports:', error);
      toast({
        title: "Error",
        description: "Failed to load ports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoFillPortData = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a port name first",
        variant: "destructive"
      });
      return;
    }

    setIsAutoFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('autofill-port-data', {
        body: { portName: formData.name.trim() }
      });

      if (error) throw error;

      if (data.success) {
        const aiData = data.data;
        setFormData(prev => ({
          ...prev,
          ...aiData,
          name: prev.name // Keep the original name
        }));
        
        toast({
          title: "Success",
          description: "Port data auto-filled successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to auto-fill port data');
      }
    } catch (error: any) {
      console.error('Auto-fill error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to auto-fill port data",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const initializeMap = () => {
    if (mapContainer) return;

    const mapDiv = document.getElementById('port-map');
    if (!mapDiv) return;

    const map = L.map(mapDiv).setView([
      formData.lat || 51.505, 
      formData.lng || -0.09
    ], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let marker: L.Marker | null = null;

    // Add existing marker if coordinates exist
    if (formData.lat && formData.lng) {
      marker = L.marker([formData.lat, formData.lng]).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Remove existing marker
      if (marker) {
        map.removeLayer(marker);
      }
      
      // Add new marker
      marker = L.marker([lat, lng]).addTo(map);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6))
      }));
    });

    setMapContainer(map);
  };

  const toggleMap = () => {
    setIsMapVisible(!isMapVisible);
    if (!isMapVisible) {
      // Delay map initialization to ensure DOM element exists
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  };

  // Cleanup map when dialog closes
  useEffect(() => {
    if (!isDialogOpen && mapContainer) {
      mapContainer.remove();
      setMapContainer(null);
      setIsMapVisible(false);
    }
  }, [isDialogOpen, mapContainer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Port name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingPort) {
        // For updates, only send the fields that can be updated
        const updateData = {
          name: formData.name?.trim(),
          country: formData.country || null,
          region: formData.region || null,
          city: formData.city || null,
          address: formData.address || null,
          postal_code: formData.postal_code || null,
          port_type: formData.port_type || null,
          status: formData.status || null,
          description: formData.description || null,
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          lat: formData.lat ? Number(formData.lat) : null,
          lng: formData.lng ? Number(formData.lng) : null,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          annual_throughput: formData.annual_throughput ? Number(formData.annual_throughput) : null,
          berth_count: formData.berth_count ? Number(formData.berth_count) : null,
          terminal_count: formData.terminal_count ? Number(formData.terminal_count) : null,
          max_vessel_length: formData.max_vessel_length ? Number(formData.max_vessel_length) : null,
          max_vessel_beam: formData.max_vessel_beam ? Number(formData.max_vessel_beam) : null,
          max_draught: formData.max_draught ? Number(formData.max_draught) : null,
          max_deadweight: formData.max_deadweight ? Number(formData.max_deadweight) : null,
          channel_depth: formData.channel_depth ? Number(formData.channel_depth) : null,
          berth_depth: formData.berth_depth ? Number(formData.berth_depth) : null,
          anchorage_depth: formData.anchorage_depth ? Number(formData.anchorage_depth) : null,
          pilotage_required: Boolean(formData.pilotage_required),
          tug_assistance: Boolean(formData.tug_assistance),
          customs_office: Boolean(formData.customs_office),
          quarantine_station: Boolean(formData.quarantine_station),
          free_trade_zone: Boolean(formData.free_trade_zone),
          rail_connection: Boolean(formData.rail_connection),
          road_connection: Boolean(formData.road_connection),
          port_charges: formData.port_charges ? Number(formData.port_charges) : null,
          average_wait_time: formData.average_wait_time ? Number(formData.average_wait_time) : null,
          tidal_range: formData.tidal_range ? Number(formData.tidal_range) : null,
          airport_distance: formData.airport_distance ? Number(formData.airport_distance) : null,
          established: formData.established ? Number(formData.established) : null,
          vessel_count: formData.vessel_count ? Number(formData.vessel_count) : null,
          total_cargo: formData.total_cargo ? Number(formData.total_cargo) : null,
          owner: formData.owner || null,
          operator: formData.operator || null,
          port_authority: formData.port_authority || null,
          facilities: formData.facilities || null,
          services: formData.services || null,
          operating_hours: formData.operating_hours || null,
          cargo_types: formData.cargo_types || null,
          security_level: formData.security_level || null,
          environmental_certifications: formData.environmental_certifications || null
        };

        const { error } = await db
          .from('ports')
          .update(updateData)
          .eq('id', editingPort.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Port updated successfully" });
      } else {
        // For new ports, create a clean insert object without any ID fields
        const insertData = {
          name: formData.name.trim(),
          country: formData.country || null,
          region: formData.region || null,
          city: formData.city || null,
          address: formData.address || null,
          postal_code: formData.postal_code || null,
          port_type: formData.port_type || null,
          status: formData.status || null,
          description: formData.description || null,
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          lat: formData.lat ? Number(formData.lat) : null,
          lng: formData.lng ? Number(formData.lng) : null,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          annual_throughput: formData.annual_throughput ? Number(formData.annual_throughput) : null,
          berth_count: formData.berth_count ? Number(formData.berth_count) : null,
          terminal_count: formData.terminal_count ? Number(formData.terminal_count) : null,
          max_vessel_length: formData.max_vessel_length ? Number(formData.max_vessel_length) : null,
          max_vessel_beam: formData.max_vessel_beam ? Number(formData.max_vessel_beam) : null,
          max_draught: formData.max_draught ? Number(formData.max_draught) : null,
          max_deadweight: formData.max_deadweight ? Number(formData.max_deadweight) : null,
          channel_depth: formData.channel_depth ? Number(formData.channel_depth) : null,
          berth_depth: formData.berth_depth ? Number(formData.berth_depth) : null,
          anchorage_depth: formData.anchorage_depth ? Number(formData.anchorage_depth) : null,
          pilotage_required: Boolean(formData.pilotage_required),
          tug_assistance: Boolean(formData.tug_assistance),
          customs_office: Boolean(formData.customs_office),
          quarantine_station: Boolean(formData.quarantine_station),
          free_trade_zone: Boolean(formData.free_trade_zone),
          rail_connection: Boolean(formData.rail_connection),
          road_connection: Boolean(formData.road_connection),
          port_charges: formData.port_charges ? Number(formData.port_charges) : null,
          average_wait_time: formData.average_wait_time ? Number(formData.average_wait_time) : null,
          tidal_range: formData.tidal_range ? Number(formData.tidal_range) : null,
          airport_distance: formData.airport_distance ? Number(formData.airport_distance) : null,
          established: formData.established ? Number(formData.established) : null,
          vessel_count: formData.vessel_count ? Number(formData.vessel_count) : null,
          total_cargo: formData.total_cargo ? Number(formData.total_cargo) : null,
          owner: formData.owner || null,
          operator: formData.operator || null,
          port_authority: formData.port_authority || null,
          facilities: formData.facilities || null,
          services: formData.services || null,
          operating_hours: formData.operating_hours || null,
          cargo_types: formData.cargo_types || null,
          security_level: formData.security_level || null,
          environmental_certifications: formData.environmental_certifications || null
        };

        const { error } = await db
          .from('ports')
          .insert([insertData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Port created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingPort(null);
      setFormData({});
      fetchPorts();
    } catch (error: any) {
      console.error('Failed to save port:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save port",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await db
        .from('ports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Port deleted successfully" });
      fetchPorts();
    } catch (error: any) {
      console.error('Failed to delete port:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete port",
        variant: "destructive"
      });
    }
  };

  const filteredPorts = ports.filter(port =>
    port.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToXLSX = () => {
    const exportData = filteredPorts.map(port => ({
      'Port Name': port.name || '',
      'Country': port.country || '',
      'Region': port.region || '',
      'City': port.city || '',
      'Port Type': port.port_type || '',
      'Status': port.status || '',
      'Latitude': port.lat || '',
      'Longitude': port.lng || '',
      'Capacity': port.capacity || '',
      'Berth Count': port.berth_count || '',
      'Terminal Count': port.terminal_count || '',
      'Max Vessel Length': port.max_vessel_length || '',
      'Max Draught': port.max_draught || '',
      'Phone': port.phone || '',
      'Email': port.email || '',
      'Website': port.website || '',
      'Owner': port.owner || '',
      'Operator': port.operator || '',
      'Port Authority': port.port_authority || '',
      'Annual Throughput': port.annual_throughput || '',
      'Created At': port.created_at || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ports');
    
    const fileName = `ports_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Success",
      description: `Exported ${exportData.length} ports to ${fileName}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Port Management
          </CardTitle>
          <CardDescription>
            Add, edit, and manage ports in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search ports..."
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
                <Button onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingPort(null);
                  setFormData({});
                  setIsDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Port
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPort ? 'Edit Port' : 'Add New Port'}</DialogTitle>
                  <DialogDescription>
                    {editingPort ? 'Update port information' : 'Enter port details to add to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6" onClick={(e) => e.stopPropagation()}>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                      <TabsTrigger value="specifications">Specifications</TabsTrigger>
                      <TabsTrigger value="facilities">Facilities</TabsTrigger>
                      <TabsTrigger value="operations">Operations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={autoFillPortData}
                            disabled={isAutoFilling || !formData.name?.trim()}
                            className="flex items-center gap-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            {isAutoFilling ? 'Auto-filling...' : 'AI Auto-fill'}
                          </Button>
                        </div>
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
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            value={formData.postal_code || ''}
                            onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
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
                          <Label htmlFor="port_type">Port Type</Label>
                          <Select
                            value={formData.port_type || ''}
                            onValueChange={(value) => setFormData({...formData, port_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select port type" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg">
                              {portTypes.map(type => (
                                <SelectItem key={type} value={type} className="hover:bg-accent">
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status || ''}
                            onValueChange={(value) => setFormData({...formData, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg">
                              <SelectItem value="Active" className="hover:bg-accent">Active</SelectItem>
                              <SelectItem value="Inactive" className="hover:bg-accent">Inactive</SelectItem>
                              <SelectItem value="Under Construction" className="hover:bg-accent">Under Construction</SelectItem>
                              <SelectItem value="Maintenance" className="hover:bg-accent">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Label className="text-sm font-medium">Port Location</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleMap}
                            className="flex items-center gap-2"
                          >
                            {isMapVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {isMapVisible ? 'Hide Map' : 'Show Map'}
                          </Button>
                        </div>
                        
                        {isMapVisible && (
                          <div className="border rounded-lg overflow-hidden">
                            <div 
                              id="port-map" 
                              className="w-full h-64"
                              style={{ minHeight: '250px' }}
                            />
                            <div className="p-2 bg-muted text-sm text-muted-foreground">
                              Click on the map to select coordinates
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lat">Latitude</Label>
                            <Input
                              id="lat"
                              type="number"
                              step="any"
                              value={formData.lat?.toString() || ''}
                              onChange={(e) => setFormData({...formData, lat: e.target.value ? parseFloat(e.target.value) : undefined})}
                              placeholder="Enter latitude"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lng">Longitude</Label>
                            <Input
                              id="lng"
                              type="number"
                              step="any"
                              value={formData.lng?.toString() || ''}
                              onChange={(e) => setFormData({...formData, lng: e.target.value ? parseFloat(e.target.value) : undefined})}
                              placeholder="Enter longitude"
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
                          <Label htmlFor="airport_distance">Airport Distance (km)</Label>
                          <Input
                            id="airport_distance"
                            type="number"
                            step="any"
                            value={formData.airport_distance || ''}
                            onChange={(e) => setFormData({...formData, airport_distance: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="established">Established Year</Label>
                          <Input
                            id="established"
                            type="number"
                            value={formData.established || ''}
                            onChange={(e) => setFormData({...formData, established: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rail_connection"
                            checked={formData.rail_connection || false}
                            onCheckedChange={(checked) => setFormData({...formData, rail_connection: checked as boolean})}
                          />
                          <Label htmlFor="rail_connection">Rail Connection</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="road_connection"
                            checked={formData.road_connection || false}
                            onCheckedChange={(checked) => setFormData({...formData, road_connection: checked as boolean})}
                          />
                          <Label htmlFor="road_connection">Road Connection</Label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="specifications" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="capacity">Capacity</Label>
                          <Input
                            id="capacity"
                            type="number"
                            value={formData.capacity || ''}
                            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="annual_throughput">Annual Throughput</Label>
                          <Input
                            id="annual_throughput"
                            type="number"
                            value={formData.annual_throughput || ''}
                            onChange={(e) => setFormData({...formData, annual_throughput: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="berth_count">Berth Count</Label>
                          <Input
                            id="berth_count"
                            type="number"
                            value={formData.berth_count || ''}
                            onChange={(e) => setFormData({...formData, berth_count: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="terminal_count">Terminal Count</Label>
                          <Input
                            id="terminal_count"
                            type="number"
                            value={formData.terminal_count || ''}
                            onChange={(e) => setFormData({...formData, terminal_count: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vessel_count">Vessel Count</Label>
                          <Input
                            id="vessel_count"
                            type="number"
                            value={formData.vessel_count || ''}
                            onChange={(e) => setFormData({...formData, vessel_count: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="max_vessel_length">Max Vessel Length (m)</Label>
                          <Input
                            id="max_vessel_length"
                            type="number"
                            step="any"
                            value={formData.max_vessel_length || ''}
                            onChange={(e) => setFormData({...formData, max_vessel_length: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_vessel_beam">Max Vessel Beam (m)</Label>
                          <Input
                            id="max_vessel_beam"
                            type="number"
                            step="any"
                            value={formData.max_vessel_beam || ''}
                            onChange={(e) => setFormData({...formData, max_vessel_beam: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_draught">Max Draught (m)</Label>
                          <Input
                            id="max_draught"
                            type="number"
                            step="any"
                            value={formData.max_draught || ''}
                            onChange={(e) => setFormData({...formData, max_draught: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_deadweight">Max Deadweight (t)</Label>
                          <Input
                            id="max_deadweight"
                            type="number"
                            value={formData.max_deadweight || ''}
                            onChange={(e) => setFormData({...formData, max_deadweight: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="channel_depth">Channel Depth (m)</Label>
                          <Input
                            id="channel_depth"
                            type="number"
                            step="any"
                            value={formData.channel_depth || ''}
                            onChange={(e) => setFormData({...formData, channel_depth: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="berth_depth">Berth Depth (m)</Label>
                          <Input
                            id="berth_depth"
                            type="number"
                            step="any"
                            value={formData.berth_depth || ''}
                            onChange={(e) => setFormData({...formData, berth_depth: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="anchorage_depth">Anchorage Depth (m)</Label>
                          <Input
                            id="anchorage_depth"
                            type="number"
                            step="any"
                            value={formData.anchorage_depth || ''}
                            onChange={(e) => setFormData({...formData, anchorage_depth: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="facilities" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="owner">Owner</Label>
                          <Input
                            id="owner"
                            value={formData.owner || ''}
                            onChange={(e) => setFormData({...formData, owner: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="operator">Operator</Label>
                          <Input
                            id="operator"
                            value={formData.operator || ''}
                            onChange={(e) => setFormData({...formData, operator: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="port_authority">Port Authority</Label>
                          <Input
                            id="port_authority"
                            value={formData.port_authority || ''}
                            onChange={(e) => setFormData({...formData, port_authority: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="facilities">Facilities</Label>
                        <Textarea
                          id="facilities"
                          value={formData.facilities || ''}
                          onChange={(e) => setFormData({...formData, facilities: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="services">Services</Label>
                        <Textarea
                          id="services"
                          value={formData.services || ''}
                          onChange={(e) => setFormData({...formData, services: e.target.value})}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cargo_types">Cargo Types</Label>
                        <Textarea
                          id="cargo_types"
                          value={formData.cargo_types || ''}
                          onChange={(e) => setFormData({...formData, cargo_types: e.target.value})}
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="pilotage_required"
                            checked={formData.pilotage_required || false}
                            onCheckedChange={(checked) => setFormData({...formData, pilotage_required: checked as boolean})}
                          />
                          <Label htmlFor="pilotage_required">Pilotage Required</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="tug_assistance"
                            checked={formData.tug_assistance || false}
                            onCheckedChange={(checked) => setFormData({...formData, tug_assistance: checked as boolean})}
                          />
                          <Label htmlFor="tug_assistance">Tug Assistance</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="customs_office"
                            checked={formData.customs_office || false}
                            onCheckedChange={(checked) => setFormData({...formData, customs_office: checked as boolean})}
                          />
                          <Label htmlFor="customs_office">Customs Office</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="quarantine_station"
                            checked={formData.quarantine_station || false}
                            onCheckedChange={(checked) => setFormData({...formData, quarantine_station: checked as boolean})}
                          />
                          <Label htmlFor="quarantine_station">Quarantine Station</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="free_trade_zone"
                            checked={formData.free_trade_zone || false}
                            onCheckedChange={(checked) => setFormData({...formData, free_trade_zone: checked as boolean})}
                          />
                          <Label htmlFor="free_trade_zone">Free Trade Zone</Label>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="operations" className="space-y-4">
                      <div>
                        <Label htmlFor="operating_hours">Operating Hours</Label>
                        <Input
                          id="operating_hours"
                          value={formData.operating_hours || ''}
                          onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="port_charges">Port Charges</Label>
                          <Input
                            id="port_charges"
                            type="number"
                            step="any"
                            value={formData.port_charges || ''}
                            onChange={(e) => setFormData({...formData, port_charges: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="average_wait_time">Average Wait Time (hrs)</Label>
                          <Input
                            id="average_wait_time"
                            type="number"
                            step="any"
                            value={formData.average_wait_time || ''}
                            onChange={(e) => setFormData({...formData, average_wait_time: parseFloat(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tidal_range">Tidal Range (m)</Label>
                          <Input
                            id="tidal_range"
                            type="number"
                            step="any"
                            value={formData.tidal_range || ''}
                            onChange={(e) => setFormData({...formData, tidal_range: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="security_level">Security Level</Label>
                          <Input
                            id="security_level"
                            value={formData.security_level || ''}
                            onChange={(e) => setFormData({...formData, security_level: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="total_cargo">Total Cargo (tons)</Label>
                          <Input
                            id="total_cargo"
                            type="number"
                            value={formData.total_cargo || ''}
                            onChange={(e) => setFormData({...formData, total_cargo: parseInt(e.target.value)})}
                          />
                        </div>
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
                  </Tabs>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingPort ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{ports.length}</div>
              <div className="text-sm text-muted-foreground">Total Ports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {ports.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Ports</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {new Set(ports.map(p => p.country).filter(Boolean)).size}
              </div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {filteredPorts.length}
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
                  <TableHead>Region</TableHead>
                  <TableHead>Type</TableHead>
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
                ) : filteredPorts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'No ports found matching your search.' : 'No ports available.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPorts.map((port) => (
                    <TableRow key={port.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{port.name || 'Unnamed Port'}</TableCell>
                      <TableCell>{[port.city, port.country].filter(Boolean).join(', ') || 'Unknown Location'}</TableCell>
                      <TableCell>{port.region || 'Unknown Region'}</TableCell>
                      <TableCell>{port.port_type || port.type || 'Unknown Type'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          port.status === 'Active' || port.status === 'active' ? 'bg-green-100 text-green-800' :
                          port.status === 'Inactive' || port.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {port.status || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingPort(port);
                              const cleanPortData = {
                                name: port.name,
                                country: port.country,
                                region: port.region,
                                city: port.city,
                                address: port.address,
                                postal_code: port.postal_code,
                                port_type: port.port_type,
                                status: port.status,
                                description: port.description,
                                phone: port.phone,
                                email: port.email,
                                website: port.website,
                                lat: port.lat,
                                lng: port.lng,
                                capacity: port.capacity,
                                annual_throughput: port.annual_throughput,
                                berth_count: port.berth_count,
                                terminal_count: port.terminal_count,
                                max_vessel_length: port.max_vessel_length,
                                max_vessel_beam: port.max_vessel_beam,
                                max_draught: port.max_draught,
                                max_deadweight: port.max_deadweight,
                                channel_depth: port.channel_depth,
                                berth_depth: port.berth_depth,
                                anchorage_depth: port.anchorage_depth,
                                pilotage_required: port.pilotage_required || false,
                                tug_assistance: port.tug_assistance || false,
                                customs_office: port.customs_office || false,
                                quarantine_station: port.quarantine_station || false,
                                free_trade_zone: port.free_trade_zone || false,
                                rail_connection: port.rail_connection || false,
                                road_connection: port.road_connection || false,
                                port_charges: port.port_charges,
                                average_wait_time: port.average_wait_time,
                                tidal_range: port.tidal_range,
                                airport_distance: port.airport_distance,
                                established: port.established,
                                vessel_count: port.vessel_count,
                                total_cargo: port.total_cargo,
                                owner: port.owner,
                                operator: port.operator,
                                port_authority: port.port_authority,
                                facilities: port.facilities,
                                services: port.services,
                                operating_hours: port.operating_hours,
                                cargo_types: port.cargo_types,
                                security_level: port.security_level,
                                environmental_certifications: port.environmental_certifications
                              };
                              setFormData(cleanPortData);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${port.name}"? This action cannot be undone.`)) {
                                handleDelete(port.id);
                              }
                            }}
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
    </div>
  );
};

export default PortManagement;