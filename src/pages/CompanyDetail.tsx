import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, MapPin, Globe, Mail, Phone, Calendar, Users, DollarSign, Ship, Eye, Lock, Crown, Briefcase } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Company {
  id: number;
  name: string;
  company_type: 'real' | 'fake';
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
  logo_url?: string;
  owner_name?: string;
  ceo_name?: string;
  headquarters_address?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vessel {
  id: number;
  name: string;
  vessel_type?: string;
  flag?: string;
  imo?: string;
  mmsi?: string;
  status?: string;
  current_region?: string;
  cargo_type?: string;
  deadweight?: number;
  length?: number;
  built?: number;
}

const CompanyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [vesselsLoading, setVesselsLoading] = useState(true);
  const [brokerMembership, setBrokerMembership] = useState<any>(null);
  const [partnershipRequestLoading, setPartnershipRequestLoading] = useState(false);
  const [partnershipMessage, setPartnershipMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCompany(parseInt(id));
      fetchCompanyVessels(parseInt(id));
    }
    if (user) {
      checkBrokerMembership();
    }
  }, [id, user]);

  const checkBrokerMembership = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await db
        .from('broker_memberships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setBrokerMembership(data);
      }
    } catch (error) {
      console.error('Failed to check broker membership:', error);
    }
  };

  const handlePartnershipRequest = async () => {
    if (!user || !company) return;
    
    setPartnershipRequestLoading(true);
    try {
      const { error } = await db
        .from('company_partnership_requests')
        .insert({
          requester_id: user.id,
          company_id: company.id,
          message: partnershipMessage,
          status: 'pending'
        });

      if (error) {
        if (error.message.includes('duplicate key')) {
          toast({
            title: "Request Already Exists",
            description: "You have already sent a partnership request to this company.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Partnership Request Sent",
          description: "Your partnership request has been submitted successfully.",
        });
        setPartnershipMessage('');
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to send partnership request:', error);
      toast({
        title: "Error",
        description: "Failed to send partnership request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPartnershipRequestLoading(false);
    }
  };

  const hasBrokerMembership = brokerMembership && 
    brokerMembership.membership_status === 'active' && 
    brokerMembership.payment_status === 'completed';

  const fetchCompany = async (companyId: number) => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();

      if (error) throw error;
      setCompany(data);
    } catch (error) {
      console.error('Failed to fetch company:', error);
      toast({
        title: "Error",
        description: "Failed to load company details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyVessels = async (companyId: number) => {
    setVesselsLoading(true);
    try {
      const { data, error } = await db
        .from('vessels')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setVessels(data || []);
    } catch (error) {
      console.error('Failed to fetch company vessels:', error);
      toast({
        title: "Error",
        description: "Failed to load company vessels",
        variant: "destructive"
      });
    } finally {
      setVesselsLoading(false);
    }
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

  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Company not found</h3>
          <p className="text-muted-foreground mb-4">
            The company you're looking for doesn't exist or may have been removed.
          </p>
          <Link to="/companies">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Companies
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/companies">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {company.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              {company.industry || 'Oil & Gas Company'}
            </p>
          </div>
          <div className="flex gap-2">
            {company.is_verified && (
              <Badge variant="outline" className="text-green-600">
                Verified Company
              </Badge>
            )}
            <Badge variant="outline">Active</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2">
          <Card className="trading-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                {company.logo_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={company.logo_url}
                      alt={`${company.name} logo`}
                      className="w-16 h-16 object-contain rounded-lg border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  {company.description ? (
                    <p className="text-muted-foreground leading-relaxed">
                      {company.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No description available for this company.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-semibold">{company.industry || 'Oil & Gas'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Company Type</p>
                  <p className="font-semibold capitalize">{company.company_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Founded</p>
                  <p className="font-semibold">{company.founded_year || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={company.is_verified ? 'default' : 'secondary'}>
                      {company.is_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leadership Information */}
          {(company.owner_name || company.ceo_name) && (
            <Card className="trading-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Leadership Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {company.owner_name && (
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Owner</div>
                        <div className="font-semibold">{company.owner_name}</div>
                      </div>
                    </div>
                  )}
                  {company.ceo_name && (
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Crown className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">CEO</div>
                        <div className="font-semibold">{company.ceo_name}</div>
                      </div>
                    </div>
                  )}
                </div>
                {company.headquarters_address && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div className="text-sm font-medium">Headquarters</div>
                        <div className="text-sm text-muted-foreground">
                          {company.headquarters_address}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Company Statistics */}
          <Card className="trading-card mb-6">
            <CardHeader>
              <CardTitle>Company Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {company.founded_year && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {company.founded_year}
                    </div>
                    <div className="text-sm text-muted-foreground">Founded</div>
                  </div>
                )}
                {company.employees_count && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {company.employees_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Employees</div>
                  </div>
                )}
                {company.annual_revenue && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      ${(company.annual_revenue / 1000000).toFixed(0)}M
                    </div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {vessels.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Fleet Size</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Fleet */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-primary" />
                Company Fleet ({vessels.length} vessels)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vesselsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : vessels.length === 0 ? (
                <div className="text-center py-8">
                  <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No vessels found for this company.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vessels.map((vessel) => (
                    <div
                      key={vessel.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{vessel.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            {vessel.vessel_type} • {vessel.flag}
                          </div>
                        </div>
                        <Link to={`/vessels/${vessel.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {vessel.imo && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">IMO:</span>
                            <span>{vessel.imo}</span>
                          </div>
                        )}
                        {vessel.deadweight && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">DWT:</span>
                            <span>{vessel.deadweight.toLocaleString()} MT</span>
                          </div>
                        )}
                        {vessel.built && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Built:</span>
                            <span>{vessel.built}</span>
                          </div>
                        )}
                        {vessel.status && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline" className="text-xs">
                              {vessel.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Location</div>
                  <div className="text-sm text-muted-foreground">
                    {company.city && company.country
                      ? `${company.city}, ${company.country}`
                      : company.country || 'Global Operations'
                    }
                  </div>
                  {company.address && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {company.address}
                    </div>
                  )}
                </div>
              </div>

              {company.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <a
                      href={`mailto:${company.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {company.email}
                    </a>
                  </div>
                </div>
              )}

              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Phone</div>
                    <a
                      href={`tel:${company.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                </div>
              )}

              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Website</div>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="trading-card">
            <CardContent className="p-6">
              <div className="space-y-3">
                {/* Connect Button */}
                {hasBrokerMembership ? (
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Connection Initiated",
                        description: "Your connection request has been sent to the company.",
                      });
                    }}
                  >
                    Connect with Company
                  </Button>
                ) : (
                  <div className="relative">
                    <Button 
                      className="w-full"
                      disabled
                      variant="outline"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Connect with Company
                    </Button>
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      Broker membership required
                    </div>
                  </div>
                )}

                {/* Partnership Request Button */}
                {hasBrokerMembership ? (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Request Partnership
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Request Partnership</DialogTitle>
                        <DialogDescription>
                          Send a partnership request to {company.name}. Include a message explaining your business proposition.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Message</label>
                          <Textarea
                            placeholder="Explain your partnership proposal and how it would benefit both companies..."
                            value={partnershipMessage}
                            onChange={(e) => setPartnershipMessage(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                          disabled={partnershipRequestLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePartnershipRequest}
                          disabled={partnershipRequestLoading || !partnershipMessage.trim()}
                        >
                          {partnershipRequestLoading ? "Sending..." : "Send Request"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="relative">
                    <Button variant="outline" className="w-full" disabled>
                      <Lock className="mr-2 h-4 w-4" />
                      Request Partnership
                    </Button>
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      Broker membership required
                    </div>
                  </div>
                )}

                {/* Membership Status Info */}
                {!hasBrokerMembership && user && (
                  <div className="p-3 bg-muted/50 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                          Broker Membership Required
                        </div>
                        <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                          Upgrade to broker membership to connect and partner with companies.
                        </div>
                        <Link to="/broker-membership" className="inline-block mt-2">
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            Upgrade Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visit Website Button */}
                {company.website && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;