import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Ship, 
  MapPin, 
  Clock, 
  Activity, 
  ArrowLeft,
  Navigation,
  Fuel,
  Users,
  Package,
  DollarSign,
  Calendar,
  Flag,
  Building2,
  Compass,
  Anchor,
  Gauge,
  Zap,
  Route,
  TrendingUp,
  Globe,
  AlertCircle,
  Info,
  Target,
  Truck,
  Briefcase,
  Lock,
  FileText
} from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';
import EnhancedVesselDocumentGenerator from '@/components/EnhancedVesselDocumentGenerator';

import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Vessel {
  id: string;
  name: string;
  mmsi: string;
  imo: string;
  vessel_type: string;
  flag: string;
  flag_country?: string;
  built: number;
  deadweight: number;
  cargo_capacity: number;
  current_lat: number;
  current_lng: number;
  speed: string;
  status: string;
  departure_port: number;
  destination_port: number;
  departure_port_name?: string;
  destination_port_name?: string;
  loading_port_name?: string;
  departure_date: string;
  arrival_date: string;
  eta: string;
  loading_port: string;
  cargo_type: string;
  cargo_quantity: number;
  oil_type: string;
  oil_source: string;
  current_region: string;
  owner_name: string;
  operator_name: string;
  buyer_name: string;
  seller_name: string;
  source_company: string;
  target_refinery: string;
  length: number;
  width: number;
  beam: string;
  draught: number;
  draft: string;
  gross_tonnage: number;
  crew_size: number;
  engine_power: number;
  fuel_consumption: number;
  course: number;
  deal_value: number;
  price: number;
  market_price: number;
  quantity: number;
  departure_lat: number;
  departure_lng: number;
  destination_lat: number;
  destination_lng: number;
  route_distance: number;
  shipping_type: string;
  callsign: string;
  nav_status: string;
  route_info: string;
  metadata: any;
  last_updated: string;
  company_id: string;
}

const VesselDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBroker } = useUserRole();
  const { toast } = useToast();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [loading, setLoading] = useState(true);
  const [brokerProfile, setBrokerProfile] = useState<any>(null);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [dealForm, setDealForm] = useState({
    deal_type: '',
    expected_destination: '',
    special_notes: '',
    terms_trade_laws: false,
    terms_legal_framework: false,
    terms_commission: false,
    terms_platform_role: false
  });

  useEffect(() => {
    if (id) {
      fetchVessel();
    }
    if (user) {
      fetchBrokerProfile();
    }
  }, [id, user]);

  const fetchBrokerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setBrokerProfile(data);
    } catch (error) {
      console.error('Error fetching broker profile:', error);
    }
  };

  const fetchVessel = async () => {
    try {
      const [vesselRes, portsRes] = await Promise.all([
        db.from('vessels').select('*').eq('id', id).maybeSingle(),
        db.from('ports').select('id, name, country')
      ]);

      if (vesselRes.error) {
        console.error('Error fetching vessel:', vesselRes.error);
      } else if (vesselRes.data) {
        const vessel = vesselRes.data;
        const ports = portsRes.data || [];
        
        // Create port lookup map
        const portMap = ports.reduce((acc, port) => {
          acc[port.id] = port;
          return acc;
        }, {} as any);

        // Enhance vessel with port and flag information
        const enhancedVessel = {
          ...vessel,
          departure_port_name: vessel.departure_port ? portMap[vessel.departure_port]?.name || `Port ${vessel.departure_port}` : 'Unknown',
          destination_port_name: vessel.destination_port ? portMap[vessel.destination_port]?.name || `Port ${vessel.destination_port}` : 'Unknown',
          loading_port_name: vessel.loading_port ? portMap[vessel.loading_port]?.name || vessel.loading_port : 'Unknown',
          flag_country: getCountryFromFlag(vessel.flag)
        };

        setVessel(enhancedVessel);
      }
    } catch (error) {
      console.error('Failed to fetch vessel:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map flag to country name
  const handleCreateDeal = async () => {
    if (!brokerProfile || !vessel) return;

    // Validate all terms are checked
    const allTermsAccepted = dealForm.terms_trade_laws && 
                           dealForm.terms_legal_framework && 
                           dealForm.terms_commission && 
                           dealForm.terms_platform_role;

    if (!allTermsAccepted) {
      toast({
        title: "Error",
        description: "Please accept all terms and conditions to proceed.",
        variant: "destructive"
      });
      return;
    }

    try {
      const dealData = {
        broker_id: brokerProfile.id,
        vessel_id: parseInt(id!),
        deal_type: dealForm.deal_type,
        cargo_type: vessel.cargo_type,
        quantity: vessel.cargo_quantity || 0,
        price_per_unit: vessel.price || 0,
        total_value: (vessel.cargo_quantity || 0) * (vessel.price || 0),
        source_port: vessel.loading_port_name,
        destination_port: dealForm.expected_destination || vessel.destination_port_name,
        terms_conditions: dealForm.special_notes || 'Standard brokerage terms apply',
        status: 'pending',
        steps_completed: 0,
        total_steps: 8
      };

      const { error } = await supabase
        .from('broker_deals')
        .insert([dealData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Broker deal created successfully! Check your dashboard to track progress."
      });

      setDealDialogOpen(false);
      setDealForm({
        deal_type: '',
        expected_destination: '',
        special_notes: '',
        terms_trade_laws: false,
        terms_legal_framework: false,
        terms_commission: false,
        terms_platform_role: false
      });

      // Navigate to broker dashboard
      navigate('/broker-dashboard');

    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create broker deal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isVerifiedBroker = brokerProfile?.verified_at;

  // Helper function to map flag to country name
  const getCountryFromFlag = (flag: string): string => {
    if (!flag) return 'Unknown';
    
    const flagToCountryMap: { [key: string]: string } = {
      'marshall islands': 'Marshall Islands',
      'liberia': 'Liberia',
      'panama': 'Panama',
      'singapore': 'Singapore',
      'malta': 'Malta',
      'bahamas': 'Bahamas',
      'cyprus': 'Cyprus',
      'antigua and barbuda': 'Antigua and Barbuda',
      'isle of man': 'Isle of Man',
      'hong kong': 'Hong Kong',
      'greece': 'Greece',
      'norway': 'Norway',
      'united kingdom': 'United Kingdom',
      'germany': 'Germany',
      'netherlands': 'Netherlands',
      'denmark': 'Denmark',
      'italy': 'Italy',
      'france': 'France',
      'spain': 'Spain',
      'japan': 'Japan',
      'south korea': 'South Korea',
      'china': 'China',
      'united states': 'United States',
      'russia': 'Russia',
      'turkey': 'Turkey',
      'india': 'India',
      'brazil': 'Brazil',
      'saudi arabia': 'Saudi Arabia',
      'uae': 'United Arab Emirates',
      'qatar': 'Qatar',
      'kuwait': 'Kuwait'
    };

    const lowercaseFlag = flag.toLowerCase();
    return flagToCountryMap[lowercaseFlag] || flag.charAt(0).toUpperCase() + flag.slice(1);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!vessel) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Vessel Not Found</h1>
          <Button onClick={() => navigate('/vessels')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vessels
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'underway':
      case 'sailing':
        return 'default';
      case 'anchored':
      case 'at anchor':
        return 'secondary';
      case 'loading':
      case 'discharging':
        return 'outline';
      case 'berthed':
      case 'in port':
        return 'secondary';
      case 'complete':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/vessels')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vessels
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {vessel.name}
          </h1>
          <p className="text-muted-foreground">
            {vessel.vessel_type} • {vessel.flag_country}
          </p>
        </div>
      </div>

      {/* Key Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Deadweight</p>
                <p className="text-xl font-bold">{vessel.deadweight?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Speed</p>
                <p className="text-xl font-bold">{vessel.speed} kts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="text-xl font-bold">{vessel.cargo_quantity?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Deal Value</p>
                <p className="text-xl font-bold">${(vessel.deal_value || 0)?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Vessel Information */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Vessel Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge variant={getStatusBadgeVariant(vessel.status)} className="text-sm">
                  {vessel.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {vessel.current_region}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">MMSI</p>
                  <p className="font-semibold">{vessel.mmsi || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IMO</p>
                  <p className="font-semibold">{vessel.imo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Call Sign</p>
                  <p className="font-semibold">{vessel.callsign || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Built</p>
                  <p className="font-semibold">{vessel.built || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flag</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    {vessel.flag_country}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vessel Type</p>
                  <p className="font-semibold">{vessel.vessel_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Technical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Length</p>
                  <p className="font-semibold">{vessel.length || 'N/A'}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Beam</p>
                  <p className="font-semibold">{vessel.beam || vessel.width || 'N/A'}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Draught</p>
                  <p className="font-semibold">{vessel.draught || vessel.draft || 'N/A'}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadweight</p>
                  <p className="font-semibold">{vessel.deadweight?.toLocaleString() || 'N/A'} DWT</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gross Tonnage</p>
                  <p className="font-semibold">{vessel.gross_tonnage?.toLocaleString() || 'N/A'} GT</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Engine Power</p>
                  <p className="font-semibold">{vessel.engine_power?.toLocaleString() || 'N/A'} kW</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position & Navigation */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                Position & Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Position</p>
                    <p className="font-semibold">
                      {vessel.current_lat?.toFixed(4)}°, {vessel.current_lng?.toFixed(4)}°
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Speed</p>
                    <p className="font-semibold">{vessel.speed || 'N/A'} knots</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Course</p>
                    <p className="font-semibold">{vessel.course || 'N/A'}°</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Navigation Status</p>
                    <p className="font-semibold">{vessel.nav_status || vessel.status}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vessel Location Map */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Vessel Location & Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VesselMap 
                vessel={{
                  latitude: vessel.current_lat,
                  longitude: vessel.current_lng,
                  departure_port_lat: vessel.departure_lat,
                  departure_port_lng: vessel.departure_lng,
                  destination_port_lat: vessel.destination_lat,
                  destination_port_lng: vessel.destination_lng,
                  departure_port: vessel.departure_port_name,
                  destination_port: vessel.destination_port_name,
                  name: vessel.name
                }}
                height="400px"
              />
            </CardContent>
          </Card>

          {/* Voyage Schedule */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Voyage Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Departure Date</p>
                  <p className="font-semibold">{formatDate(vessel.departure_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Arrival Date</p>
                  <p className="font-semibold">{formatDate(vessel.arrival_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ETA</p>
                  <p className="font-semibold">{formatDate(vessel.eta)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">{formatDate(vessel.last_updated)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Generation & Storage Section */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Vessel Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Generator */}
              <EnhancedVesselDocumentGenerator vessel={vessel} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Route Information */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Departure Port</p>
                <p className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  {vessel.departure_port_name}
                </p>
                {vessel.departure_lat && vessel.departure_lng && (
                  <p className="text-xs text-muted-foreground">
                    {vessel.departure_lat.toFixed(4)}°, {vessel.departure_lng.toFixed(4)}°
                  </p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Loading Port</p>
                <p className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  {vessel.loading_port_name}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Destination Port</p>
                <p className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {vessel.destination_port_name}
                </p>
                {vessel.destination_lat && vessel.destination_lng && (
                  <p className="text-xs text-muted-foreground">
                    {vessel.destination_lat.toFixed(4)}°, {vessel.destination_lng.toFixed(4)}°
                  </p>
                )}
              </div>
              {vessel.route_distance && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Route Distance</p>
                    <p className="font-semibold">{vessel.route_distance.toLocaleString()} nm</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Commercial Parties */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Commercial Parties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-semibold">{vessel.owner_name || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Operator</p>
                <p className="font-semibold">{vessel.operator_name || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Buyer</p>
                <p className="font-semibold">{vessel.buyer_name || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Seller</p>
                <p className="font-semibold">{vessel.seller_name || 'N/A'}</p>
              </div>
              {vessel.source_company && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Source Company</p>
                    <p className="font-semibold">{vessel.source_company}</p>
                  </div>
                </>
              )}
              {vessel.target_refinery && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Target Refinery</p>
                    <p className="font-semibold">{vessel.target_refinery}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Operational Details */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Operational Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Crew Size</p>
                    <p className="font-semibold">{vessel.crew_size ? `${vessel.crew_size} persons` : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Consumption</p>
                    <p className="font-semibold">{vessel.fuel_consumption ? `${vessel.fuel_consumption} MT/day` : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                    <p className="font-semibold">{vessel.status || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Region</p>
                    <p className="font-semibold">{vessel.current_region || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Navigation Status</p>
                    <p className="font-semibold">{vessel.nav_status || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Engine Power</p>
                    <p className="font-semibold">{vessel.engine_power ? `${vessel.engine_power?.toLocaleString()} kW` : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {(vessel.owner_name || vessel.operator_name) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vessel.owner_name && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Owner</p>
                          <p className="font-semibold">{vessel.owner_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {vessel.operator_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Operator</p>
                          <p className="font-semibold">{vessel.operator_name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {vessel.route_info && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <Route className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Route Information</p>
                      <p className="font-semibold text-sm">{vessel.route_info}</p>
                    </div>
                  </div>
                </>
              )}

              {(!vessel.crew_size && !vessel.fuel_consumption && !vessel.status && !vessel.current_region && !vessel.nav_status && !vessel.engine_power && !vessel.owner_name && !vessel.operator_name && !vessel.route_info) && (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No detailed operational data available for this vessel
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cargo & Commercial Details */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Cargo & Commercial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cargo Type</p>
                  <p className="font-semibold">{vessel.cargo_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Oil Type</p>
                  <p className="font-semibold">{vessel.oil_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Oil Source</p>
                  <p className="font-semibold">{vessel.oil_source || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Type</p>
                  <p className="font-semibold">{vessel.shipping_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo Quantity</p>
                  <p className="font-semibold">
                    {vessel.cargo_quantity?.toLocaleString() || vessel.quantity?.toLocaleString() || 'N/A'} barrels
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cargo Capacity</p>
                  <p className="font-semibold">
                    {vessel.cargo_capacity?.toLocaleString() || 'N/A'} barrels
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deal Value</p>
                    <p className="font-semibold text-green-600">
                      ${vessel.deal_value?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-semibold text-blue-600">
                      ${vessel.price?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Market Price</p>
                    <p className="font-semibold text-purple-600">
                      ${vessel.market_price?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Creation - Broker Only */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Broker Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isVerifiedBroker ? (
                <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Create Broker Deal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Create Broker Deal for {vessel.name}</DialogTitle>
                      <DialogDescription className="text-sm">
                        Set up a new brokerage deal for this vessel. You'll be able to track the deal progress through your dashboard.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                      {/* Deal Type */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <Label className="text-sm font-semibold">Deal Type *</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="direct_buyer"
                              checked={dealForm.deal_type === 'direct_buyer'}
                              onCheckedChange={(checked) => 
                                setDealForm({...dealForm, deal_type: checked ? 'direct_buyer' : ''})
                              }
                            />
                            <Label htmlFor="direct_buyer" className="font-normal text-sm">DIRECT BUYER</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="brokerage"
                              checked={dealForm.deal_type === 'brokerage'}
                              onCheckedChange={(checked) => 
                                setDealForm({...dealForm, deal_type: checked ? 'brokerage' : ''})
                              }
                            />
                            <Label htmlFor="brokerage" className="font-normal text-sm">BROKERAGE (Intermediary)</Label>
                          </div>
                        </div>
                      </div>

                      {/* Expected Destination */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <Label htmlFor="expected_destination" className="text-sm font-semibold">Expected Destination</Label>
                        <p className="text-xs text-muted-foreground mb-2">(Enter port or country of delivery)</p>
                        <Input
                          id="expected_destination"
                          value={dealForm.expected_destination}
                          onChange={(e) => setDealForm({...dealForm, expected_destination: e.target.value})}
                          placeholder={vessel.destination_port_name || "Enter destination port or country"}
                          className="mt-1"
                        />
                      </div>

                      {/* Special Notes */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <Label htmlFor="special_notes" className="text-sm font-semibold">Special Notes / Buyer Requirements</Label>
                        <p className="text-xs text-muted-foreground mb-2">(Optional free text field)</p>
                        <Textarea
                          id="special_notes"
                          value={dealForm.special_notes}
                          onChange={(e) => setDealForm({...dealForm, special_notes: e.target.value})}
                          placeholder="Enter any special notes or buyer requirements..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      {/* Separator */}
                      <Separator />

                      {/* Terms & Conditions */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <Label className="text-sm font-semibold">Terms & Conditions (please confirm):</Label>
                        </div>
                        
                        <div className="space-y-2 ml-4">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms_trade_laws"
                              checked={dealForm.terms_trade_laws}
                              onCheckedChange={(checked) => 
                                setDealForm({...dealForm, terms_trade_laws: checked as boolean})
                              }
                            />
                            <Label htmlFor="terms_trade_laws" className="font-normal text-xs leading-relaxed">
                              I agree to comply with all international trade laws and government regulations.
                            </Label>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms_legal_framework"
                              checked={dealForm.terms_legal_framework}
                              onCheckedChange={(checked) => 
                                setDealForm({...dealForm, terms_legal_framework: checked as boolean})
                              }
                            />
                            <Label htmlFor="terms_legal_framework" className="font-normal text-xs leading-relaxed">
                              I confirm that all transactions follow the legal framework of PetroDealHub.
                            </Label>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms_commission"
                              checked={dealForm.terms_commission}
                              onCheckedChange={(checked) => 
                                setDealForm({...dealForm, terms_commission: checked as boolean})
                              }
                            />
                            <Label htmlFor="terms_commission" className="font-normal text-xs leading-relaxed">
                              Commission structure will be honored by all parties
                            </Label>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="terms_platform_role"
                              checked={dealForm.terms_platform_role}
                              onCheckedChange={(checked) => 
                                setDealForm({...dealForm, terms_platform_role: checked as boolean})
                              }
                            />
                            <Label htmlFor="terms_platform_role" className="font-normal text-xs leading-relaxed">
                              I accept PetroDealHub's role as a neutral platform without liability in external disputes.
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Separator */}
                      <Separator />

                      {/* Actions */}
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <Label className="text-sm font-semibold">Actions</Label>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setDealDialogOpen(false)}
                            className="flex-1 h-9"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateDeal}
                            className="flex-1 h-9"
                            size="sm"
                            disabled={!dealForm.deal_type || 
                                     !dealForm.terms_trade_laws || 
                                     !dealForm.terms_legal_framework || 
                                     !dealForm.terms_commission || 
                                     !dealForm.terms_platform_role}
                          >
                            Create Deal
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(brokerProfile ? '/broker-dashboard' : '/broker-membership')}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {brokerProfile ? 'Verification Required' : 'Become a Broker'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {brokerProfile 
                      ? 'Your broker account needs admin verification to create deals'
                      : 'Requires verified broker membership to create deals'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          {vessel.route_info && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{vessel.route_info}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VesselDetail;