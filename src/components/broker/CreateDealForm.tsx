import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Ship, DollarSign, Package, Plus } from 'lucide-react';

interface Vessel {
  id: number;
  name: string;
  vessel_type: string;
  cargo_capacity: number;
  flag: string;
}

interface CreateDealFormProps {
  onSuccess?: (dealId: string) => void;
  onCancel?: () => void;
  preselectedVessel?: Vessel | null;
}

const CreateDealForm: React.FC<CreateDealFormProps> = ({ 
  onSuccess, 
  onCancel, 
  preselectedVessel 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [brokerProfile, setBrokerProfile] = useState<any>(null);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [formData, setFormData] = useState({
    deal_type: '',
    cargo_type: '',
    quantity: '',
    price_per_unit: '',
    total_value: '',
    source_port: '',
    destination_port: '',
    delivery_date: '',
    vessel_id: preselectedVessel?.id.toString() || '',
    terms_conditions: '',
    commission_rate: '2.5'
  });

  useEffect(() => {
    fetchBrokerProfile();
    if (!preselectedVessel) {
      fetchVessels();
    }
  }, [user]);

  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerUnit = parseFloat(formData.price_per_unit) || 0;
    const totalValue = quantity * pricePerUnit;
    
    if (quantity > 0 && pricePerUnit > 0) {
      setFormData(prev => ({ ...prev, total_value: totalValue.toString() }));
    }
  }, [formData.quantity, formData.price_per_unit]);

  const fetchBrokerProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setBrokerProfile(data);
    } catch (error) {
      console.error('Error fetching broker profile:', error);
    }
  };

  const fetchVessels = async () => {
    try {
      const { data, error } = await supabase
        .from('vessels')
        .select('id, name, vessel_type, cargo_capacity, flag')
        .order('name');

      if (error) throw error;
      setVessels(data || []);
    } catch (error) {
      console.error('Error fetching vessels:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerProfile) {
      toast({
        title: "Error",
        description: "Broker profile not found",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const dealData = {
        broker_id: brokerProfile.id,
        deal_type: formData.deal_type,
        cargo_type: formData.cargo_type,
        quantity: parseFloat(formData.quantity),
        price_per_unit: parseFloat(formData.price_per_unit),
        total_value: parseFloat(formData.total_value),
        source_port: formData.source_port,
        destination_port: formData.destination_port,
        delivery_date: formData.delivery_date || null,
        vessel_id: parseInt(formData.vessel_id) || null,
        terms_conditions: formData.terms_conditions,
        commission_rate: parseFloat(formData.commission_rate),
        status: 'pending',
        total_steps: 8,
        steps_completed: 0
      };

      const { data, error } = await supabase
        .from('broker_deals')
        .insert(dealData)
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deal created successfully! You can now track its progress.",
      });

      if (onSuccess && data) {
        onSuccess(data.id);
      }
    } catch (error: any) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!brokerProfile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Deal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading broker profile...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!brokerProfile.verified_at) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Deal
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="text-center py-8">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verification Required</h3>
            <p className="text-muted-foreground">
              Your broker profile needs to be verified by an admin before you can create deals.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Create New Broker Deal
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Deal Type & Cargo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deal_type">Deal Type *</Label>
              <Select value={formData.deal_type} onValueChange={(value) => handleSelectChange('deal_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brokerage">Brokerage</SelectItem>
                  <SelectItem value="spot">Spot Sale</SelectItem>
                  <SelectItem value="contract">Contract Sale</SelectItem>
                  <SelectItem value="futures">Futures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cargo_type">Cargo Type *</Label>
              <Select value={formData.cargo_type} onValueChange={(value) => handleSelectChange('cargo_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crude_oil">Crude Oil</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="jet_fuel">Jet Fuel</SelectItem>
                  <SelectItem value="fuel_oil">Fuel Oil</SelectItem>
                  <SelectItem value="lng">LNG</SelectItem>
                  <SelectItem value="lpg">LPG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vessel Selection */}
          {!preselectedVessel && (
            <div>
              <Label htmlFor="vessel_id">Vessel</Label>
              <Select value={formData.vessel_id} onValueChange={(value) => handleSelectChange('vessel_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vessel (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id.toString()}>
                      {vessel.name} - {vessel.vessel_type} ({vessel.cargo_capacity?.toLocaleString()} MT)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {preselectedVessel && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                <span className="font-medium">{preselectedVessel.name}</span>
                <span className="text-sm text-muted-foreground">
                  {preselectedVessel.vessel_type} - {preselectedVessel.cargo_capacity?.toLocaleString()} MT
                </span>
              </div>
            </div>
          )}

          {/* Quantity & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity (MT) *</Label>
              <div className="relative">
                <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="price_per_unit">Price per MT (USD) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price_per_unit"
                  name="price_per_unit"
                  type="number"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="total_value">Total Value (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="total_value"
                  name="total_value"
                  type="number"
                  step="0.01"
                  value={formData.total_value}
                  onChange={handleInputChange}
                  className="pl-10 bg-muted"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Ports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source_port">Source Port *</Label>
              <Input
                id="source_port"
                name="source_port"
                value={formData.source_port}
                onChange={handleInputChange}
                placeholder="e.g., Houston, TX"
                required
              />
            </div>
            <div>
              <Label htmlFor="destination_port">Destination Port *</Label>
              <Input
                id="destination_port"
                name="destination_port"
                value={formData.destination_port}
                onChange={handleInputChange}
                placeholder="e.g., Rotterdam, Netherlands"
                required
              />
            </div>
          </div>

          {/* Delivery Date & Commission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_date">Expected Delivery Date</Label>
              <Input
                id="delivery_date"
                name="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                name="commission_rate"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.commission_rate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div>
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              name="terms_conditions"
              value={formData.terms_conditions}
              onChange={handleInputChange}
              placeholder="Enter any specific terms, conditions, or notes for this deal..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Deal...
                </>
              ) : (
                'Create Deal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDealForm;