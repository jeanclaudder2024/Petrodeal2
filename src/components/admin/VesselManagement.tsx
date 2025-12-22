import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Edit, Search, Bot, Ship, Activity, MapPin, Route, Package, DollarSign, Flag, Map, ChevronDown, ChevronUp, Download, Trash2, Building2, FileText, AlertTriangle, Lock, Briefcase, Fuel, Anchor, Shield } from 'lucide-react';
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
  status: string | null;
  ai_autofill_source: string | null;
  // Technical Specifications
  length: number | null;
  width: number | null;
  beam: string | null;
  draught: number | null;
  draft: string | null;
  deadweight: number | null;
  gross_tonnage: number | null;
  cargo_capacity: number | null;
  cargo_capacity_bbl: number | null;
  engine_power: number | null;
  service_speed: number | null;
  fuel_consumption: number | null;
  crew_size: number | null;
  // Navigation & Location
  current_lat: number | null;
  current_lng: number | null;
  speed: string | null;
  course: number | null;
  nav_status: string | null;
  current_region: string | null;
  // Route & Ports
  departure_port: number | null;
  destination_port: number | null;
  loading_port: string | null;
  discharge_port: string | null;
  departure_date: string | null;
  eta: string | null;
  arrival_date: string | null;
  route_distance: number | null;
  voyage_status: string | null;
  voyage_notes: string | null;
  route_info: string | null;
  // Cargo Information
  cargo_type: string | null;
  commodity_name: string | null;
  commodity_category: string | null;
  hs_code: string | null;
  oil_type: string | null;
  oil_source: string | null;
  source_refinery: string | null;
  cargo_origin_country: string | null;
  sanctions_status: string | null;
  min_quantity: number | null;
  max_quantity: number | null;
  quantity_unit: string | null;
  total_shipment_quantity: number | null;
  cargo_quantity: number | null;
  quality_specification: string | null;
  // Commercial Parties
  owner_name: string | null;
  operator_name: string | null;
  source_company: string | null;
  target_refinery: string | null;
  buyer_company_id: number | null;
  seller_company_id: number | null;
  commodity_source_company_id: number | null;
  buyer_name: string | null;
  seller_name: string | null;
  // Deal & Commercial Terms
  deal_reference_id: string | null;
  deal_status: string | null;
  contract_type: string | null;
  delivery_terms: string | null;
  delivery_method: string | null;
  price_basis: string | null;
  benchmark_reference: string | null;
  indicative_price: number | null;
  market_price: number | null;
  deal_value: number | null;
  price_notes: string | null;
  payment_method: string | null;
  payment_timing: string | null;
  payment_notes: string | null;
  // Other
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
  company_type: string;
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

interface VesselManagementProps {
  vesselIdToEdit?: number | null;
  onVesselEditComplete?: () => void;
}

