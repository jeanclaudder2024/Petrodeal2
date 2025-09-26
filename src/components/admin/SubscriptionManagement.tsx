import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Users, 
  Percent, 
  Edit3, 
  Trash2, 
  Plus, 
  TrendingUp,
  DollarSign,
  Calendar,
  Search,
  Filter,
  BarChart3
} from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  email: string;
  user_id: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  vessel_limit: number;
  port_limit: number;
  regions_limit: number;
  refinery_limit: number;
  support_level: string;
  user_seats: number;
  api_access: boolean;
  real_time_analytics: boolean;
  created_at: string;
  updated_at: string;
}

interface Discount {
  id: string;
  plan_tier: string;
  discount_percentage: number;
  discount_name: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_tier: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  vessel_limit: number;
  port_limit: number;
  regions_limit: number;
  refinery_limit: number;
  document_access: string[];
  support_level: string;
  user_seats: number;
  api_access: boolean;
  real_time_analytics: boolean;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const SubscriptionManagement = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // New discount form state
  const [newDiscount, setNewDiscount] = useState({
    plan_tier: '',
    discount_percentage: 0,
    discount_name: '',
    valid_until: ''
  });

  // New plan form state
  const [newPlan, setNewPlan] = useState({
    plan_name: '',
    plan_tier: '',
    description: '',
    monthly_price: 0,
    annual_price: 0,
    vessel_limit: 10,
    port_limit: 20,
    regions_limit: 1,
    refinery_limit: 5,
    document_access: ['basic'],
    support_level: 'email',
    user_seats: 1,
    api_access: false,
    real_time_analytics: false,
    features: [''],
    is_popular: false,
    sort_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscribers
      const { data: subsData, error: subsError } = await db
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscribers(subsData || []);

      // Fetch discounts
      const { data: discountData, error: discountError } = await db
        .from('subscription_discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (discountError) throw discountError;
      setDiscounts(discountData || []);

      // Fetch plans
      const { data: plansData, error: plansError } = await db
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscriber) return;

    try {
      const { error } = await db
        .from('subscribers')
        .update({
          subscription_tier: editingSubscriber.subscription_tier,
          vessel_limit: editingSubscriber.vessel_limit,
          port_limit: editingSubscriber.port_limit,
          regions_limit: editingSubscriber.regions_limit,
          refinery_limit: editingSubscriber.refinery_limit,
          support_level: editingSubscriber.support_level,
          user_seats: editingSubscriber.user_seats,
          api_access: editingSubscriber.api_access,
          real_time_analytics: editingSubscriber.real_time_analytics
        })
        .eq('id', editingSubscriber.id);

      if (error) throw error;

      toast.success('Subscription updated successfully');
      setIsEditDialogOpen(false);
      setEditingSubscriber(null);
      fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const handleCreateDiscount = async () => {
    try {
      const { error } = await db
        .from('subscription_discounts')
        .insert({
          plan_tier: newDiscount.plan_tier,
          discount_percentage: newDiscount.discount_percentage,
          discount_name: newDiscount.discount_name || null,
          valid_until: newDiscount.valid_until || null
        });

      if (error) throw error;

      toast.success('Discount created successfully');
      setIsDiscountDialogOpen(false);
      setNewDiscount({
        plan_tier: '',
        discount_percentage: 0,
        discount_name: '',
        valid_until: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating discount:', error);
      toast.error('Failed to create discount');
    }
  };

  const handleToggleDiscount = async (discountId: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from('subscription_discounts')
        .update({ is_active: !isActive })
        .eq('id', discountId);

      if (error) throw error;

      toast.success(`Discount ${!isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling discount:', error);
      toast.error('Failed to update discount');
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    try {
      const { error } = await db
        .from('subscription_discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;

      toast.success('Discount deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  const handleCreatePlan = async () => {
    try {
      const { error } = await db
        .from('subscription_plans')
        .insert({
          ...newPlan,
          features: newPlan.features.filter(f => f.trim() !== '')
        });

      if (error) throw error;

      toast.success('Plan created successfully');
      setIsPlanDialogOpen(false);
      setNewPlan({
        plan_name: '',
        plan_tier: '',
        description: '',
        monthly_price: 0,
        annual_price: 0,
        vessel_limit: 10,
        port_limit: 20,
        regions_limit: 1,
        refinery_limit: 5,
        document_access: ['basic'],
        support_level: 'email',
        user_seats: 1,
        api_access: false,
        real_time_analytics: false,
        features: [''],
        is_popular: false,
        sort_order: 0
      });
      fetchData();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await db
        .from('subscription_plans')
        .update({
          plan_name: editingPlan.plan_name,
          description: editingPlan.description,
          monthly_price: editingPlan.monthly_price,
          annual_price: editingPlan.annual_price,
          vessel_limit: editingPlan.vessel_limit,
          port_limit: editingPlan.port_limit,
          regions_limit: editingPlan.regions_limit,
          refinery_limit: editingPlan.refinery_limit,
          document_access: editingPlan.document_access,
          support_level: editingPlan.support_level,
          user_seats: editingPlan.user_seats,
          api_access: editingPlan.api_access,
          real_time_analytics: editingPlan.real_time_analytics,
          features: editingPlan.features.filter(f => f.trim() !== ''),
          is_active: editingPlan.is_active,
          is_popular: editingPlan.is_popular,
          sort_order: editingPlan.sort_order
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast.success('Plan updated successfully');
      setIsPlanDialogOpen(false);
      setEditingPlan(null);
      fetchData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await db
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast.success('Plan deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || sub.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.subscribed).length,
    basic: subscribers.filter(s => s.subscription_tier === 'basic').length,
    professional: subscribers.filter(s => s.subscription_tier === 'professional').length,
    enterprise: subscribers.filter(s => s.subscription_tier === 'enterprise').length,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading subscription data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Subs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Basic</p>
                <p className="text-2xl font-bold text-blue-600">{stats.basic}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Professional</p>
                <p className="text-2xl font-bold text-purple-600">{stats.professional}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Enterprise</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.enterprise}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers List */}
          <Card>
            <CardHeader>
              <CardTitle>User Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Email</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Tier</th>
                      <th className="text-left py-2">Limits</th>
                      <th className="text-left py-2">Features</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b">
                        <td className="py-3">{subscriber.email}</td>
                        <td className="py-3">
                          <Badge variant={subscriber.subscribed ? "default" : "secondary"}>
                            {subscriber.subscribed ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">
                            {subscriber.subscription_tier?.toUpperCase() || 'FREE'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            <div>Vessels: {subscriber.vessel_limit}</div>
                            <div>Ports: {subscriber.port_limit}</div>
                            <div>Regions: {subscriber.regions_limit}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            <div>API: {subscriber.api_access ? '✓' : '✗'}</div>
                            <div>Analytics: {subscriber.real_time_analytics ? '✓' : '✗'}</div>
                            <div>Seats: {subscriber.user_seats}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSubscriber(subscriber);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          {/* Create Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Plans</CardTitle>
                <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Plan Name</Label>
                        <Input
                          value={editingPlan ? editingPlan.plan_name : newPlan.plan_name}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, plan_name: e.target.value})
                            : setNewPlan({...newPlan, plan_name: e.target.value})
                          }
                          placeholder="e.g., Starter Plan"
                        />
                      </div>

                      <div>
                        <Label>Plan Tier</Label>
                        <Input
                          value={editingPlan ? editingPlan.plan_tier : newPlan.plan_tier}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, plan_tier: e.target.value})
                            : setNewPlan({...newPlan, plan_tier: e.target.value})
                          }
                          placeholder="e.g., starter"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editingPlan ? editingPlan.description : newPlan.description}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, description: e.target.value})
                            : setNewPlan({...newPlan, description: e.target.value})
                          }
                          placeholder="Plan description..."
                        />
                      </div>

                      <div>
                        <Label>Monthly Price ($)</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.monthly_price : newPlan.monthly_price}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, monthly_price: parseFloat(e.target.value) || 0})
                            : setNewPlan({...newPlan, monthly_price: parseFloat(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>Annual Price ($)</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.annual_price : newPlan.annual_price}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, annual_price: parseFloat(e.target.value) || 0})
                            : setNewPlan({...newPlan, annual_price: parseFloat(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>Vessel Limit</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.vessel_limit : newPlan.vessel_limit}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, vessel_limit: parseInt(e.target.value) || 0})
                            : setNewPlan({...newPlan, vessel_limit: parseInt(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>Port Limit</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.port_limit : newPlan.port_limit}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, port_limit: parseInt(e.target.value) || 0})
                            : setNewPlan({...newPlan, port_limit: parseInt(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>Regions Limit</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.regions_limit : newPlan.regions_limit}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, regions_limit: parseInt(e.target.value) || 0})
                            : setNewPlan({...newPlan, regions_limit: parseInt(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>Refinery Limit</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.refinery_limit : newPlan.refinery_limit}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, refinery_limit: parseInt(e.target.value) || 0})
                            : setNewPlan({...newPlan, refinery_limit: parseInt(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>User Seats</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.user_seats : newPlan.user_seats}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, user_seats: parseInt(e.target.value) || 0})
                            : setNewPlan({...newPlan, user_seats: parseInt(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div>
                        <Label>Support Level</Label>
                        <Select
                          value={editingPlan ? editingPlan.support_level : newPlan.support_level}
                          onValueChange={(value) => editingPlan 
                            ? setEditingPlan({...editingPlan, support_level: value})
                            : setNewPlan({...newPlan, support_level: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                            <SelectItem value="dedicated">Dedicated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Sort Order</Label>
                        <Input
                          type="number"
                          value={editingPlan ? editingPlan.sort_order : newPlan.sort_order}
                          onChange={(e) => editingPlan 
                            ? setEditingPlan({...editingPlan, sort_order: parseInt(e.target.value) || 0})
                            : setNewPlan({...newPlan, sort_order: parseInt(e.target.value) || 0})
                          }
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Features (one per line)</Label>
                        <Textarea
                          value={editingPlan ? editingPlan.features.join('\n') : newPlan.features.join('\n')}
                          onChange={(e) => {
                            const features = e.target.value.split('\n').filter(f => f.trim() !== '');
                            editingPlan 
                              ? setEditingPlan({...editingPlan, features})
                              : setNewPlan({...newPlan, features});
                          }}
                          placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                          rows={4}
                        />
                      </div>

                      <div className="col-span-2 space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="api_access_plan"
                            checked={editingPlan ? editingPlan.api_access : newPlan.api_access}
                            onChange={(e) => editingPlan 
                              ? setEditingPlan({...editingPlan, api_access: e.target.checked})
                              : setNewPlan({...newPlan, api_access: e.target.checked})
                            }
                          />
                          <Label htmlFor="api_access_plan">API Access</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="real_time_analytics_plan"
                            checked={editingPlan ? editingPlan.real_time_analytics : newPlan.real_time_analytics}
                            onChange={(e) => editingPlan 
                              ? setEditingPlan({...editingPlan, real_time_analytics: e.target.checked})
                              : setNewPlan({...newPlan, real_time_analytics: e.target.checked})
                            }
                          />
                          <Label htmlFor="real_time_analytics_plan">Real-time Analytics</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_popular"
                            checked={editingPlan ? editingPlan.is_popular : newPlan.is_popular}
                            onChange={(e) => editingPlan 
                              ? setEditingPlan({...editingPlan, is_popular: e.target.checked})
                              : setNewPlan({...newPlan, is_popular: e.target.checked})
                            }
                          />
                          <Label htmlFor="is_popular">Mark as Popular</Label>
                        </div>

                        {editingPlan && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="is_active_plan"
                              checked={editingPlan.is_active}
                              onChange={(e) => setEditingPlan({...editingPlan, is_active: e.target.checked})}
                            />
                            <Label htmlFor="is_active_plan">Plan Active</Label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button 
                        onClick={editingPlan ? handleUpdatePlan : handleCreatePlan} 
                        className="flex-1"
                      >
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsPlanDialogOpen(false);
                        setEditingPlan(null);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Plan Name</th>
                      <th className="text-left py-2">Tier</th>
                      <th className="text-left py-2">Pricing</th>
                      <th className="text-left py-2">Limits</th>
                      <th className="text-left py-2">Features</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {plan.is_popular && <Crown className="h-4 w-4 text-yellow-500" />}
                            <span className="font-medium">{plan.plan_name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">{plan.plan_tier.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            <div>${plan.monthly_price}/mo</div>
                            <div>${plan.annual_price}/yr</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            <div>Vessels: {plan.vessel_limit}</div>
                            <div>Ports: {plan.port_limit}</div>
                            <div>Regions: {plan.regions_limit}</div>
                            <div>Seats: {plan.user_seats}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-xs space-y-1">
                            <div>API: {plan.api_access ? '✓' : '✗'}</div>
                            <div>Analytics: {plan.real_time_analytics ? '✓' : '✗'}</div>
                            <div>Support: {plan.support_level}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            <Badge variant={plan.is_active ? "default" : "secondary"}>
                              {plan.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {plan.is_popular && (
                              <Badge variant="outline" className="text-xs">Popular</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPlan(plan);
                                setIsPlanDialogOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlan(plan.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          {/* Create Discount */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan Discounts</CardTitle>
                <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Discount
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Discount</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Plan Tier</Label>
                        <Select 
                          value={newDiscount.plan_tier} 
                          onValueChange={(value) => setNewDiscount({...newDiscount, plan_tier: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic Plan</SelectItem>
                            <SelectItem value="professional">Professional Plan</SelectItem>
                            <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Discount Percentage</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={newDiscount.discount_percentage}
                          onChange={(e) => setNewDiscount({...newDiscount, discount_percentage: parseInt(e.target.value) || 0})}
                          placeholder="e.g., 20"
                        />
                      </div>

                      <div>
                        <Label>Discount Name (Optional)</Label>
                        <Input
                          value={newDiscount.discount_name}
                          onChange={(e) => setNewDiscount({...newDiscount, discount_name: e.target.value})}
                          placeholder="e.g., Holiday Sale"
                        />
                      </div>

                      <div>
                        <Label>Valid Until (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={newDiscount.valid_until}
                          onChange={(e) => setNewDiscount({...newDiscount, valid_until: e.target.value})}
                        />
                      </div>

                      <Button onClick={handleCreateDiscount} className="w-full">
                        Create Discount
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Plan</th>
                      <th className="text-left py-2">Discount</th>
                      <th className="text-left py-2">Name</th>
                      <th className="text-left py-2">Valid Until</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map((discount) => (
                      <tr key={discount.id} className="border-b">
                        <td className="py-3">
                          <Badge variant="outline">
                            {discount.plan_tier.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            {discount.discount_percentage}%
                          </div>
                        </td>
                        <td className="py-3">
                          {discount.discount_name || '-'}
                        </td>
                        <td className="py-3">
                          {discount.valid_until 
                            ? new Date(discount.valid_until).toLocaleDateString()
                            : 'No expiry'
                          }
                        </td>
                        <td className="py-3">
                          <Badge variant={discount.is_active ? "default" : "secondary"}>
                            {discount.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleDiscount(discount.id, discount.is_active)}
                            >
                              {discount.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDiscount(discount.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Subscription Dialog */}
      {editingSubscriber && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Subscription: {editingSubscriber.email}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subscription Tier</Label>
                <Select
                  value={editingSubscriber.subscription_tier || ''}
                  onValueChange={(value) => setEditingSubscriber({...editingSubscriber, subscription_tier: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Support Level</Label>
                <Select
                  value={editingSubscriber.support_level}
                  onValueChange={(value) => setEditingSubscriber({...editingSubscriber, support_level: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dedicated">Dedicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Vessel Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.vessel_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, vessel_limit: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label>Port Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.port_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, port_limit: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label>Regions Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.regions_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, regions_limit: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label>Refinery Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.refinery_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, refinery_limit: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <Label>User Seats</Label>
                <Input
                  type="number"
                  value={editingSubscriber.user_seats}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, user_seats: parseInt(e.target.value)})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="api_access"
                  checked={editingSubscriber.api_access}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, api_access: e.target.checked})}
                />
                <Label htmlFor="api_access">API Access</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="real_time_analytics"
                  checked={editingSubscriber.real_time_analytics}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, real_time_analytics: e.target.checked})}
                />
                <Label htmlFor="real_time_analytics">Real-time Analytics</Label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={handleUpdateSubscription} className="flex-1">
                Update Subscription
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SubscriptionManagement;