import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ship, MapPin, Search, Filter, Eye } from 'lucide-react';
import { db } from '@/lib/supabase-helper';

interface Vessel {
  id: string;
  name: string;
  imo_number: string;
  vessel_type: string;
  dwt: number;
  flag: string;
  status: string;
  current_location: string;
  destination: string;
  eta?: string;
  created_at: string;
}

const VesselTracking = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    fetchVessels();
  }, []);

  const fetchVessels = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('vessels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vessels:', error);
        setVessels([]);
      } else {
        setVessels((data as Vessel[]) || []);
      }
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
      setVessels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVessels = vessels.filter(vessel => {
    const matchesSearch = (vessel.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vessel.imo_number || '').includes(searchTerm) ||
                         (vessel.flag || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || vessel.vessel_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500';
    switch (status.toLowerCase()) {
      case 'sailing': return 'bg-green-500';
      case 'anchored': return 'bg-yellow-500';
      case 'in_port': return 'bg-blue-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const vesselTypes = [...new Set(vessels.map(v => v.vessel_type))];

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
            <Ship className="h-5 w-5 text-primary" />
            Vessel Tracking
          </CardTitle>
          <CardDescription>
            Monitor oil tankers and cargo vessels in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vessels by name, IMO, or flag..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All Types
              </Button>
              {vesselTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Vessels Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vessel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>DWT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVessels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No vessels found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVessels.map((vessel) => (
                    <TableRow key={vessel.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{vessel.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            IMO: {vessel.imo_number || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Flag: {vessel.flag || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vessel.vessel_type || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>{vessel.dwt?.toLocaleString() || 'N/A'} MT</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(vessel.status)}`} />
                          <span className="capitalize">{vessel.status ? vessel.status.replace('_', ' ') : 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {vessel.current_location || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>{vessel.destination || 'Unknown'}</TableCell>
                      <TableCell>
                        {vessel.eta ? new Date(vessel.eta).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {vessels.filter(v => v.status === 'sailing').length}
              </div>
              <div className="text-sm text-muted-foreground">Sailing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {vessels.filter(v => v.status === 'anchored').length}
              </div>
              <div className="text-sm text-muted-foreground">Anchored</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {vessels.filter(v => v.status === 'in_port').length}
              </div>
              <div className="text-sm text-muted-foreground">In Port</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {vessels.filter(v => v.status === 'maintenance').length}
              </div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VesselTracking;