const VesselManagement = ({ vesselIdToEdit, onVesselEditComplete }: VesselManagementProps) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [isAutofillingVessel, setIsAutofillingVessel] = useState<number | null>(null);
  const [ports, setPorts] = useState<Port[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buyerCompanies, setBuyerCompanies] = useState<Company[]>([]);
  const [sellerCompanies, setSellerCompanies] = useState<Company[]>([]);
  const [realCompanies, setRealCompanies] = useState<Company[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [showInlineMap, setShowInlineMap] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // Bulk auto-fill state
  const [isBulkAutoFilling, setIsBulkAutoFilling] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  
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

  const initialFormData: Vessel = {
    name: '',
    vessel_type: null,
    flag: null,
    mmsi: null,
    imo: null,
    callsign: null,
    built: null,
    status: null,
    ai_autofill_source: 'manual',
    length: null,
    width: null,
    beam: null,
    draught: null,
    draft: null,
    deadweight: null,
    gross_tonnage: null,
    cargo_capacity: null,
    cargo_capacity_bbl: null,
    engine_power: null,
    service_speed: null,
    fuel_consumption: null,
    crew_size: null,
    current_lat: null,
    current_lng: null,
    speed: null,
    course: null,
    nav_status: null,
    current_region: null,
    departure_port: null,
    destination_port: null,
    loading_port: null,
    discharge_port: null,
    departure_date: null,
    eta: null,
    arrival_date: null,
    route_distance: null,
    voyage_status: null,
    voyage_notes: null,
    route_info: null,
    cargo_type: null,
    commodity_name: null,
    commodity_category: null,
    hs_code: null,
    oil_type: null,
    oil_source: null,
    source_refinery: null,
    cargo_origin_country: null,
    sanctions_status: 'non-sanctioned',
    min_quantity: null,
    max_quantity: null,
    quantity_unit: 'MT',
    total_shipment_quantity: null,
    cargo_quantity: null,
    quality_specification: null,
    owner_name: null,
    operator_name: null,
    source_company: null,
    target_refinery: null,
    buyer_company_id: null,
    seller_company_id: null,
    commodity_source_company_id: null,
    buyer_name: null,
    seller_name: null,
    deal_reference_id: null,
    deal_status: 'open',
    contract_type: null,
    delivery_terms: null,
    delivery_method: 'Vessel',
    price_basis: 'TBD',
    benchmark_reference: null,
    indicative_price: null,
    market_price: null,
    deal_value: null,
    price_notes: null,
    payment_method: null,
    payment_timing: null,
    payment_notes: null,
    company_id: null,
    refinery_id: null,
    metadata: null,
  };

  const [formData, setFormData] = useState<Vessel>(initialFormData);

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
        .select('id, name, country, company_type')
        .order('name');

      if (error) throw error;
      const allCompanies = data || [];
      setCompanies(allCompanies);
      // Filter by EXACT company_type: 'buyer' only for Buyer dropdown
      setBuyerCompanies(allCompanies.filter(c => c.company_type === 'buyer'));
      // Filter by EXACT company_type: 'seller' only for Seller dropdown
      setSellerCompanies(allCompanies.filter(c => c.company_type === 'seller'));
      // Filter by EXACT company_type: 'real' only for Commodity Sources dropdown
      setRealCompanies(allCompanies.filter(c => c.company_type === 'real'));
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

  // Handle vesselIdToEdit prop from ConnectionManagement
  useEffect(() => {
    if (vesselIdToEdit && vessels.length > 0) {
      const vesselToEdit = vessels.find(v => v.id === vesselIdToEdit);
      if (vesselToEdit) {
        handleEdit(vesselToEdit);
      }
    }
  }, [vesselIdToEdit, vessels]);

  // Handle dialog close - notify parent when edit is complete
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open && onVesselEditComplete) {
      onVesselEditComplete();
    }
  };

  // Sea coordinate verification - checks if coordinates are in known shipping lanes
  const verifySeaCoordinates = (lat: number | null, lng: number | null): { isValid: boolean; message: string } => {
    if (lat === null || lng === null) {
      return { isValid: true, message: 'No coordinates provided' };
    }

    // Known shipping lane boundaries (approximate ocean/sea areas)
    const seaAreas = [
      { name: 'Persian Gulf', minLat: 23, maxLat: 30, minLng: 48, maxLng: 57 },
      { name: 'Mediterranean Sea', minLat: 30, maxLat: 46, minLng: -6, maxLng: 37 },
      { name: 'North Sea', minLat: 51, maxLat: 62, minLng: -4, maxLng: 13 },
      { name: 'Gulf of Mexico', minLat: 18, maxLat: 31, minLng: -98, maxLng: -81 },
      { name: 'Caribbean Sea', minLat: 9, maxLat: 22, minLng: -88, maxLng: -60 },
      { name: 'Atlantic Ocean', minLat: -60, maxLat: 60, minLng: -80, maxLng: 0 },
      { name: 'Pacific Ocean West', minLat: -60, maxLat: 60, minLng: 100, maxLng: 180 },
      { name: 'Pacific Ocean East', minLat: -60, maxLat: 60, minLng: -180, maxLng: -100 },
      { name: 'Indian Ocean', minLat: -60, maxLat: 30, minLng: 20, maxLng: 120 },
      { name: 'South China Sea', minLat: 0, maxLat: 25, minLng: 99, maxLng: 122 },
      { name: 'Arabian Sea', minLat: 5, maxLat: 25, minLng: 50, maxLng: 77 },
      { name: 'Red Sea', minLat: 12, maxLat: 30, minLng: 32, maxLng: 44 },
      { name: 'Baltic Sea', minLat: 53, maxLat: 66, minLng: 10, maxLng: 30 },
      { name: 'Black Sea', minLat: 40, maxLat: 47, minLng: 27, maxLng: 42 },
      { name: 'Gulf of Oman', minLat: 22, maxLat: 27, minLng: 56, maxLng: 62 },
      { name: 'Bay of Bengal', minLat: 5, maxLat: 23, minLng: 77, maxLng: 100 },
      { name: 'East China Sea', minLat: 24, maxLat: 34, minLng: 118, maxLng: 132 },
      { name: 'Sea of Japan', minLat: 33, maxLat: 52, minLng: 127, maxLng: 142 },
    ];

    for (const area of seaAreas) {
      if (lat >= area.minLat && lat <= area.maxLat && lng >= area.minLng && lng <= area.maxLng) {
        return { isValid: true, message: `Location verified in ${area.name}` };
      }
    }

    return { 
      isValid: false, 
      message: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) may not be in a recognized shipping lane. Please verify the location is at sea.` 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const vesselData = { ...formData };
      
      if (!editingVessel) {
        delete vesselData.id;
      }

      // Verify sea coordinates before saving
      const coordCheck = verifySeaCoordinates(vesselData.current_lat, vesselData.current_lng);
      if (!coordCheck.isValid) {
        toast({
          title: "Location Warning",
          description: coordCheck.message,
          variant: "destructive"
        });
        return; // Stop submission if coordinates are not valid
      }

      // Convert string values to appropriate types
      // IMPORTANT: COMPLETELY REMOVE refinery_id to avoid FK constraint error
      const processedData: any = {
        name: vesselData.name,
        vessel_type: vesselData.vessel_type,
        flag: vesselData.flag,
        mmsi: vesselData.mmsi,
        imo: vesselData.imo,
        callsign: vesselData.callsign,
        built: vesselData.built ? Number(vesselData.built) : null,
        status: vesselData.status,
        ai_autofill_source: vesselData.ai_autofill_source,
        length: vesselData.length ? Number(vesselData.length) : null,
        width: vesselData.width ? Number(vesselData.width) : null,
        beam: vesselData.beam,
        draught: vesselData.draught ? Number(vesselData.draught) : null,
        draft: vesselData.draft,
        deadweight: vesselData.deadweight ? Number(vesselData.deadweight) : null,
        gross_tonnage: vesselData.gross_tonnage ? Number(vesselData.gross_tonnage) : null,
        cargo_capacity: vesselData.cargo_capacity ? Number(vesselData.cargo_capacity) : null,
        cargo_capacity_bbl: vesselData.cargo_capacity_bbl ? Number(vesselData.cargo_capacity_bbl) : null,
        engine_power: vesselData.engine_power ? Number(vesselData.engine_power) : null,
        service_speed: vesselData.service_speed ? Number(vesselData.service_speed) : null,
        fuel_consumption: vesselData.fuel_consumption ? Number(vesselData.fuel_consumption) : null,
        crew_size: vesselData.crew_size ? Number(vesselData.crew_size) : null,
        current_lat: vesselData.current_lat ? Number(vesselData.current_lat) : null,
        current_lng: vesselData.current_lng ? Number(vesselData.current_lng) : null,
        speed: vesselData.speed,
        course: vesselData.course ? Number(vesselData.course) : null,
        nav_status: vesselData.nav_status,
        current_region: vesselData.current_region,
        departure_port: vesselData.departure_port ? Number(vesselData.departure_port) : null,
        destination_port: vesselData.destination_port ? Number(vesselData.destination_port) : null,
        loading_port: vesselData.loading_port,
        discharge_port: vesselData.discharge_port,
        departure_date: vesselData.departure_date,
        eta: vesselData.eta,
        arrival_date: vesselData.arrival_date,
        route_distance: vesselData.route_distance ? Number(vesselData.route_distance) : null,
        voyage_status: vesselData.voyage_status,
        voyage_notes: vesselData.voyage_notes,
        route_info: vesselData.route_info,
        cargo_type: vesselData.cargo_type,
        commodity_name: vesselData.commodity_name,
        commodity_category: vesselData.commodity_category,
        hs_code: vesselData.hs_code,
        oil_type: vesselData.oil_type,
        oil_source: vesselData.oil_source,
        source_refinery: vesselData.source_refinery,
        cargo_origin_country: vesselData.cargo_origin_country,
        sanctions_status: vesselData.sanctions_status,
        min_quantity: vesselData.min_quantity ? Number(vesselData.min_quantity) : null,
        max_quantity: vesselData.max_quantity ? Number(vesselData.max_quantity) : null,
        quantity_unit: vesselData.quantity_unit,
        total_shipment_quantity: vesselData.total_shipment_quantity ? Number(vesselData.total_shipment_quantity) : null,
        cargo_quantity: vesselData.cargo_quantity ? Number(vesselData.cargo_quantity) : null,
        quality_specification: vesselData.quality_specification,
        owner_name: vesselData.owner_name,
        operator_name: vesselData.operator_name,
        source_company: vesselData.source_company,
        target_refinery: vesselData.target_refinery,
        buyer_company_id: vesselData.buyer_company_id ? Number(vesselData.buyer_company_id) : null,
        seller_company_id: vesselData.seller_company_id ? Number(vesselData.seller_company_id) : null,
        commodity_source_company_id: vesselData.commodity_source_company_id ? Number(vesselData.commodity_source_company_id) : null,
        buyer_name: vesselData.buyer_name,
        seller_name: vesselData.seller_name,
        deal_reference_id: vesselData.deal_reference_id,
        deal_status: vesselData.deal_status,
        contract_type: vesselData.contract_type,
        delivery_terms: vesselData.delivery_terms,
        delivery_method: vesselData.delivery_method,
        price_basis: vesselData.price_basis,
        benchmark_reference: vesselData.benchmark_reference,
        indicative_price: vesselData.indicative_price ? Number(vesselData.indicative_price) : null,
        market_price: vesselData.market_price ? Number(vesselData.market_price) : null,
        deal_value: vesselData.deal_value ? Number(vesselData.deal_value) : null,
        price_notes: vesselData.price_notes,
        payment_method: vesselData.payment_method,
        payment_timing: vesselData.payment_timing,
        payment_notes: vesselData.payment_notes,
        company_id: vesselData.company_id ? Number(vesselData.company_id) : null,
        metadata: vesselData.metadata,
        // CRITICAL: DO NOT include refinery_id - it causes FK constraint errors
        // Use target_refinery text field instead
      };

      let result;
      
      if (editingVessel) {
        result = await supabase
          .from('vessels')
          .update(processedData)
          .eq('id', editingVessel.id)
          .select()
          .single();
      } else {
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
        description: `Vessel ${editingVessel ? 'updated' : 'created'} successfully${coordCheck.message ? ` - ${coordCheck.message}` : ''}`
      });

      resetForm();
      setIsDialogOpen(false);
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
    setFormData(initialFormData);
    setEditingVessel(null);
    setActiveTab('basic');
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

  // Check if required fields for autofill are present
  const canAutofill = () => {
    return Boolean(formData.name?.trim() && formData.imo?.trim() && formData.mmsi?.trim());
  };

  const handleAISearch = async () => {
    if (!formData.name?.trim() || !formData.imo?.trim() || !formData.mmsi?.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please enter Vessel Name, IMO, and MMSI before using Auto-Fill. These fields are required for accurate AI search.",
        variant: "destructive"
      });
      return;
    }

    setIsAutofillingVessel(-1);

    try {
      const { data, error } = await supabase.functions.invoke('ai-vessel-search', {
        body: { 
          imo: formData.imo,
          mmsi: formData.mmsi,
          vesselName: formData.name
        }
      });

      if (error) throw error;

      if (data.success && data.vesselData) {
        const protectedFields = {
          name: formData.name,
          imo: formData.imo,
          mmsi: formData.mmsi
        };
        
        setFormData(prev => ({
          ...prev,
          ...data.vesselData,
          ...protectedFields,
          ai_autofill_source: 'AIS'
        }));

        toast({
          title: "Success",
          description: data.message + " (Name, IMO, MMSI preserved)",
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
    
    // Check if vessel has required fields
    const vessel = vessels.find(v => v.id === vesselId);
    if (!vessel?.name?.trim() || !vessel?.imo?.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please enter Vessel Name and IMO before using Auto-Fill.",
        variant: "destructive"
      });
      return;
    }
    
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

  // Bulk auto-fill all vessels
  const handleBulkAutofill = async () => {
    // Filter vessels that have required fields (name and imo)
    const eligibleVessels = vessels.filter(v => v.name?.trim() && v.imo?.trim());
    const skippedCount = vessels.length - eligibleVessels.length;
    
    if (eligibleVessels.length === 0) {
      toast({
        title: "No Eligible Vessels",
        description: "All vessels are missing Name or IMO. Please add these fields first.",
        variant: "destructive"
      });
      return;
    }
    
    const confirmMessage = skippedCount > 0 
      ? `Auto-fill ${eligibleVessels.length} vessels? (${skippedCount} will be skipped - missing Name/IMO)`
      : `Auto-fill ALL ${eligibleVessels.length} vessels? This may take several minutes.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsBulkAutoFilling(true);
    setShowBulkDialog(true);
    setBulkProgress({ current: 0, total: eligibleVessels.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < eligibleVessels.length; i++) {
      const vessel = eligibleVessels[i];
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const { data, error } = await supabase.functions.invoke('autofill-vessel-data', {
          body: { vesselId: vessel.id }
        });

        if (error || !data?.success) {
          failedCount++;
          console.error(`Failed to autofill vessel ${vessel.id}:`, error || data?.error);
        } else {
          successCount++;
        }
      } catch (error) {
        failedCount++;
        console.error(`Error autofilling vessel ${vessel.id}:`, error);
      }

      setBulkProgress(prev => ({ ...prev, success: successCount, failed: failedCount }));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsBulkAutoFilling(false);
    await fetchVessels();

    const skippedMsg = skippedCount > 0 ? ` Skipped ${skippedCount} (missing Name/IMO).` : '';
    toast({
      title: "Bulk Auto-Fill Complete",
      description: `Successfully updated ${successCount} vessels. Failed: ${failedCount}.${skippedMsg}`,
      variant: failedCount > 0 ? "destructive" : "default"
    });
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

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      markerRef.current = null;
    }

    const timer = setTimeout(() => {
      if (!mapRef.current) return;

      const defaultCenter: [number, number] = [25.276987, 55.296249];
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

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      if (formData.current_lat && formData.current_lng) {
        const existingMarker = L.marker([formData.current_lat, formData.current_lng])
          .addTo(map)
          .bindPopup(`Current: ${formData.current_lat.toFixed(4)}, ${formData.current_lng.toFixed(4)}`);
        markerRef.current = existingMarker;
      }

      map.on('click', (e: L.LeafletMouseEvent) => {
        const clickLat = parseFloat(e.latlng.lat.toFixed(6));
        const clickLng = parseFloat(e.latlng.lng.toFixed(6));

        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        const newMarker = L.marker([clickLat, clickLng])
          .addTo(map)
          .bindPopup(`Selected: ${clickLat}, ${clickLng}`)
          .openPopup();
        
        markerRef.current = newMarker;
        
        setFormData(prev => ({
          ...prev,
          current_lat: clickLat,
          current_lng: clickLng
        }));
      });

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
    vessel.mmsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.deal_reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSanctionsStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'non-sanctioned': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'restricted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'sanctioned': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDealStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-green-500/10 text-green-600';
      case 'negotiation': return 'bg-yellow-500/10 text-yellow-600';
      case 'reserved': return 'bg-blue-500/10 text-blue-600';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: vessels.length,
    active: vessels.filter(v => v.status === 'sailing' || v.status === 'active' || v.nav_status === 'sailing').length,
    countries: new Set(vessels.map(v => v.flag).filter(Boolean)).size,
    filtered: filteredVessels.length,
    types: new Set(vessels.map(v => v.vessel_type).filter(Boolean)).size,
    openDeals: vessels.filter(v => v.deal_status === 'open').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="trading-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Vessels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Flag className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.countries}</p>
                <p className="text-xs text-muted-foreground">Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.types}</p>
                <p className="text-xs text-muted-foreground">Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.openDeals}</p>
                <p className="text-xs text-muted-foreground">Open Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Search className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.filtered}</p>
                <p className="text-xs text-muted-foreground">Filtered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Fuel className="h-6 w-6 text-primary" />
            Vessel / Tanker Management
          </h2>
          <p className="text-muted-foreground">Comprehensive vessel database with cargo & deal management</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Auto-Fill Button */}
          <Button 
            variant="outline" 
            onClick={handleBulkAutofill}
            disabled={isBulkAutoFilling || vessels.length === 0}
            className="border-primary/50 hover:bg-primary/10"
          >
            {isBulkAutoFilling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bot className="h-4 w-4 mr-2" />
            )}
            Bulk Auto-Fill All ({vessels.length})
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vessel
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                {editingVessel ? 'Edit Vessel' : 'Create New Vessel'}
              </DialogTitle>
              <DialogDescription>
                {editingVessel ? 'Update vessel information' : 'Enter vessel details organized by category. Fill Name, IMO, and MMSI first, then use AI Auto-Fill.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Auto-Fill Section */}
              <Card className={`border-2 ${canAutofill() ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-dashed border-muted-foreground/30'}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                      <Bot className={`h-8 w-8 ${canAutofill() ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">AI Auto-Fill All Fields</h3>
                      <p className="text-sm text-muted-foreground">
                        {canAutofill() 
                          ? '✓ Ready! Click to auto-fill all remaining fields with AI-generated data.' 
                          : '⚠️ Enter Vessel Name, IMO Number, and MMSI (all required) to enable AI Auto-Fill'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={canAutofill() ? "default" : "outline"}
                      size="lg"
                      onClick={handleAISearch}
                      disabled={isAutofillingVessel !== null || !canAutofill()}
                      className="flex items-center gap-2 min-w-[200px]"
                    >
                      {isAutofillingVessel ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                      {isAutofillingVessel ? 'Processing...' : 'AI Auto-Fill All Fields'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 7 Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-7 h-auto">
                  <TabsTrigger value="basic" className="flex flex-col gap-1 py-2 text-xs">
                    <Ship className="h-4 w-4" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="flex flex-col gap-1 py-2 text-xs">
                    <Activity className="h-4 w-4" />
                    Technical
                  </TabsTrigger>
                  <TabsTrigger value="navigation" className="flex flex-col gap-1 py-2 text-xs">
                    <MapPin className="h-4 w-4" />
                    Navigation
                  </TabsTrigger>
                  <TabsTrigger value="route" className="flex flex-col gap-1 py-2 text-xs">
                    <Route className="h-4 w-4" />
                    Route
                  </TabsTrigger>
                  <TabsTrigger value="cargo" className="flex flex-col gap-1 py-2 text-xs">
                    <Fuel className="h-4 w-4" />
                    Cargo
                  </TabsTrigger>
                  <TabsTrigger value="commercial" className="flex flex-col gap-1 py-2 text-xs">
                    <Building2 className="h-4 w-4" />
                    Parties
                  </TabsTrigger>
                  <TabsTrigger value="deal" className="flex flex-col gap-1 py-2 text-xs">
                    <DollarSign className="h-4 w-4" />
                    Deal
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Basic Information */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Ship className="h-5 w-5 text-primary" />
                        Basic Information
                      </CardTitle>
                      <CardDescription>Vessel identity & AIS auto-fill requirements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="flex items-center gap-1">
                            Vessel Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            placeholder="Required for AI Auto-Fill"
                            className={!formData.name?.trim() ? 'border-orange-300' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vessel_type" className="flex items-center gap-1">
                            Vessel Type <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={formData.vessel_type || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, vessel_type: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vessel type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select vessel type</SelectItem>
                              <SelectItem value="Crude Tanker">Crude Tanker</SelectItem>
                              <SelectItem value="Product Tanker">Product Tanker</SelectItem>
                              <SelectItem value="LNG Carrier">LNG Carrier</SelectItem>
                              <SelectItem value="LPG Carrier">LPG Carrier</SelectItem>
                              <SelectItem value="VLCC">VLCC</SelectItem>
                              <SelectItem value="Suezmax">Suezmax</SelectItem>
                              <SelectItem value="Aframax">Aframax</SelectItem>
                              <SelectItem value="Chemical Tanker">Chemical Tanker</SelectItem>
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
                              <SelectValue placeholder="Select flag" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              <SelectItem value="none">Select flag state</SelectItem>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.name.toLowerCase()}>
                                  <span className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.name}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="imo" className="flex items-center gap-1">
                            IMO Number <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="imo"
                            value={formData.imo || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, imo: e.target.value || null }))}
                            placeholder="7-digit IMO (required)"
                            className={!formData.imo?.trim() ? 'border-orange-300' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="mmsi" className="flex items-center gap-1">
                            MMSI <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="mmsi"
                            value={formData.mmsi || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, mmsi: e.target.value || null }))}
                            placeholder="9-digit MMSI (required)"
                            className={!formData.mmsi?.trim() ? 'border-orange-300' : ''}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
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
                        <div>
                          <Label htmlFor="status">Vessel Status</Label>
                          <Select 
                            value={formData.status || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="at_port">At Port</SelectItem>
                              <SelectItem value="anchored">Anchored</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ai_source">AI Auto-Fill Source</Label>
                          <Input
                            id="ai_source"
                            value={formData.ai_autofill_source || 'Manual'}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 2: Technical Specifications */}
                <TabsContent value="technical" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        Technical Specifications
                      </CardTitle>
                      <CardDescription>Credibility & logistics assessment data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="length">Length Overall (m)</Label>
                          <Input
                            id="length"
                            type="number"
                            step="0.1"
                            value={formData.length || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="width">Beam (m)</Label>
                          <Input
                            id="width"
                            type="number"
                            step="0.1"
                            value={formData.width || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value ? Number(e.target.value) : null }))}
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
                        <div>
                          <Label htmlFor="deadweight">Deadweight (DWT)</Label>
                          <Input
                            id="deadweight"
                            type="number"
                            value={formData.deadweight || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadweight: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="gross_tonnage">Gross Tonnage (GT)</Label>
                          <Input
                            id="gross_tonnage"
                            type="number"
                            value={formData.gross_tonnage || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, gross_tonnage: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cargo_capacity">Cargo Capacity (MT)</Label>
                          <Input
                            id="cargo_capacity"
                            type="number"
                            value={formData.cargo_capacity || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cargo_capacity: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cargo_capacity_bbl">Cargo Capacity (BBL)</Label>
                          <Input
                            id="cargo_capacity_bbl"
                            type="number"
                            value={formData.cargo_capacity_bbl || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cargo_capacity_bbl: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="engine_power">Engine Power (kW)</Label>
                          <Input
                            id="engine_power"
                            type="number"
                            value={formData.engine_power || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, engine_power: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="service_speed">Service Speed (knots)</Label>
                          <Input
                            id="service_speed"
                            type="number"
                            step="0.1"
                            value={formData.service_speed || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, service_speed: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fuel_consumption">Fuel Consumption (MT/day)</Label>
                          <Input
                            id="fuel_consumption"
                            type="number"
                            step="0.1"
                            value={formData.fuel_consumption || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, fuel_consumption: e.target.value ? Number(e.target.value) : null }))}
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
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 3: Navigation & Location */}
                <TabsContent value="navigation" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        Navigation & Location
                      </CardTitle>
                      <CardDescription>Tracking & transparency data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="nav_status">Navigation Status</Label>
                          <Select 
                            value={formData.nav_status || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, nav_status: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select status</SelectItem>
                              <SelectItem value="underway">Underway</SelectItem>
                              <SelectItem value="anchored">Anchored</SelectItem>
                              <SelectItem value="moored">Moored</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="current_region">Current Region</Label>
                          <Input
                            id="current_region"
                            value={formData.current_region || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, current_region: e.target.value || null }))}
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

                      {showInlineMap && (
                        <div className="border rounded-lg overflow-hidden">
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
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 4: Route & Ports */}
                <TabsContent value="route" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Route className="h-5 w-5 text-primary" />
                        Route & Ports (Voyage)
                      </CardTitle>
                      <CardDescription>Shipment visibility data</CardDescription>
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
                              <SelectValue placeholder="Select port" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select port</SelectItem>
                              {ports.map((port) => (
                                <SelectItem key={port.id} value={port.id.toString()}>
                                  {port.name} ({port.country})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="loading_port">Loading Port</Label>
                          <Input
                            id="loading_port"
                            value={formData.loading_port || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, loading_port: e.target.value || null }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="discharge_port">Discharge Port</Label>
                          <Input
                            id="discharge_port"
                            value={formData.discharge_port || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, discharge_port: e.target.value || null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="destination_port">Destination Port</Label>
                          <Select 
                            value={formData.destination_port?.toString() || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, destination_port: value === "none" ? null : Number(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select port" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select port</SelectItem>
                              {ports.map((port) => (
                                <SelectItem key={port.id} value={port.id.toString()}>
                                  {port.name} ({port.country})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="departure_date">Departure Date</Label>
                          <Input
                            id="departure_date"
                            type="datetime-local"
                            value={formData.departure_date?.slice(0, 16) || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, departure_date: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="eta">ETA (Estimated Arrival)</Label>
                          <Input
                            id="eta"
                            type="datetime-local"
                            value={formData.eta?.slice(0, 16) || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, eta: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="route_distance">Route Distance (NM)</Label>
                          <Input
                            id="route_distance"
                            type="number"
                            value={formData.route_distance || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, route_distance: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="voyage_status">Voyage Status</Label>
                          <Select 
                            value={formData.voyage_status || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, voyage_status: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select status</SelectItem>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="voyage_notes">Voyage Notes</Label>
                          <Textarea
                            id="voyage_notes"
                            value={formData.voyage_notes || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, voyage_notes: e.target.value || null }))}
                            placeholder="Waypoints & routing details"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 5: Cargo Information */}
                <TabsContent value="cargo" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Fuel className="h-5 w-5 text-primary" />
                        Cargo Information
                      </CardTitle>
                      <CardDescription>What is onboard - most important for customers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cargo_type" className="flex items-center gap-1">
                            Cargo Type <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={formData.cargo_type || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, cargo_type: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select type</SelectItem>
                              <SelectItem value="Crude Oil">Crude Oil</SelectItem>
                              <SelectItem value="Refined Product">Refined Product</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="commodity_name" className="flex items-center gap-1">
                            Commodity Name <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={formData.commodity_name || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, commodity_name: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select commodity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select commodity</SelectItem>
                              <SelectItem value="ULSD EN590 10ppm">ULSD EN590 10ppm</SelectItem>
                              <SelectItem value="Jet A1">Jet A1</SelectItem>
                              <SelectItem value="Virgin Fuel D2">Virgin Fuel D2</SelectItem>
                              <SelectItem value="D6 Virgin Fuel Oil">D6 Virgin Fuel Oil</SelectItem>
                              <SelectItem value="Brent Crude">Brent Crude</SelectItem>
                              <SelectItem value="WTI Crude">WTI Crude</SelectItem>
                              <SelectItem value="Arab Light">Arab Light</SelectItem>
                              <SelectItem value="Bonny Light">Bonny Light</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="commodity_category">Commodity Category</Label>
                          <Select 
                            value={formData.commodity_category || "none"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, commodity_category: value === "none" ? null : value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select category</SelectItem>
                              <SelectItem value="Crude">Crude</SelectItem>
                              <SelectItem value="Clean Product">Clean Product</SelectItem>
                              <SelectItem value="Dirty Product">Dirty Product</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="hs_code">HS Code (Optional)</Label>
                          <Input
                            id="hs_code"
                            value={formData.hs_code || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, hs_code: e.target.value || null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="oil_source">Oil Source / Field</Label>
                          <Input
                            id="oil_source"
                            value={formData.oil_source || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, oil_source: e.target.value || null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="source_refinery">Source Refinery</Label>
                          <Input
                            id="source_refinery"
                            value={formData.source_refinery || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, source_refinery: e.target.value || null }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cargo_origin_country">Cargo Origin Country</Label>
                          <Input
                            id="cargo_origin_country"
                            value={formData.cargo_origin_country || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cargo_origin_country: e.target.value || null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sanctions_status" className="flex items-center gap-1">
                            Sanctions Status <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={formData.sanctions_status || "non-sanctioned"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, sanctions_status: value }))}
                          >
                            <SelectTrigger className={getSanctionsStatusColor(formData.sanctions_status)}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="non-sanctioned">
                                <span className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-green-600" />
                                  Non-Sanctioned
                                </span>
                              </SelectItem>
                              <SelectItem value="restricted">
                                <span className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  Restricted
                                </span>
                              </SelectItem>
                              <SelectItem value="sanctioned">
                                <span className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  Sanctioned
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="min_quantity">Minimum Quantity</Label>
                          <Input
                            id="min_quantity"
                            type="number"
                            value={formData.min_quantity || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_quantity">Maximum Quantity</Label>
                          <Input
                            id="max_quantity"
                            type="number"
                            value={formData.max_quantity || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, max_quantity: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantity_unit" className="flex items-center gap-1">
                            Quantity Unit <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={formData.quantity_unit || "MT"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, quantity_unit: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MT">MT (Metric Tons)</SelectItem>
                              <SelectItem value="BBL">BBL (Barrels)</SelectItem>
                              <SelectItem value="GAL">GAL (Gallons)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="total_shipment_quantity">Total Shipment Quantity</Label>
                          <Input
                            id="total_shipment_quantity"
                            type="number"
                            value={formData.total_shipment_quantity || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, total_shipment_quantity: e.target.value ? Number(e.target.value) : null }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quality_specification">Quality Specification Reference</Label>
                        <Textarea
                          id="quality_specification"
                          value={formData.quality_specification || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, quality_specification: e.target.value || null }))}
                          placeholder="API, Sulfur %, Density, ASTM / ISO standards..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 6: Commercial Parties */}
                <TabsContent value="commercial" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                        Commercial Parties
                      </CardTitle>
                      <CardDescription>Transparency & access control</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Public / Customer View */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm flex items-center gap-2 text-green-600">
                          <Shield className="h-4 w-4" />
                          Public / Customer View
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="owner_name">Vessel Owner</Label>
                            <Input
                              id="owner_name"
                              value={formData.owner_name || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value || null }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="operator_name">Vessel Operator</Label>
                            <Input
                              id="operator_name"
                              value={formData.operator_name || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, operator_name: e.target.value || null }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="source_company">Source Company</Label>
                            <Input
                              id="source_company"
                              value={formData.source_company || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, source_company: e.target.value || null }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="target_refinery">Target Refinery</Label>
                            <Select 
                              value={formData.refinery_id || "none"} 
                              onValueChange={(value) => {
                                const refinery = refineries.find(r => r.id === value);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  refinery_id: value === "none" ? null : value,
                                  target_refinery: refinery?.name || null
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select refinery" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select refinery</SelectItem>
                                {refineries.map((refinery) => (
                                  <SelectItem key={refinery.id} value={refinery.id}>
                                    {refinery.name} ({refinery.country})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Broker Only View */}
                      <div className="space-y-4 p-4 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                        <h4 className="font-medium text-sm flex items-center gap-2 text-orange-600">
                          <Lock className="h-4 w-4" />
                          Broker Only View (Hidden from Public)
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="buyer_company_id">Buyer Company</Label>
                            <Select 
                              value={formData.buyer_company_id?.toString() || "none"} 
                              onValueChange={(value) => {
                                const company = buyerCompanies.find(c => c.id.toString() === value);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  buyer_company_id: value === "none" ? null : Number(value),
                                  buyer_name: company?.name || null
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select buyer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select buyer</SelectItem>
                                {buyerCompanies.map((company) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name} ({company.country})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="seller_company_id">Seller Company</Label>
                            <Select 
                              value={formData.seller_company_id?.toString() || "none"} 
                              onValueChange={(value) => {
                                const company = sellerCompanies.find(c => c.id.toString() === value);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  seller_company_id: value === "none" ? null : Number(value),
                                  seller_name: company?.name || null
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select seller" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select seller</SelectItem>
                                {sellerCompanies.map((company) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name} ({company.country})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="commodity_source_company_id">Commodity Sources</Label>
                            <Select 
                              value={formData.commodity_source_company_id?.toString() || "none"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, commodity_source_company_id: value === "none" ? null : Number(value) }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select source</SelectItem>
                                {realCompanies.map((company) => (
                                  <SelectItem key={company.id} value={company.id.toString()}>
                                    {company.name} ({company.country})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab 7: Deal & Commercial Terms */}
                <TabsContent value="deal" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Deal & Commercial Terms
                      </CardTitle>
                      <CardDescription>Turn vessel into a sellable deal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Deal Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="deal_reference_id" className="flex items-center gap-1">
                            Deal Reference ID <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="deal_reference_id"
                            value={formData.deal_reference_id || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, deal_reference_id: e.target.value || null }))}
                            placeholder="e.g., PDH-2024-001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deal_status">Deal Status</Label>
                          <Select 
                            value={formData.deal_status || "open"} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, deal_status: value }))}
                          >
                            <SelectTrigger className={getDealStatusColor(formData.deal_status)}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="negotiation">Negotiation</SelectItem>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Contract Terms */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Contract Terms</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="contract_type" className="flex items-center gap-1">
                              Contract Type <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={formData.contract_type || "none"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value === "none" ? null : value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select type</SelectItem>
                                <SelectItem value="spot">Spot</SelectItem>
                                <SelectItem value="spot_trial">Spot Trial</SelectItem>
                                <SelectItem value="term">Term</SelectItem>
                                <SelectItem value="option_12m">Option 12 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="delivery_terms" className="flex items-center gap-1">
                              Delivery Terms <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={formData.delivery_terms || "none"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_terms: value === "none" ? null : value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select terms</SelectItem>
                                <SelectItem value="FOB">FOB</SelectItem>
                                <SelectItem value="CIF">CIF</SelectItem>
                                <SelectItem value="CFR">CFR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="delivery_method">Delivery Method</Label>
                            <Select 
                              value={formData.delivery_method || "Vessel"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_method: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Vessel">Vessel</SelectItem>
                                <SelectItem value="Storage">Storage</SelectItem>
                                <SelectItem value="Pipeline">Pipeline</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Structure */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Pricing Structure</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="price_basis" className="flex items-center gap-1">
                              Price Basis <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={formData.price_basis || "TBD"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, price_basis: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select basis" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TBD">TBD</SelectItem>
                                <SelectItem value="Platts">Platts</SelectItem>
                                <SelectItem value="Argus">Argus</SelectItem>
                                <SelectItem value="Fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="benchmark_reference">Benchmark Reference</Label>
                            <Input
                              id="benchmark_reference"
                              value={formData.benchmark_reference || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, benchmark_reference: e.target.value || null }))}
                              placeholder="e.g., Platts ULSD, ICE Brent"
                            />
                          </div>
                          <div>
                            <Label htmlFor="indicative_price">Indicative Price ($)</Label>
                            <Input
                              id="indicative_price"
                              type="number"
                              step="0.01"
                              value={formData.indicative_price || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, indicative_price: e.target.value ? Number(e.target.value) : null }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="market_price">Market Price ($)</Label>
                            <Input
                              id="market_price"
                              type="number"
                              step="0.01"
                              value={formData.market_price || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, market_price: e.target.value ? Number(e.target.value) : null }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="deal_value">Deal Value ($)</Label>
                            <Input
                              id="deal_value"
                              type="number"
                              value={formData.deal_value || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, deal_value: e.target.value ? Number(e.target.value) : null }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="price_notes">Price Notes</Label>
                            <Input
                              id="price_notes"
                              value={formData.price_notes || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, price_notes: e.target.value || null }))}
                              placeholder="Based on procedure & source refinery"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Payment Terms */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground">Payment Terms</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="payment_method" className="flex items-center gap-1">
                              Payment Method <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={formData.payment_method || "none"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value === "none" ? null : value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select method</SelectItem>
                                <SelectItem value="MT103">MT103</SelectItem>
                                <SelectItem value="TT">TT (Wire Transfer)</SelectItem>
                                <SelectItem value="LC">LC (Letter of Credit)</SelectItem>
                                <SelectItem value="SBLC">SBLC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="payment_timing" className="flex items-center gap-1">
                              Payment Timing <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                              value={formData.payment_timing || "none"} 
                              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_timing: value === "none" ? null : value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timing" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select timing</SelectItem>
                                <SelectItem value="after_delivery">After Delivery</SelectItem>
                                <SelectItem value="upon_documents">Upon Documents</SelectItem>
                                <SelectItem value="at_loading">At Loading</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="payment_notes">Payment Notes</Label>
                            <Input
                              id="payment_notes"
                              value={formData.payment_notes || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, payment_notes: e.target.value || null }))}
                              placeholder="After successful delivery"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
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
      </div>

      {/* Bulk Auto-Fill Progress Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Bulk Auto-Fill Progress
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress: {bulkProgress.current} / {bulkProgress.total}</span>
              <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100) || 0}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300" 
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100 || 0}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{bulkProgress.success}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{bulkProgress.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
            {isBulkAutoFilling && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing vessels... Please wait.
              </div>
            )}
            {!isBulkAutoFilling && bulkProgress.current > 0 && (
              <Button onClick={() => setShowBulkDialog(false)} className="w-full">
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Bar */}
      <Card className="trading-card">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by vessel name, MMSI, type, flag, or deal reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vessels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVessels.map((vessel) => (
          <Card key={vessel.id} className="trading-card hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{vessel.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{vessel.vessel_type}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {vessel.deal_status && (
                    <Badge className={getDealStatusColor(vessel.deal_status)} variant="outline">
                      {vessel.deal_status}
                    </Badge>
                  )}
                  {vessel.sanctions_status && (
                    <Badge className={getSanctionsStatusColor(vessel.sanctions_status)} variant="outline">
                      {vessel.sanctions_status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Flag className="h-3 w-3" />
                  <span>{vessel.flag || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Anchor className="h-3 w-3" />
                  <span>IMO: {vessel.imo || 'N/A'}</span>
                </div>
              </div>
              
              {vessel.commodity_name && (
                <div className="p-2 bg-muted/50 rounded text-sm">
                  <span className="text-muted-foreground">Cargo:</span>{' '}
                  <span className="font-medium">{vessel.commodity_name}</span>
                </div>
              )}

              {vessel.deal_reference_id && (
                <div className="text-xs text-muted-foreground">
                  Deal: <span className="font-mono">{vessel.deal_reference_id}</span>
                </div>
              )}

              {vessel.deal_value && (
                <div className="text-sm font-medium text-green-600">
                  Deal Value: ${vessel.deal_value.toLocaleString()}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAutofill(vessel.id!)}
                  disabled={isAutofillingVessel === vessel.id}
                >
                  {isAutofillingVessel === vessel.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Bot className="h-3 w-3" />
                  )}
                  <span className="ml-1">Auto-Fill</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(vessel)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(vessel.id!)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVessels.length === 0 && (
        <Card className="trading-card">
          <CardContent className="py-8 text-center">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vessels found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VesselManagement;
