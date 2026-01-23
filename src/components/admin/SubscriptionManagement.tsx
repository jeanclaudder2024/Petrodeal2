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
import { Switch } from '@/components/ui/switch';
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
  BarChart3,
  Sparkles,
  Clock,
  Tag,
  Megaphone,
  Lock,
  Unlock,
  UserPlus,
  Briefcase
} from 'lucide-react';
import { db, supabase } from '@/lib/supabase-helper';
import { toast } from 'sonner';
import UnsubscribeRequestsManagement from './UnsubscribeRequestsManagement';
import SponsorshipManagement from './SponsorshipManagement';

interface Subscriber {
  id: string;
  email: string;
  user_id: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  subscription_status: string | null;
  is_trial_active: boolean | null;
  trial_end_date: string | null;
  unified_trial_end_date: string | null;
  stripe_customer_id: string | null;
  vessel_limit: number;
  port_limit: number;
  regions_limit: number;
  refinery_limit: number;
  support_level: string;
  user_seats: number;
  api_access: boolean;
  real_time_analytics: boolean;
  is_locked: boolean | null;
  locked_at: string | null;
  locked_reason: string | null;
  has_broker_subscription: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
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

interface PromotionFrame {
  id: string;
  title: string;
  description: string;
  eligible_plans: string[];
  billing_cycle: string;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  show_countdown: boolean;
  is_active: boolean;
  placement: string;
  show_on_home: boolean;
  show_on_subscription: boolean;
  show_on_registration: boolean;
}

interface BannerConfig {
  id: string;
  title: string;
  subtitle: string;
  start_date: string;
  end_date: string;
  show_countdown: boolean;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
}

// Tier limits configuration
const TIER_LIMITS = {
  trial: { vessel: 10, port: 20, regions: 1, refinery: 5, support: 'email', seats: 1, api: false, analytics: false },
  basic: { vessel: 50, port: 50, regions: 4, refinery: 15, support: 'email', seats: 1, api: false, analytics: false },
  professional: { vessel: 180, port: 100, regions: 6, refinery: 70, support: 'priority', seats: 5, api: false, analytics: true },
  enterprise: { vessel: 500, port: 120, regions: 7, refinery: 999, support: 'dedicated', seats: 20, api: true, analytics: true }
};

const SubscriptionManagement = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [promotionFrames, setPromotionFrames] = useState<PromotionFrame[]>([]);
  const [bannerConfigs, setBannerConfigs] = useState<BannerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<PromotionFrame | null>(null);
  const [editingBanner, setEditingBanner] = useState<BannerConfig | null>(null);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<AuthUser | null>(null);

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

  // Promotion frame form state
  const [newPromotion, setNewPromotion] = useState({
    title: 'Limited-Time Offer',
    description: '',
    eligible_plans: ['professional'],
    billing_cycle: 'both',
    discount_type: 'percentage',
    discount_value: 20,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    show_countdown: true,
    placement: 'step5',
    show_on_home: false,
    show_on_subscription: false,
    show_on_registration: false
  });

  // Banner form state
  const [newBanner, setNewBanner] = useState({
    title: 'BLACK FRIDAY SALE',
    subtitle: 'Up to 70% OFF',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    show_countdown: true,
    cta_text: 'Shop Now',
    cta_link: '#pricing'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [subsRes, discountRes, plansRes, promoRes, bannerRes, usersRes] = await Promise.all([
        db.from('subscribers').select('*').order('created_at', { ascending: false }),
        db.from('subscription_discounts').select('*').order('created_at', { ascending: false }),
        db.from('subscription_plans').select('*').order('sort_order', { ascending: true }),
        db.from('promotion_frames').select('*').order('created_at', { ascending: false }),
        db.from('banner_configs').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_users_with_roles')
      ]);

      if (subsRes.data) setSubscribers(subsRes.data);
      if (discountRes.data) setDiscounts(discountRes.data);
      if (plansRes.data) setPlans(plansRes.data);
      if (promoRes.data) setPromotionFrames(promoRes.data);
      if (bannerRes.data) setBannerConfigs(bannerRes.data);
      if (usersRes.data) setAuthUsers(usersRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  // Apply tier limits when tier changes
  const applyTierLimits = (tier: string) => {
    const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.trial;
    if (editingSubscriber) {
      setEditingSubscriber({
        ...editingSubscriber,
        subscription_tier: tier,
        vessel_limit: limits.vessel,
        port_limit: limits.port,
        regions_limit: limits.regions,
        refinery_limit: limits.refinery,
        support_level: limits.support,
        user_seats: limits.seats,
        api_access: limits.api,
        real_time_analytics: limits.analytics
      });
    }
  };

  const handleUpdateSubscription = async () => {
    if (!editingSubscriber) return;

    try {
      const updateData: any = {
        subscription_tier: editingSubscriber.subscription_tier,
        subscription_end: editingSubscriber.subscription_end,
        subscription_status: editingSubscriber.subscription_status,
        subscribed: editingSubscriber.subscribed,
        vessel_limit: editingSubscriber.vessel_limit,
        port_limit: editingSubscriber.port_limit,
        regions_limit: editingSubscriber.regions_limit,
        refinery_limit: editingSubscriber.refinery_limit,
        support_level: editingSubscriber.support_level,
        user_seats: editingSubscriber.user_seats,
        api_access: editingSubscriber.api_access,
        real_time_analytics: editingSubscriber.real_time_analytics,
        is_trial_active: editingSubscriber.is_trial_active,
        trial_end_date: editingSubscriber.trial_end_date,
        unified_trial_end_date: editingSubscriber.unified_trial_end_date,
        is_locked: editingSubscriber.is_locked,
        locked_at: editingSubscriber.is_locked ? editingSubscriber.locked_at || new Date().toISOString() : null,
        locked_reason: editingSubscriber.is_locked ? editingSubscriber.locked_reason : null,
        has_broker_subscription: editingSubscriber.has_broker_subscription,
        updated_at: new Date().toISOString()
      };

      const { error } = await db
        .from('subscribers')
        .update(updateData)
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

  const handleToggleLock = async (subscriber: Subscriber) => {
    try {
      const newLockState = !subscriber.is_locked;
      const { error } = await db
        .from('subscribers')
        .update({
          is_locked: newLockState,
          locked_at: newLockState ? new Date().toISOString() : null,
          locked_reason: newLockState ? 'Locked by admin' : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (error) throw error;

      toast.success(`Account ${newLockState ? 'locked' : 'unlocked'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Failed to update lock status');
    }
  };

  const handleExtendTrial = async (subscriber: Subscriber, days: number) => {
    try {
      const currentEnd = subscriber.unified_trial_end_date || subscriber.trial_end_date;
      const baseDate = currentEnd && new Date(currentEnd) > new Date() ? new Date(currentEnd) : new Date();
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await db
        .from('subscribers')
        .update({
          trial_end_date: newEndDate.toISOString(),
          unified_trial_end_date: newEndDate.toISOString(),
          is_trial_active: true,
          is_locked: false,
          locked_at: null,
          locked_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (error) throw error;

      toast.success(`Trial extended by ${days} days`);
      fetchData();
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error('Failed to extend trial');
    }
  };

  const handleToggleBrokerSubscription = async (subscriber: Subscriber) => {
    try {
      const newState = !subscriber.has_broker_subscription;
      const { error } = await supabase
        .from('subscribers')
        .update({
          has_broker_subscription: newState,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriber.id);

      if (error) throw error;

      toast.success(`Broker subscription ${newState ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      console.error('Error toggling broker subscription:', error);
      toast.error('Failed to update broker subscription');
    }
  };

  const handleAddUserToSubscribers = async (user: AuthUser) => {
    try {
      const { error } = await db
        .from('subscribers')
        .insert({
          user_id: user.id,
          email: user.email,
          subscription_tier: 'trial',
          is_trial_active: true,
          trial_start_date: new Date().toISOString(),
          trial_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          unified_trial_end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          subscribed: false,
          subscription_status: 'trialing',
          vessel_limit: 10,
          port_limit: 20,
          regions_limit: 1,
          refinery_limit: 5,
          support_level: 'email',
          user_seats: 1,
          api_access: false,
          real_time_analytics: false,
          is_locked: false,
          has_broker_subscription: false
        });

      if (error) throw error;

      toast.success('User added to subscribers with 5-day trial');
      setIsAddUserDialogOpen(false);
      setSelectedUserToAdd(null);
      fetchData();
    } catch (error) {
      console.error('Error adding user to subscribers:', error);
      toast.error('Failed to add user to subscribers');
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

  // Promotion Frame handlers
  const handleCreatePromotion = async () => {
    try {
      const { error } = await db
        .from('promotion_frames')
        .insert({
          ...newPromotion,
          start_date: new Date(newPromotion.start_date).toISOString(),
          end_date: newPromotion.end_date ? new Date(newPromotion.end_date).toISOString() : null
        });

      if (error) throw error;

      toast.success('Promotion frame created successfully');
      setIsPromotionDialogOpen(false);
      setNewPromotion({
        title: 'Limited-Time Offer',
        description: '',
        eligible_plans: ['professional'],
        billing_cycle: 'both',
        discount_type: 'percentage',
        discount_value: 20,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        show_countdown: true,
        placement: 'step5',
        show_on_home: false,
        show_on_subscription: false,
        show_on_registration: false
      });
      fetchData();
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Failed to create promotion');
    }
  };

  const handleUpdatePromotion = async () => {
    if (!editingPromotion) return;

    try {
      const { error } = await db
        .from('promotion_frames')
        .update({
          title: editingPromotion.title,
          description: editingPromotion.description,
          eligible_plans: editingPromotion.eligible_plans,
          billing_cycle: editingPromotion.billing_cycle,
          discount_type: editingPromotion.discount_type,
          discount_value: editingPromotion.discount_value,
          start_date: editingPromotion.start_date,
          end_date: editingPromotion.end_date,
          show_countdown: editingPromotion.show_countdown,
          is_active: editingPromotion.is_active,
          placement: editingPromotion.placement,
          show_on_home: editingPromotion.show_on_home,
          show_on_subscription: editingPromotion.show_on_subscription,
          show_on_registration: editingPromotion.show_on_registration
        })
        .eq('id', editingPromotion.id);

      if (error) throw error;

      toast.success('Promotion updated successfully');
      setIsPromotionDialogOpen(false);
      setEditingPromotion(null);
      fetchData();
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Failed to update promotion');
    }
  };

  const handleTogglePromotion = async (id: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from('promotion_frames')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Promotion ${!isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update promotion');
    }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      const { error } = await db
        .from('promotion_frames')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Promotion deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete promotion');
    }
  };

  // Banner handlers
  const handleCreateBanner = async () => {
    try {
      const { error } = await db
        .from('banner_configs')
        .insert({
          ...newBanner,
          start_date: new Date(newBanner.start_date).toISOString(),
          end_date: newBanner.end_date ? new Date(newBanner.end_date).toISOString() : null
        });

      if (error) throw error;

      toast.success('Banner created successfully');
      setIsBannerDialogOpen(false);
      setNewBanner({
        title: 'BLACK FRIDAY SALE',
        subtitle: 'Up to 70% OFF',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        show_countdown: true,
        cta_text: 'Shop Now',
        cta_link: '#pricing'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating banner:', error);
      toast.error('Failed to create banner');
    }
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;

    try {
      const { error } = await db
        .from('banner_configs')
        .update({
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          start_date: editingBanner.start_date,
          end_date: editingBanner.end_date,
          show_countdown: editingBanner.show_countdown,
          cta_text: editingBanner.cta_text,
          cta_link: editingBanner.cta_link,
          is_active: editingBanner.is_active
        })
        .eq('id', editingBanner.id);

      if (error) throw error;

      toast.success('Banner updated successfully');
      setIsBannerDialogOpen(false);
      setEditingBanner(null);
      fetchData();
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    }
  };

  const handleToggleBanner = async (id: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from('banner_configs')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Banner ${!isActive ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const { error } = await db
        .from('banner_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Banner deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' ||
                        (filterTier === 'trial' && sub.is_trial_active && !sub.subscribed) ||
                        sub.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  // Users not in subscribers list
  const usersNotInSubscribers = authUsers.filter(
    user => !subscribers.some(sub => sub.email === user.email)
  );

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.subscribed).length,
    trial: subscribers.filter(s => s.is_trial_active && !s.subscribed).length,
    locked: subscribers.filter(s => s.is_locked).length,
    basic: subscribers.filter(s => s.subscription_tier === 'basic').length,
    professional: subscribers.filter(s => s.subscription_tier === 'professional').length,
    enterprise: subscribers.filter(s => s.subscription_tier === 'enterprise').length,
    brokers: subscribers.filter(s => s.has_broker_subscription).length,
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Users className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mb-1" />
              <p className="text-lg font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Clock className="h-4 w-4 text-blue-600 mb-1" />
              <p className="text-lg font-bold text-blue-600">{stats.trial}</p>
              <p className="text-xs text-muted-foreground">Trial</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Lock className="h-4 w-4 text-red-600 mb-1" />
              <p className="text-lg font-bold text-red-600">{stats.locked}</p>
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Crown className="h-4 w-4 text-blue-500 mb-1" />
              <p className="text-lg font-bold text-blue-500">{stats.basic}</p>
              <p className="text-xs text-muted-foreground">Basic</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Crown className="h-4 w-4 text-purple-600 mb-1" />
              <p className="text-lg font-bold text-purple-600">{stats.professional}</p>
              <p className="text-xs text-muted-foreground">Pro</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Crown className="h-4 w-4 text-yellow-600 mb-1" />
              <p className="text-lg font-bold text-yellow-600">{stats.enterprise}</p>
              <p className="text-xs text-muted-foreground">Enterprise</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col items-center">
              <Briefcase className="h-4 w-4 text-orange-600 mb-1" />
              <p className="text-lg font-bold text-orange-600">{stats.brokers}</p>
              <p className="text-xs text-muted-foreground">Brokers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscribers" className="space-y-6">
        <TabsList className="flex flex-nowrap overflow-x-auto w-full">
          <TabsTrigger value="subscribers" className="text-xs md:text-sm whitespace-nowrap">Subscribers</TabsTrigger>
          <TabsTrigger value="plans" className="text-xs md:text-sm whitespace-nowrap">Plans</TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs md:text-sm whitespace-nowrap">Promotions</TabsTrigger>
          <TabsTrigger value="banners" className="text-xs md:text-sm whitespace-nowrap">Banners</TabsTrigger>
          <TabsTrigger value="sponsorship" className="text-xs md:text-sm whitespace-nowrap">Sponsorship</TabsTrigger>
          <TabsTrigger value="unsubscribe" className="text-xs md:text-sm whitespace-nowrap">Unsubscribe</TabsTrigger>
        </TabsList>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
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
                    <SelectItem value="trial">Free Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                
                {usersNotInSubscribers.length > 0 && (
                  <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Missing Users ({usersNotInSubscribers.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Users to Subscribers</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {usersNotInSubscribers.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined: {new Date(user.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddUserToSubscribers(user)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

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
                      <th className="text-left py-2">Package</th>
                      <th className="text-left py-2">Trial Status</th>
                      <th className="text-left py-2">Stripe Status</th>
                      <th className="text-left py-2">Next Payment</th>
                      <th className="text-left py-2">Limits</th>
                      <th className="text-left py-2">Broker</th>
                      <th className="text-left py-2">Lock</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.map((subscriber) => {
                      const trialEndDate = subscriber.unified_trial_end_date || subscriber.trial_end_date;
                      const isTrialActive = subscriber.is_trial_active && trialEndDate && new Date(trialEndDate) > new Date();
                      const trialDaysLeft = trialEndDate 
                        ? Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                        : 0;
                      const packageName = subscriber.subscribed 
                        ? (subscriber.subscription_tier?.toUpperCase() || 'ACTIVE')
                        : isTrialActive 
                          ? 'Free Trial'
                          : 'EXPIRED';
                      
                      return (
                        <tr key={subscriber.id} className={`border-b hover:bg-muted/50 ${subscriber.is_locked ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                          <td className="py-3">
                            <div className="font-medium">{subscriber.email}</div>
                            {subscriber.stripe_customer_id && (
                              <div className="text-xs text-muted-foreground">Stripe: {subscriber.stripe_customer_id.slice(0, 15)}...</div>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge variant={subscriber.subscribed ? "default" : isTrialActive ? "secondary" : "outline"}>
                              {packageName}
                            </Badge>
                          </td>
                          <td className="py-3">
                            {isTrialActive ? (
                              <div>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {trialDaysLeft} days left
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Ends: {new Date(trialEndDate!).toLocaleDateString()}
                                </div>
                              </div>
                            ) : trialEndDate ? (
                              <Badge variant="outline" className="text-red-600 border-red-300">Expired</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3">
                            <Badge variant={
                              subscriber.subscription_status === 'active' ? 'default' :
                              subscriber.subscription_status === 'trialing' ? 'secondary' :
                              subscriber.subscription_status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {subscriber.subscription_status || (subscriber.subscribed ? 'active' : 'expired')}
                            </Badge>
                          </td>
                          <td className="py-3">
                            {subscriber.subscription_end ? (
                              <div className="text-sm">
                                {new Date(subscriber.subscription_end).toLocaleDateString()}
                              </div>
                            ) : isTrialActive ? (
                              <div className="text-xs text-muted-foreground">
                                After trial: {new Date(new Date(trialEndDate!).getTime() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="text-xs space-y-0.5">
                              <div>V:{subscriber.vessel_limit} P:{subscriber.port_limit}</div>
                              <div>R:{subscriber.regions_limit} Ref:{subscriber.refinery_limit}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Button
                              variant={subscriber.has_broker_subscription ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleToggleBrokerSubscription(subscriber)}
                              className="gap-1"
                            >
                              <Briefcase className="h-3 w-3" />
                              {subscriber.has_broker_subscription ? 'Active' : 'Off'}
                            </Button>
                          </td>
                          <td className="py-3">
                            <Button
                              variant={subscriber.is_locked ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => handleToggleLock(subscriber)}
                              className="gap-1"
                            >
                              {subscriber.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            </Button>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExtendTrial(subscriber, 5)}
                                title="Add 5 days trial"
                              >
                                +5d
                              </Button>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Plans</CardTitle>
                <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingPlan(null)}>
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
                          disabled={!!editingPlan}
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
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan} className="flex-1">
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsPlanDialogOpen(false); setEditingPlan(null); }}>
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
                      <th className="text-left py-2">Plan</th>
                      <th className="text-left py-2">Tier</th>
                      <th className="text-left py-2">Monthly</th>
                      <th className="text-left py-2">Annual</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} className="border-b">
                        <td className="py-3 font-medium">{plan.plan_name}</td>
                        <td className="py-3">{plan.plan_tier}</td>
                        <td className="py-3">${plan.monthly_price}</td>
                        <td className="py-3">${plan.annual_price}</td>
                        <td className="py-3">
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingPlan(plan); setIsPlanDialogOpen(true); }}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlan(plan.id)}>
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

        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Promotion Frames</CardTitle>
                <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingPromotion(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Promotion
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Title</Label>
                        <Input
                          value={editingPromotion ? editingPromotion.title : newPromotion.title}
                          onChange={(e) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, title: e.target.value})
                            : setNewPromotion({...newPromotion, title: e.target.value})
                          }
                          placeholder="e.g., Limited-Time Offer"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editingPromotion ? editingPromotion.description : newPromotion.description}
                          onChange={(e) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, description: e.target.value})
                            : setNewPromotion({...newPromotion, description: e.target.value})
                          }
                          placeholder="Promotion description..."
                        />
                      </div>
                      <div>
                        <Label>Discount Value (%)</Label>
                        <Input
                          type="number"
                          value={editingPromotion ? editingPromotion.discount_value : newPromotion.discount_value}
                          onChange={(e) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, discount_value: parseFloat(e.target.value) || 0})
                            : setNewPromotion({...newPromotion, discount_value: parseFloat(e.target.value) || 0})
                          }
                        />
                      </div>
                      <div>
                        <Label>Billing Cycle</Label>
                        <Select
                          value={editingPromotion ? editingPromotion.billing_cycle : newPromotion.billing_cycle}
                          onValueChange={(value) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, billing_cycle: value})
                            : setNewPromotion({...newPromotion, billing_cycle: value})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Both Monthly & Annual</SelectItem>
                            <SelectItem value="annual">Annual Only</SelectItem>
                            <SelectItem value="monthly">Monthly Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={editingPromotion ? editingPromotion.start_date?.split('T')[0] : newPromotion.start_date}
                          onChange={(e) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, start_date: e.target.value})
                            : setNewPromotion({...newPromotion, start_date: e.target.value})
                          }
                        />
                      </div>
                      <div>
                        <Label>End Date (Optional)</Label>
                        <Input
                          type="date"
                          value={editingPromotion ? (editingPromotion.end_date?.split('T')[0] || '') : newPromotion.end_date}
                          onChange={(e) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, end_date: e.target.value})
                            : setNewPromotion({...newPromotion, end_date: e.target.value})
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingPromotion ? editingPromotion.show_countdown : newPromotion.show_countdown}
                          onCheckedChange={(checked) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, show_countdown: checked})
                            : setNewPromotion({...newPromotion, show_countdown: checked})
                          }
                        />
                        <Label>Show Countdown</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingPromotion ? editingPromotion.show_on_home : newPromotion.show_on_home}
                          onCheckedChange={(checked) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, show_on_home: checked})
                            : setNewPromotion({...newPromotion, show_on_home: checked})
                          }
                        />
                        <Label>Show on Home</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingPromotion ? editingPromotion.show_on_subscription : newPromotion.show_on_subscription}
                          onCheckedChange={(checked) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, show_on_subscription: checked})
                            : setNewPromotion({...newPromotion, show_on_subscription: checked})
                          }
                        />
                        <Label>Show on Subscription</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingPromotion ? editingPromotion.show_on_registration : newPromotion.show_on_registration}
                          onCheckedChange={(checked) => editingPromotion 
                            ? setEditingPromotion({...editingPromotion, show_on_registration: checked})
                            : setNewPromotion({...newPromotion, show_on_registration: checked})
                          }
                        />
                        <Label>Show on Registration</Label>
                      </div>
                      {editingPromotion && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingPromotion.is_active}
                            onCheckedChange={(checked) => setEditingPromotion({...editingPromotion, is_active: checked})}
                          />
                          <Label>Active</Label>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion} className="flex-1">
                        {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsPromotionDialogOpen(false); setEditingPromotion(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotionFrames.map(promo => (
                  <div key={promo.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{promo.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {promo.discount_value}% off - {promo.eligible_plans?.join(', ') || 'all plans'} 
                        <Badge variant="outline" className="ml-2">{promo.billing_cycle}</Badge>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={promo.is_active ? "default" : "secondary"}>
                        {promo.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingPromotion(promo); setIsPromotionDialogOpen(true); }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleTogglePromotion(promo.id, promo.is_active)}>
                        {promo.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePromotion(promo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {promotionFrames.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No promotions created yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Banner Configs</CardTitle>
                <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingBanner(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Banner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Title</Label>
                        <Input
                          value={editingBanner ? editingBanner.title : newBanner.title}
                          onChange={(e) => editingBanner 
                            ? setEditingBanner({...editingBanner, title: e.target.value})
                            : setNewBanner({...newBanner, title: e.target.value})
                          }
                          placeholder="e.g., BLACK FRIDAY SALE"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={editingBanner ? editingBanner.subtitle : newBanner.subtitle}
                          onChange={(e) => editingBanner 
                            ? setEditingBanner({...editingBanner, subtitle: e.target.value})
                            : setNewBanner({...newBanner, subtitle: e.target.value})
                          }
                          placeholder="e.g., Up to 70% OFF"
                        />
                      </div>
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={editingBanner ? editingBanner.start_date?.split('T')[0] : newBanner.start_date}
                          onChange={(e) => editingBanner 
                            ? setEditingBanner({...editingBanner, start_date: e.target.value})
                            : setNewBanner({...newBanner, start_date: e.target.value})
                          }
                        />
                      </div>
                      <div>
                        <Label>End Date (Optional)</Label>
                        <Input
                          type="date"
                          value={editingBanner ? (editingBanner.end_date?.split('T')[0] || '') : newBanner.end_date}
                          onChange={(e) => editingBanner 
                            ? setEditingBanner({...editingBanner, end_date: e.target.value})
                            : setNewBanner({...newBanner, end_date: e.target.value})
                          }
                        />
                      </div>
                      <div>
                        <Label>CTA Text</Label>
                        <Input
                          value={editingBanner ? editingBanner.cta_text : newBanner.cta_text}
                          onChange={(e) => editingBanner 
                            ? setEditingBanner({...editingBanner, cta_text: e.target.value})
                            : setNewBanner({...newBanner, cta_text: e.target.value})
                          }
                          placeholder="e.g., Shop Now"
                        />
                      </div>
                      <div>
                        <Label>CTA Link</Label>
                        <Input
                          value={editingBanner ? editingBanner.cta_link : newBanner.cta_link}
                          onChange={(e) => editingBanner 
                            ? setEditingBanner({...editingBanner, cta_link: e.target.value})
                            : setNewBanner({...newBanner, cta_link: e.target.value})
                          }
                          placeholder="e.g., #pricing or /subscription"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editingBanner ? editingBanner.show_countdown : newBanner.show_countdown}
                          onCheckedChange={(checked) => editingBanner 
                            ? setEditingBanner({...editingBanner, show_countdown: checked})
                            : setNewBanner({...newBanner, show_countdown: checked})
                          }
                        />
                        <Label>Show Countdown</Label>
                      </div>
                      {editingBanner && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editingBanner.is_active}
                            onCheckedChange={(checked) => setEditingBanner({...editingBanner, is_active: checked})}
                          />
                          <Label>Active</Label>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={editingBanner ? handleUpdateBanner : handleCreateBanner} className="flex-1">
                        {editingBanner ? 'Update Banner' : 'Create Banner'}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsBannerDialogOpen(false); setEditingBanner(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bannerConfigs.map(banner => (
                  <div key={banner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{banner.title}</p>
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingBanner(banner); setIsBannerDialogOpen(true); }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleBanner(banner.id, banner.is_active)}>
                        {banner.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteBanner(banner.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {bannerConfigs.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No banners created yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unsubscribe" className="space-y-6">
          <UnsubscribeRequestsManagement />
        </TabsContent>

        <TabsContent value="sponsorship" className="space-y-6">
          <SponsorshipManagement />
        </TabsContent>
      </Tabs>

      {/* Enhanced Edit Subscription Dialog */}
      {editingSubscriber && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Subscription: {editingSubscriber.email}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {/* Subscription Tier with auto-apply limits */}
              <div>
                <Label>Subscription Tier</Label>
                <Select
                  value={editingSubscriber.subscription_tier || 'trial'}
                  onValueChange={(value) => applyTierLimits(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Free Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subscription Duration */}
              <div>
                <Label>Subscription Duration (Manual)</Label>
                <Select
                  onValueChange={(value) => {
                    const months = parseInt(value);
                    if (!isNaN(months)) {
                      const newEndDate = new Date();
                      newEndDate.setMonth(newEndDate.getMonth() + months);
                      setEditingSubscriber({
                        ...editingSubscriber, 
                        subscription_end: newEndDate.toISOString(),
                        subscribed: true,
                        subscription_status: 'active'
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Set duration..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <SelectItem key={m} value={String(m)}>{m} Month{m > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingSubscriber.subscription_end && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ends: {new Date(editingSubscriber.subscription_end).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Trial End Date */}
              <div>
                <Label>Trial End Date</Label>
                <Input
                  type="date"
                  value={editingSubscriber.unified_trial_end_date?.split('T')[0] || editingSubscriber.trial_end_date?.split('T')[0] || ''}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value).toISOString();
                    setEditingSubscriber({
                      ...editingSubscriber,
                      trial_end_date: newDate,
                      unified_trial_end_date: newDate,
                      is_trial_active: new Date(newDate) > new Date()
                    });
                  }}
                />
              </div>

              {/* Is Trial Active */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSubscriber.is_trial_active || false}
                  onCheckedChange={(checked) => setEditingSubscriber({...editingSubscriber, is_trial_active: checked})}
                />
                <Label>Trial Active</Label>
              </div>

              {/* Is Locked */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSubscriber.is_locked || false}
                  onCheckedChange={(checked) => setEditingSubscriber({
                    ...editingSubscriber, 
                    is_locked: checked,
                    locked_reason: checked ? 'Locked by admin' : null
                  })}
                />
                <Label>Account Locked</Label>
              </div>

              {/* Lock Reason */}
              {editingSubscriber.is_locked && (
                <div>
                  <Label>Lock Reason</Label>
                  <Input
                    value={editingSubscriber.locked_reason || ''}
                    onChange={(e) => setEditingSubscriber({...editingSubscriber, locked_reason: e.target.value})}
                    placeholder="Reason for locking..."
                  />
                </div>
              )}

              {/* Broker Subscription */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSubscriber.has_broker_subscription || false}
                  onCheckedChange={(checked) => setEditingSubscriber({...editingSubscriber, has_broker_subscription: checked})}
                />
                <Label>Broker Subscription Active</Label>
              </div>

              {/* Is Subscribed */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSubscriber.subscribed || false}
                  onCheckedChange={(checked) => setEditingSubscriber({
                    ...editingSubscriber, 
                    subscribed: checked,
                    subscription_status: checked ? 'active' : 'expired'
                  })}
                />
                <Label>Paid Subscription Active</Label>
              </div>

              {/* Support Level */}
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

              {/* Limits */}
              <div>
                <Label>Vessel Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.vessel_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, vessel_limit: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>Port Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.port_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, port_limit: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>Regions Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.regions_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, regions_limit: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>Refinery Limit</Label>
                <Input
                  type="number"
                  value={editingSubscriber.refinery_limit}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, refinery_limit: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <Label>User Seats</Label>
                <Input
                  type="number"
                  value={editingSubscriber.user_seats}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, user_seats: parseInt(e.target.value) || 1})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSubscriber.api_access || false}
                  onCheckedChange={(checked) => setEditingSubscriber({...editingSubscriber, api_access: checked})}
                />
                <Label>API Access</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingSubscriber.real_time_analytics || false}
                  onCheckedChange={(checked) => setEditingSubscriber({...editingSubscriber, real_time_analytics: checked})}
                />
                <Label>Real-time Analytics</Label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleUpdateSubscription} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingSubscriber(null); }}>
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
