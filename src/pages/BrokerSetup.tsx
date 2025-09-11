import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, 
  Check, 
  Shield, 
  User, 
  FileText,
  Loader2,
  AlertCircle,
  Camera,
  Plus,
  X,
  Building,
  MapPin,
  Award,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Twitter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const BrokerSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    country: '',
    city: '',
    license_number: '',
    years_experience: '',
    specializations: '',
    bio: '',
    website: '',
    linkedin_url: '',
    twitter_url: '',
    languages: '',
    certifications: '',
    education: '',
    trading_volume: '',
    commission_rate: '',
    preferred_regions: '',
    company_size: '',
    company_type: '',
    business_registration: '',
    tax_id: ''
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [passportDocument, setPassportDocument] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [specializationList, setSpecializationList] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [countryCode, setCountryCode] = useState('+1');

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 
    'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 
    'Norway', 'Denmark', 'Finland', 'Japan', 'South Korea', 'China', 'India', 
    'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'UAE', 
    'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Egypt', 'Nigeria', 
    'South Africa', 'Kenya', 'Morocco', 'Brazil', 'Argentina', 'Chile', 'Mexico', 
    'Colombia', 'Peru', 'Venezuela', 'Russia', 'Poland', 'Czech Republic', 
    'Hungary', 'Romania', 'Greece', 'Turkey', 'Israel', 'Jordan', 'Lebanon', 
    'Iraq', 'Iran', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Myanmar', 'Vietnam', 
    'Cambodia', 'Laos', 'Taiwan', 'Hong Kong', 'Macau', 'Mongolia', 'Kazakhstan', 
    'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 
    'Nepal', 'Bhutan', 'Maldives', 'New Zealand', 'Papua New Guinea', 'Fiji'
  ];

  const countryCodes = [
    { country: 'United States', code: '+1' },
    { country: 'United Kingdom', code: '+44' },
    { country: 'Canada', code: '+1' },
    { country: 'Australia', code: '+61' },
    { country: 'Germany', code: '+49' },
    { country: 'France', code: '+33' },
    { country: 'Italy', code: '+39' },
    { country: 'Spain', code: '+34' },
    { country: 'Netherlands', code: '+31' },
    { country: 'Belgium', code: '+32' },
    { country: 'Switzerland', code: '+41' },
    { country: 'Austria', code: '+43' },
    { country: 'Sweden', code: '+46' },
    { country: 'Norway', code: '+47' },
    { country: 'Denmark', code: '+45' },
    { country: 'Finland', code: '+358' },
    { country: 'Japan', code: '+81' },
    { country: 'South Korea', code: '+82' },
    { country: 'China', code: '+86' },
    { country: 'India', code: '+91' },
    { country: 'Singapore', code: '+65' },
    { country: 'Malaysia', code: '+60' },
    { country: 'Thailand', code: '+66' },
    { country: 'Indonesia', code: '+62' },
    { country: 'Philippines', code: '+63' },
    { country: 'UAE', code: '+971' },
    { country: 'Saudi Arabia', code: '+966' },
    { country: 'Qatar', code: '+974' },
    { country: 'Kuwait', code: '+965' },
    { country: 'Bahrain', code: '+973' },
    { country: 'Oman', code: '+968' },
    { country: 'Egypt', code: '+20' },
    { country: 'Nigeria', code: '+234' },
    { country: 'South Africa', code: '+27' },
    { country: 'Kenya', code: '+254' },
    { country: 'Morocco', code: '+212' },
    { country: 'Brazil', code: '+55' },
    { country: 'Argentina', code: '+54' },
    { country: 'Chile', code: '+56' },
    { country: 'Mexico', code: '+52' },
    { country: 'Colombia', code: '+57' },
    { country: 'Peru', code: '+51' },
    { country: 'Venezuela', code: '+58' },
    { country: 'Russia', code: '+7' },
    { country: 'Poland', code: '+48' },
    { country: 'Czech Republic', code: '+420' },
    { country: 'Hungary', code: '+36' },
    { country: 'Romania', code: '+40' },
    { country: 'Greece', code: '+30' },
    { country: 'Turkey', code: '+90' },
    { country: 'Israel', code: '+972' },
    { country: 'Jordan', code: '+962' },
    { country: 'Lebanon', code: '+961' },
    { country: 'Iraq', code: '+964' },
    { country: 'Iran', code: '+98' },
    { country: 'Pakistan', code: '+92' },
    { country: 'Bangladesh', code: '+880' },
    { country: 'Sri Lanka', code: '+94' },
    { country: 'Myanmar', code: '+95' },
    { country: 'Vietnam', code: '+84' },
    { country: 'Cambodia', code: '+855' },
    { country: 'Laos', code: '+856' },
    { country: 'Taiwan', code: '+886' },
    { country: 'Hong Kong', code: '+852' },
    { country: 'Macau', code: '+853' },
    { country: 'Mongolia', code: '+976' },
    { country: 'Kazakhstan', code: '+7' },
    { country: 'Uzbekistan', code: '+998' },
    { country: 'Turkmenistan', code: '+993' },
    { country: 'Kyrgyzstan', code: '+996' },
    { country: 'Tajikistan', code: '+992' },
    { country: 'Afghanistan', code: '+93' },
    { country: 'Nepal', code: '+977' },
    { country: 'Bhutan', code: '+975' },
    { country: 'Maldives', code: '+960' },
    { country: 'New Zealand', code: '+64' },
    { country: 'Papua New Guinea', code: '+675' },
    { country: 'Fiji', code: '+679' }
  ];

  useEffect(() => {
    if (user) {
      checkSetupStatus();
    }
  }, [user]);

  // Auto-populate name and email from user profile for new broker profiles
  useEffect(() => {
    if (user && !hasProfile) {
      setFormData(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user, hasProfile]);

  const checkSetupStatus = async () => {
    try {
      // Check membership status
      const { data: membershipData } = await supabase.functions.invoke('check-broker-membership');
      setMembershipStatus(membershipData);

      if (!membershipData.has_membership || membershipData.payment_status !== 'paid') {
        navigate('/broker-membership');
        return;
      }

      // Check if broker profile exists
      const { data: profile } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profile) {
        setHasProfile(true);
        
        // Parse phone number to separate country code and number
        let phoneNumber = profile.phone || '';
        let extractedCountryCode = '+1';
        
        if (phoneNumber.startsWith('+')) {
          const spaceIndex = phoneNumber.indexOf(' ');
          if (spaceIndex > 0) {
            extractedCountryCode = phoneNumber.substring(0, spaceIndex);
            phoneNumber = phoneNumber.substring(spaceIndex + 1);
          }
        }
        
        setCountryCode(extractedCountryCode);
        
        setFormData({
          full_name: profile.full_name || '',
          company_name: profile.company_name || '',
          phone: phoneNumber,
          email: (profile as any).email || '',
          address: profile.address || '',
          country: profile.country || '',
          city: profile.city || '',
          license_number: profile.license_number || '',
          years_experience: profile.years_experience?.toString() || '',
          specializations: profile.specializations?.join(', ') || '',
          bio: profile.bio || '',
          website: (profile as any).website || '',
          linkedin_url: (profile as any).linkedin_url || '',
          twitter_url: (profile as any).twitter_url || '',
          languages: (profile as any).languages?.join(', ') || '',
          certifications: (profile as any).certifications?.join(', ') || '',
          education: (profile as any).education || '',
          trading_volume: (profile as any).trading_volume || '',
          commission_rate: (profile as any).commission_rate?.toString() || '',
          preferred_regions: (profile as any).preferred_regions?.join(', ') || '',
          company_size: (profile as any).company_size || '',
          company_type: (profile as any).company_type || '',
          business_registration: (profile as any).business_registration || '',
          tax_id: (profile as any).tax_id || ''
        });
        if (profile.specializations) {
          setSpecializationList(profile.specializations);
        }
        if (profile.profile_image_url) {
          setProfileImagePreview(profile.profile_image_url);
        }

        // If profile is verified, redirect to dashboard
        // If profile exists but not verified, redirect to waiting page
        if (profile.verified_at) {
          navigate('/broker-dashboard');
        } else {
          navigate('/broker-verification-waiting');
        }
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportDocument(file);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSpecialization = (spec: string) => {
    if (spec && !specializationList.includes(spec)) {
      setSpecializationList([...specializationList, spec]);
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializationList(specializationList.filter(s => s !== spec));
  };

  const uploadDocument = async (file: File, userId: string, folder: string = 'documents'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('broker-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Create signed URL for private bucket (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('broker-documents')
      .createSignedUrl(fileName, 31536000); // 1 year in seconds

    if (signedUrlError) throw signedUrlError;

    return signedUrlData.signedUrl;
  };

  const uploadProfileImage = async (file: File, userId: string): Promise<string> => {
    return uploadDocument(file, userId, 'profiles');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get membership ID
      const { data: membership } = await supabase
        .from('broker_memberships')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        throw new Error('Membership not found');
      }

      // Upload profile image
      let profileImageUrl = profileImagePreview;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(profileImage, user.id);
      }

      // Upload passport document (required)
      if (!passportDocument && !hasProfile) {
        throw new Error('Passport document is required for verification');
      }
      
      let passportUrl = '';
      if (passportDocument) {
        passportUrl = await uploadDocument(passportDocument, user.id, 'passport');
      }

      // Upload additional documents
      let documentUrls: string[] = [];
      if (documents.length > 0) {
        documentUrls = await Promise.all(
          documents.map(doc => uploadDocument(doc, user.id))
        );
      }

      // Prepare profile data
      const profileData = {
        user_id: user.id,
        membership_id: membership.id,
        full_name: formData.full_name,
        company_name: formData.company_name || null,
        phone: `${countryCode} ${formData.phone}`,
        email: formData.email || user.email,
        address: formData.address || null,
        country: formData.country || null,
        city: formData.city || null,
        license_number: formData.license_number || null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        specializations: specializationList.length > 0 ? specializationList : null,
        bio: formData.bio || null,
        profile_image_url: profileImageUrl || null,
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_url: formData.twitter_url || null,
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()) : null,
        certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()) : null,
        education: formData.education || null,
        trading_volume: formData.trading_volume || null,
        commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null,
        preferred_regions: formData.preferred_regions ? formData.preferred_regions.split(',').map(s => s.trim()) : null,
        company_size: formData.company_size || null,
        company_type: formData.company_type || null,
        business_registration: formData.business_registration || null,
        tax_id: formData.tax_id || null,
        id_document_url: passportUrl || documentUrls[0] || null,
        additional_documents: documentUrls.length > 1 ? documentUrls.slice(1) : documentUrls.length === 1 ? null : null,
      };

      if (hasProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('broker_profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('broker_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      toast({
        title: "Profile Submitted",
        description: "Your broker profile has been submitted for verification. You'll be notified once approved.",
      });

      // Navigate to verification waiting page for new submissions, dashboard for updates
      if (hasProfile) {
        navigate('/broker-dashboard');
      } else {
        navigate('/broker-verification-waiting');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const steps = [
    { title: "Personal Info", icon: User },
    { title: "Professional Details", icon: Award },
    { title: "Company Information", icon: Building },
    { title: "Documents & Verification", icon: FileText }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Complete Your Broker Profile
          </h1>
          <p className="text-muted-foreground">
            Fill in your details to get verified and start brokering deals
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted text-muted-foreground'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Status Card */}
        {membershipStatus && (
          <Card className="mb-6 border-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span className="font-medium">Membership Active</span>
                <Badge variant="outline" className="ml-auto">
                  {membershipStatus.verification_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Multi-Step Form */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 0: Personal Information */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={profileImagePreview} />
                      <AvatarFallback className="text-2xl">
                        {formData.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center space-x-2">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Label htmlFor="profile_image" className="cursor-pointer">
                          <Camera className="h-4 w-4 mr-2" />
                          Upload Photo
                          <Input
                            id="profile_image"
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                          />
                        </Label>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <div className="flex gap-2">
                        <Select
                          value={countryCode}
                          onValueChange={setCountryCode}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border z-50 max-h-60 overflow-y-auto">
                            {countryCodes.map((item) => (
                              <SelectItem key={item.code} value={item.code} className="hover:bg-muted focus:bg-muted">
                                {item.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="123456789"
                          className="flex-1"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        name="years_experience"
                        type="number"
                        min="0"
                        value={formData.years_experience}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) => setFormData(prev => ({...prev, country: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border z-50 max-h-60 overflow-y-auto">
                          {countries.map((country) => (
                            <SelectItem key={country} value={country} className="hover:bg-muted focus:bg-muted">
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="languages">Languages (comma-separated)</Label>
                      <Input
                        id="languages"
                        name="languages"
                        placeholder="English, Arabic, French"
                        value={formData.languages}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        name="education"
                        placeholder="MBA in Finance"
                        value={formData.education}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Professional Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="bio">Professional Bio *</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      placeholder="Tell us about your experience and expertise in oil trading..."
                      value={formData.bio}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label>Specializations</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {specializationList.map((spec, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {spec}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeSpecialization(spec)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add specialization (e.g., Crude Oil)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSpecialization(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addSpecialization(input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="license_number">License Number</Label>
                      <Input
                        id="license_number"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                      <Input
                        id="certifications"
                        name="certifications"
                        placeholder="ISO 9001, API Certified"
                        value={formData.certifications}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trading_volume">Annual Trading Volume</Label>
                      <Input
                        id="trading_volume"
                        name="trading_volume"
                        placeholder="$10M - $50M"
                        value={formData.trading_volume}
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

                  <div>
                    <Label htmlFor="preferred_regions">Preferred Trading Regions (comma-separated)</Label>
                    <Input
                      id="preferred_regions"
                      name="preferred_regions"
                      placeholder="Middle East, Europe, Asia Pacific"
                      value={formData.preferred_regions}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.website}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter_url">Twitter Profile</Label>
                      <Input
                        id="twitter_url"
                        name="twitter_url"
                        type="url"
                        placeholder="https://twitter.com/username"
                        value={formData.twitter_url}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Company Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_type">Company Type</Label>
                      <Select
                        value={formData.company_type}
                        onValueChange={(value) => setFormData(prev => ({...prev, company_type: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="llc">LLC</SelectItem>
                          <SelectItem value="corporation">Corporation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_size">Company Size</Label>
                      <Select
                        value={formData.company_size}
                        onValueChange={(value) => setFormData(prev => ({...prev, company_size: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="business_registration">Business Registration Number</Label>
                      <Input
                        id="business_registration"
                        name="business_registration"
                        value={formData.business_registration}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
                    <Input
                      id="tax_id"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Documents & Verification */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Passport Upload - Required */}
                  <div>
                    <Label htmlFor="passport" className="text-base font-semibold">Passport Document *</Label>
                    <p className="text-sm text-muted-foreground mb-2">Upload a clear photo or scan of your passport (required for verification)</p>
                    <div className="mt-2 border-2 border-dashed border-primary/25 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-primary" />
                        <div className="mt-2">
                          <Label htmlFor="passport" className="cursor-pointer">
                            <span className="text-primary hover:text-primary/80 font-medium">
                              {passportDocument ? 'Change Passport' : 'Upload Passport'}
                            </span>
                            <Input
                              id="passport"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handlePassportUpload}
                              className="hidden"
                            />
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          PDF, JPG, PNG up to 10MB
                        </p>
                      </div>
                      {passportDocument && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700">
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">Passport uploaded: {passportDocument.name}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="documents">Additional Documents (License, Certificates, etc.)</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <div className="mt-2">
                          <Label htmlFor="documents" className="cursor-pointer">
                            <span className="text-primary hover:text-primary/80">Upload files</span>
                            <Input
                              id="documents"
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          PDF, JPG, PNG up to 10MB each
                        </p>
                      </div>
                      {documents.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Selected files:</p>
                          <ul className="text-sm text-muted-foreground">
                            {documents.map((file, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Verification Required</p>
                      <p className="text-yellow-700">
                        Your profile will be reviewed by our admin team. Verification typically takes 1-2 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={loading || (!passportDocument && !hasProfile)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        {hasProfile ? 'Update Profile' : 'Submit for Verification'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerSetup;