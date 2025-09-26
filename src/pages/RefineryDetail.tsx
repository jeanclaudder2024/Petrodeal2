import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Factory, 
  MapPin, 
  Globe, 
  ArrowLeft,
  Building2,
  Gauge,
  Users,
  DollarSign,
  Calendar,
  Activity,
  TrendingUp,
  Droplets,
  Zap,
  Shield,
  Award,
  Truck,
  BarChart3,
  Settings,
  Fuel,
  Package,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';

interface Refinery {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  lat: number;
  lng: number;
  capacity: number;
  processing_capacity: number;
  production_capacity: number;
  distillation_capacity: number;
  conversion_capacity: number;
  hydrogen_capacity: number;
  storage_capacity: number;
  type: string;
  status: string;
  description: string;
  operator: string;
  owner: string;
  parent_company: string;
  year_built: number;
  established_year: number;
  utilization: number;
  operational_efficiency: number;
  efficiency_rating: number;
  products: string;
  fuel_types: string;
  complexity: string;
  employees_count: number;
  workforce_size: number;
  annual_throughput: number;
  daily_throughput: number;
  annual_revenue: number;
  revenue: number;
  operating_costs: number;
  investment_cost: number;
  profit_margin: number;
  market_share: number;
  domestic_market_share: number;
  energy_consumption: number;
  water_usage: number;
  nearest_port: string;
  nearest_airport: string;
  safety_rating: string;
  environmental_rating: string;
  certifications: string;
  environmental_certifications: string;
  processing_units: string;
  crude_oil_sources: string;
  sulfur_recovery: number;
  octane_rating: number;
  pipeline_connections: string;
  shipping_terminals: string;
  rail_connections: string;
  transportation_links: string;
  utilities_infrastructure: string;
  major_customers: string;
  supply_chain_partners: string;
  competitive_advantages: string;
  technical_specs: string;
}

interface Vessel {
  id: number;
  name: string;
  vessel_type: string;
  flag: string;
  status: string;
  cargo_type: string;
  current_lat: number;
  current_lng: number;
  destination: string;
  eta: string;
}

const RefineryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refinery, setRefinery] = useState<Refinery | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [vesselsLoading, setVesselsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRefinery();
      fetchConnectedVessels();
    }
  }, [id]);

  const fetchRefinery = async () => {
    try {
      const { data, error } = await db
        .from('refineries')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching refinery:', error);
      } else {
        setRefinery(data);
      }
    } catch (error) {
      console.error('Failed to fetch refinery:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedVessels = async () => {
    try {
      const { data, error } = await db
        .from('vessels')
        .select('*')
        .eq('refinery_id', id)
        .limit(10);

      if (error) {
        console.error('Error fetching connected vessels:', error);
      } else {
        setVessels(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch connected vessels:', error);
    } finally {
      setVesselsLoading(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!refinery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Refinery Not Found</h1>
          <Button onClick={() => navigate('/refineries')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Refineries
          </Button>
        </div>
      </div>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    return status?.toLowerCase() === 'operational' ? 'default' : 'secondary';
  };

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'excellent':
        return 'text-green-600';
      case 'very good':
        return 'text-blue-600';
      case 'good':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/refineries')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Refineries
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {refinery.name}
          </h1>
          <p className="text-muted-foreground">
            {refinery.city}, {refinery.country} • {refinery.region}
          </p>
        </div>
      </div>

      {/* Key Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-xl font-bold">{refinery.capacity?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Utilization</p>
                <p className="text-xl font-bold">{refinery.utilization}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-xl font-bold">{refinery.employees_count?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">${(refinery.annual_revenue || 0)?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Refinery Information */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                Refinery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge variant={getStatusBadgeVariant(refinery.status)} className="text-sm">
                  {refinery.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {refinery.type} • Built {refinery.year_built}
                </span>
              </div>
              
              <p className="text-muted-foreground">{refinery.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Established</p>
                  <p className="font-semibold">{refinery.established_year || refinery.year_built || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Complexity</p>
                  <p className="font-semibold">{refinery.complexity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-semibold">
                    {refinery.lat?.toFixed(4)}°, {refinery.lng?.toFixed(4)}°
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold">{refinery.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold">{refinery.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{refinery.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-semibold">
                    {refinery.website ? (
                      <a href={refinery.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {refinery.website}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operator</p>
                  <p className="font-semibold">{refinery.operator || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-semibold">{refinery.owner || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nearest Port</p>
                  <p className="font-semibold">{refinery.nearest_port || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nearest Airport</p>
                  <p className="font-semibold">{refinery.nearest_airport || 'N/A'}</p>
                </div>
              </div>
              
              {refinery.technical_specs && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Technical Specifications</p>
                    <p className="text-muted-foreground">{refinery.technical_specs}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Production & Capacity */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Production & Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Refining Capacity</p>
                  <p className="font-semibold">
                    {refinery.capacity?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processing Capacity</p>
                  <p className="font-semibold">
                    {refinery.processing_capacity?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Production Capacity</p>
                  <p className="font-semibold">
                    {refinery.production_capacity?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distillation Capacity</p>
                  <p className="font-semibold">
                    {refinery.distillation_capacity?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Capacity</p>
                  <p className="font-semibold">
                    {refinery.conversion_capacity?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hydrogen Capacity</p>
                  <p className="font-semibold">
                    {refinery.hydrogen_capacity?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilization Rate</p>
                  <p className="font-semibold">{refinery.utilization || 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operational Efficiency</p>
                  <p className="font-semibold">{refinery.operational_efficiency || 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Throughput</p>
                  <p className="font-semibold">
                    {refinery.annual_throughput?.toLocaleString() || 'N/A'} bbl/year
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage Capacity</p>
                  <p className="font-semibold">
                    {refinery.storage_capacity?.toLocaleString() || 'N/A'} bbl
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Throughput</p>
                  <p className="font-semibold">
                    {refinery.daily_throughput?.toLocaleString() || 'N/A'} bbl/day
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efficiency Rating</p>
                  <p className="font-semibold">{refinery.efficiency_rating || 'N/A'}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products & Specifications */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                Products & Fuel Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Products</p>
                <p className="text-muted-foreground">{refinery.products || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fuel Types</p>
                <p className="text-muted-foreground">{refinery.fuel_types || 'N/A'}</p>
              </div>
              {refinery.processing_units && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Processing Units</p>
                    <p className="text-muted-foreground">{refinery.processing_units}</p>
                  </div>
                </>
              )}
              {refinery.crude_oil_sources && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Crude Oil Sources</p>
                    <p className="text-muted-foreground">{refinery.crude_oil_sources}</p>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sulfur Recovery</p>
                  <p className="font-semibold">{refinery.sulfur_recovery || 'N/A'}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Octane Rating</p>
                  <p className="font-semibold">{refinery.octane_rating || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial & Operational Performance */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Financial & Operational Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Revenue</p>
                  <p className="font-semibold text-green-600">
                    ${refinery.annual_revenue?.toLocaleString() || refinery.revenue?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Operating Costs</p>
                  <p className="font-semibold text-red-600">
                    ${refinery.operating_costs?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Investment Cost</p>
                  <p className="font-semibold">
                    ${refinery.investment_cost?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="font-semibold text-blue-600">
                    {refinery.profit_margin || 'N/A'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Share</p>
                  <p className="font-semibold">
                    {refinery.market_share || refinery.domestic_market_share || 'N/A'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Workforce Size</p>
                  <p className="font-semibold">{refinery.workforce_size || refinery.employees_count?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Energy Consumption</p>
                  <p className="font-semibold">{refinery.energy_consumption?.toLocaleString() || 'N/A'} MW</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Water Usage</p>
                  <p className="font-semibold">{refinery.water_usage?.toLocaleString() || 'N/A'} m³/day</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure & Connectivity */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Infrastructure & Transportation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Pipeline Connections</p>
                  <p className="text-foreground">{refinery.pipeline_connections || 'No pipeline connections specified'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Shipping Terminals</p>
                  <p className="text-foreground">{refinery.shipping_terminals || 'No shipping terminals specified'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Rail Connections</p>
                  <p className="text-foreground">{refinery.rail_connections || 'No rail connections specified'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Transportation Links</p>
                  <p className="text-foreground">{refinery.transportation_links || 'No transportation links specified'}</p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Utilities Infrastructure</p>
                  <p className="text-foreground">{refinery.utilities_infrastructure || 'No utilities infrastructure specified'}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nearest Port</p>
                  <p className="font-semibold">{refinery.nearest_port || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nearest Airport</p>
                  <p className="font-semibold">{refinery.nearest_airport || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Ownership & Management */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Ownership & Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Parent Company</p>
                <p className="font-semibold">{refinery.parent_company || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-semibold">{refinery.owner || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Operator</p>
                <p className="font-semibold">{refinery.operator || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ratings & Certifications */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Ratings & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Safety Rating</p>
                  <p className={`font-semibold ${getRatingColor(refinery.safety_rating)}`}>
                    {refinery.safety_rating || 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Environmental Rating</p>
                  <p className={`font-semibold ${getRatingColor(refinery.environmental_rating)}`}>
                    {refinery.environmental_rating || 'N/A'}
                  </p>
                </div>
              </div>
              
              {refinery.certifications && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Certifications</p>
                    <p className="text-sm text-muted-foreground">{refinery.certifications}</p>
                  </div>
                </>
              )}
              
              {refinery.environmental_certifications && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Environmental Certifications</p>
                    <p className="text-sm text-muted-foreground">{refinery.environmental_certifications}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Operational Status */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Operational Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Established</p>
                  <p className="font-semibold">{refinery.established_year || refinery.year_built || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Workforce</p>
                  <p className="font-semibold">{refinery.employees_count || refinery.workforce_size || 'N/A'} employees</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nearest Port</p>
                  <p className="font-semibold">{refinery.nearest_port || 'N/A'}</p>
                </div>
              </div>
              
              {refinery.nearest_airport && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nearest Airport</p>
                    <p className="font-semibold">{refinery.nearest_airport}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market & Commercial */}
          {(refinery.major_customers || refinery.supply_chain_partners || refinery.competitive_advantages) && (
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Market & Commercial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {refinery.major_customers && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Major Customers</p>
                    <p className="text-sm text-muted-foreground">{refinery.major_customers}</p>
                  </div>
                )}
                
                {refinery.supply_chain_partners && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Supply Chain Partners</p>
                      <p className="text-sm text-muted-foreground">{refinery.supply_chain_partners}</p>
                    </div>
                  </>
                )}
                
                {refinery.competitive_advantages && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Competitive Advantages</p>
                      <p className="text-sm text-muted-foreground">{refinery.competitive_advantages}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Connected Vessels Section */}
      <div className="mt-8">
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Connected Vessels
              <Badge variant="secondary" className="ml-2">
                {vessels.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vesselsLoading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading vessels...</p>
              </div>
            ) : vessels.length > 0 ? (
              <div className="space-y-4">
                {vessels.map((vessel) => (
                  <div key={vessel.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{vessel.name}</h4>
                      <Badge variant="outline">{vessel.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p>{vessel.vessel_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Flag</p>
                        <p>{vessel.flag}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cargo</p>
                        <p>{vessel.cargo_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Destination</p>
                        <p>{vessel.destination || 'N/A'}</p>
                      </div>
                    </div>
                    {vessel.eta && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">ETA</p>
                        <p>{new Date(vessel.eta).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No vessels currently connected to this refinery</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefineryDetail;