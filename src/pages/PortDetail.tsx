import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Anchor, 
  MapPin, 
  Globe, 
  ArrowLeft,
  Building2,
  Shield,
  Truck,
  Plane,
  Users,
  DollarSign,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  Ship,
  Package
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';

interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  address: string;
  postal_code: string;
  phone: string;
  email: string;
  website: string;
  lat: number;
  lng: number;
  port_type: string;
  type: string;
  status: string;
  description: string;
  capacity: number;
  annual_throughput: number;
  established: number;
  port_authority: string;
  operator: string;
  owner: string;
  berth_count: number;
  terminal_count: number;
  vessel_count: number;
  max_vessel_length: number;
  max_vessel_beam: number;
  max_draught: number;
  max_deadweight: number;
  channel_depth: number;
  berth_depth: number;
  anchorage_depth: number;
  cargo_types: string;
  facilities: string;
  services: string;
  operating_hours: string;
  security_level: string;
  pilotage_required: boolean;
  tug_assistance: boolean;
  customs_office: boolean;
  quarantine_station: boolean;
  free_trade_zone: boolean;
  rail_connection: boolean;
  road_connection: boolean;
  port_charges: number;
  average_wait_time: number;
  tidal_range: number;
  airport_distance: number;
  total_cargo: number;
  environmental_certifications: string;
  currency: string;
  timezone: string;
}

interface Vessel {
  id: number;
  name: string;
  vessel_type: string;
  flag: string;
  status: string;
  departure_port: number;
  destination_port: number;
  speed: string;
  cargo_type: string;
  deadweight: number;
  owner_name: string;
  operator_name: string;
}

const PortDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [port, setPort] = useState<Port | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [vesselsLoading, setVesselsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPort();
      fetchConnectedVessels();
    }
  }, [id]);

  const fetchPort = async () => {
    try {
      const { data, error } = await db
        .from('ports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching port:', error);
      } else {
        setPort(data);
      }
    } catch (error) {
      console.error('Failed to fetch port:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedVessels = async () => {
    try {
      const portId = parseInt(id!);
      const { data, error } = await db
        .from('vessels')
        .select('id, name, vessel_type, flag, status, departure_port, destination_port, speed, cargo_type, deadweight, owner_name, operator_name')
        .or(`departure_port.eq.${portId},destination_port.eq.${portId}`)
        .order('name');

      if (error) {
        console.error('Error fetching vessels:', error);
      } else {
        setVessels(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
    } finally {
      setVesselsLoading(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!port) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Port Not Found</h1>
          <Button onClick={() => navigate('/ports')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ports
          </Button>
        </div>
      </div>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    return status?.toLowerCase() === 'active' ? 'default' : 'secondary';
  };

  const getVesselStatusBadgeVariant = (status: string) => {
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

  const getConnectionType = (vessel: Vessel) => {
    const isDeparture = vessel.departure_port === parseInt(id!);
    const isDestination = vessel.destination_port === parseInt(id!);
    
    if (isDeparture && isDestination) return 'Transit';
    if (isDeparture) return 'Departure';
    if (isDestination) return 'Destination';
    return 'Connected';
  };

  const BooleanIcon = ({ value }: { value: boolean }) => 
    value ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/ports')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ports
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {port.name}
          </h1>
          <p className="text-muted-foreground">
            {port.city}, {port.country} • {port.region}
          </p>
        </div>
      </div>

      {/* Key Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-xl font-bold">{port.capacity?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Throughput</p>
                <p className="text-xl font-bold">{port.annual_throughput?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Vessels</p>
                <p className="text-xl font-bold">{port.vessel_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Port Charges</p>
                <p className="text-xl font-bold">{port.port_charges?.toLocaleString()} {port.currency}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-primary" />
                Port Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Badge variant={getStatusBadgeVariant(port.status)}>
                  {port.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {port.type} • Established {port.established}
                </span>
              </div>
              
              <p className="text-muted-foreground">{port.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Port Type</p>
                  <p className="font-semibold">{port.port_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-semibold">
                    {port.lat?.toFixed(4)}°, {port.lng?.toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timezone</p>
                  <p className="font-semibold">{port.timezone}</p>
                </div>
                {port.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold">{port.address}</p>
                  </div>
                )}
                {port.postal_code && (
                  <div>
                    <p className="text-sm text-muted-foreground">Postal Code</p>
                    <p className="font-semibold">{port.postal_code}</p>
                  </div>
                )}
                {port.operating_hours && (
                  <div>
                    <p className="text-sm text-muted-foreground">Operating Hours</p>
                    <p className="font-semibold">{port.operating_hours}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Operations */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Capacity & Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Throughput</p>
                  <p className="font-semibold">
                    {port.annual_throughput?.toLocaleString()} tons
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Capacity</p>
                  <p className="font-semibold">
                    {port.capacity?.toLocaleString()} tons
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Berths</p>
                  <p className="font-semibold">{port.berth_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terminals</p>
                  <p className="font-semibold">{port.terminal_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Vessels</p>
                  <p className="font-semibold">{port.vessel_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Port Charges</p>
                  <p className="font-semibold">
                    {port.port_charges?.toLocaleString()} {port.currency}
                  </p>
                </div>
                {port.total_cargo && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cargo</p>
                    <p className="font-semibold">{port.total_cargo?.toLocaleString()} tons</p>
                  </div>
                )}
                {port.average_wait_time && (
                  <div>
                    <p className="text-sm text-muted-foreground">Average Wait Time</p>
                    <p className="font-semibold">{port.average_wait_time} hours</p>
                  </div>
                )}
                {port.tidal_range && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tidal Range</p>
                    <p className="font-semibold">{port.tidal_range}m</p>
                  </div>
                )}
                {port.airport_distance && (
                  <div>
                    <p className="text-sm text-muted-foreground">Airport Distance</p>
                    <p className="font-semibold">{port.airport_distance} km</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vessel Specifications */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Vessel Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Max Vessel Length</p>
                  <p className="font-semibold">{port.max_vessel_length}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Vessel Beam</p>
                  <p className="font-semibold">{port.max_vessel_beam}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Draught</p>
                  <p className="font-semibold">{port.max_draught}m</p>
                </div>
                {port.max_deadweight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max Deadweight</p>
                    <p className="font-semibold">{port.max_deadweight?.toLocaleString()} tons</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Channel Depth</p>
                  <p className="font-semibold">{port.channel_depth}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Berth Depth</p>
                  <p className="font-semibold">{port.berth_depth}m</p>
                </div>
                {port.anchorage_depth && (
                  <div>
                    <p className="text-sm text-muted-foreground">Anchorage Depth</p>
                    <p className="font-semibold">{port.anchorage_depth}m</p>
                  </div>
                )}
               </div>
            </CardContent>
          </Card>

          {/* Facilities */}
          {(port.facilities || port.services) && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Facilities & Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {port.facilities && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">Facilities</p>
                    <p className="text-muted-foreground">{port.facilities}</p>
                  </div>
                )}
                {port.services && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">Services</p>
                    <p className="text-muted-foreground">{port.services}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cargo Types */}
          {port.cargo_types && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Cargo Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{port.cargo_types}</p>
              </CardContent>
            </Card>
          )}

          {/* Environmental Information */}
          {port.environmental_certifications && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Environmental Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{port.environmental_certifications}</p>
              </CardContent>
            </Card>
          )}

          {/* Connected Vessels */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Connected Vessels
                <Badge variant="outline" className="ml-2">
                  {vessels.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vesselsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : vessels.length > 0 ? (
                <div className="space-y-3">
                  {vessels.map((vessel) => (
                    <div 
                      key={vessel.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/vessels/${vessel.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{vessel.name}</h4>
                          <Badge variant={getVesselStatusBadgeVariant(vessel.status)} className="text-xs">
                            {vessel.status}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getConnectionType(vessel)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Type:</span> {vessel.vessel_type}
                        </div>
                        <div>
                          <span className="font-medium">Flag:</span> {vessel.flag}
                        </div>
                        <div>
                          <span className="font-medium">Cargo:</span> {vessel.cargo_type}
                        </div>
                        <div>
                          <span className="font-medium">Speed:</span> {vessel.speed} kts
                        </div>
                      </div>

                      {(vessel.owner_name || vessel.operator_name) && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {vessel.owner_name && (
                              <div>
                                <span className="font-medium">Owner:</span> {vessel.owner_name}
                              </div>
                            )}
                            {vessel.operator_name && (
                              <div>
                                <span className="font-medium">Operator:</span> {vessel.operator_name}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-muted-foreground">
                  <Ship className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No vessels currently connected to this port</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Authority & Management */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Port Authority</p>
                <p className="font-semibold">{port.port_authority}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Operator</p>
                <p className="font-semibold">{port.operator}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-semibold">{port.owner}</p>
              </div>
            </CardContent>
          </Card>

          {/* Security & Services */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Security Level</p>
                <p className="font-semibold">{port.security_level}</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pilotage Required</span>
                  <BooleanIcon value={port.pilotage_required} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tug Assistance</span>
                  <BooleanIcon value={port.tug_assistance} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customs Office</span>
                  <BooleanIcon value={port.customs_office} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Quarantine Station</span>
                  <BooleanIcon value={port.quarantine_station} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Free Trade Zone</span>
                  <BooleanIcon value={port.free_trade_zone} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(port.phone || port.email || port.website) && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {port.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-semibold">{port.phone}</p>
                  </div>
                )}
                {port.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{port.email}</p>
                  </div>
                )}
                {port.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <a 
                      href={port.website.startsWith('http') ? port.website : `https://${port.website}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {port.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Facilities & Services */}
          {(port.facilities || port.services) && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Facilities & Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {port.facilities && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">Facilities</p>
                    <p className="text-muted-foreground">{port.facilities}</p>
                  </div>
                )}
                {port.services && (
                  <div>
                    <p className="text-sm text-muted-foreground font-medium mb-2">Services</p>
                    <p className="text-muted-foreground">{port.services}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Environmental Information */}
          {port.environmental_certifications && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Environmental Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{port.environmental_certifications}</p>
              </CardContent>
            </Card>
          )}

          {/* Connectivity */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Connectivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Road Connection</span>
                  </div>
                  <BooleanIcon value={port.road_connection} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Rail Connection</span>
                  </div>
                  <BooleanIcon value={port.rail_connection} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PortDetail;