import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Network, Ship, MapPin, Factory, Edit, Trash2, Search, Route, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Vessel {
  id: number;
  name: string;
  imo?: string;
  vessel_type?: string;
  departure_port?: number;
  destination_port?: number;
  target_refinery?: string;
  status?: string;
  eta?: string;
  departure_date?: string;
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

interface ConnectionManagementProps {
  onEditVessel?: (vesselId: number) => void;
}

const ConnectionManagement = ({ onEditVessel }: ConnectionManagementProps) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [vesselsResponse, portsResponse, refineriesResponse] = await Promise.all([
        db.from('vessels').select('id, name, imo, vessel_type, departure_port, destination_port, target_refinery, status, eta, departure_date').order('name'),
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

  // Note: handleUpdateConnection, handleAiAutoFill, findMatchingPort, findMatchingRefinery
  // have been removed - vessel editing is now done in VesselManagement

  const handleDisconnect = async (vesselId: number, type: 'departure' | 'destination' | 'refinery') => {
    if (!confirm(`Are you sure you want to remove this ${type} connection?`)) return;

    try {
      const updateData: any = {};
      if (type === 'departure') updateData.departure_port = null;
      if (type === 'destination') updateData.destination_port = null;
      if (type === 'refinery') updateData.target_refinery = null;

      const { error } = await db
        .from('vessels')
        .update(updateData)
        .eq('id', vesselId);

      if (error) throw error;

      toast({ title: "Success", description: "Connection removed successfully" });
      fetchData();
    } catch (error) {
      console.error('Failed to remove connection:', error);
      toast({
        title: "Error",
        description: "Failed to remove connection",
        variant: "destructive"
      });
    }
  };

  const filteredConnections = connections.filter(connection =>
    connection.vessel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.vessel.imo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.departurePort?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.destinationPort?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.targetRefinery?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Check if vessel has arrived (current date >= ETA)
  const isVesselArrived = (vessel: Vessel): boolean => {
    if (!vessel.eta) return false;
    const eta = new Date(vessel.eta);
    const now = new Date();
    return now >= eta;
  };

  const arrivedVessels = connections.filter(c => isVesselArrived(c.vessel) && c.destinationPort);

  const connectionStats = {
    totalVessels: vessels.length,
    connectedToPorts: connections.filter(c => c.departurePort || c.destinationPort).length,
    connectedToRefineries: connections.filter(c => c.targetRefinery).length,
    fullyConnected: connections.filter(c => c.departurePort && c.destinationPort && c.targetRefinery).length,
    arrivedVessels: arrivedVessels.length
  };

  const handleMarkAsArrived = async (vesselId: number) => {
    try {
      const { error } = await db
        .from('vessels')
        .update({ 
          status: 'in port',
          arrival_date: new Date().toISOString()
        })
        .eq('id', vesselId);

      if (error) throw error;

      toast({ title: "Success", description: "Vessel marked as arrived" });
      fetchData();
    } catch (error) {
      console.error('Failed to mark as arrived:', error);
      toast({ title: "Error", description: "Failed to update vessel status", variant: "destructive" });
    }
  };

  const handleCreateNewRoute = (vessel: Vessel, currentDestinationPort?: Port) => {
    // Navigate to vessel edit page instead of opening dialog
    if (onEditVessel) {
      onEditVessel(vessel.id);
      toast({
        title: "Opening Vessel Editor",
        description: `Editing vessel ${vessel.name} - create new route from ${currentDestinationPort?.name || 'previous destination'}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Connection Management
          </CardTitle>
          <CardDescription>
            Manage connections between vessels, ports, and refineries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vessels</p>
                  <p className="text-2xl font-bold">{connectionStats.totalVessels}</p>
                </div>
                <Ship className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connected to Ports</p>
                  <p className="text-2xl font-bold">{connectionStats.connectedToPorts}</p>
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connected to Refineries</p>
                  <p className="text-2xl font-bold">{connectionStats.connectedToRefineries}</p>
                </div>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fully Connected</p>
                  <p className="text-2xl font-bold">{connectionStats.fullyConnected}</p>
                </div>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          {/* Arrival Alerts */}
          {arrivedVessels.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {arrivedVessels.length} Vessel(s) Have Arrived!
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {arrivedVessels.map(c => (
                    <div key={c.vessel.id} className="flex items-center justify-between bg-destructive/10 p-2 rounded">
                      <div>
                        <span className="font-medium">{c.vessel.name}</span>
                        <span className="text-sm ml-2">at {c.destinationPort?.name}</span>
                        {c.vessel.eta && (
                          <span className="text-xs ml-2 opacity-75">
                            (ETA: {new Date(c.vessel.eta).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCreateNewRoute(c.vessel, c.destinationPort)}
                        >
                          <Route className="h-3 w-3 mr-1" />
                          New Route
                        </Button>
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => handleMarkAsArrived(c.vessel.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Arrived
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by vessel name, IMO, ports, or refineries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Connections Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vessel</TableHead>
                  <TableHead>IMO</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Departure Port</TableHead>
                  <TableHead>Destination Port</TableHead>
                  <TableHead>Target Refinery</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConnections.map((connection) => (
                  <TableRow key={connection.vessel.id}>
                    <TableCell className="font-medium">
                      {connection.vessel.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {connection.vessel.imo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {connection.vessel.vessel_type || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(connection.vessel.status)}>
                        {connection.vessel.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {connection.departurePort ? (
                        <div className="flex items-center gap-2">
                          <span>{connection.departurePort.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(connection.vessel.id, 'departure')}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not connected</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {connection.destinationPort ? (
                        <div className="flex items-center gap-2">
                          <span>{connection.destinationPort.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(connection.vessel.id, 'destination')}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not connected</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {connection.targetRefinery ? (
                        <div className="flex items-center gap-2">
                          <span>{connection.targetRefinery.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(connection.vessel.id, 'refinery')}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not connected</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (onEditVessel) {
                            onEditVessel(connection.vessel.id);
                          }
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit Vessel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredConnections.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No connections found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConnectionManagement;