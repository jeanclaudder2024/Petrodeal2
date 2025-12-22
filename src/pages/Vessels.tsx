import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Ship, 
  MapPin, 
  Activity, 
  Search,
  Eye,
  Navigation,
  Package,
  Filter,
  Grid3X3,
  List,
  Fuel,
  DollarSign,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Anchor,
  Waves,
  TrendingUp,
  Globe,
  FileText,
  Phone
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';
import { useIsMobile } from '@/hooks/use-mobile';

interface Vessel {
  id: number;
  name: string;
  mmsi: string;
  imo: string;
  vessel_type: string;
  flag: string;
  flag_country?: string;
  flag_emoji?: string;
  current_lat: number;
  current_lng: number;
  speed: string;
  status: string;
  departure_port: number;
  destination_port: number;
  departure_port_name?: string;
  destination_port_name?: string;
  cargo_type: string;
  cargo_quantity: number;
  oil_type: string;
  current_region: string;
  owner_name: string;
  deadweight: number;
  cargo_capacity: number;
  built: number;
  buyer_name: string;
  seller_name: string;
  operator_name: string;
  quantity: number;
  deal_value: number;
  price: number;
  market_price: number;
  commodity_name?: string;
  sanctions_status?: string;
  deal_status?: string;
  deal_reference_id?: string;
  contract_type?: string;
  delivery_terms?: string;
  indicative_price?: number;
}

const Vessels = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sanctionsFilter, setSanctionsFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      const [vesselsRes, portsRes] = await Promise.all([
        db.from('vessels').select('*').order('name'),
        db.from('ports').select('id, name, country')
      ]);

      if (vesselsRes.error) {
        console.error('Error fetching vessels:', vesselsRes.error);
      } else {
        const vessels = vesselsRes.data || [];
        const ports = portsRes.data || [];
        
        const portMap = ports.reduce((acc, port) => {
          acc[port.id] = port;
          return acc;
        }, {} as any);

        const enhancedVessels = vessels.map(vessel => ({
          ...vessel,
          departure_port_name: vessel.departure_port ? portMap[vessel.departure_port]?.name || `Port ${vessel.departure_port}` : 'Unknown',
          destination_port_name: vessel.destination_port ? portMap[vessel.destination_port]?.name || `Port ${vessel.destination_port}` : 'Unknown',
          flag_country: getCountryFromFlag(vessel.flag),
          flag_emoji: getCountryFlag(getCountryFromFlag(vessel.flag))
        }));

        setVessels(enhancedVessels);
      }
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (country: string): string => {
    const countryToFlag: { [key: string]: string } = {
      'marshall islands': '🇲🇭', 'liberia': '🇱🇷', 'panama': '🇵🇦', 'singapore': '🇸🇬',
      'malta': '🇲🇹', 'bahamas': '🇧🇸', 'cyprus': '🇨🇾', 'hong kong': '🇭🇰',
      'greece': '🇬🇷', 'norway': '🇳🇴', 'united kingdom': '🇬🇧', 'germany': '🇩🇪',
      'netherlands': '🇳🇱', 'japan': '🇯🇵', 'china': '🇨🇳', 'saudi arabia': '🇸🇦',
      'united arab emirates': '🇦🇪', 'qatar': '🇶🇦', 'kuwait': '🇰🇼'
    };
    return countryToFlag[country?.toLowerCase()] || '🏳️';
  };

  const getCountryFromFlag = (flag: string): string => {
    if (!flag) return 'Unknown';
    const flagToCountryMap: { [key: string]: string } = {
      'marshall islands': 'Marshall Islands', 'liberia': 'Liberia', 'panama': 'Panama',
      'singapore': 'Singapore', 'malta': 'Malta', 'bahamas': 'Bahamas', 'cyprus': 'Cyprus',
      'hong kong': 'Hong Kong', 'greece': 'Greece', 'norway': 'Norway',
      'united kingdom': 'United Kingdom', 'germany': 'Germany', 'netherlands': 'Netherlands',
      'japan': 'Japan', 'china': 'China', 'saudi arabia': 'Saudi Arabia',
      'uae': 'United Arab Emirates', 'qatar': 'Qatar', 'kuwait': 'Kuwait'
    };
    const lowercaseFlag = flag.toLowerCase();
    return flagToCountryMap[lowercaseFlag] || flag.charAt(0).toUpperCase() + flag.slice(1);
  };

  const filteredVessels = vessels.filter(vessel => {
    const matchesSearch = vessel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.mmsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.imo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.commodity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.deal_reference_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vessel.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || vessel.vessel_type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesSanctions = sanctionsFilter === 'all' || vessel.sanctions_status?.toLowerCase() === sanctionsFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType && matchesSanctions;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'in transit': return 'default';
      case 'at port': case 'anchored': return 'secondary';
      case 'loading': case 'discharging': return 'outline';
      default: return 'default';
    }
  };

  const getSanctionsBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'non-sanctioned':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'restricted':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30"><Shield className="h-3 w-3 mr-1" />Restricted</Badge>;
      case 'sanctioned':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><ShieldAlert className="h-3 w-3 mr-1" />Sanctioned</Badge>;
      default:
        return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getDealStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Badge className="bg-green-500/20 text-green-700 animate-pulse">🟢 Open</Badge>;
      case 'negotiation':
        return <Badge className="bg-yellow-500/20 text-yellow-700">🟡 Negotiating</Badge>;
      case 'reserved':
        return <Badge className="bg-blue-500/20 text-blue-700">🔵 Reserved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500/20 text-gray-700">⚫ Closed</Badge>;
      default:
        return null;
    }
  };

  const handleViewDetails = (vesselId: number) => {
    navigate(`/vessels/${vesselId}`);
  };

  // Stats calculations
  const totalCargoValue = vessels.reduce((sum, v) => sum + (v.deal_value || 0), 0);
  const openDeals = vessels.filter(v => v.deal_status?.toLowerCase() === 'open').length;
  const verifiedVessels = vessels.filter(v => v.sanctions_status?.toLowerCase() === 'non-sanctioned').length;

  const VesselGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredVessels.map((vessel) => (
        <Card key={vessel.id} className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          {/* Oil Platform Header */}
          <div className="relative h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/hero-oil-trading.jpg')] bg-cover bg-center opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <Badge variant={getStatusBadgeVariant(vessel.status)} className="shadow-lg">
                {vessel.status || 'Unknown'}
              </Badge>
              {vessel.deal_status && getDealStatusBadge(vessel.deal_status)}
            </div>
            
            {/* Deal Reference */}
            {vessel.deal_reference_id && (
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-background/80 backdrop-blur text-xs font-mono">
                  {vessel.deal_reference_id}
                </Badge>
              </div>
            )}
            
            {/* Vessel Icon */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/20 backdrop-blur">
                <Ship className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl">{vessel.flag_emoji}</span>
            </div>
          </div>
          
          <CardContent className="p-4 space-y-4">
            {/* Vessel Name & Type */}
            <div>
              <h3 className="font-bold text-lg text-foreground line-clamp-1">{vessel.name}</h3>
              <p className="text-sm text-muted-foreground">{vessel.vessel_type} • {vessel.flag_country}</p>
            </div>
            
            {/* Commodity & Sanctions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{vessel.commodity_name || vessel.oil_type || 'N/A'}</span>
              </div>
              {getSanctionsBadge(vessel.sanctions_status || '')}
            </div>
            
            {/* Cargo Quantity */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cargo</span>
                </div>
                <span className="font-bold text-lg">{vessel.cargo_quantity?.toLocaleString() || 'N/A'} MT</span>
              </div>
            </div>
            
            {/* Route */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium truncate">{vessel.departure_port_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium truncate">{vessel.destination_port_name}</span>
              </div>
            </div>
            
            {/* Deal Value & Price */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div>
                <p className="text-xs text-muted-foreground">Deal Value</p>
                <p className="font-bold text-lg text-primary">${(vessel.deal_value / 1000000)?.toFixed(2) || '0'}M</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Price/bbl</p>
                <p className="font-semibold">${vessel.indicative_price || vessel.price || 'TBD'}</p>
              </div>
            </div>
            
            {/* Contract Info */}
            {vessel.contract_type && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{vessel.contract_type}</span>
                {vessel.delivery_terms && <span>• {vessel.delivery_terms}</span>}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => handleViewDetails(vessel.id)}
                className="flex-1"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate(`/vessels/${vessel.id}`)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const vesselTypes = [...new Set(vessels.map(v => v.vessel_type).filter(Boolean))];
  const vesselStatuses = [...new Set(vessels.map(v => v.status).filter(Boolean))];

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-oil-trading.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/20">
              <Fuel className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Oil Tanker Fleet</h1>
              <p className="text-slate-300">Available Cargo & Trading Deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview - Oil Platform Theme */}
      <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-5'}`}>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Fleet</p>
                <p className="text-2xl font-bold">{vessels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Deals</p>
                <p className="text-2xl font-bold text-green-600">{openDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Navigation className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{vessels.filter(v => v.status?.toLowerCase() === 'in transit').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedVessels}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${(totalCargoValue / 1000000000).toFixed(2)}B</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-primary" />
            Search & Filter Cargo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vessel, IMO, commodity, deal ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vessel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vesselTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {vesselStatuses.map(status => (
                  <SelectItem key={status} value={status.toLowerCase()}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sanctionsFilter} onValueChange={setSanctionsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sanctions Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="non-sanctioned">✅ Non-Sanctioned</SelectItem>
                <SelectItem value="restricted">⚠️ Restricted</SelectItem>
                <SelectItem value="sanctioned">🚫 Sanctioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vessels Grid/Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              Available Cargo ({filteredVessels.length} vessels)
            </CardTitle>
            
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <VesselGrid />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Deal Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVessels.map((vessel) => (
                    <TableRow key={vessel.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{vessel.flag_emoji}</span>
                          <div>
                            <p className="font-semibold">{vessel.name}</p>
                            <p className="text-xs text-muted-foreground">{vessel.vessel_type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vessel.commodity_name || vessel.oil_type}</p>
                          {getSanctionsBadge(vessel.sanctions_status || '')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{vessel.cargo_quantity?.toLocaleString()} MT</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{vessel.departure_port_name}</p>
                          <p className="text-muted-foreground">→ {vessel.destination_port_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">${(vessel.deal_value / 1000000)?.toFixed(2)}M</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusBadgeVariant(vessel.status)}>{vessel.status}</Badge>
                          {getDealStatusBadge(vessel.deal_status || '')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleViewDetails(vessel.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredVessels.length === 0 && (
            <div className="text-center py-12">
              <Ship className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No vessels found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vessels;
