import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Edit, Search, Bot, Ship, Activity, MapPin, Route, Package, DollarSign, Flag, Map, ChevronDown, ChevronUp, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vessel {
  id?: number;
  name: string;
  vessel_type: string | null;
  flag: string | null;
  mmsi: string | null;
  imo: string | null;
  callsign: string | null;
  built: number | null;
  length: number | null;
  width: number | null;
  beam: string | null;
  draught: number | null;
  draft: string | null;
  deadweight: number | null;
  gross_tonnage: number | null;
  cargo_capacity: number | null;
  cargo_quantity: number | null;
  engine_power: number | null;
  crew_size: number | null;
  fuel_consumption: number | null;
  speed: string | null;
  course: number | null;
  nav_status: string | null;
  cargo_type: string | null;
  oil_type: string | null;
  oil_source: string | null;
  owner_name: string | null;
  operator_name: string | null;
  buyer_name: string | null;
  seller_name: string | null;
  source_company: string | null;
  target_refinery: string | null;
  current_lat: number | null;
  current_lng: number | null;
  current_region: string | null;
  status: string | null;
  destination: string | null;
  eta: string | null;
  departure_port: number | null;
  destination_port: number | null;
  departure_date: string | null;
  arrival_date: string | null;
  departure_lat: number | null;
  departure_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  loading_port: string | null;
  route_distance: number | null;
  route_info: string | null;
  shipping_type: string | null;
  deal_value: number | null;
  price: number | null;
  market_price: number | null;
  quantity: number | null;
  company_id: number | null;
  refinery_id: string | null;
  metadata: any;
}

interface Port {
  id: number;
  name: string;
  country: string;
}

interface Company {
  id: number;
  name: string;
  country: string;
}

