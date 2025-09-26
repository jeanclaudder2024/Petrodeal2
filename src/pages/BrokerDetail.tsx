import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Users, 
  MapPin, 
  Star, 
  TrendingUp,
  Phone,
  Mail,
  Building,
  Award,
  Calendar,
  DollarSign,
  Target,
  Globe
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
  created_at: string;
}

const BrokerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBrokerDetails();
    }
  }, [id]);

  const fetchBrokerDetails = async () => {
    try {
      const { data, error } = await db
        .from('brokers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching broker:', error);
      } else {
        setBroker(data);
      }
    } catch (error) {
      console.error('Failed to fetch broker:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (!broker) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Broker Not Found</h1>
          <Button onClick={() => navigate('/brokers')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brokers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/brokers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Brokers
        </Button>
        
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {broker.company_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                {broker.company_name}
              </h1>
              {broker.verified && (
                <Badge variant="default" className="bg-green-500">
                  <Award className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-xl text-muted-foreground mb-4">{broker.contact_person}</p>
            
            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(broker.rating || 0)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{broker.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-muted-foreground">({broker.total_deals || 0} deals)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{broker.experience_years || 0} years experience</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {broker.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">{broker.email}</p>
                  </div>
                </div>
              )}
              
              {broker.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-muted-foreground">{broker.phone}</p>
                  </div>
                </div>
              )}
              
              {broker.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">{broker.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specializations */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Specializations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {broker.specialization && broker.specialization.length > 0 ? (
                  broker.specialization.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No specializations listed</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Regions */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Operating Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {broker.regions && broker.regions.length > 0 ? (
                  broker.regions.map((region, index) => (
                    <Badge key={index} variant="outline">
                      {region}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No regions specified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {broker.certification && broker.certification.length > 0 ? (
                  broker.certification.map((cert, index) => (
                    <Badge key={index} variant="default">
                      {cert}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No certifications listed</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Commission Rate</span>
                <span className="font-semibold">{broker.commission_rate || 0}%</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Deals</span>
                <span className="font-semibold">{broker.total_deals || 0}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Volume</span>
                <span className="font-semibold">
                  {(broker.total_volume || 0).toLocaleString()} bbl
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Experience</span>
                <span className="font-semibold">{broker.experience_years || 0} years</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="font-semibold">
                  {new Date(broker.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full hero-button">
                <Mail className="h-4 w-4 mr-2" />
                Contact Broker
              </Button>
              
              <Button variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
              
              <Button variant="outline" className="w-full">
                <Building className="h-4 w-4 mr-2" />
                View Company Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrokerDetail;