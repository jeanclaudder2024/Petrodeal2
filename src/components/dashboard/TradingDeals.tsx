import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, Plus, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  title: string;
  oil_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_value: number;
  currency: string;
  status: string;
  deal_type: string;
  delivery_terms: string;
  delivery_location: string;
  delivery_date: string;
  buyer_id?: string;
  seller_id?: string;
  broker_id?: string;
  created_at: string;
  updated_at: string;
}

const TradingDeals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: '',
    oil_type: '',
    quantity: '',
    unit: 'barrels',
    price_per_unit: '',
    currency: 'USD',
    deal_type: 'buy',
    delivery_terms: '',
    delivery_location: '',
    delivery_date: ''
  });

  useEffect(() => {
    // Using mock data for now
    setLoading(true);
    setTimeout(() => {
      const mockDeals: Deal[] = [
        {
          id: '1',
          title: 'Brent Crude Oil Purchase',
          oil_type: 'Brent Crude',
          quantity: 50000,
          unit: 'barrels',
          price_per_unit: 84.50,
          total_value: 4225000,
          currency: 'USD',
          status: 'active',
          deal_type: 'buy',
          delivery_terms: 'FOB Rotterdam',
          delivery_location: 'Rotterdam, Netherlands',
          delivery_date: '2024-09-15',
          created_at: '2024-08-20T10:30:00Z',
          updated_at: '2024-08-24T14:20:00Z'
        },
        {
          id: '2',
          title: 'WTI Crude Sale',
          oil_type: 'WTI',
          quantity: 25000,
          unit: 'barrels',
          price_per_unit: 79.80,
          total_value: 1995000,
          currency: 'USD',
          status: 'pending',
          deal_type: 'sell',
          delivery_terms: 'CIF Singapore',
          delivery_location: 'Singapore',
          delivery_date: '2024-09-20',
          created_at: '2024-08-22T09:15:00Z',
          updated_at: '2024-08-24T11:45:00Z'
        },
        {
          id: '3',
          title: 'Dubai Crude Transaction',
          oil_type: 'Dubai Crude',
          quantity: 75000,
          unit: 'barrels',
          price_per_unit: 82.30,
          total_value: 6172500,
          currency: 'USD',
          status: 'completed',
          deal_type: 'buy',
          delivery_terms: 'DAP Dubai',
          delivery_location: 'Dubai, UAE',
          delivery_date: '2024-08-10',
          created_at: '2024-07-25T16:20:00Z',
          updated_at: '2024-08-10T18:30:00Z'
        },
        {
          id: '4',
          title: 'Heavy Crude Export',
          oil_type: 'Heavy Crude',
          quantity: 100000,
          unit: 'barrels',
          price_per_unit: 75.20,
          total_value: 7520000,
          currency: 'USD',
          status: 'active',
          deal_type: 'sell',
          delivery_terms: 'FOB Houston',
          delivery_location: 'Houston, USA',
          delivery_date: '2024-09-25',
          created_at: '2024-08-18T12:00:00Z',
          updated_at: '2024-08-24T09:30:00Z'
        }
      ];
      setDeals(mockDeals);
      setLoading(false);
    }, 800);
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(newDeal.quantity);
    const pricePerUnit = parseFloat(newDeal.price_per_unit);
    const totalValue = quantity * pricePerUnit;

    const newDealData: Deal = {
      id: Date.now().toString(),
      title: newDeal.title,
      oil_type: newDeal.oil_type,
      quantity,
      unit: newDeal.unit,
      price_per_unit: pricePerUnit,
      total_value: totalValue,
      currency: newDeal.currency,
      status: 'pending',
      deal_type: newDeal.deal_type,
      delivery_terms: newDeal.delivery_terms,
      delivery_location: newDeal.delivery_location,
      delivery_date: newDeal.delivery_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to existing deals (mock functionality)
    setDeals(prevDeals => [newDealData, ...prevDeals]);

    toast({
      title: "Success",
      description: "Deal created successfully!"
    });
    
    setIsCreateDialogOpen(false);
    setNewDeal({
      title: '',
      oil_type: '',
      quantity: '',
      unit: 'barrels',
      price_per_unit: '',
      currency: 'USD',
      deal_type: 'buy',
      delivery_terms: '',
      delivery_location: '',
      delivery_date: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'active': return <BarChart3 className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Trading Deals
              </CardTitle>
              <CardDescription>
                Manage your oil trading deals and transactions
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hero-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Trading Deal</DialogTitle>
                  <DialogDescription>
                    Enter the details for your new oil trading deal
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDeal} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Deal Title</Label>
                      <Input
                        id="title"
                        value={newDeal.title}
                        onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                        placeholder="e.g., Brent Crude Oil Purchase"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oil_type">Oil Type</Label>
                      <Select onValueChange={(value) => setNewDeal({ ...newDeal, oil_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select oil type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Brent Crude">Brent Crude</SelectItem>
                          <SelectItem value="WTI">WTI</SelectItem>
                          <SelectItem value="Dubai Crude">Dubai Crude</SelectItem>
                          <SelectItem value="Heavy Crude">Heavy Crude</SelectItem>
                          <SelectItem value="Light Crude">Light Crude</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newDeal.quantity}
                        onChange={(e) => setNewDeal({ ...newDeal, quantity: e.target.value })}
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select onValueChange={(value) => setNewDeal({ ...newDeal, unit: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barrels">Barrels</SelectItem>
                          <SelectItem value="tonnes">Tonnes</SelectItem>
                          <SelectItem value="gallons">Gallons</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deal_type">Deal Type</Label>
                      <Select onValueChange={(value) => setNewDeal({ ...newDeal, deal_type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price_per_unit">Price per Unit</Label>
                      <Input
                        id="price_per_unit"
                        type="number"
                        step="0.01"
                        value={newDeal.price_per_unit}
                        onChange={(e) => setNewDeal({ ...newDeal, price_per_unit: e.target.value })}
                        placeholder="75.50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select onValueChange={(value) => setNewDeal({ ...newDeal, currency: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_location">Delivery Location</Label>
                      <Input
                        id="delivery_location"
                        value={newDeal.delivery_location}
                        onChange={(e) => setNewDeal({ ...newDeal, delivery_location: e.target.value })}
                        placeholder="e.g., Rotterdam, Netherlands"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_date">Delivery Date</Label>
                      <Input
                        id="delivery_date"
                        type="date"
                        value={newDeal.delivery_date}
                        onChange={(e) => setNewDeal({ ...newDeal, delivery_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delivery_terms">Delivery Terms</Label>
                    <Textarea
                      id="delivery_terms"
                      value={newDeal.delivery_terms}
                      onChange={(e) => setNewDeal({ ...newDeal, delivery_terms: e.target.value })}
                      placeholder="FOB, CIF, DAP, etc. Include any special terms..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="hero-button">
                      Create Deal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Deals Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Oil Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No deals found. Create your first deal to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  deals.map((deal) => (
                    <TableRow key={deal.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(deal.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deal.deal_type === 'buy' ? 'default' : 'secondary'}>
                          {deal.deal_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{deal.oil_type}</TableCell>
                      <TableCell>
                        {deal.quantity.toLocaleString()} {deal.unit}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: deal.currency
                        }).format(deal.price_per_unit)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: deal.currency
                        }).format(deal.total_value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(deal.status)}`} />
                          {getStatusIcon(deal.status)}
                          <span className="capitalize">{deal.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {deals.filter(d => d.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {deals.filter(d => d.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {deals.filter(d => d.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact'
                }).format(deals.reduce((sum, deal) => sum + deal.total_value, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingDeals;