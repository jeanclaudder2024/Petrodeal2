import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Factory, 
  Gauge, 
  Droplets, 
  TrendingUp,
  Search,
  Eye,
  Users,
  Building2,
  Activity,
  DollarSign
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';
import refinery1 from '@/assets/refinery-1.jpg';
import refinery2 from '@/assets/refinery-2.jpg';
import refinery3 from '@/assets/refinery-3.jpg';

interface Refinery {
  id: string;
  name: string;
  country: string;
  region: string;
  city: string;
  type: string;
  status: string;
  capacity: number;
  processing_capacity: number;
  utilization: number;
  operational_efficiency: number;
  complexity: string;
  employees_count: number;
  annual_throughput: number;
  annual_revenue: number;
  products: string;
  parent_company: string;
  safety_rating: string;
  environmental_rating: string;
  established_year: number;
}

const Refineries = () => {
  const navigate = useNavigate();
  const [refineries, setRefineries] = useState<Refinery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRefineries();
  }, []);

  const fetchRefineries = async () => {
    try {
      const { data, error } = await db
        .from('refineries')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching refineries:', error);
      } else {
        setRefineries(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch refineries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRefineries = refineries.filter(refinery =>
    refinery.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refinery.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refinery.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refinery.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refinery.parent_company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    return status?.toLowerCase() === 'operational' ? 'default' : 'secondary';
  };

  const handleViewDetails = (refineryId: string) => {
    navigate(`/refineries/${refineryId}`);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  const totalCapacity = refineries.reduce((sum, refinery) => sum + (refinery.capacity || 0), 0);
  const totalThroughput = refineries.reduce((sum, refinery) => sum + (refinery.annual_throughput || 0), 0);
  const totalEmployees = refineries.reduce((sum, refinery) => sum + (refinery.employees_count || 0), 0);
  const totalRevenue = refineries.reduce((sum, refinery) => sum + (refinery.annual_revenue || 0), 0);
  const operationalRefineries = refineries.filter(r => r.status?.toLowerCase() === 'operational').length;

  const refineryImages = [refinery1, refinery2, refinery3];
  
  const getRefineryImage = (index: number) => {
    return refineryImages[index % refineryImages.length];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Refinery Operations
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor refinery performance and production worldwide
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refineries</CardTitle>
            <Factory className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refineries.length}</div>
            <p className="text-xs text-muted-foreground">
              {operationalRefineries} operational
            </p>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Gauge className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalCapacity / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">bbl/day capacity</p>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Throughput</CardTitle>
            <Droplets className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalThroughput / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">bbl per year</p>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(totalRevenue / 1000000000).toFixed(1)}B
            </div>
            <p className="text-xs text-muted-foreground">annual revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="trading-card mb-6">
        <CardHeader>
          <CardTitle>Search Refineries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, country, city, type, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Refinery Cards Grid */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Factory className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Global Refineries ({filteredRefineries.length} facilities)</h2>
        </div>
        
        {filteredRefineries.length === 0 ? (
          <div className="text-center py-16">
            <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No refineries found matching your search.' : 'No refineries found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRefineries.map((refinery, index) => (
              <Card
                key={refinery.id}
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in border-0"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${getRefineryImage(index)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '320px'
                }}
                onClick={() => handleViewDetails(refinery.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-primary-foreground transition-colors">
                          {refinery.name}
                        </h3>
                        <div className="text-white/80 text-sm mb-1">
                          {refinery.city}, {refinery.country}
                        </div>
                        <div className="text-white/60 text-xs">
                          {refinery.parent_company}
                        </div>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(refinery.status)}
                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                      >
                        {refinery.status}
                      </Badge>
                    </div>

                    <div className="text-white/70 text-sm mb-4">
                      <div className="flex items-center gap-4 mb-2">
                        <span>Est. {refinery.established_year}</span>
                        <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                          {refinery.type}
                        </Badge>
                      </div>
                      <div className="text-xs opacity-80">
                        Complexity: {refinery.complexity}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Gauge className="h-4 w-4 text-blue-400" />
                          <span className="text-white/70">Capacity</span>
                        </div>
                        <div className="font-semibold text-white">
                          {((refinery.capacity || 0) / 1000).toFixed(0)}K bbl/day
                        </div>
                      </div>
                      
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-green-400" />
                          <span className="text-white/70">Utilization</span>
                        </div>
                        <div className="font-semibold text-white">
                          {refinery.utilization || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-white/70 text-sm">
                        <Droplets className="h-4 w-4 inline mr-1" />
                        {((refinery.annual_throughput || 0) / 1000000).toFixed(1)}M bbl/year
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(refinery.id);
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

export default Refineries;