interface Refinery {
  id: string;
  name: string;
  country: string;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

const VesselManagement = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [isAutofillingVessel, setIsAutofillingVessel] = useState<number | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [showInlineMap, setShowInlineMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const { toast } = useToast();

  // Popular maritime flags with their country codes and names
  const countries: Country[] = [
    { code: "BS", name: "Bahamas", flag: "🇧🇸" },
    { code: "LR", name: "Liberia", flag: "🇱🇷" },
    { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
    { code: "PA", name: "Panama", flag: "🇵🇦" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "MT", name: "Malta", flag: "🇲🇹" },
    { code: "CY", name: "Cyprus", flag: "🇨🇾" },
    { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
    { code: "IM", name: "Isle of Man", flag: "🇮🇲" },
    { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
    { code: "GR", name: "Greece", flag: "🇬🇷" },
    { code: "NO", name: "Norway", flag: "🇳🇴" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱" },
    { code: "DK", name: "Denmark", flag: "🇩🇰" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "KR", name: "South Korea", flag: "🇰🇷" },
    { code: "CN", name: "China", flag: "🇨🇳" },
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "RU", name: "Russia", flag: "🇷🇺" },
    { code: "TR", name: "Turkey", flag: "🇹🇷" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
    { code: "QA", name: "Qatar", flag: "🇶🇦" },
    { code: "KW", name: "Kuwait", flag: "🇰🇼" }
  ];

  const [formData, setFormData] = useState<Vessel>({
    name: '',
    vessel_type: null,
    flag: null,
    mmsi: null,
    imo: null,
    callsign: null,
    built: null,
    length: null,
    width: null,
    beam: null,
    draught: null,
    draft: null,
    deadweight: null,
    gross_tonnage: null,
    cargo_capacity: null,
    cargo_quantity: null,
    engine_power: null,
    crew_size: null,
    fuel_consumption: null,
    speed: null,
    course: null,
    nav_status: null,
    cargo_type: null,
    oil_type: null,
    oil_source: null,
    owner_name: null,
    operator_name: null,
    buyer_name: null,
    seller_name: null,
    source_company: null,
    target_refinery: null,
    current_lat: null,
    current_lng: null,
    current_region: null,
    status: null,
    destination: null,
    eta: null,
    departure_port: null,
    destination_port: null,
    departure_date: null,
    arrival_date: null,
    departure_lat: null,
    departure_lng: null,
    destination_lat: null,
    destination_lng: null,
    loading_port: null,
    route_distance: null,
    route_info: null,
    shipping_type: null,
    deal_value: null,
    price: null,
    market_price: null,
    quantity: null,
    company_id: null,
    refinery_id: null,
    metadata: null,
  });

  const fetchVessels = async () => {
    try {
      const { data, error } = await supabase
        .from('vessels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVessels(data || []);
    } catch (error: any) {
      console.error('Error fetching vessels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vessels",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPorts = async () => {
    try {
      const { data, error } = await supabase
        .from('ports')
        .select('id, name, country')
        .order('name');

      if (error) throw error;
      setPorts(data || []);
    } catch (error) {
      console.error('Error fetching ports:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, country')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchRefineries = async () => {
    try {
      const { data, error } = await supabase
        .from('refineries')
        .select('id, name, country')
        .order('name');

      if (error) throw error;
      setRefineries(data || []);
    } catch (error) {
      console.error('Error fetching refineries:', error);
    }
  };

  useEffect(() => {
    fetchVessels();
    fetchPorts();
    fetchCompanies();
    fetchRefineries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare the data for submission, removing the id field if it's a new vessel
      const vesselData = { ...formData };
      
      // Remove id from the data to let the database auto-generate it for new vessels
      if (!editingVessel) {
        delete vesselData.id;
      }

      // Convert string values to appropriate types
      const processedData = {
        ...vesselData,
        built: vesselData.built ? Number(vesselData.built) : null,
        length: vesselData.length ? Number(vesselData.length) : null,
        width: vesselData.width ? Number(vesselData.width) : null,
        draught: vesselData.draught ? Number(vesselData.draught) : null,
        deadweight: vesselData.deadweight ? Number(vesselData.deadweight) : null,
        gross_tonnage: vesselData.gross_tonnage ? Number(vesselData.gross_tonnage) : null,
        cargo_capacity: vesselData.cargo_capacity ? Number(vesselData.cargo_capacity) : null,
        cargo_quantity: vesselData.cargo_quantity ? Number(vesselData.cargo_quantity) : null,
        engine_power: vesselData.engine_power ? Number(vesselData.engine_power) : null,
        crew_size: vesselData.crew_size ? Number(vesselData.crew_size) : null,
        fuel_consumption: vesselData.fuel_consumption ? Number(vesselData.fuel_consumption) : null,
        course: vesselData.course ? Number(vesselData.course) : null,
        current_lat: vesselData.current_lat ? Number(vesselData.current_lat) : null,
        current_lng: vesselData.current_lng ? Number(vesselData.current_lng) : null,
        departure_port: vesselData.departure_port ? Number(vesselData.departure_port) : null,
        destination_port: vesselData.destination_port ? Number(vesselData.destination_port) : null,
        departure_lat: vesselData.departure_lat ? Number(vesselData.departure_lat) : null,
        departure_lng: vesselData.departure_lng ? Number(vesselData.departure_lng) : null,
        destination_lat: vesselData.destination_lat ? Number(vesselData.destination_lat) : null,
        destination_lng: vesselData.destination_lng ? Number(vesselData.destination_lng) : null,
        route_distance: vesselData.route_distance ? Number(vesselData.route_distance) : null,
        deal_value: vesselData.deal_value ? Number(vesselData.deal_value) : null,
        price: vesselData.price ? Number(vesselData.price) : null,
        market_price: vesselData.market_price ? Number(vesselData.market_price) : null,
        quantity: vesselData.quantity ? Number(vesselData.quantity) : null,
        company_id: vesselData.company_id ? Number(vesselData.company_id) : null,
        refinery_id: vesselData.refinery_id || null,
      };

      let result;
      
      if (editingVessel) {
        // Update existing vessel
        result = await supabase
          .from('vessels')
          .update(processedData)
          .eq('id', editingVessel.id)
          .select()
          .single();
      } else {
        // Create new vessel - let the database auto-generate the ID
        result = await supabase
          .from('vessels')
          .insert([processedData])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Failed to save vessel:', result.error);
        throw result.error;
      }

      toast({
        title: "Success",
        description: `Vessel ${editingVessel ? 'updated' : 'created'} successfully`
      });

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      
      // Refresh the vessels list
      await fetchVessels();

    } catch (error: any) {
      console.error('Failed to save vessel:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingVessel ? 'update' : 'create'} vessel: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      vessel_type: null,
      flag: null,
      mmsi: null,
      imo: null,
      callsign: null,
      built: null,
      length: null,
      width: null,
      beam: null,
      draught: null,
      draft: null,
      deadweight: null,
      gross_tonnage: null,
      cargo_capacity: null,
      cargo_quantity: null,
      engine_power: null,
      crew_size: null,
      fuel_consumption: null,
      speed: null,
      course: null,
      nav_status: null,
      cargo_type: null,
      oil_type: null,
      oil_source: null,
      owner_name: null,
      operator_name: null,
      buyer_name: null,
      seller_name: null,
      source_company: null,
      target_refinery: null,
      current_lat: null,
      current_lng: null,
      current_region: null,
      status: null,
      destination: null,
      eta: null,
      departure_port: null,
      destination_port: null,
      departure_date: null,
      arrival_date: null,
      departure_lat: null,
      departure_lng: null,
      destination_lat: null,
      destination_lng: null,
      loading_port: null,
      route_distance: null,
      route_info: null,
      shipping_type: null,
      deal_value: null,
      price: null,
      market_price: null,
      quantity: null,
      company_id: null,
      refinery_id: null,
      metadata: null,
    });
    setEditingVessel(null);
  };

  const handleEdit = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setFormData(vessel);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleAISearch = async () => {
    if (!formData.name && !formData.imo) {
      toast({
        title: "Error",
        description: "Please enter a vessel name or IMO number for AI search",
        variant: "destructive"
      });
      return;
    }

    setIsAutofillingVessel(-1); // Use -1 to indicate AI search in progress

    try {
      const { data, error } = await supabase.functions.invoke('ai-vessel-search', {
        body: { 
          vesselName: formData.name || undefined,
          imo: formData.imo || undefined
        }
      });

      if (error) throw error;

      if (data.success && data.vesselData) {
        // Populate form with AI-generated data
        setFormData(prev => ({
          ...prev,
          ...data.vesselData
        }));

        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch vessel data');
      }
    } catch (error: any) {
      console.error('AI search error:', error);
      toast({
        title: "AI Search Failed", 
        description: error.message || 'Failed to search for vessel data',
        variant: "destructive"
      });
    } finally {
      setIsAutofillingVessel(null);
    }
  };

  const handleDelete = async (vesselId: number) => {
    if (!confirm('Are you sure you want to delete this vessel? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vessels')
        .delete()
        .eq('id', vesselId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vessel deleted successfully"
      });

      // Refresh the vessels list
      await fetchVessels();

    } catch (error: any) {
      console.error('Failed to delete vessel:', error);
      toast({
        title: "Error",
        description: `Failed to delete vessel: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleAutofill = async (vesselId: number) => {
    if (!vesselId) return;
    
    setIsAutofillingVessel(vesselId);
    
    try {
      const { data, error } = await supabase.functions.invoke('autofill-vessel-data', {
        body: { vesselId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.message
        });
        
        // Refresh the vessels list to show updated data
        await fetchVessels();
      } else {
        throw new Error(data.error || 'Failed to autofill vessel data');
      }
    } catch (error: any) {
      console.error('Autofill error:', error);
      toast({
        title: "Autofill Failed",
        description: error.message || 'Failed to autofill vessel data',
        variant: "destructive"
      });
    } finally {
      setIsAutofillingVessel(null);
    }
  };

  // Fix Leaflet default markers
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  // Initialize inline map
  useEffect(() => {
    if (!showInlineMap || !mapRef.current) return;

    // Clean up existing map
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    }

    // Create map after a short delay
    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const defaultCenter: [number, number] = [25.276987, 55.296249]; // Dubai
      const initialCenter: [number, number] = 
        (formData.current_lat && formData.current_lng) 
          ? [formData.current_lat, formData.current_lng] 
          : defaultCenter;

      const map = L.map(mapRef.current, {
        center: initialCenter,
        zoom: formData.current_lat && formData.current_lng ? 10 : 6,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        zoomControl: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add existing marker if coordinates exist
      if (formData.current_lat && formData.current_lng) {
        const existingMarker = L.marker([formData.current_lat, formData.current_lng])
          .addTo(map)
          .bindPopup(`Current: ${formData.current_lat.toFixed(4)}, ${formData.current_lng.toFixed(4)}`);
        markerRef.current = existingMarker;
      }

      // Handle map clicks
      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickLat = parseFloat(e.latlng.lat.toFixed(6));
        const clickLng = parseFloat(e.latlng.lng.toFixed(6));

        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add new marker
        const newMarker = L.marker([clickLat, clickLng])
          .addTo(map)
          .bindPopup(`Selected: ${clickLat}, ${clickLng}`)
          .openPopup();
        
        markerRef.current = newMarker;
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          current_lat: clickLat,
          current_lng: clickLng
        }));
      });

      // Ensure map renders correctly
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      leafletMapRef.current = map;
    }, 250);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showInlineMap, formData.current_lat, formData.current_lng]);

  const filteredVessels = vessels.filter(vessel =>
    vessel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.vessel_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.flag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.mmsi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vessel Management</h2>
          <p className="text-muted-foreground">Manage vessel database</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vessel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">{editingVessel ? 'Edit Vessel' : 'Create New Vessel'}</DialogTitle>
              <DialogDescription>
                {editingVessel ? 'Update vessel information' : 'Enter vessel details organized by category'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Section */}
              <Card className="trading-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ship className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <Bot className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Auto-Fill</p>
                      <p className="text-xs text-muted-foreground">Enter vessel name or IMO and let AI fill the rest</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAISearch}
                      disabled={isAutofillingVessel !== null}
                      className="flex items-center gap-2"
                    >
                      {isAutofillingVessel ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      Auto-Fill with AI
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Vessel Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Enter vessel name for AI search"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vessel_type">Vessel Type</Label>
                      <Select 
                        value={formData.vessel_type || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, vessel_type: value === "none" ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vessel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select vessel type</SelectItem>
                          <SelectItem value="Oil Tanker">Oil Tanker</SelectItem>
                          <SelectItem value="Bulk Carrier">Bulk Carrier</SelectItem>
                          <SelectItem value="Container Ship">Container Ship</SelectItem>
                          <SelectItem value="General Cargo">General Cargo</SelectItem>
                          <SelectItem value="Chemical Tanker">Chemical Tanker</SelectItem>
                          <SelectItem value="LNG Carrier">LNG Carrier</SelectItem>
                          <SelectItem value="LPG Carrier">LPG Carrier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="flag">Flag State</Label>
                      <Select 
                        value={formData.flag || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, flag: value === "none" ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select flag state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="none">Select flag state</SelectItem>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.name.toLowerCase()}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{country.flag}</span>
                                <span>{country.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mmsi">MMSI</Label>
                      <Input
                        id="mmsi"
                        value={formData.mmsi || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mmsi: e.target.value || null }))}
                        placeholder="9-digit MMSI number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="imo">IMO</Label>
                      <Input
                        id="imo"
                        value={formData.imo || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, imo: e.target.value || null }))}
                        placeholder="7-digit IMO number for AI search"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="callsign">Call Sign</Label>
                      <Input
                        id="callsign"
                        value={formData.callsign || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, callsign: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="built">Built Year</Label>
                      <Input
                        id="built"
                        type="number"
                        min="1900"
                        max="2030"
                        value={formData.built || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, built: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Specifications Section */}
              <Card className="trading-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="length">Length (m)</Label>
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        value={formData.length || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Width (m)</Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        value={formData.width || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="beam">Beam (m)</Label>
                      <Input
                        id="beam"
                        value={formData.beam || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, beam: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="draught">Draught (m)</Label>
                      <Input
                        id="draught"
                        type="number"
                        step="0.1"
                        value={formData.draught || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, draught: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="deadweight">Deadweight (MT)</Label>
                      <Input
                        id="deadweight"
                        type="number"
                        value={formData.deadweight || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, deadweight: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gross_tonnage">Gross Tonnage</Label>
                      <Input
                        id="gross_tonnage"
                        type="number"
                        value={formData.gross_tonnage || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, gross_tonnage: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cargo_capacity">Cargo Capacity</Label>
                      <Input
                        id="cargo_capacity"
                        type="number"
                        value={formData.cargo_capacity || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cargo_capacity: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="engine_power">Engine Power (kW)</Label>
                      <Input
                        id="engine_power"
                        type="number"
                        value={formData.engine_power || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, engine_power: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="crew_size">Crew Size</Label>
                      <Input
                        id="crew_size"
                        type="number"
                        value={formData.crew_size || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, crew_size: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fuel_consumption">Fuel Consumption</Label>
                      <Input
                        id="fuel_consumption"
                        type="number"
                        step="0.1"
                        value={formData.fuel_consumption || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, fuel_consumption: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation & Location Section */}
              <Card className="trading-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Navigation & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="speed">Speed (knots)</Label>
                      <Input
                        id="speed"
                        value={formData.speed || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, speed: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="course">Course (degrees)</Label>
                      <Input
                        id="course"
                        type="number"
                        min="0"
                        max="360"
                        value={formData.course || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, course: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="nav_status">Navigation Status</Label>
                      <Input
                        id="nav_status"
                        value={formData.nav_status || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, nav_status: e.target.value || null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="current_lat">Current Latitude</Label>
                      <Input
                        id="current_lat"
                        type="number"
                        step="0.000001"
                        value={formData.current_lat || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_lat: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="current_lng">Current Longitude</Label>
                      <Input
                        id="current_lng"
                        type="number"
                        step="0.000001"
                        value={formData.current_lng || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_lng: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInlineMap(!showInlineMap)}
                      className="flex items-center gap-2"
                    >
                      <Map className="h-4 w-4" />
                      {showInlineMap ? 'Hide Map' : 'Select on Map'}
                      {showInlineMap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Inline Map */}
                  {showInlineMap && (
                    <div className="mt-4 border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/50 border-b">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Click anywhere on the map to select coordinates</span>
                        </div>
                        {formData.current_lat && formData.current_lng && (
                          <div className="text-xs text-green-600 mt-1">
                            Selected: {formData.current_lat.toFixed(4)}, {formData.current_lng.toFixed(4)}
                          </div>
                        )}
                      </div>
                      <div 
                        ref={mapRef}
                        className="w-full h-64 bg-muted cursor-crosshair"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="current_region">Current Region</Label>
                      <Input
                        id="current_region"
                        value={formData.current_region || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, current_region: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value === "none" ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select status</SelectItem>
                          <SelectItem value="sailing">Sailing</SelectItem>
                          <SelectItem value="anchored">Anchored</SelectItem>
                          <SelectItem value="in_port">In Port</SelectItem>
                          <SelectItem value="loading">Loading</SelectItem>
                          <SelectItem value="discharging">Discharging</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Route & Ports Section */}
              <Card className="trading-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Route className="h-5 w-5 text-primary" />
                    Route & Ports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departure_port">Departure Port</Label>
                      <Select 
                        value={formData.departure_port?.toString() || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, departure_port: value === "none" ? null : Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select departure port" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select departure port</SelectItem>
                          {ports.map((port) => (
                            <SelectItem key={port.id} value={port.id.toString()}>
                              {port.name} ({port.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="destination_port">Destination Port</Label>
                      <Select 
                        value={formData.destination_port?.toString() || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, destination_port: value === "none" ? null : Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination port" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select destination port</SelectItem>
                          {ports.map((port) => (
                            <SelectItem key={port.id} value={port.id.toString()}>
                              {port.name} ({port.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departure_date">Departure Date</Label>
                      <Input
                        id="departure_date"
                        type="datetime-local"
                        value={formData.departure_date || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, departure_date: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="arrival_date">Arrival Date</Label>
                      <Input
                        id="arrival_date"
                        type="datetime-local"
                        value={formData.arrival_date || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, arrival_date: e.target.value || null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="loading_port">Loading Port</Label>
                      <Input
                        id="loading_port"
                        value={formData.loading_port || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, loading_port: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="route_distance">Route Distance (nm)</Label>
                      <Input
                        id="route_distance"
                        type="number"
                        step="0.1"
                        value={formData.route_distance || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, route_distance: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="route_info">Route Information</Label>
                    <Textarea
                      id="route_info"
                      value={formData.route_info || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, route_info: e.target.value || null }))}
                      placeholder="Enter route details and waypoints"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Cargo & Business Section */}
              <Card className="trading-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary" />
                    Cargo & Business
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cargo_type">Cargo Type</Label>
                      <Input
                        id="cargo_type"
                        value={formData.cargo_type || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cargo_type: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="oil_type">Oil Type</Label>
                      <Input
                        id="oil_type"
                        value={formData.oil_type || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, oil_type: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="oil_source">Oil Source</Label>
                      <Input
                        id="oil_source"
                        value={formData.oil_source || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, oil_source: e.target.value || null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cargo_quantity">Cargo Quantity</Label>
                      <Input
                        id="cargo_quantity"
                        type="number"
                        value={formData.cargo_quantity || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cargo_quantity: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Total Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.1"
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_id">Company</Label>
                      <Select 
                        value={formData.company_id?.toString() || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value === "none" ? null : Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No company selected</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name} ({company.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="refinery_id">Target Refinery</Label>
                      <Select 
                        value={formData.refinery_id || "none"} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, refinery_id: value === "none" ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select refinery (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No refinery selected</SelectItem>
                          {refineries.map((refinery) => (
                            <SelectItem key={refinery.id} value={refinery.id}>
                              {refinery.name} ({refinery.country})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="owner_name">Owner Name</Label>
                      <Input
                        id="owner_name"
                        value={formData.owner_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="operator_name">Operator Name</Label>
                      <Input
                        id="operator_name"
                        value={formData.operator_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, operator_name: e.target.value || null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="buyer_name">Buyer Name</Label>
                      <Input
                        id="buyer_name"
                        value={formData.buyer_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyer_name: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seller_name">Seller Name</Label>
                      <Input
                        id="seller_name"
                        value={formData.seller_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, seller_name: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="source_company">Source Company</Label>
                      <Input
                        id="source_company"
                        value={formData.source_company || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, source_company: e.target.value || null }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information Section */}
              <Card className="trading-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="deal_value">Deal Value</Label>
                      <Input
                        id="deal_value"
                        type="number"
                        step="0.01"
                        value={formData.deal_value || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, deal_value: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="market_price">Market Price</Label>
                      <Input
                        id="market_price"
                        type="number"
                        step="0.01"
                        value={formData.market_price || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, market_price: e.target.value ? Number(e.target.value) : null }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shipping_type">Shipping Type</Label>
                      <Input
                        id="shipping_type"
                        value={formData.shipping_type || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, shipping_type: e.target.value || null }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="eta">ETA</Label>
                      <Input
                        id="eta"
                        type="datetime-local"
                        value={formData.eta || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, eta: e.target.value || null }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingVessel ? 'Update Vessel' : 'Create Vessel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vessels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {vessels.map((vessel) => (
              <Card key={vessel.id} className="trading-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{vessel.name}</h3>
                        {vessel.flag && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">
                              {countries.find(c => c.name.toLowerCase() === vessel.flag?.toLowerCase())?.flag || "🏳️"}
                            </span>
                            <span className="text-sm text-muted-foreground capitalize">
                              {vessel.flag}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Type: {vessel.vessel_type || 'N/A'}</span>
                        {vessel.mmsi && <span className="ml-4">MMSI: {vessel.mmsi}</span>}
                        {vessel.imo && <span className="ml-4">IMO: {vessel.imo}</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>DWT: {vessel.deadweight?.toLocaleString() || 'N/A'}</span>
                        {vessel.built && <span className="ml-4">Built: {vessel.built}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAutofill(vessel.id!)}
                        disabled={isAutofillingVessel === vessel.id}
                        className="flex items-center gap-2"
                      >
                        {isAutofillingVessel === vessel.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                        Auto-fill
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(vessel)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(vessel.id!)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {vessels.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No vessels found. Create your first vessel above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VesselManagement;

