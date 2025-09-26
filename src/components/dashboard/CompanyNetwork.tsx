import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, Search, MapPin, Globe, Phone, Mail } from 'lucide-react';
import { db } from '@/lib/supabase-helper';

interface Company {
  id: string;
  name: string;
  company_type: string;
  country: string;
  city: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  verified: boolean;
  created_at: string;
}

const CompanyNetwork = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    // Using mock data for now
    setLoading(true);
    setTimeout(() => {
      const mockCompanies: Company[] = [
        {
          id: '1',
          name: 'Global Maritime Trading Ltd',
          company_type: 'trader',
          country: 'Singapore',
          city: 'Singapore',
          description: 'Leading oil trading company specializing in crude oil and refined products across Asia-Pacific region.',
          website: 'https://globalmaritime.com',
          email: 'contact@globalmaritime.com',
          phone: '+65 6234 5678',
          verified: true,
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          name: 'North Sea Petroleum Corp',
          company_type: 'trader',
          country: 'Norway',
          city: 'Oslo',
          description: 'Specialized in North Sea crude oil trading with 25+ years of experience in the European market.',
          website: 'https://northseapetro.no',
          email: 'info@northseapetro.no',
          phone: '+47 2123 4567',
          verified: true,
          created_at: '2024-02-01T14:20:00Z'
        },
        {
          id: '3',
          name: 'Atlantic Shipping Solutions',
          company_type: 'shipping',
          country: 'United Kingdom',
          city: 'London',
          description: 'Premier shipping and logistics provider for oil tankers and maritime transport services.',
          website: 'https://atlanticshipping.co.uk',
          email: 'operations@atlanticshipping.co.uk',
          phone: '+44 20 7123 4567',
          verified: true,
          created_at: '2024-01-20T09:45:00Z'
        },
        {
          id: '4',
          name: 'Gulf Energy Refinery',
          company_type: 'refinery',
          country: 'United Arab Emirates',
          city: 'Abu Dhabi',
          description: 'State-of-the-art refinery processing 500,000 barrels per day of crude oil into various petroleum products.',
          website: 'https://gulfenergy.ae',
          email: 'business@gulfenergy.ae',
          phone: '+971 2 123 4567',
          verified: true,
          created_at: '2024-03-10T11:15:00Z'
        },
        {
          id: '5',
          name: 'Mediterranean Oil Brokers',
          company_type: 'broker',
          country: 'Italy',
          city: 'Milan',
          description: 'Independent oil brokerage facilitating trades between refineries, traders, and end consumers.',
          website: 'https://medoilbrokers.it',
          email: 'deals@medoilbrokers.it',
          phone: '+39 02 1234 5678',
          verified: false,
          created_at: '2024-02-28T16:30:00Z'
        },
        {
          id: '6',
          name: 'Pacific Logistics Hub',
          company_type: 'logistics',
          country: 'Japan',
          city: 'Tokyo',
          description: 'Comprehensive logistics services for petroleum products including storage, transportation, and distribution.',
          website: 'https://pacificlogistics.jp',
          email: 'services@pacificlogistics.jp',
          phone: '+81 3 1234 5678',
          verified: true,
          created_at: '2024-04-05T08:20:00Z'
        },
        {
          id: '7',
          name: 'Americas Crude Trading',
          company_type: 'trader',
          country: 'United States',
          city: 'Houston',
          description: 'Major player in Western Hemisphere crude oil trading with extensive pipeline and storage infrastructure.',
          website: 'https://americascrude.com',
          email: 'trading@americascrude.com',
          phone: '+1 713 123 4567',
          verified: true,
          created_at: '2024-01-08T12:00:00Z'
        },
        {
          id: '8',
          name: 'Baltic Marine Services',
          company_type: 'shipping',
          country: 'Denmark',
          city: 'Copenhagen',
          description: 'Specialized tanker fleet serving Northern European ports with eco-friendly shipping solutions.',
          website: 'https://balticmarine.dk',
          email: 'fleet@balticmarine.dk',
          phone: '+45 3312 3456',
          verified: false,
          created_at: '2024-03-22T15:45:00Z'
        }
      ];
      setCompanies(mockCompanies);
      setLoading(false);
    }, 600);
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || company.company_type === selectedType;
    return matchesSearch && matchesType;
  });

  const companyTypes = [...new Set(companies.map(c => c.company_type))];

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'trader': return 'bg-blue-500';
      case 'broker': return 'bg-gold';
      case 'refinery': return 'bg-green-500';
      case 'shipping': return 'bg-primary';
      case 'logistics': return 'bg-purple-500';
      default: return 'bg-gray-500';
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
            <Users className="h-5 w-5 text-primary" />
            Company Network
          </CardTitle>
          <CardDescription>
            Connect with verified trading companies and maritime service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, country, or city..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('all')}
              >
                All Types
              </Button>
              {companyTypes.map(type => (
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

          {/* Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No companies found matching your criteria
              </div>
            ) : (
              filteredCompanies.map((company) => (
                <Card key={company.id} className="trading-card hover:shadow-elegant transition-smooth">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <div className="font-semibold truncate">{company.name}</div>
                      </div>
                      {company.verified && (
                        <Badge variant="default" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getTypeColor(company.company_type)}`} />
                      <Badge variant="outline" className="text-xs">
                        {company.company_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{company.city}, {company.country}</span>
                    </div>
                    
                    {company.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {company.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {company.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                      
                      {company.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={`mailto:${company.email}`}
                            className="text-primary hover:underline truncate"
                          >
                            {company.email}
                          </a>
                        </div>
                      )}
                      
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={`tel:${company.phone}`}
                            className="text-primary hover:underline"
                          >
                            {company.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <Button className="w-full" variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Network Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {companies.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {companies.filter(c => c.verified).length}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {companies.filter(c => c.company_type === 'trader').length}
              </div>
              <div className="text-sm text-muted-foreground">Traders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {companies.filter(c => c.company_type === 'broker').length}
              </div>
              <div className="text-sm text-muted-foreground">Brokers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyNetwork;