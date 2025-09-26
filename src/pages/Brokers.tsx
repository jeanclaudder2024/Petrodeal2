import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  MapPin, 
  Star, 
  TrendingUp, 
  Search,
  Eye,
  Phone,
  Mail,
  Building,
  Award
} from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import LoadingFallback from '@/components/LoadingFallback';

interface Broker {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  specialization: string[];
  experience_years: number;
  certification: string[];
  regions: string[];
  commission_rate: number;
  rating: number;
  total_deals: number;
  total_volume: number;
  verified: boolean;
  status: string;
}

const Brokers = () => {
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [specializationFilter, setSpecializationFilter] = useState('all');

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      const { data, error } = await db
        .from('brokers')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching brokers:', error);
      } else {
        setBrokers(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrokers = brokers.filter(broker => {
    const matchesSearch = 
      broker.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = regionFilter === 'all' || broker.regions?.includes(regionFilter);
    const matchesSpecialization = specializationFilter === 'all' || 
      broker.specialization?.includes(specializationFilter);

    return matchesSearch && matchesRegion && matchesSpecialization;
  });

  const handleViewDetails = (brokerId: string) => {
    navigate(`/brokers/${brokerId}`);
  };

  const getRegions = () => {
    const regions = new Set<string>();
    brokers.forEach(broker => {
      broker.regions?.forEach(region => regions.add(region));
    });
    return Array.from(regions);
  };

  const getSpecializations = () => {
    const specializations = new Set<string>();
    brokers.forEach(broker => {
      broker.specialization?.forEach(spec => specializations.add(spec));
    });
    return Array.from(specializations);
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Oil Trading Brokers
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect with verified brokers and trading professionals
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brokers.length}</div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brokers.filter(b => b.verified).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brokers.reduce((sum, b) => sum + (b.total_deals || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="trading-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brokers.length > 0 
                ? (brokers.reduce((sum, b) => sum + (b.rating || 0), 0) / brokers.length).toFixed(1)
                : '0.0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="trading-card mb-6">
        <CardHeader>
          <CardTitle>Search & Filter Brokers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {getRegions().map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {getSpecializations().map(spec => (
                  <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Brokers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBrokers.map((broker) => (
          <Card key={broker.id} className="trading-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {broker.company_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{broker.company_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{broker.contact_person}</p>
                  </div>
                </div>
                {broker.verified && (
                  <Badge variant="default" className="bg-green-500">
                    <Award className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(broker.rating || 0)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {broker.rating?.toFixed(1) || '0.0'} ({broker.total_deals || 0} deals)
                </span>
              </div>

              {/* Experience */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{broker.experience_years || 0} years experience</span>
              </div>

              {/* Commission */}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Commission: {broker.commission_rate || 0}%</span>
              </div>

              {/* Specializations */}
              {broker.specialization && broker.specialization.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {broker.specialization.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {broker.specialization.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{broker.specialization.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                {broker.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{broker.email}</span>
                  </div>
                )}
                {broker.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{broker.phone}</span>
                  </div>
                )}
                {broker.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{broker.address}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                onClick={() => handleViewDetails(broker.id)}
                className="w-full mt-4"
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredBrokers.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || (regionFilter !== 'all') || (specializationFilter !== 'all') 
              ? 'No brokers found matching your filters.' 
              : 'No brokers found.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Brokers;