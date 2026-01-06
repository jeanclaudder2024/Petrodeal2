import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, ChevronDown, ChevronUp, Building2, Ship, MapPin, Factory, Database, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { DataExplorerSkeleton } from './LoadingSkeletons';

// Placeholder definitions for each entity type
const COMPANY_PLACEHOLDERS = [
  'company_name', 'trade_name', 'company_type', 'description', 'company_objective',
  'email', 'official_email', 'operations_email', 'phone', 'website',
  'address', 'city', 'country', 'legal_address',
  'industry', 'employees_count', 'annual_revenue', 'founded_year', 'primary_activity', 'trading_regions',
  'registration_number', 'registration_country', 'representative_name', 'representative_title',
  'passport_number', 'passport_country', 'representative_email',
  'refinery_name', 'refinery_location', 'refinery_capacity_bpd', 'products_supplied', 'loading_ports',
  'kyc_status', 'sanctions_status', 'country_risk', 'compliance_notes',
  'logo_url', 'director_photo_url', 'signatory_signature_url',
  'bank_name', 'bank_address', 'account_name', 'account_number', 'iban', 'swift_code', 'beneficiary_address', 'currency'
];

const VESSEL_PLACEHOLDERS = [
  'vessel_name', 'vessel_type', 'flag', 'mmsi', 'imo', 'callsign', 'built', 'status',
  'length', 'width', 'beam', 'draught', 'draft', 'deadweight', 'gross_tonnage',
  'cargo_capacity', 'cargo_capacity_bbl', 'engine_power', 'service_speed', 'fuel_consumption', 'crew_size',
  'current_lat', 'current_lng', 'speed', 'course', 'nav_status', 'current_region',
  'departure_port', 'destination_port', 'loading_port', 'discharge_port',
  'departure_date', 'eta', 'arrival_date', 'route_distance', 'voyage_status', 'voyage_notes',
  'cargo_type', 'commodity_name', 'commodity_category', 'hs_code', 'oil_type', 'oil_source',
  'source_refinery', 'cargo_origin_country', 'sanctions_status', 'min_quantity', 'max_quantity',
  'quantity_unit', 'total_shipment_quantity', 'cargo_quantity', 'quality_specification',
  'owner_name', 'operator_name', 'source_company', 'target_refinery', 'buyer_name', 'seller_name',
  'deal_reference_id', 'deal_status', 'contract_type', 'delivery_terms', 'delivery_method',
  'price_basis', 'benchmark_reference', 'indicative_price', 'market_price', 'deal_value', 'price_notes',
  'payment_method', 'payment_timing', 'payment_notes'
];

const PORT_PLACEHOLDERS = [
  'port_name', 'country', 'region', 'city', 'address', 'postal_code', 'port_type', 'status', 'description',
  'phone', 'email', 'website', 'lat', 'lng',
  'capacity', 'berth_count', 'terminal_count', 'max_vessel_length', 'max_vessel_beam',
  'max_draught', 'max_deadweight', 'channel_depth', 'berth_depth', 'anchorage_depth',
  'pilotage_required', 'tug_assistance', 'customs_office', 'quarantine_station',
  'free_trade_zone', 'rail_connection', 'road_connection',
  'owner', 'operator', 'port_authority', 'facilities', 'services', 'operating_hours',
  'cargo_types', 'security_level', 'environmental_certifications', 'port_charges',
  'average_wait_time', 'tidal_range', 'airport_distance', 'established', 'annual_throughput',
  'vessel_count', 'total_cargo'
];

const REFINERY_PLACEHOLDERS = [
  'refinery_name', 'country', 'region', 'city', 'address', 'type', 'status', 'description',
  'phone', 'email', 'website', 'lat', 'lng',
  'capacity', 'processing_capacity', 'storage_capacity',
  'operator', 'owner', 'established_year', 'workforce_size', 'annual_revenue',
  'products', 'fuel_types', 'processing_units', 'crude_oil_sources',
  'pipeline_connections', 'shipping_terminals', 'rail_connections',
  'environmental_certifications', 'complexity', 'utilization', 'annual_throughput',
  'daily_throughput', 'operational_efficiency', 'investment_cost', 'operating_costs',
  'profit_margin', 'market_share', 'technical_specs'
];

interface EntityCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  placeholders: string[];
  entityType: string;
  data: any[];
  color: string;
}

