import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Save, 
  X, 
  User, 
  Building2, 
  Phone, 
  Globe,
  Briefcase,
  AlertTriangle,
  Link as LinkIcon,
  Percent
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BrokerProfile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  license_number: string;
  specializations: string[];
  years_experience: number;
  bio: string;
  verified_at: string;
  verification_notes: string;
  id_document_url: string;
  additional_documents: string[];
  profile_image_url: string;
  created_at: string;
  updated_at: string;
}

interface EditProfileFormProps {
  profile: BrokerProfile;
  onSave: (updatedProfile: BrokerProfile) => void;
  onCancel: () => void;
}

const SPECIALIZATION_SUGGESTIONS = [
  'Crude Oil', 'Refined Products', 'LNG', 'LPG', 'Petrochemicals',
  'Bunker Fuel', 'Jet Fuel', 'Diesel', 'Gasoline', 'Naphtha',
  'Fuel Oil', 'Bitumen', 'Natural Gas', 'Coal', 'Ship Brokering'
];

const TRADING_REGIONS = [
  'Middle East', 'Asia Pacific', 'Europe', 'North America', 'South America',
  'West Africa', 'East Africa', 'North Africa', 'Mediterranean', 'Baltic',
  'Caribbean', 'Central Asia', 'Southeast Asia', 'Oceania'
];

const EXPERIENCE_RANGES = [
  { value: '1', label: '0-1 years' },
  { value: '3', label: '2-3 years' },
  { value: '5', label: '4-5 years' },
  { value: '8', label: '6-8 years' },
  { value: '12', label: '9-12 years' },
  { value: '15', label: '13-15 years' },
  { value: '20', label: '15-20 years' },
  { value: '25', label: '20+ years' },
];

const VOLUME_RANGES = [
  'Under $1M', '$1M - $5M', '$5M - $10M', '$10M - $50M',
  '$50M - $100M', '$100M - $500M', '$500M+',
];

const PHONE_CODES = [
  { code: '+1', flag: '🇺🇸', country: 'US' },
  { code: '+44', flag: '🇬🇧', country: 'UK' },
  { code: '+971', flag: '🇦🇪', country: 'UAE' },
  { code: '+966', flag: '🇸🇦', country: 'SA' },
  { code: '+65', flag: '🇸🇬', country: 'SG' },
  { code: '+31', flag: '🇳🇱', country: 'NL' },
  { code: '+49', flag: '🇩🇪', country: 'DE' },
  { code: '+33', flag: '🇫🇷', country: 'FR' },
  { code: '+86', flag: '🇨🇳', country: 'CN' },
  { code: '+81', flag: '🇯🇵', country: 'JP' },
  { code: '+91', flag: '🇮🇳', country: 'IN' },
  { code: '+55', flag: '🇧🇷', country: 'BR' },
  { code: '+234', flag: '🇳🇬', country: 'NG' },
  { code: '+27', flag: '🇿🇦', country: 'ZA' },
  { code: '+61', flag: '🇦🇺', country: 'AU' },
  { code: '+7', flag: '🇷🇺', country: 'RU' },
  { code: '+90', flag: '🇹🇷', country: 'TR' },
  { code: '+961', flag: '🇱🇧', country: 'LB' },
];

const EditProfileForm: React.FC<EditProfileFormProps> = ({ profile, onSave, onCancel }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Parse phone code from existing phone
  const getPhoneCode = () => {
    const found = PHONE_CODES.find(p => profile.phone?.startsWith(p.code));
    return found?.code || '+1';
  };
  const getPhoneNumber = () => {
    const code = getPhoneCode();
    return profile.phone?.replace(code, '').trim() || '';
  };

  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    company_name: profile.company_name || '',
    phone_code: getPhoneCode(),
    phone_number: getPhoneNumber(),
    address: profile.address || '',
    country: profile.country || '',
    city: profile.city || '',
    license_number: profile.license_number || '',
    years_experience: profile.years_experience || 0,
    bio: profile.bio || '',
    specializations: profile.specializations || [],
    commission_rate: (profile as any).commission_rate || 0,
    trading_volume: (profile as any).trading_volume || '',
    preferred_regions: (profile as any).preferred_regions || [],
    website: (profile as any).website || '',
    linkedin_url: (profile as any).linkedin_url || '',
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const toggleRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_regions: prev.preferred_regions.includes(region)
        ? prev.preferred_regions.filter((r: string) => r !== region)
        : [...prev.preferred_regions, region]
    }));
  };

  const isFieldInvalid = (field: string) => {
    if (!touched[field]) return false;
    const val = (formData as any)[field];
    if (field === 'full_name') return !val?.trim();
    if (field === 'phone_number') return !val?.trim();
    return false;
  };

  // Profile completion
  const completionFields = [
    !!formData.full_name, !!formData.phone_number, !!formData.company_name,
    !!formData.country, !!formData.city, !!formData.bio,
    formData.specializations.length > 0, formData.years_experience > 0,
    !!formData.license_number, formData.preferred_regions.length > 0
  ];
  const completionPercent = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.phone_number.trim()) {
      toast({ title: "Validation Error", description: "Full name and phone are required.", variant: "destructive" });
      return;
    }

    // Validate website
    if (formData.website && !formData.website.match(/^https?:\/\//)) {
      formData.website = 'https://' + formData.website;
    }
    // Validate LinkedIn
    if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com')) {
      toast({ title: "Invalid LinkedIn URL", description: "Please enter a valid LinkedIn URL.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const phone = `${formData.phone_code} ${formData.phone_number}`.trim();
      const { data, error } = await supabase
        .from('broker_profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          phone,
          address: formData.address,
          country: formData.country,
          city: formData.city,
          license_number: formData.license_number,
          years_experience: formData.years_experience,
          bio: formData.bio,
          specializations: formData.specializations,
          commission_rate: formData.commission_rate,
          trading_volume: formData.trading_volume,
          preferred_regions: formData.preferred_regions,
          website: formData.website,
          linkedin_url: formData.linkedin_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Profile Updated", description: "Your broker profile has been successfully updated." });
      onSave(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion */}
      <Card className="rounded-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-bold">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="rounded-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, full_name: true }))}
                placeholder="Enter your full name"
                className={`rounded-sm ${isFieldInvalid('full_name') ? 'border-red-500' : ''}`}
              />
              {isFieldInvalid('full_name') && <p className="text-xs text-red-500 mt-1">Full name is required</p>}
            </div>
            <div>
              <Label>Phone Number *</Label>
              <div className="flex gap-2">
                <Select value={formData.phone_code} onValueChange={(v) => handleInputChange('phone_code', v)}>
                  <SelectTrigger className="w-28 rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_CODES.map(p => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.flag} {p.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, phone_number: true }))}
                  placeholder="Phone number"
                  className={`flex-1 rounded-sm ${isFieldInvalid('phone_number') ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about your experience and expertise..."
              rows={4}
              className="rounded-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="rounded-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" value={formData.company_name} onChange={(e) => handleInputChange('company_name', e.target.value)} placeholder="Enter your company name" className="rounded-sm" />
            </div>
            <div>
              <Label htmlFor="address">Business Address</Label>
              <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Enter your business address" className="rounded-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="Enter city" className="rounded-sm" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} placeholder="Enter country" className="rounded-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="website" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://yourcompany.com" className="pl-9 rounded-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="linkedin_url" value={formData.linkedin_url} onChange={(e) => handleInputChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." className="pl-9 rounded-sm" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card className="rounded-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-5 w-5" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="license_number">License Number</Label>
              <Input id="license_number" value={formData.license_number} onChange={(e) => handleInputChange('license_number', e.target.value)} placeholder="Enter your license number" className="rounded-sm" />
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Select value={String(formData.years_experience)} onValueChange={(v) => handleInputChange('years_experience', parseInt(v))}>
                <SelectTrigger className="rounded-sm"><SelectValue placeholder="Select experience" /></SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_RANGES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Trading Volume</Label>
              <Select value={formData.trading_volume} onValueChange={(v) => handleInputChange('trading_volume', v)}>
                <SelectTrigger className="rounded-sm"><SelectValue placeholder="Select volume range" /></SelectTrigger>
                <SelectContent>
                  {VOLUME_RANGES.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Commission Rate (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value) || 0)}
                  placeholder="2.5"
                  min="0"
                  max="100"
                  step="0.5"
                  className="pr-8 rounded-sm"
                />
                <Percent className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              {formData.commission_rate > 20 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Commission rate above 20% is unusual
                </div>
              )}
            </div>
          </div>

          {/* Specializations */}
          <div>
            <Label>Specializations</Label>
            <p className="text-xs text-muted-foreground mb-2">Select your areas of expertise</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATION_SUGGESTIONS.map(spec => (
                <Badge
                  key={spec}
                  variant={formData.specializations.includes(spec) ? 'default' : 'outline'}
                  className="cursor-pointer rounded-sm transition-colors hover:bg-primary/80"
                  onClick={() => toggleSpecialization(spec)}
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          {/* Trading Regions */}
          <div>
            <Label>Trading Regions</Label>
            <p className="text-xs text-muted-foreground mb-2">Select the regions you operate in</p>
            <div className="flex flex-wrap gap-2">
              {TRADING_REGIONS.map(region => (
                <Badge
                  key={region}
                  variant={formData.preferred_regions.includes(region) ? 'default' : 'outline'}
                  className="cursor-pointer rounded-sm transition-colors hover:bg-primary/80"
                  onClick={() => toggleRegion(region)}
                >
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-sm">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1 rounded-sm">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EditProfileForm;
