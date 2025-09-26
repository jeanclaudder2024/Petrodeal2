import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, MapPin, DollarSign, Search, Plus, Globe, Mail, Phone, Eye } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import company1 from '@/assets/company-1.jpg';
import company2 from '@/assets/company-2.jpg';
import company3 from '@/assets/company-3.jpg';

interface Company {
  id: number;
  name: string;
  company_type: 'real' | 'fake';
  logo_url?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  industry?: string;
  employees_count?: number;
  annual_revenue?: number;
  founded_year?: number;
  is_verified?: boolean;
  owner_name?: string;
  ceo_name?: string;
  headquarters_address?: string;
  created_at?: string;
  updated_at?: string;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('company_type', 'real')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const companyImages = [company1, company2, company3];
  
  const getCompanyImage = (index: number) => {
    return companyImages[index % companyImages.length];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Company Network
        </h1>
        <p className="text-muted-foreground mt-2">
          Explore and connect with trading companies in the oil industry
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{companies.length}</div>
                <div className="text-sm text-muted-foreground">Total Companies</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{filteredCompanies.length}</div>
                <div className="text-sm text-muted-foreground">Active Partners</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{new Set(companies.map(c => c.country).filter(Boolean)).size}</div>
                <div className="text-sm text-muted-foreground">Countries</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="trading-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gold" />
              <div>
                <div className="text-2xl font-bold">{companies.filter(c => c.is_verified).length}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Grid */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Company Network ({filteredCompanies.length} companies)</h2>
        </div>
        
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search criteria" : "No companies available yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCompanies.map((company, index) => (
              <Card
                key={company.id}
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in border-0"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${getCompanyImage(index)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '300px'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                  <div>
                    {/* Logo Section */}
                    {company.logo_url && (
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 shadow-lg">
                          <img
                            src={company.logo_url}
                            alt={`${company.name} logo`}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white group-hover:text-primary-foreground transition-colors mb-2 line-clamp-2">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-1 text-white/80 text-sm mb-2">
                          <MapPin className="h-3 w-3" />
                          {company.city && company.country ? `${company.city}, ${company.country}` : company.country || 'Global Operations'}
                        </div>
                        {company.industry && (
                          <div className="text-white/70 text-sm">
                            {company.industry}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {company.is_verified && (
                          <Badge className="bg-green-600/80 text-white border-green-500/50 text-xs">
                            Verified
                          </Badge>
                        )}
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          Active
                        </Badge>
                      </div>
                    </div>

                    {company.description && (
                      <div className="text-white/70 text-sm mb-4 line-clamp-2">
                        {company.description}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {company.founded_year && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-4 w-4 text-blue-400" />
                            <span className="text-white/70 text-xs">Founded</span>
                          </div>
                          <div className="font-semibold text-white">
                            {company.founded_year}
                          </div>
                        </div>
                      )}
                      
                      {company.employees_count && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-green-400" />
                            <span className="text-white/70 text-xs">Employees</span>
                          </div>
                          <div className="font-semibold text-white">
                            {company.employees_count.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-white/70 text-sm">
                        <Mail className="h-4 w-4 inline mr-1" />
                        {company.email ? 'Contact Available' : 'Get in Touch'}
                      </div>
                      
                      <Link to={`/companies/${company.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
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

export default Companies;