const EntityCard: React.FC<EntityCardProps> = ({
  title,
  description,
  icon,
  count,
  placeholders,
  entityType,
  data,
  color
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const downloadXLS = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${entityType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${title} exported as XLS`);
  };

  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${entityType}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(`${title} exported as CSV`);
  };

  const copyPlaceholders = () => {
    const formatted = placeholders.map(p => `{{${p}}}`).join('\n');
    navigator.clipboard.writeText(formatted);
    toast.success('Placeholders copied to clipboard');
  };

  return (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadXLS} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download XLS
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCSV} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Available Placeholders ({placeholders.length})
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" onClick={copyPlaceholders}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {placeholders.map((placeholder) => (
                  <Badge
                    key={placeholder}
                    variant="outline"
                    className="text-xs font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(`{{${placeholder}}}`);
                      toast.success(`Copied {{${placeholder}}}`);
                    }}
                  >
                    {`{{${placeholder}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

const DataExplorer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    realCompanies: 0,
    buyerCompanies: 0,
    sellerCompanies: 0,
    vessels: 0,
    ports: 0,
    refineries: 0
  });
  const [data, setData] = useState<{
    realCompanies: any[];
    buyerCompanies: any[];
    sellerCompanies: any[];
    vessels: any[];
    ports: any[];
    refineries: any[];
  }>({
    realCompanies: [],
    buyerCompanies: [],
    sellerCompanies: [],
    vessels: [],
    ports: [],
    refineries: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        { data: companies, count: companiesCount },
        { data: vessels, count: vesselsCount },
        { data: ports, count: portsCount },
        { data: refineries, count: refineriesCount }
      ] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('vessels').select('*'),
        supabase.from('ports').select('*'),
        supabase.from('refineries').select('*')
      ]);

      // Filter companies by type
      const realCompanies = companies?.filter(c => c.company_type === 'real') || [];
      const buyerCompanies = companies?.filter(c => c.company_type === 'buyer') || [];
      const sellerCompanies = companies?.filter(c => c.company_type === 'seller') || [];

      setCounts({
        realCompanies: realCompanies.length,
        buyerCompanies: buyerCompanies.length,
        sellerCompanies: sellerCompanies.length,
        vessels: vessels?.length || 0,
        ports: ports?.length || 0,
        refineries: refineries?.length || 0
      });

      setData({
        realCompanies,
        buyerCompanies,
        sellerCompanies,
        vessels: vessels || [],
        ports: ports || [],
        refineries: refineries || []
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DataExplorerSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Explorer</h3>
          <p className="text-sm text-muted-foreground">
            View, export, and explore placeholders for each entity type
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <EntityCard
          title="Real Companies"
          description="Verified business entities"
          icon={<Building2 className="h-8 w-8 text-blue-600" />}
          count={counts.realCompanies}
          placeholders={COMPANY_PLACEHOLDERS}
          entityType="company_real"
          data={data.realCompanies}
          color="border-l-blue-500"
        />

        <EntityCard
          title="Buyer Companies"
          description="Purchasing entities"
          icon={<Building2 className="h-8 w-8 text-green-600" />}
          count={counts.buyerCompanies}
          placeholders={COMPANY_PLACEHOLDERS}
          entityType="company_buyer"
          data={data.buyerCompanies}
          color="border-l-green-500"
        />

        <EntityCard
          title="Seller Companies"
          description="Selling entities"
          icon={<Building2 className="h-8 w-8 text-orange-600" />}
          count={counts.sellerCompanies}
          placeholders={COMPANY_PLACEHOLDERS}
          entityType="company_seller"
          data={data.sellerCompanies}
          color="border-l-orange-500"
        />

        <EntityCard
          title="Vessels"
          description="Ships and tankers"
          icon={<Ship className="h-8 w-8 text-purple-600" />}
          count={counts.vessels}
          placeholders={VESSEL_PLACEHOLDERS}
          entityType="vessel"
          data={data.vessels}
          color="border-l-purple-500"
        />

        <EntityCard
          title="Ports"
          description="Shipping terminals"
          icon={<MapPin className="h-8 w-8 text-red-600" />}
          count={counts.ports}
          placeholders={PORT_PLACEHOLDERS}
          entityType="port"
          data={data.ports}
          color="border-l-red-500"
        />

        <EntityCard
          title="Refineries"
          description="Processing facilities"
          icon={<Factory className="h-8 w-8 text-amber-600" />}
          count={counts.refineries}
          placeholders={REFINERY_PLACEHOLDERS}
          entityType="refinery"
          data={data.refineries}
          color="border-l-amber-500"
        />
      </div>
    </div>
  );
};

export default DataExplorer;
