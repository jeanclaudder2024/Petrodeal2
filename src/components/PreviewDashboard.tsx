import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Ship, 
  MapPin, 
  Factory, 
  Globe, 
  TrendingUp, 
  Shield,
  Clock,
  CreditCard,
  ArrowRight,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface PreviewData {
  vessels: any[];
  ports: any[];
  refineries: any[];
  regions: string[];
}

const PreviewDashboard = () => {
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState<PreviewData>({
    vessels: [],
    ports: [],
    refineries: [],
    regions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviewData();
  }, []);

  const fetchPreviewData = async () => {
    try {
      // Fetch limited data for preview
      const [vesselsRes, portsRes, refineriesRes] = await Promise.all([
        supabase.from('vessels').select('name, vessel_type, flag, status, current_region').limit(6),
        supabase.from('ports').select('name, country, region, type, status').limit(6),
        supabase.from('refineries').select('name, country, region, type, status, processing_capacity').limit(6)
      ]);

      const vessels = vesselsRes.data || [];
      const ports = portsRes.data || [];
      const refineries = refineriesRes.data || [];

      // Extract unique regions
      const allRegions = [
        ...vessels.map(v => v.current_region).filter(Boolean),
        ...ports.map(p => p.region).filter(Boolean),
        ...refineries.map(r => r.region).filter(Boolean)
      ];
      const uniqueRegions = [...new Set(allRegions)].slice(0, 8);

      setPreviewData({
        vessels,
        ports,
        refineries,
        regions: uniqueRegions
      });
    } catch (error) {
      console.error('Error fetching preview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Eye className="h-4 w-4 mr-2" />
            Live Preview
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Global Oil Trading Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Access real-time data on vessels, ports, refineries, and trading opportunities worldwide. 
            Start your 5-day free trial to explore the complete platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="group">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/subscription')}>
              <CreditCard className="mr-2 h-4 w-4" />
              View Pricing
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              5-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Full platform access
            </div>
          </div>
        </div>

        {/* Preview Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Global Regions */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {previewData.regions.slice(0, 8).map((region, index) => (
                  <Badge key={index} variant="outline" className="justify-center">
                    {region}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Access data from major oil trading regions worldwide
              </p>
            </CardContent>
          </Card>

          {/* Live Vessels */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Live Vessels ({previewData.vessels.length} shown)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previewData.vessels.slice(0, 4).map((vessel, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="font-medium text-sm">{vessel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {vessel.vessel_type} • {vessel.flag}
                      </p>
                    </div>
                    <Badge variant={vessel.status === 'active' ? 'default' : 'secondary'}>
                      {vessel.status || 'Unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Real-time vessel tracking and cargo information
              </p>
            </CardContent>
          </Card>

          {/* Ports Network */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Port Network ({previewData.ports.length} shown)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previewData.ports.slice(0, 4).map((port, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="font-medium text-sm">{port.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {port.country} • {port.type}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {port.region}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Comprehensive port data with capacity and services
              </p>
            </CardContent>
          </Card>

          {/* Refineries */}
          <Card className="trading-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Refineries ({previewData.refineries.length} shown)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previewData.refineries.slice(0, 4).map((refinery, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <p className="font-medium text-sm">{refinery.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {refinery.country} • {refinery.type}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {refinery.region}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Refinery capacity and processing information
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="trading-card text-center">
          <CardContent className="py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of oil trading professionals who trust our platform for real-time market data, 
              vessel tracking, and trading opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleGetStarted} className="group">
                Start Your 5-Day Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/subscription')}>
                View All Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreviewDashboard;