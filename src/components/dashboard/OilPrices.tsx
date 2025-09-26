import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
  created_at: string;
  updated_at: string;
}

const OilPrices = () => {
  const [prices, setPrices] = useState<OilPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchOilPrices = async () => {
    try {
      const { data, error } = await db.from('oil_prices').select('*').order('current_price', { ascending: false });
      
      if (error) {
        console.error('Error fetching oil prices:', error);
        toast({
          title: "Error",
          description: "Failed to load oil prices",
          variant: "destructive"
        });
        return;
      }

      setPrices(data || []);
      
    } catch (error) {
      console.error('Error fetching oil prices:', error);
      toast({
        title: "Error", 
        description: "Failed to load oil prices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerPriceUpdate = async () => {
    setRefreshing(true);
    try {
      console.log('Triggering oil price update...');
      const { data, error } = await supabase.functions.invoke('fetch-oil-prices');
      
      if (error) {
        console.error('Error updating oil prices:', error);
        toast({
          title: "Update Error",
          description: "Failed to update oil prices from API. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log('Oil price update response:', data);
        toast({
          title: "Prices Updated",
          description: `Successfully updated ${data?.updated_count || 0} oil prices from external API`,
        });
        // Refresh local data after update
        await fetchOilPrices();
      }
    } catch (error) {
      console.error('Error triggering price update:', error);
      toast({
        title: "Update Error",
        description: "Failed to trigger price update. Check your internet connection.",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOilPrices();
  }, []);

  const getPriceChangeIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getPriceChangeColor = (change?: number) => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffMinutes / 1440)} days ago`;
    }
  };

  // Prepare chart data
  const chartData = prices.map(price => ({
    name: price.oil_type.replace(' Oil', '').replace(' Crude', ''),
    price: price.current_price,
    change: price.price_change || 0,
    changePercent: price.price_change_percent || 0,
    positiveChange: (price.price_change_percent || 0) > 0 ? price.price_change_percent : 0,
    negativeChange: (price.price_change_percent || 0) < 0 ? price.price_change_percent : 0
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const majorOils = ['Brent Crude Oil', 'WTI Crude Oil', 'Natural Gas'];
  const otherOils = prices.filter(p => !majorOils.includes(p.oil_type));

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Last updated: {prices.length > 0 ? formatLastUpdated(prices[0].last_updated) : 'Never'}
          </Badge>
        </div>
        <Button 
          onClick={triggerPriceUpdate}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating...' : 'Update Prices'}
        </Button>
      </div>

      {/* Major Oil Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {majorOils.map(oilType => {
          const priceData = prices.find(p => p.oil_type === oilType);
          return (
            <Card key={oilType} className="trading-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{oilType}</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                {priceData ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatPrice(priceData.current_price, priceData.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      per {priceData.unit}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriceChangeIcon(priceData.price_change)}
                      <span className={`text-sm ${getPriceChangeColor(priceData.price_change)}`}>
                        {priceData.price_change ? 
                          `${priceData.price_change > 0 ? '+' : ''}${priceData.price_change.toFixed(2)} (${priceData.price_change_percent?.toFixed(2)}%)` : 
                          'No change data'
                        }
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {priceData.exchange} • {priceData.symbol}
                    </p>
                  </>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Price Chart */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Current Prices</CardTitle>
              <CardDescription>
                Real-time oil and energy commodity prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                    labelFormatter={(label) => `Oil Type: ${label}`}
                  />
                  <Bar dataKey="price" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader>
              <CardTitle>Price Changes</CardTitle>
              <CardDescription>
                24-hour price change percentages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'Change']}
                    labelFormatter={(label) => `Oil Type: ${label}`}
                  />
                  <Bar dataKey="positiveChange" fill="#10b981" />
                  <Bar dataKey="negativeChange" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Oil Prices Table */}
      {otherOils.length > 0 && (
        <Card className="trading-card">
          <CardHeader>
            <CardTitle>All Commodities</CardTitle>
            <CardDescription>
              Complete list of tracked oil and energy prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Commodity</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">Change</th>
                    <th className="text-right p-2">Change %</th>
                    <th className="text-left p-2">Exchange</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((price) => (
                    <tr key={price.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{price.oil_type}</td>
                      <td className="text-right p-2">
                        {formatPrice(price.current_price, price.currency)}
                      </td>
                      <td className={`text-right p-2 ${getPriceChangeColor(price.price_change)}`}>
                        {price.price_change ? 
                          `${price.price_change > 0 ? '+' : ''}${price.price_change.toFixed(2)}` : 
                          '-'
                        }
                      </td>
                      <td className={`text-right p-2 ${getPriceChangeColor(price.price_change_percent)}`}>
                        {price.price_change_percent ? 
                          `${price.price_change_percent > 0 ? '+' : ''}${price.price_change_percent.toFixed(2)}%` : 
                          '-'
                        }
                      </td>
                      <td className="p-2 text-muted-foreground">{price.exchange || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Summary */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Market Summary</CardTitle>
          <CardDescription>
            Oil market overview with real-time price feeds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {prices.length}
              </div>
              <div className="text-sm text-muted-foreground">Price Feeds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {prices.filter(p => (p.price_change || 0) > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Gaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {prices.filter(p => (p.price_change || 0) < 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Declining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {prices.filter(p => (p.price_change || 0) === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Unchanged</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OilPrices;