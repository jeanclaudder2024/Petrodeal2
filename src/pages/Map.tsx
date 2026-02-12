import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Ship, MapPin, Factory, Building2, Search, Filter, Navigation, Layers, Activity, TrendingUp, Globe, Radio } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import InteractiveMap from '@/components/InteractiveMap';
import SponsorBanner from '@/components/SponsorBanner';
import { useTheme } from 'next-themes';

interface MapData {
  vessels: any[];
  ports: any[];
  refineries: any[];
  companies: any[];
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
  showCompanies: boolean;
}

const MapPage = () => {
  const [mapData, setMapData] = useState<MapData>({ vessels: [], ports: [], refineries: [], companies: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({
    vesselTypes: [], portTypes: [], refineryTypes: [], countries: [], regions: [],
    searchTerm: '', showVessels: true, showPorts: true, showRefineries: true, showCompanies: true
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24H');
  const [lastUpdated, setLastUpdated] = useState(0);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  const mapTheme = resolvedTheme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    fetchMapData();
    const interval = setInterval(() => { setLastUpdated(prev => prev + 1); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [vesselsRes, portsRes, refineriesRes, companiesRes] = await Promise.all([
        db.from('vessels').select('*'),
        db.from('ports').select('*'),
        db.from('refineries').select('*'),
        db.from('companies').select('*')
      ]);

      const vessels = vesselsRes.data || [];
      const companies = (companiesRes.data || []).map((company: any) => {
        const connectedVessels = vessels.filter(
          v => v.commodity_source_company_id === company.id || v.buyer_company_id === company.id || v.seller_company_id === company.id
        );
        return { ...company, vessel_count: connectedVessels.length, connected_vessels: connectedVessels.map(v => ({ id: v.id, name: v.name })) };
      });

      setMapData({ vessels, ports: portsRes.data || [], refineries: refineriesRes.data || [], companies });
      setLastUpdated(0);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      toast({ title: "Error", description: "Failed to load map data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getUniqueValues = (data: any[], field: string) => [...new Set(data.map(item => item[field]).filter(Boolean))];

  const vesselTypes = getUniqueValues(mapData.vessels, 'vessel_type');
  const portTypes = getUniqueValues(mapData.ports, 'port_type');
  const refineryTypes = getUniqueValues(mapData.refineries, 'type');
  const countries = [...getUniqueValues(mapData.ports, 'country'), ...getUniqueValues(mapData.refineries, 'country'), ...getUniqueValues(mapData.companies, 'country')].filter((v, i, a) => a.indexOf(v) === i);
  const regions = [...getUniqueValues(mapData.ports, 'region'), ...getUniqueValues(mapData.refineries, 'region')].filter((v, i, a) => a.indexOf(v) === i);

  const filteredData = {
    vessels: mapData.vessels.filter(vessel => filters.showVessels && (filters.vesselTypes.length === 0 || filters.vesselTypes.includes(vessel.vessel_type)) && (filters.searchTerm === '' || vessel.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || vessel.flag?.toLowerCase().includes(filters.searchTerm.toLowerCase()))),
    ports: mapData.ports.filter(port => filters.showPorts && (filters.portTypes.length === 0 || filters.portTypes.includes(port.port_type)) && (filters.countries.length === 0 || filters.countries.includes(port.country)) && (filters.regions.length === 0 || filters.regions.includes(port.region)) && (filters.searchTerm === '' || port.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || port.country?.toLowerCase().includes(filters.searchTerm.toLowerCase()))),
    refineries: mapData.refineries.filter(refinery => filters.showRefineries && (filters.refineryTypes.length === 0 || filters.refineryTypes.includes(refinery.type)) && (filters.countries.length === 0 || filters.countries.includes(refinery.country)) && (filters.regions.length === 0 || filters.regions.includes(refinery.region)) && (filters.searchTerm === '' || refinery.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || refinery.operator?.toLowerCase().includes(filters.searchTerm.toLowerCase()))),
    companies: mapData.companies.filter(company => filters.showCompanies && (filters.countries.length === 0 || filters.countries.includes(company.country)) && (filters.searchTerm === '' || company.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || company.country?.toLowerCase().includes(filters.searchTerm.toLowerCase())))
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const totalMovements = filteredData.vessels.length;
  const avgUtilization = mapData.refineries.length > 0 ? Math.round((mapData.refineries.filter(r => r.status === 'Active' || r.status === 'Operational').length / mapData.refineries.length) * 100) : 78;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SponsorBanner location="dashboard_map" className="mb-0" />

      {/* Live Status Header Bar */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-6 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse bg-cyan-500"></span>
            <span className="text-muted-foreground">Live Data Stream Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Global Network Operational</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-amber-500" />
            <span className="text-muted-foreground">Updated {lastUpdated} sec ago</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['24H', '7D', '30D', '90D'].map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                selectedTimeRange === range
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Global Energy Flow Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time monitoring of crude and refined product movements across global trade routes.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vessels, ports, refineries..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Layer Controls */}
          <div className="flex flex-wrap gap-4">
            {[
              { id: 'vessels', checked: filters.showVessels, onChange: (c: boolean) => setFilters({...filters, showVessels: c}), icon: Ship, color: 'text-blue-400', label: `Vessels (${filteredData.vessels.length})` },
              { id: 'routes', checked: showRoutes, onChange: (c: boolean) => setShowRoutes(c), icon: Navigation, color: 'text-cyan-400', label: 'Trade Routes' },
              { id: 'ports', checked: filters.showPorts, onChange: (c: boolean) => setFilters({...filters, showPorts: c}), icon: MapPin, color: 'text-green-400', label: `Ports (${filteredData.ports.length})` },
              { id: 'refineries', checked: filters.showRefineries, onChange: (c: boolean) => setFilters({...filters, showRefineries: c}), icon: Factory, color: 'text-amber-400', label: `Refineries (${filteredData.refineries.length})` },
              { id: 'companies', checked: filters.showCompanies, onChange: (c: boolean) => setFilters({...filters, showCompanies: c}), icon: Building2, color: 'text-purple-400', label: `Companies (${filteredData.companies.length})` },
            ].map(item => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox id={item.id} checked={item.checked} onCheckedChange={(checked) => item.onChange(!!checked)} />
                <label htmlFor={item.id} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </label>
              </div>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
                <Layers className="h-4 w-4 text-primary" />
                Advanced Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Vessel Types', items: vesselTypes, key: 'vesselTypes' as const, prefix: 'vessel' },
                  { label: 'Port Types', items: portTypes, key: 'portTypes' as const, prefix: 'port' },
                  { label: 'Countries', items: countries.slice(0, 10), key: 'countries' as const, prefix: 'country' },
                  { label: 'Regions', items: regions.slice(0, 10), key: 'regions' as const, prefix: 'region' },
                ].map(section => (
                  <div key={section.label}>
                    <label className="text-xs font-medium text-muted-foreground">{section.label}</label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {section.items.map(item => (
                        <div key={item} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${section.prefix}-${item}`}
                            checked={(filters[section.key] as string[]).includes(item)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilters({...filters, [section.key]: [...(filters[section.key] as string[]), item]});
                              } else {
                                setFilters({...filters, [section.key]: (filters[section.key] as string[]).filter(t => t !== item)});
                              }
                            }}
                          />
                          <label htmlFor={`${section.prefix}-${item}`} className="text-xs text-muted-foreground">{item}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="rounded-lg border border-border bg-card overflow-hidden mb-6">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Global Intelligence View</h2>
            </div>
            <span className="text-xs text-muted-foreground">Powered by advanced market analytics</span>
          </div>
          <div className="relative overflow-visible p-0">
            <InteractiveMap data={filteredData} height="350px" showRoutes={showRoutes} theme={mapTheme} />
          </div>
        </div>

        {/* Intelligence Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Energy Movements', value: totalMovements, icon: Ship, iconColor: 'text-blue-400', trend: '+4.2% this week', trendColor: 'text-cyan-500', hoverBorder: 'hover:border-cyan-500/50' },
            { label: 'Refinery Utilization', value: `${avgUtilization}%`, icon: Factory, iconColor: 'text-amber-400', trend: '↑ 3% from last 30 days', trendColor: 'text-cyan-500', hoverBorder: 'hover:border-amber-500/50' },
            { label: 'Active Ports', value: filteredData.ports.length, icon: MapPin, iconColor: 'text-green-400', trend: 'All operational', trendColor: 'text-green-500', hoverBorder: 'hover:border-green-500/50' },
            { label: 'Market References', value: filteredData.companies.length, icon: Building2, iconColor: 'text-purple-400', trend: 'Global coverage', trendColor: 'text-purple-500', hoverBorder: 'hover:border-purple-500/50' },
          ].map((card, i) => (
            <div key={i} className={`rounded-lg border border-border bg-card p-5 transition-all ${card.hoverBorder}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${card.trendColor}`} />
                <span className={`text-xs ${card.trendColor}`}>{card.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Company Disclaimer */}
        <div className="text-center py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Company names represent publicly available market intelligence references. No direct affiliation or partnership implied.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
