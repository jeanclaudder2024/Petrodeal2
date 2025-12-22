import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Loader2, DollarSign, Percent, Check, Crown, Shield } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { toast } from 'sonner';

interface BrokerMembershipContent {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  sale_price: number;
  discount_badge_text: string;
  savings_text: string;
  payment_note: string;
  guarantee_text: string;
  billing_cycle: string;
  features: string[];
  is_active: boolean;
}

const BrokerPricingManagement = () => {
  const [content, setContent] = useState<BrokerMembershipContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('broker_membership_content')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setContent({
          ...data,
          features: Array.isArray(data.features) ? data.features : JSON.parse(data.features || '[]'),
          original_price: data.original_price || 999,
          sale_price: data.sale_price || data.price || 499,
          discount_badge_text: data.discount_badge_text || '50% OFF - Limited Time',
          savings_text: data.savings_text || 'Save $500 - Limited Time Offer!',
          payment_note: data.payment_note || 'One-time payment • No recurring fees • Lifetime access',
          guarantee_text: data.guarantee_text || '30-day money-back guarantee'
        });
      } else {
        // Create default content if none exists
        const defaultContent = {
          title: 'Broker Lifetime Membership',
          description: 'Join the elite network of verified international oil brokers',
          price: 499,
          original_price: 999,
          sale_price: 499,
          discount_badge_text: '50% OFF - Limited Time',
          savings_text: 'Save $500 - Limited Time Offer!',
          payment_note: 'One-time payment • No recurring fees • Lifetime access',
          guarantee_text: '30-day money-back guarantee',
          billing_cycle: 'lifetime',
          features: [
            'Verified Broker Badge & Profile',
            'Direct Access to Global Oil Companies',
            'International Deal Management',
            'Advanced Documentation Suite',
            'ICC & UNCITRAL Compliance',
            'Priority Support & Verification'
          ],
          is_active: true
        };
        
        const { data: newData, error: insertError } = await db
          .from('broker_membership_content')
          .insert(defaultContent)
          .select()
          .single();
          
        if (!insertError && newData) {
          setContent({
            ...newData,
            features: newData.features || []
          });
          toast.success('Default broker pricing content created');
        }
      }
    } catch (error) {
      console.error('Error loading broker content:', error);
      toast.error('Failed to load broker pricing content');
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    if (!content) return;

    setSaving(true);
    try {
      const { error } = await db
        .from('broker_membership_content')
        .update({
          title: content.title,
          description: content.description,
          price: content.sale_price, // Keep price in sync with sale_price
          original_price: content.original_price,
          sale_price: content.sale_price,
          discount_badge_text: content.discount_badge_text,
          savings_text: content.savings_text,
          payment_note: content.payment_note,
          guarantee_text: content.guarantee_text,
          billing_cycle: content.billing_cycle,
          features: content.features,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id);

      if (error) throw error;
      toast.success('Broker pricing content updated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim() || !content) return;
    setContent({
      ...content,
      features: [...content.features, newFeature.trim()]
    });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    if (!content) return;
    const newFeatures = [...content.features];
    newFeatures.splice(index, 1);
    setContent({ ...content, features: newFeatures });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No broker membership content found.</p>
      </div>
    );
  }

  const savings = content.original_price - content.sale_price;
  const discountPercent = Math.round((savings / content.original_price) * 100);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Broker Membership Pricing
          </CardTitle>
          <CardDescription>
            Full control over the Broker Membership page content and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Broker Lifetime Membership"
              />
            </div>
            <div>
              <Label>Billing Cycle</Label>
              <Input
                value={content.billing_cycle}
                onChange={(e) => setContent({ ...content, billing_cycle: e.target.value })}
                placeholder="lifetime, monthly, annual"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={content.description}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
              placeholder="Join the elite network of verified international oil brokers"
              rows={2}
            />
          </div>

          {/* Pricing Section */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Pricing Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Original Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={content.original_price}
                  onChange={(e) => setContent({ ...content, original_price: parseFloat(e.target.value) || 0 })}
                  placeholder="999.00"
                />
                <p className="text-xs text-muted-foreground mt-1">Strike-through price</p>
              </div>
              <div>
                <Label>Sale Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={content.sale_price}
                  onChange={(e) => setContent({ ...content, sale_price: parseFloat(e.target.value) || 0 })}
                  placeholder="499.00"
                />
                <p className="text-xs text-muted-foreground mt-1">Actual price to pay</p>
              </div>
              <div>
                <Label>Calculated Discount</Label>
                <div className="h-10 flex items-center">
                  <Badge className="bg-green-500 text-white text-lg px-4 py-1">
                    {discountPercent}% OFF - Save ${savings.toFixed(0)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Badge & Text Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Discount Badge Text</Label>
              <Input
                value={content.discount_badge_text}
                onChange={(e) => setContent({ ...content, discount_badge_text: e.target.value })}
                placeholder="50% OFF - Limited Time"
              />
            </div>
            <div>
              <Label>Savings Text</Label>
              <Input
                value={content.savings_text}
                onChange={(e) => setContent({ ...content, savings_text: e.target.value })}
                placeholder="Save $500 - Limited Time Offer!"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Payment Note</Label>
              <Input
                value={content.payment_note}
                onChange={(e) => setContent({ ...content, payment_note: e.target.value })}
                placeholder="One-time payment • No recurring fees • Lifetime access"
              />
            </div>
            <div>
              <Label>Guarantee Text</Label>
              <Input
                value={content.guarantee_text}
                onChange={(e) => setContent({ ...content, guarantee_text: e.target.value })}
                placeholder="30-day money-back guarantee"
              />
            </div>
          </div>

          {/* Features */}
          <div>
            <Label>Features</Label>
            <div className="space-y-2 mt-2">
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="flex-1 justify-start py-2">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    {feature}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => removeFeature(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a new feature..."
                  onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                />
                <Button onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={saveContent} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>How it will appear on the Broker Membership page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-lg mx-auto p-6 border-2 border-primary/20 rounded-xl bg-gradient-to-b from-background to-muted/20">
            {/* Discount Badge */}
            <div className="text-center mb-4">
              <Badge className="bg-red-500 text-white px-4 py-1.5 text-sm">
                <Percent className="h-3 w-3 mr-1" />
                {content.discount_badge_text}
              </Badge>
            </div>

            {/* Title & Crown */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center mb-3">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">{content.title}</h2>
              <p className="text-muted-foreground text-sm">{content.description}</p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl text-muted-foreground line-through">${content.original_price.toFixed(0)}</span>
                <span className="text-4xl font-bold">${content.sale_price.toFixed(0)}</span>
              </div>
              <div className="text-green-600 font-semibold text-sm mt-1">{content.savings_text}</div>
              <div className="text-muted-foreground text-xs mt-1">{content.payment_note}</div>
            </div>

            {/* Features */}
            <div className="space-y-2 mb-4">
              {content.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button className="w-full h-12 text-lg font-semibold">
              <Crown className="h-5 w-5 mr-2" />
              Get Broker Membership - ${content.sale_price.toFixed(0)}
            </Button>

            {/* Trust Indicators */}
            <div className="mt-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Secure payment powered by Stripe
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3 w-3" />
                {content.guarantee_text}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrokerPricingManagement;
