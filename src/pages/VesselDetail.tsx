import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ship, MapPin, Clock, Activity, ArrowLeft, Navigation, Fuel, Users, Package,
  DollarSign, Calendar, Flag, Building2, Compass, Anchor, Gauge, Zap, Route,
  TrendingUp, Globe, AlertCircle, Info, Target, Truck, Briefcase, Lock, FileText,
  Shield, ShieldCheck, ShieldAlert, CreditCard, Receipt, Handshake, Timer
} from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';
import VesselMap from '@/components/VesselMap';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import VesselDocumentGenerator from '@/components/VesselDocumentGenerator';

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
  cargo_capacity_bbl?: number;
  current_lat: number;
  current_lng: number;
  speed: string;
  service_speed?: number;
  status: string;
  vesselstatus?: string;
  departure_port: number;
  destination_port: number;
  departure_port_name?: string;
  destination_port_name?: string;
  loading_port?: string;
  discharge_port?: string;
  departure_date: string;
  arrival_date: string;
  eta: string;
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
  last_updated: string;
  // New fields
  commodity_name?: string;
  commodity_category?: string;
  hs_code?: string;
  cargo_origin_country?: string;
  source_refinery?: string;
  sanctions_status?: string;
  min_quantity?: number;
  max_quantity?: number;
  quantity_unit?: string;
  total_shipment_quantity?: number;
  quality_specification?: string;
  deal_reference_id?: string;
  deal_status?: string;
  contract_type?: string;
  delivery_terms?: string;
  delivery_method?: string;
  delivery_date?: string;
  price_basis?: string;
  benchmark_reference?: string;
  indicative_price?: number;
  price_notes?: string;
  payment_method?: string;
  payment_timing?: string;
  payment_notes?: string;
  voyage_status?: string;
  voyage_notes?: string;
  ai_autofill_source?: string;
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
    if (id) fetchVessel();
    if (user) fetchBrokerProfile();
  }, [id, user]);

  const fetchBrokerProfile = async () => {
    try {
      const { data } = await supabase.from('broker_profiles').select('*').eq('user_id', user!.id).single();
      setBrokerProfile(data);
    } catch (error) {}
  };

  const fetchVessel = async () => {
    try {
      const [vesselRes, portsRes] = await Promise.all([
        db.from('vessels').select('*').eq('id', id).maybeSingle(),
        db.from('ports').select('id, name, country')
      ]);

      if (vesselRes.data) {
        const ports = portsRes.data || [];
        const portMap = ports.reduce((acc, port) => { acc[port.id] = port; return acc; }, {} as any);
        
        setVessel({
          ...vesselRes.data,
          departure_port_name: vesselRes.data.departure_port ? portMap[vesselRes.data.departure_port]?.name || 'Unknown' : 'Unknown',
          destination_port_name: vesselRes.data.destination_port ? portMap[vesselRes.data.destination_port]?.name || 'Unknown' : 'Unknown',
          flag_country: vesselRes.data.flag
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!brokerProfile || !vessel) return;
    const allTermsAccepted = dealForm.terms_trade_laws && dealForm.terms_legal_framework && dealForm.terms_commission && dealForm.terms_platform_role;
    if (!allTermsAccepted) {
      toast({ title: "Error", description: "Please accept all terms.", variant: "destructive" });
      return;
    }
    try {
      await supabase.from('broker_deals').insert([{
        broker_id: brokerProfile.id,
        vessel_id: parseInt(id!),
        deal_type: dealForm.deal_type,
        cargo_type: vessel.cargo_type,
        quantity: vessel.cargo_quantity || 0,
        price_per_unit: vessel.price || 0,
        total_value: (vessel.cargo_quantity || 0) * (vessel.price || 0),
        source_port: vessel.loading_port,
        destination_port: dealForm.expected_destination || vessel.destination_port_name,
        terms_conditions: dealForm.special_notes || 'Standard terms apply',
        status: 'pending',
        steps_completed: 0,
        total_steps: 8
      }]);
      toast({ title: "Success", description: "Broker deal created!" });
      setDealDialogOpen(false);
      navigate('/broker-dashboard');
    } catch (error) {
      toast({ title: "Error", description: "Failed to create deal.", variant: "destructive" });
    }
  };

  const isVerifiedBroker = brokerProfile?.verified_at;
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  const getSanctionsBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'non-sanctioned': return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><ShieldCheck className="h-3 w-3 mr-1" />Non-Sanctioned</Badge>;
      case 'restricted': return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Shield className="h-3 w-3 mr-1" />Restricted</Badge>;
      case 'sanctioned': return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><ShieldAlert className="h-3 w-3 mr-1" />Sanctioned</Badge>;
      default: return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) return <LoadingFallback />;
  if (!vessel) return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold text-muted-foreground">Vessel Not Found</h1>
      <Button onClick={() => navigate('/vessels')} className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/vessels')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{vessel.name}</h1>
            {vessel.deal_reference_id && <Badge variant="outline" className="font-mono">{vessel.deal_reference_id}</Badge>}
          </div>
          <p className="text-muted-foreground">{vessel.vessel_type} • {vessel.flag_country}</p>
        </div>
        {getSanctionsBadge(vessel.sanctions_status || '')}
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Cargo</p>
              <p className="text-xl font-bold">{vessel.cargo_quantity?.toLocaleString()} MT</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Deal Value</p>
              <p className="text-xl font-bold text-green-600">${(vessel.deal_value / 1000000)?.toFixed(2)}M</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Navigation className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-xl font-bold">{vessel.speed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Fuel className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Commodity</p>
              <p className="text-lg font-bold truncate">{vessel.commodity_name || vessel.oil_type}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Handshake className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Contract</p>
              <p className="text-lg font-bold">{vessel.contract_type || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cargo" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 gap-1">
          <TabsTrigger value="cargo">🛢️ Cargo</TabsTrigger>
          <TabsTrigger value="vessel">🚢 Vessel</TabsTrigger>
          <TabsTrigger value="route">🛤️ Route</TabsTrigger>
          <TabsTrigger value="deal">💰 Deal</TabsTrigger>
          <TabsTrigger value="parties">🏢 Parties</TabsTrigger>
          <TabsTrigger value="map">📍 Map</TabsTrigger>
          <TabsTrigger value="docs">📄 Docs</TabsTrigger>
        </TabsList>

        {/* CARGO TAB */}
        <TabsContent value="cargo">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Fuel className="h-5 w-5 text-primary" />Cargo Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Cargo Type</p><p className="font-semibold">{vessel.cargo_type}</p></div>
                <div><p className="text-sm text-muted-foreground">Commodity</p><p className="font-semibold">{vessel.commodity_name || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Category</p><p className="font-semibold">{vessel.commodity_category || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Oil Type/Source</p><p className="font-semibold">{vessel.oil_type}</p></div>
                <div><p className="text-sm text-muted-foreground">Origin Country</p><p className="font-semibold">{vessel.cargo_origin_country || vessel.oil_source}</p></div>
                <div><p className="text-sm text-muted-foreground">Source Refinery</p><p className="font-semibold">{vessel.source_refinery || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">HS Code</p><p className="font-semibold">{vessel.hs_code || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Quality Spec</p><p className="font-semibold text-xs">{vessel.quality_specification || 'N/A'}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Quantity & Sanctions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Min Quantity</p><p className="font-semibold">{vessel.min_quantity?.toLocaleString() || 'N/A'} {vessel.quantity_unit}</p></div>
                  <div><p className="text-sm text-muted-foreground">Max Quantity</p><p className="font-semibold">{vessel.max_quantity?.toLocaleString() || 'N/A'} {vessel.quantity_unit}</p></div>
                  <div><p className="text-sm text-muted-foreground">Total Shipment</p><p className="font-bold text-lg">{vessel.total_shipment_quantity?.toLocaleString() || vessel.cargo_quantity?.toLocaleString()} {vessel.quantity_unit || 'MT'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Cargo Capacity</p><p className="font-semibold">{vessel.cargo_capacity?.toLocaleString()} MT</p></div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Sanctions Status</span>
                  {getSanctionsBadge(vessel.sanctions_status || '')}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* VESSEL TAB */}
        <TabsContent value="vessel">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Ship className="h-5 w-5 text-primary" />Basic Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">IMO</p><p className="font-semibold">{vessel.imo}</p></div>
                <div><p className="text-sm text-muted-foreground">MMSI</p><p className="font-semibold">{vessel.mmsi}</p></div>
                <div><p className="text-sm text-muted-foreground">Call Sign</p><p className="font-semibold">{vessel.callsign}</p></div>
                <div><p className="text-sm text-muted-foreground">Flag</p><p className="font-semibold">{vessel.flag}</p></div>
                <div><p className="text-sm text-muted-foreground">Built</p><p className="font-semibold">{vessel.built}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><Badge>{vessel.vesselstatus || vessel.status}</Badge></div>
                <div><p className="text-sm text-muted-foreground">AI Source</p><p className="font-semibold">{vessel.ai_autofill_source || 'Manual'}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-primary" />Technical Specs</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Length</p><p className="font-semibold">{vessel.length} m</p></div>
                <div><p className="text-sm text-muted-foreground">Beam</p><p className="font-semibold">{vessel.beam || vessel.width} m</p></div>
                <div><p className="text-sm text-muted-foreground">Draught</p><p className="font-semibold">{vessel.draught || vessel.draft} m</p></div>
                <div><p className="text-sm text-muted-foreground">DWT</p><p className="font-semibold">{vessel.deadweight?.toLocaleString()} DWT</p></div>
                <div><p className="text-sm text-muted-foreground">GT</p><p className="font-semibold">{vessel.gross_tonnage?.toLocaleString()} GT</p></div>
                <div><p className="text-sm text-muted-foreground">Cargo (BBL)</p><p className="font-semibold">{vessel.cargo_capacity_bbl?.toLocaleString() || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Engine Power</p><p className="font-semibold">{vessel.engine_power?.toLocaleString()} kW</p></div>
                <div><p className="text-sm text-muted-foreground">Speed</p><p className="font-semibold">{vessel.service_speed || vessel.speed} kn</p></div>
                <div><p className="text-sm text-muted-foreground">Fuel</p><p className="font-semibold">{vessel.fuel_consumption} MT/day</p></div>
                <div><p className="text-sm text-muted-foreground">Crew</p><p className="font-semibold">{vessel.crew_size}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROUTE TAB */}
        <TabsContent value="route">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-primary" />Route & Ports</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-green-500" /><div><p className="text-xs text-muted-foreground">Departure</p><p className="font-semibold">{vessel.departure_port_name}</p></div></div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-orange-500" /><div><p className="text-xs text-muted-foreground">Loading</p><p className="font-semibold">{vessel.loading_port || 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-purple-500" /><div><p className="text-xs text-muted-foreground">Discharge</p><p className="font-semibold">{vessel.discharge_port || 'N/A'}</p></div></div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500" /><div><p className="text-xs text-muted-foreground">Destination</p><p className="font-semibold">{vessel.destination_port_name}</p></div></div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Distance</p><p className="font-semibold">{vessel.route_distance?.toLocaleString()} NM</p></div>
                  <div><p className="text-sm text-muted-foreground">Voyage Status</p><Badge>{vessel.voyage_status || 'N/A'}</Badge></div>
                </div>
                {vessel.voyage_notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{vessel.voyage_notes}</p></div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Schedule</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm text-muted-foreground">Departure Date</p><p className="font-semibold">{formatDate(vessel.departure_date)}</p></div>
                <div><p className="text-sm text-muted-foreground">ETA</p><p className="font-semibold">{formatDate(vessel.eta)}</p></div>
                <div><p className="text-sm text-muted-foreground">Arrival Date</p><p className="font-semibold">{formatDate(vessel.arrival_date)}</p></div>
                <div><p className="text-sm text-muted-foreground">Delivery Date</p><p className="font-semibold">{formatDate(vessel.delivery_date || '')}</p></div>
                <div><p className="text-sm text-muted-foreground">Last Updated</p><p className="font-semibold">{formatDate(vessel.last_updated)}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DEAL TAB */}
        <TabsContent value="deal">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" />Deal & Contract</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Deal Reference</span><Badge variant="outline" className="font-mono">{vessel.deal_reference_id || 'N/A'}</Badge></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Deal Status</span><Badge className="bg-green-500/20 text-green-700">{vessel.deal_status || 'Open'}</Badge></div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Contract Type</p><p className="font-semibold">{vessel.contract_type || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Delivery Terms</p><p className="font-semibold">{vessel.delivery_terms || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Delivery Method</p><p className="font-semibold">{vessel.delivery_method || 'Vessel'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Shipping Type</p><p className="font-semibold">{vessel.shipping_type || 'N/A'}</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Price Basis</p><p className="font-semibold">{vessel.price_basis || 'TBD'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Benchmark</p><p className="font-semibold">{vessel.benchmark_reference || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Indicative Price</p><p className="font-bold text-lg text-primary">${vessel.indicative_price || vessel.price}/bbl</p></div>
                  <div><p className="text-sm text-muted-foreground">Market Price</p><p className="font-semibold">${vessel.market_price}/bbl</p></div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Total Deal Value</p>
                  <p className="text-3xl font-bold text-primary">${(vessel.deal_value / 1000000)?.toFixed(2)}M</p>
                </div>
                {vessel.price_notes && <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{vessel.price_notes}</p></div>}
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Payment Terms</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <div><p className="text-sm text-muted-foreground">Payment Method</p><p className="font-semibold">{vessel.payment_method || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Payment Timing</p><p className="font-semibold">{vessel.payment_timing || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Notes</p><p className="text-sm">{vessel.payment_notes || 'N/A'}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PARTIES TAB */}
        <TabsContent value="parties">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Public Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm text-muted-foreground">Vessel Owner</p><p className="font-semibold">{vessel.owner_name || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Vessel Operator</p><p className="font-semibold">{vessel.operator_name || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Source Company</p><p className="font-semibold">{vessel.source_company || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Target Refinery</p><p className="font-semibold">{vessel.target_refinery || 'N/A'}</p></div>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-500" />
                  Broker Only Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isVerifiedBroker ? (
                  <div className="space-y-4">
                    <div><p className="text-sm text-muted-foreground">Buyer Company</p><p className="font-semibold">{vessel.buyer_name || 'N/A'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Seller Company</p><p className="font-semibold">{vessel.seller_name || 'N/A'}</p></div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Verified broker access required</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/broker-membership')}>Become a Broker</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MAP TAB */}
        <TabsContent value="map">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Live Position & Route</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div><p className="text-sm text-muted-foreground">Position</p><p className="font-semibold">{vessel.current_lat?.toFixed(4)}°, {vessel.current_lng?.toFixed(4)}°</p></div>
                <div><p className="text-sm text-muted-foreground">Course</p><p className="font-semibold">{vessel.course}°</p></div>
                <div><p className="text-sm text-muted-foreground">Speed</p><p className="font-semibold">{vessel.speed}</p></div>
                <div><p className="text-sm text-muted-foreground">Region</p><p className="font-semibold">{vessel.current_region}</p></div>
              </div>
              <VesselMap vessel={{ latitude: vessel.current_lat, longitude: vessel.current_lng, departure_port_lat: vessel.departure_lat, departure_port_lng: vessel.departure_lng, destination_port_lat: vessel.destination_lat, destination_port_lng: vessel.destination_lng, departure_port: vessel.departure_port_name, destination_port: vessel.destination_port_name, name: vessel.name }} height="500px" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCS TAB */}
        <TabsContent value="docs">
          <VesselDocumentGenerator
            vesselImo={String(vessel.imo ?? vessel.id ?? '')}
            vesselName={vessel.name}
          />
          <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Broker Services</CardTitle></CardHeader>
            <CardContent>
              {isVerifiedBroker ? (
                <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full"><Briefcase className="h-4 w-4 mr-2" />Create Broker Deal</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Deal for {vessel.name}</DialogTitle>
                      <DialogDescription>Set up a brokerage deal for this vessel.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Deal Type</Label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2"><Checkbox checked={dealForm.deal_type === 'direct_buyer'} onCheckedChange={(c) => setDealForm({...dealForm, deal_type: c ? 'direct_buyer' : ''})} />Direct Buyer</label>
                          <label className="flex items-center gap-2"><Checkbox checked={dealForm.deal_type === 'brokerage'} onCheckedChange={(c) => setDealForm({...dealForm, deal_type: c ? 'brokerage' : ''})} />Brokerage</label>
                        </div>
                      </div>
                      <div><Label>Expected Destination</Label><Input value={dealForm.expected_destination} onChange={(e) => setDealForm({...dealForm, expected_destination: e.target.value})} placeholder={vessel.destination_port_name} /></div>
                      <div><Label>Special Notes</Label><Textarea value={dealForm.special_notes} onChange={(e) => setDealForm({...dealForm, special_notes: e.target.value})} /></div>
                      <Separator />
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={dealForm.terms_trade_laws} onCheckedChange={(c) => setDealForm({...dealForm, terms_trade_laws: c as boolean})} />I comply with international trade laws</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={dealForm.terms_legal_framework} onCheckedChange={(c) => setDealForm({...dealForm, terms_legal_framework: c as boolean})} />I follow PetroDealHub legal framework</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={dealForm.terms_commission} onCheckedChange={(c) => setDealForm({...dealForm, terms_commission: c as boolean})} />Commission structure honored</label>
                        <label className="flex items-center gap-2 text-sm"><Checkbox checked={dealForm.terms_platform_role} onCheckedChange={(c) => setDealForm({...dealForm, terms_platform_role: c as boolean})} />I accept platform neutrality</label>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setDealDialogOpen(false)} className="flex-1">Cancel</Button>
                        <Button onClick={handleCreateDeal} className="flex-1" disabled={!dealForm.deal_type || !dealForm.terms_trade_laws || !dealForm.terms_legal_framework || !dealForm.terms_commission || !dealForm.terms_platform_role}>Create Deal</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-center py-4">
                  <Button variant="outline" onClick={() => navigate(brokerProfile ? '/broker-dashboard' : '/broker-membership')}><Lock className="h-4 w-4 mr-2" />{brokerProfile ? 'Verification Required' : 'Become a Broker'}</Button>
                  <p className="text-xs text-muted-foreground mt-2">{brokerProfile ? 'Admin verification required' : 'Broker membership needed'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VesselDetail;
