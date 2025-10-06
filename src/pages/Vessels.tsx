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
  Clock, 
  Activity, 
  Search,
  Eye,
  Navigation,
  Package,
  Flag,
  Filter,
  Grid3X3,
  List
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
}

const Vessels = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    try {
      // Fetch vessels with port information
      const [vesselsRes, portsRes] = await Promise.all([
        db.from('vessels').select('*').order('name'),
        db.from('ports').select('id, name, country')
      ]);

      if (vesselsRes.error) {
        console.error('Error fetching vessels:', vesselsRes.error);
      } else {
        const vessels = vesselsRes.data || [];
        const ports = portsRes.data || [];
        
        // Create port lookup map
        const portMap = ports.reduce((acc, port) => {
          acc[port.id] = port;
          return acc;
        }, {} as any);

        // Enhance vessels with port information
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

  // Helper function to get country flag emoji
  const getCountryFlag = (country: string): string => {
    const countryToFlag: { [key: string]: string } = {
      'marshall islands': '🇲🇭',
      'liberia': '🇱🇷',
      'panama': '🇵🇦',
      'singapore': '🇸🇬',
      'malta': '🇲🇹',
      'bahamas': '🇧🇸',
      'cyprus': '🇨🇾',
      'antigua and barbuda': '🇦🇬',
      'isle of man': '🇮🇲',
      'hong kong': '🇭🇰',
      'greece': '🇬🇷',
      'norway': '🇳🇴',
      'united kingdom': '🇬🇧',
      'germany': '🇩🇪',
      'netherlands': '🇳🇱',
      'denmark': '🇩🇰',
      'italy': '🇮🇹',
      'france': '🇫🇷',
      'spain': '🇪🇸',
      'japan': '🇯🇵',
      'south korea': '🇰🇷',
      'china': '🇨🇳',
      'united states': '🇺🇸',
      'russia': '🇷🇺',
      'turkey': '🇹🇷',
      'india': '🇮🇳',
      'brazil': '🇧🇷',
      'saudi arabia': '🇸🇦',
      'united arab emirates': '🇦🇪',
      'qatar': '🇶🇦',
      'kuwait': '🇰🇼'
    };

    return countryToFlag[country?.toLowerCase()] || '🏳️';
  };

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

  const filteredVessels = vessels.filter(vessel => {
    const matchesSearch = vessel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.mmsi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.imo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.vessel_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vessel.flag?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vessel.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || vessel.vessel_type?.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'at sea':
        return 'default';
      case 'anchored':
        return 'secondary';
      case 'loading':
        return 'outline';
      case 'discharging':
        return 'outline';
      case 'berthed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (vesselId: number) => {
    navigate(`/vessels/${vesselId}`);
  };

  // Helper function to get vessel background image
  const getVesselBackgroundImage = (vesselType: string, oilType: string) => {
    // Use the hero oil trading image as background for all vessels
    return '/hero-oil-trading.jpg';
  };

  // Mobile Grid Component
  const VesselGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredVessels.map((vessel) => {
        const backgroundImage = getVesselBackgroundImage(vessel.vessel_type, vessel.oil_type);
        
        return (
          <Card key={vessel.id} className="vessel-card hover:shadow-lg transition-all duration-300 hover:scale-105">
            {/* Background Image */}
            <div 
              className="vessel-background"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
                backgroundColor: 'hsl(var(--primary)/0.1)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
            
            {/* Gradient Overlay */}
            <div className="vessel-overlay" />
            
            <CardContent className="vessel-card-content">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1 text-foreground">{vessel.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-lg">{vessel.flag_emoji}</span>
                  <span>{vessel.flag_country}</span>
                </div>
              </div>
              <Badge 
                variant={getStatusBadgeVariant(vessel.status)} 
                className="text-xs shadow-sm"
              >
                {vessel.status}
              </Badge>
            </div>

            {/* Vessel Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Ship className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{vessel.vessel_type}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span>{vessel.speed || 'N/A'} kn</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{vessel.oil_type} - {vessel.cargo_quantity?.toLocaleString()} bbl</span>
              </div>
            </div>

            {/* Route Info */}
            <div className="space-y-2 mb-4 p-3 bg-gradient-to-r from-muted/40 to-muted/20 rounded-lg border border-border/30">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1 bg-green-500/20 rounded-full">
                  <MapPin className="h-3 w-3 text-green-600" />
                </div>
                <span className="font-medium text-foreground">From:</span>
                <span className="text-muted-foreground">{vessel.departure_port_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1 bg-blue-500/20 rounded-full">
                  <MapPin className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-medium text-foreground">To:</span>
                <span className="text-muted-foreground">{vessel.destination_port_name}</span>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              onClick={() => handleViewDetails(vessel.id)}
              className="w-full bg-primary/90 hover:bg-primary text-white shadow-lg"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );



  // Get unique vessel types and statuses for filter options
  const vesselTypes = [...new Set(vessels.map(v => v.vessel_type).filter(Boolean))];
  const vesselStatuses = [...new Set(vessels.map(v => v.status).filter(Boolean))];

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Vessel Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Track and monitor all vessels in your fleet
        </p>
      </div>

      {/* Stats Overview */}
      <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vessels</CardTitle>
            <Ship className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vessels.length}</div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Sea</CardTitle>
            <Navigation className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vessels.filter(v => v.status?.toLowerCase() === 'at sea').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loading</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vessels.filter(v => v.status?.toLowerCase() === 'loading').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anchored</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vessels.filter(v => v.status?.toLowerCase() === 'anchored').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="trading-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Search & Filter Vessels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, MMSI, IMO, vessel type, or flag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Vessel Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vessel Types</SelectItem>
                {vesselTypes.map(type => (
                  <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {vesselStatuses.map(status => (
                  <SelectItem key={status} value={status.toLowerCase()}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vessels Table/Grid */}
      <Card className="trading-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              Fleet Overview ({filteredVessels.length} vessels)
            </CardTitle>
            
            {/* View Mode Toggle - Only show on mobile */}
            {isMobile && (
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Grid View */}
          {isMobile && viewMode === 'grid' ? (
            <VesselGrid />
          ) : (
            /* Desktop Table View */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vessel Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Route</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Speed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVessels.map((vessel) => (
                    <TableRow key={vessel.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-semibold">{vessel.name}</div>
                          <div className="text-sm text-muted-foreground">
                            MMSI: {vessel.mmsi}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            IMO: {vessel.imo || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vessel.vessel_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{vessel.flag_emoji}</span>
                          <span className="text-sm">{vessel.flag_country}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(vessel.status)}>
                          {vessel.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span>{vessel.departure_port_name}</span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1 mt-1">
                            <span>→</span>
                            <MapPin className="h-3 w-3 text-blue-600" />
                            <span>{vessel.destination_port_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{vessel.oil_type}</div>
                          <div className="text-muted-foreground">
                            {vessel.cargo_quantity?.toLocaleString()} bbl
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-1">
                           <Navigation className="h-3 w-3 text-muted-foreground" />
                           <span>{vessel.speed || 'N/A'} kn</span>
                         </div>
                      </TableCell>
                       <TableCell>
                         <div className="flex gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleViewDetails(vessel.id)}
                           >
                             <Eye className="h-4 w-4 mr-2" />
                             View
                           </Button>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredVessels.length === 0 && (
            <div className="text-center py-8">
              <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No vessels found matching your search.' : 'No vessels found.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vessels;