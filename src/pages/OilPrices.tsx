import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  RefreshCw, 
  Clock,
  Activity,
  Globe,
  Fuel,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { db, supabase } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';

interface OilPriceData {
  id: string;
  oil_type: string;
  symbol: string;
  current_price: number;
  previous_price?: number;
  price_change?: number;
  price_change_percent?: number;
  currency: string;
  unit: string;
  exchange?: string;
  last_updated: string;
}

const OilPrices = () => {
  const [prices, setPrices] = useState<OilPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchOilPrices = async () => {
    try {
      const { data, error } = await db.from('oil_prices').select('*').order('current_price', { ascending: false });
      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error('Error fetching oil prices:', error);
      toast({ title: "Error", description: "Failed to load oil prices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const triggerPriceUpdate = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-oil-prices');
      if (error) throw error;
      toast({ title: "Prices Updated", description: `Updated ${data?.updated_count || 0} oil prices` });
      await fetchOilPrices();
    } catch (error) {
      console.error('Error updating oil prices:', error);
      toast({ title: "Update Error", description: "Failed to update prices", variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOilPrices();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getPriceIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return change > 0 ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const chartData = prices.map(price => ({
    name: price.oil_type.replace(' Oil', '').replace(' Crude', '').slice(0, 12),
    price: price.current_price,
    change: price.price_change_percent || 0,
  }));

  const majorOils = ['Brent Crude Oil', 'WTI Crude Oil', 'Natural Gas'];
  const majorPrices = prices.filter(p => majorOils.includes(p.oil_type));
  const otherPrices = prices.filter(p => !majorOils.includes(p.oil_type));

  const gainers = prices.filter(p => (p.price_change_percent || 0) > 0).length;
  const losers = prices.filter(p => (p.price_change_percent || 0) < 0).length;
  const unchanged = prices.filter(p => (p.price_change_percent || 0) === 0).length;

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Fuel className="h-7 w-7 text-primary" />
            Oil & Energy Prices
          </h1>
          <p className="text-muted-foreground mt-1">Real-time commodity prices and market analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {prices.length > 0 ? formatLastUpdated(prices[0].last_updated) : 'Never'}
          </Badge>
          <Button onClick={triggerPriceUpdate} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Market Summary Bar */}
      <Card className="bg-gradient-to-r from-green-500/10 via-background to-red-500/10">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <div className="text-center">
              <div className="text-2xl font-bold">{prices.length}</div>
              <div className="text-xs text-muted-foreground">Commodities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{gainers}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Gaining
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{losers}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> Declining
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{unchanged}</div>
              <div className="text-xs text-muted-foreground">Unchanged</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Major Prices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {majorPrices.map((price) => (
          <Card key={price.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              (price.price_change_percent || 0) > 0 ? 'bg-green-500' : 
              (price.price_change_percent || 0) < 0 ? 'bg-red-500' : 'bg-muted'
            }`} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">{price.oil_type}</CardTitle>
                <Badge variant="outline" className="text-xs">{price.symbol}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">{formatPrice(price.current_price, price.currency)}</div>
                  <div className="text-xs text-muted-foreground">per {price.unit}</div>
                </div>
                <div className={`text-right ${
                  (price.price_change_percent || 0) > 0 ? 'text-green-500' : 
                  (price.price_change_percent || 0) < 0 ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  <div className="flex items-center gap-1 justify-end text-lg font-semibold">
                    {getPriceIcon(price.price_change_percent)}
                    {price.price_change_percent?.toFixed(2)}%
                  </div>
                  <div className="text-xs">
                    {price.price_change ? `${price.price_change > 0 ? '+' : ''}${price.price_change.toFixed(2)}` : '-'}
                  </div>
                </div>
              </div>
              {price.exchange && (
                <div className="mt-3 pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {price.exchange}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for Charts & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="all">All Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={60} />
                    <YAxis fontSize={11} />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="price" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">24h Price Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={11} angle={-45} textAnchor="end" height={60} />
                    <YAxis fontSize={11} />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toFixed(2)}%`, 'Change']}
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar 
                      dataKey="change" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Trends</CardTitle>
              <CardDescription>Commodity price distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Commodities</CardTitle>
              <CardDescription>Complete list of tracked oil and energy prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Commodity</th>
                      <th className="text-right p-3 font-medium">Price</th>
                      <th className="text-right p-3 font-medium">Change</th>
                      <th className="text-right p-3 font-medium hidden md:table-cell">Change %</th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">Exchange</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((price) => (
                      <tr key={price.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{price.oil_type}</div>
                              <div className="text-xs text-muted-foreground">{price.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-3 font-semibold">
                          {formatPrice(price.current_price, price.currency)}
                        </td>
                        <td className={`text-right p-3 ${
                          (price.price_change || 0) > 0 ? 'text-green-500' : 
                          (price.price_change || 0) < 0 ? 'text-red-500' : ''
                        }`}>
                          {price.price_change ? `${price.price_change > 0 ? '+' : ''}${price.price_change.toFixed(2)}` : '-'}
                        </td>
                        <td className={`text-right p-3 hidden md:table-cell ${
                          (price.price_change_percent || 0) > 0 ? 'text-green-500' : 
                          (price.price_change_percent || 0) < 0 ? 'text-red-500' : ''
                        }`}>
                          <div className="flex items-center justify-end gap-1">
                            {getPriceIcon(price.price_change_percent)}
                            {price.price_change_percent?.toFixed(2)}%
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden lg:table-cell">{price.exchange || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OilPrices;