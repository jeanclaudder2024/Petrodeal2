import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Ship, MapPin, Factory, Plus, Edit, Trash2, Search, Eye, Bot, Loader2 } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Vessel {
  id: number;
  name: string;
  imo?: string;
  vessel_type?: string;
  departure_port?: number;
  destination_port?: number;
  target_refinery?: string;
  status?: string;
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

const ConnectionManagement = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [formData, setFormData] = useState<Partial<Vessel>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [vesselsResponse, portsResponse, refineriesResponse] = await Promise.all([
        db.from('vessels').select('id, name, imo, vessel_type, departure_port, destination_port, target_refinery, status').order('name'),
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

  const handleUpdateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVessel) return;

    try {
      const { error } = await db
        .from('vessels')
        .update({
          departure_port: formData.departure_port || null,
          destination_port: formData.destination_port || null,
          target_refinery: formData.target_refinery || null
        })
        .eq('id', editingVessel.id);

      if (error) throw error;

      toast({ title: "Success", description: "Connection updated successfully" });
      setIsDialogOpen(false);
      setEditingVessel(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Failed to update connection:', error);
      toast({
        title: "Error",
        description: "Failed to update connection",
        variant: "destructive"
      });
    }
  };

  const handleAiAutoFill = async () => {
    if (!editingVessel) return;
    
    setAiLoading(true);
    try {
      console.log('Starting AI auto-fill for vessel:', editingVessel.name);
      
      const { data, error } = await supabase.functions.invoke('ai-vessel-port-search', {
        body: {
          vessel_name: editingVessel.name,
          imo: editingVessel.imo,
          vessel_type: editingVessel.vessel_type
        }
      });

      if (error) {
        console.error('AI auto-fill error:', error);
        throw new Error(error.message || 'Failed to get AI suggestions');
      }

      if (data?.success && data?.data) {
        const aiSuggestions = data.data;
        console.log('AI suggestions received:', aiSuggestions);

        // Find matching ports in our database
        const departurePort = findMatchingPort(aiSuggestions.departure_ports);
        const destinationPort = findMatchingPort(aiSuggestions.destination_ports);
        const targetRefinery = findMatchingRefinery(aiSuggestions.refineries);

        // Update form data with AI suggestions
        setFormData({
          ...formData,
          departure_port: departurePort?.id,
          destination_port: destinationPort?.id,
          target_refinery: targetRefinery?.name || targetRefinery?.id
        });

        let message = "AI suggestions applied successfully!";
        if (aiSuggestions.confidence === 'low') {
          message += " (Low confidence - please verify the connections)";
        }
        if (aiSuggestions.notes) {
          message += `\n\nNotes: ${aiSuggestions.notes}`;
        }

        toast({
          title: "AI Auto-Fill Complete",
          description: message,
        });
      } else {
        throw new Error('No AI suggestions available');
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      toast({
        title: "AI Auto-Fill Failed",
        description: error instanceof Error ? error.message : "Failed to get AI suggestions for vessel connections",
        variant: "destructive"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const findMatchingPort = (suggestedPorts: string[]) => {
    if (!suggestedPorts?.length) return null;
    
    for (const suggestedPort of suggestedPorts) {
      const match = ports.find(port => 
        port.name.toLowerCase().includes(suggestedPort.toLowerCase()) ||
        suggestedPort.toLowerCase().includes(port.name.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  const findMatchingRefinery = (suggestedRefineries: string[]) => {
    if (!suggestedRefineries?.length) return null;
    
    for (const suggestedRefinery of suggestedRefineries) {
      const match = refineries.find(refinery => 
        refinery.name?.toLowerCase().includes(suggestedRefinery.toLowerCase()) ||
        suggestedRefinery.toLowerCase().includes(refinery.name?.toLowerCase() || '')
      );
      if (match) return match;
    }
    return null;
  };

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

  const connectionStats = {
    totalVessels: vessels.length,
    connectedToPorts: connections.filter(c => c.departurePort || c.destinationPort).length,
    connectedToRefineries: connections.filter(c => c.targetRefinery).length,
    fullyConnected: connections.filter(c => c.departurePort && c.destinationPort && c.targetRefinery).length
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
                          setEditingVessel(connection.vessel);
                          setFormData({
                            departure_port: connection.vessel.departure_port,
                            destination_port: connection.vessel.destination_port,
                            target_refinery: connection.vessel.target_refinery
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
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

      {/* Edit Connection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Connections</DialogTitle>
            <DialogDescription>
              Update connections for {editingVessel?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateConnection} className="space-y-4">
            <div>
              <Label htmlFor="departure_port">Departure Port</Label>
              <Select
                value={formData.departure_port?.toString() || 'none'}
                onValueChange={(value) => setFormData({...formData, departure_port: value === 'none' ? undefined : parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select departure port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No departure port</SelectItem>
                  {ports.map((port) => (
                    <SelectItem key={port.id} value={port.id.toString()}>
                      {port.name} ({port.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destination_port">Destination Port</Label>
              <Select
                value={formData.destination_port?.toString() || 'none'}
                onValueChange={(value) => setFormData({...formData, destination_port: value === 'none' ? undefined : parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No destination port</SelectItem>
                  {ports.map((port) => (
                    <SelectItem key={port.id} value={port.id.toString()}>
                      {port.name} ({port.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target_refinery">Target Refinery</Label>
              <Select
                value={formData.target_refinery || 'none'}
                onValueChange={(value) => setFormData({...formData, target_refinery: value === 'none' ? undefined : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target refinery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No target refinery</SelectItem>
                  {refineries.map((refinery) => (
                    <SelectItem key={refinery.id} value={refinery.name || refinery.id}>
                      {refinery.name} ({refinery.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Auto-Fill Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">AI Port Suggestions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiAutoFill}
                  disabled={aiLoading || !editingVessel?.imo}
                  className="gap-2"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3" />
                      Auto-Fill Ports
                    </>
                  )}
                </Button>
              </div>
              {!editingVessel?.imo && (
                <p className="text-xs text-muted-foreground">
                  IMO number required for AI suggestions
                </p>
              )}
              {editingVessel?.imo && (
                <p className="text-xs text-muted-foreground">
                  AI will search for port connections based on vessel name and IMO: {editingVessel.imo}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Connections</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionManagement;