import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Anchor, 
  MapPin, 
  Users, 
  BarChart3,
  Search,
  Eye,
  Globe,
  Ship,
  Activity,
  Building2
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';
import port1 from '@/assets/port-1.jpg';
import port2 from '@/assets/port-2.jpg';
import port3 from '@/assets/port-3.jpg';
import port4 from '@/assets/port-4.jpg';

interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  port_type: string;
  type: string;
  status: string;
  capacity: number;
  annual_throughput: number;
  berth_count: number;
  terminal_count: number;
  vessel_count: number;
  cargo_types: string;
  established: number;
  port_charges: number;
  currency: string;
}

const Ports = () => {
  const navigate = useNavigate();
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPorts();
  }, []);

  const fetchPorts = async () => {
    try {
      const { data, error } = await db
        .from('ports')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching ports:', error);
      } else {
        setPorts(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch ports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPorts = ports.filter(port =>
    port.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    port.port_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    return status?.toLowerCase() === 'active' ? 'default' : 'secondary';
  };

  const handleViewDetails = (portId: string) => {
    navigate(`/ports/${portId}`);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  const totalCapacity = ports.reduce((sum, port) => sum + (port.capacity || 0), 0);
  const totalThroughput = ports.reduce((sum, port) => sum + (port.annual_throughput || 0), 0);
  const totalBerths = ports.reduce((sum, port) => sum + (port.berth_count || 0), 0);
  const activePorts = ports.filter(p => p.status?.toLowerCase() === 'active').length;

  const portImages = [port1, port2, port3, port4];
  
  const getPortImage = (index: number) => {
    return portImages[index % portImages.length];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Port Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor port operations and capacity worldwide
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ports</CardTitle>
            <Anchor className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ports.length}</div>
            <p className="text-xs text-muted-foreground">
              {activePorts} active
            </p>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalCapacity / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">tons capacity</p>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Throughput</CardTitle>
            <Ship className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalThroughput / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">tons per year</p>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Berths</CardTitle>
            <Building2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBerths}</div>
            <p className="text-xs text-muted-foreground">berths available</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="trading-card mb-6">
        <CardHeader>
          <CardTitle>Search Ports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, country, city, or port type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Port Cards Grid */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Anchor className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Port Directory ({filteredPorts.length} ports)</h2>
        </div>
        
        {filteredPorts.length === 0 ? (
          <div className="text-center py-16">
            <Anchor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No ports found matching your search.' : 'No ports found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPorts.map((port, index) => (
              <Card
                key={port.id}
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in border-0"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${getPortImage(index)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '280px'
                }}
                onClick={() => handleViewDetails(port.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-primary-foreground transition-colors">
                          {port.name}
                        </h3>
                        <div className="flex items-center gap-1 text-white/80 text-sm">
                          <MapPin className="h-3 w-3" />
                          {port.city}, {port.country}
                        </div>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(port.status)}
                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                      >
                        {port.status}
                      </Badge>
                    </div>

                    <div className="text-white/70 text-sm mb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <span>Est. {port.established}</span>
                        <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                          {port.port_type}
                        </Badge>
                      </div>
                      <div className="text-xs opacity-80 line-clamp-2">
                        {port.cargo_types}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="h-4 w-4 text-blue-400" />
                          <span className="text-white/70">Capacity</span>
                        </div>
                        <div className="font-semibold text-white">
                          {(port.capacity / 1000000).toFixed(1)}M tons
                        </div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-orange-400" />
                          <span className="text-white/70">Berths</span>
                        </div>
                        <div className="font-semibold text-white">
                          {port.berth_count}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-white/70 text-sm">
                        <Ship className="h-4 w-4 inline mr-1" />
                        {(port.annual_throughput / 1000000).toFixed(1)}M tons/year
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(port.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ports;