import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Network, Ship, MapPin, Factory, Search, Filter, ArrowRight, ExternalLink } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import LoadingFallback from '@/components/LoadingFallback';

interface Vessel {
  id: number;
  name: string;
  vessel_type?: string;
  departure_port?: number;
  destination_port?: number;
  target_refinery?: string;
  status?: string;
  cargo_type?: string;
}

interface Port {
  id: number;
  name: string;
  country?: string;
  city?: string;
}

interface Refinery {
  id: string;
  name: string;
  country?: string;
  city?: string;
}

interface Connection {
  vessel: Vessel;
  departurePort?: Port;
  destinationPort?: Port;
  targetRefinery?: Refinery;
}

const Connections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [vesselsResponse, portsResponse, refineriesResponse] = await Promise.all([
        db.from('vessels').select('id, name, vessel_type, departure_port, destination_port, target_refinery, status, cargo_type').order('name'),
        db.from('ports').select('id, name, country, city').order('name'),
        db.from('refineries').select('id, name, country, city').order('name')
      ]);

      if (vesselsResponse.error) throw vesselsResponse.error;
      if (portsResponse.error) throw portsResponse.error;
      if (refineriesResponse.error) throw refineriesResponse.error;

      const vesselsData = vesselsResponse.data || [];
      const portsData = portsResponse.data || [];
      const refineriesData = refineriesResponse.data || [];

      setVessels(vesselsData);
      setPorts(portsData);
      setRefineries(refineriesData);

      // Build connections
      const connectionsData: Connection[] = vesselsData.map(vessel => {
        const departurePort = vessel.departure_port ? portsData.find(p => p.id === vessel.departure_port) : undefined;
        const destinationPort = vessel.destination_port ? portsData.find(p => p.id === vessel.destination_port) : undefined;
        const targetRefinery = vessel.target_refinery ? refineriesData.find(r => r.name === vessel.target_refinery || r.id === vessel.target_refinery) : undefined;

        return {
          vessel,
          departurePort,
          destinationPort,
          targetRefinery
        };
      });

      setConnections(connectionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load connection data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(connection => {
    // Search filter
    const matchesSearch = connection.vessel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.departurePort?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.destinationPort?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         connection.targetRefinery?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = filterType === 'all' || 
                       (filterType === 'connected' && (connection.departurePort || connection.destinationPort || connection.targetRefinery)) ||
                       (filterType === 'ports-only' && (connection.departurePort || connection.destinationPort) && !connection.targetRefinery) ||
                       (filterType === 'refineries-only' && connection.targetRefinery && !connection.departurePort && !connection.destinationPort) ||
                       (filterType === 'fully-connected' && connection.departurePort && connection.destinationPort && connection.targetRefinery) ||
                       (filterType === 'unconnected' && !connection.departurePort && !connection.destinationPort && !connection.targetRefinery);

    // Status filter
    const matchesStatus = filterStatus === 'all' || connection.vessel.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'sailing': return 'default';
      case 'anchored': return 'secondary';
      case 'in port': return 'outline';
      case 'loading': return 'destructive';
      case 'maintenance': return 'outline';
      default: return 'secondary';
    }
  };

  const connectionStats = {
    totalVessels: vessels.length,
    connectedToPorts: connections.filter(c => c.departurePort || c.destinationPort).length,
    connectedToRefineries: connections.filter(c => c.targetRefinery).length,
    fullyConnected: connections.filter(c => c.departurePort && c.destinationPort && c.targetRefinery).length
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Maritime Connections
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore the connections between vessels, ports, and refineries in the global maritime oil trade network.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="trading-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Vessels</p>
              <p className="text-2xl font-bold">{connectionStats.totalVessels}</p>
            </div>
            <Ship className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Port Connections</p>
              <p className="text-2xl font-bold">{connectionStats.connectedToPorts}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Refinery Connections</p>
              <p className="text-2xl font-bold">{connectionStats.connectedToRefineries}</p>
            </div>
            <Factory className="h-8 w-8 text-orange-500" />
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fully Connected</p>
              <p className="text-2xl font-bold">{connectionStats.fullyConnected}</p>
            </div>
            <Network className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Maritime Network
          </CardTitle>
          <CardDescription>
            Filter and explore vessel connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search vessels, ports, or refineries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Connections</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="ports-only">Ports Only</SelectItem>
                  <SelectItem value="refineries-only">Refineries Only</SelectItem>
                  <SelectItem value="fully-connected">Fully Connected</SelectItem>
                  <SelectItem value="unconnected">Unconnected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sailing">Sailing</SelectItem>
                  <SelectItem value="anchored">Anchored</SelectItem>
                  <SelectItem value="in port">In Port</SelectItem>
                  <SelectItem value="loading">Loading</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Connections Grid */}
          <div className="grid gap-4">
            {filteredConnections.length === 0 ? (
              <div className="text-center py-8">
                <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No connections found matching your criteria.</p>
              </div>
            ) : (
              filteredConnections.map((connection) => (
                <Card key={connection.vessel.id} className="trading-card hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Ship className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{connection.vessel.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{connection.vessel.vessel_type || 'Unknown Type'}</span>
                            {connection.vessel.cargo_type && (
                              <>
                                <span>•</span>
                                <span>{connection.vessel.cargo_type}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-1">
                            <Badge variant={getStatusBadgeVariant(connection.vessel.status)}>
                              {connection.vessel.status || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                        {/* Connection Flow */}
                        <div className="flex items-center gap-2 text-sm">
                          {connection.departurePort ? (
                            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
                              <MapPin className="h-3 w-3 text-blue-600" />
                              <span className="font-medium">{connection.departurePort.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground px-2 py-1">
                              <MapPin className="h-3 w-3" />
                              <span>No departure</span>
                            </div>
                          )}

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />

                          {connection.destinationPort ? (
                            <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span className="font-medium">{connection.destinationPort.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground px-2 py-1">
                              <MapPin className="h-3 w-3" />
                              <span>No destination</span>
                            </div>
                          )}

                          {connection.targetRefinery && (
                            <>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded">
                                <Factory className="h-3 w-3 text-orange-600" />
                                <span className="font-medium">{connection.targetRefinery.name}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/vessels/${connection.vessel.id}`)}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredConnections.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredConnections.length} of {connections.length} connections
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Connections;