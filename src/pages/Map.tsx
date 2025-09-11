import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Map as MapIcon, Ship, MapPin, Factory, Building2, Search, Filter, Navigation, Layers } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import InteractiveMap from '@/components/InteractiveMap';

interface MapData {
  vessels: any[];
  ports: any[];
  refineries: any[];
}

interface MapFilters {
  vesselTypes: string[];
  portTypes: string[];
  refineryTypes: string[];
  countries: string[];
  regions: string[];
  searchTerm: string;
  showVessels: boolean;
  showPorts: boolean;
  showRefineries: boolean;
}

const MapPage = () => {
  const [mapData, setMapData] = useState<MapData>({
    vessels: [],
    ports: [],
    refineries: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({
    vesselTypes: [],
    portTypes: [],
    refineryTypes: [],
    countries: [],
    regions: [],
    searchTerm: '',
    showVessels: true,
    showPorts: true,
    showRefineries: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [vesselsRes, portsRes, refineriesRes] = await Promise.all([
        db.from('vessels').select('*'),
        db.from('ports').select('*').limit(100),
        db.from('refineries').select('*').limit(100)
      ]);

      setMapData({
        vessels: vesselsRes.data || [],
        ports: portsRes.data || [],
        refineries: refineriesRes.data || []
      });
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUniqueValues = (data: any[], field: string) => {
    return [...new Set(data.map(item => item[field]).filter(Boolean))];
  };

  const vesselTypes = getUniqueValues(mapData.vessels, 'vessel_type');
  const portTypes = getUniqueValues(mapData.ports, 'port_type');
  const refineryTypes = getUniqueValues(mapData.refineries, 'type');
  const countries = [
    ...getUniqueValues(mapData.ports, 'country'),
    ...getUniqueValues(mapData.refineries, 'country')
  ];
  const regions = [
    ...getUniqueValues(mapData.ports, 'region'),
    ...getUniqueValues(mapData.refineries, 'region')
  ];

  const filteredData = {
    vessels: mapData.vessels.filter(vessel => 
      filters.showVessels &&
      (filters.vesselTypes.length === 0 || filters.vesselTypes.includes(vessel.vessel_type)) &&
      (filters.searchTerm === '' || 
        vessel.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        vessel.flag?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    ),
    ports: mapData.ports.filter(port => 
      filters.showPorts &&
      (filters.portTypes.length === 0 || filters.portTypes.includes(port.port_type)) &&
      (filters.countries.length === 0 || filters.countries.includes(port.country)) &&
      (filters.regions.length === 0 || filters.regions.includes(port.region)) &&
      (filters.searchTerm === '' || 
        port.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        port.country?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    ),
    refineries: mapData.refineries.filter(refinery => 
      filters.showRefineries &&
      (filters.refineryTypes.length === 0 || filters.refineryTypes.includes(refinery.type)) &&
      (filters.countries.length === 0 || filters.countries.includes(refinery.country)) &&
      (filters.regions.length === 0 || filters.regions.includes(refinery.region)) &&
      (filters.searchTerm === '' || 
        refinery.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        refinery.operator?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    )
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Interactive Map
        </h1>
        <p className="text-muted-foreground mt-2">
          Explore vessels, ports, refineries, and companies with advanced filtering
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search vessels, ports, refineries, companies..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vessels"
              checked={filters.showVessels}
              onCheckedChange={(checked) => 
                setFilters({...filters, showVessels: !!checked})
              }
            />
            <label htmlFor="vessels" className="flex items-center gap-2 text-sm font-medium">
              <Ship className="h-4 w-4 text-blue-500" />
              Vessels ({filteredData.vessels.length})
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="routes"
              checked={showRoutes}
              onCheckedChange={(checked) => setShowRoutes(!!checked)}
            />
            <label htmlFor="routes" className="flex items-center gap-2 text-sm font-medium">
              <Navigation className="h-4 w-4 text-blue-600" />
              Vessel Routes
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ports"
              checked={filters.showPorts}
              onCheckedChange={(checked) => 
                setFilters({...filters, showPorts: !!checked})
              }
            />
            <label htmlFor="ports" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-green-500" />
              Ports ({filteredData.ports.length})
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="refineries"
              checked={filters.showRefineries}
              onCheckedChange={(checked) => 
                setFilters({...filters, showRefineries: !!checked})
              }
            />
            <label htmlFor="refineries" className="flex items-center gap-2 text-sm font-medium">
              <Factory className="h-4 w-4 text-orange-500" />
              Refineries ({filteredData.refineries.length})
            </label>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
              <CardDescription>
                Refine your map view with detailed filtering options
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Vessel Types</label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {vesselTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vessel-${type}`}
                        checked={filters.vesselTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({...filters, vesselTypes: [...filters.vesselTypes, type]});
                          } else {
                            setFilters({...filters, vesselTypes: filters.vesselTypes.filter(t => t !== type)});
                          }
                        }}
                      />
                      <label htmlFor={`vessel-${type}`} className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Port Types</label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {portTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`port-${type}`}
                        checked={filters.portTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({...filters, portTypes: [...filters.portTypes, type]});
                          } else {
                            setFilters({...filters, portTypes: filters.portTypes.filter(t => t !== type)});
                          }
                        }}
                      />
                      <label htmlFor={`port-${type}`} className="text-sm">{type}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Countries</label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {countries.slice(0, 10).map(country => (
                    <div key={country} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-${country}`}
                        checked={filters.countries.includes(country)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({...filters, countries: [...filters.countries, country]});
                          } else {
                            setFilters({...filters, countries: filters.countries.filter(c => c !== country)});
                          }
                        }}
                      />
                      <label htmlFor={`country-${country}`} className="text-sm">{country}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Regions</label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {regions.slice(0, 10).map(region => (
                    <div key={region} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${region}`}
                        checked={filters.regions.includes(region)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({...filters, regions: [...filters.regions, region]});
                          } else {
                            setFilters({...filters, regions: filters.regions.filter(r => r !== region)});
                          }
                        }}
                      />
                      <label htmlFor={`region-${region}`} className="text-sm">{region}</label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map Container */}
      <Card className="trading-card mb-8 overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            Global Map View
          </CardTitle>
          <CardDescription>
            Interactive map showing filtered results across the globe
          </CardDescription>
        </CardHeader>
        <CardContent className="relative overflow-visible p-0">
          <InteractiveMap data={filteredData} height="500px" showRoutes={showRoutes} />
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="trading-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ship className="h-4 w-4 text-blue-500" />
              Active Vessels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500 mb-2">{filteredData.vessels.length}</div>
            <div className="space-y-1">
              {filteredData.vessels.slice(0, 3).map((vessel, index) => (
                <div key={index} className="text-xs text-muted-foreground truncate">
                  {vessel.name} - {vessel.flag}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-green-500" />
              Active Ports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500 mb-2">{filteredData.ports.length}</div>
            <div className="space-y-1">
              {filteredData.ports.slice(0, 3).map((port, index) => (
                <div key={index} className="text-xs text-muted-foreground truncate">
                  {port.name} - {port.country}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="trading-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Factory className="h-4 w-4 text-orange-500" />
              Refineries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500 mb-2">{filteredData.refineries.length}</div>
            <div className="space-y-1">
              {filteredData.refineries.slice(0, 3).map((refinery, index) => (
                <div key={index} className="text-xs text-muted-foreground truncate">
                  {refinery.name} - {refinery.operator}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default MapPage;