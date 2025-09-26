import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserPlus, 
  CreditCard, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Shield,
  TrendingUp,
  Ship,
  MapPin,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import EmailVerificationWaiting from './EmailVerificationWaiting';

interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  termsAgreed: boolean;
  fullName: string;
  company: string;
  country: string;
  countryCode: string;
  phone: string;
  selectedPorts: string[];
  selectedVessels: string[];
  selectedRegions: string[];
  paymentMethod: 'subscribe_with_trial';
  selectedPlan?: string;
  billingCycle: 'monthly' | 'annual';
  cardNumber: string;
  expiryDate: string;
  cvv: string;  
  cardholderName: string;
}

const MultiStepRegistration = () => {
  const navigate = useNavigate();
  const { startTrial } = useAccess();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showVerificationWaiting, setShowVerificationWaiting] = useState(false);
  const [ports, setPorts] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [filteredVessels, setFilteredVessels] = useState<any[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [formData, setFormData] = useState<RegistrationForm>({
    email: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
    fullName: '',
    company: '',
    country: '',
    countryCode: '+1',
    phone: '',
    selectedPorts: [],
    selectedVessels: [],
    selectedRegions: [],
    paymentMethod: 'subscribe_with_trial',
    selectedPlan: undefined,
    billingCycle: 'monthly',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

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
    'Cambodia', 'Laos', 'New Zealand', 'Papua New Guinea', 'Fiji'
  ];

  const countryCodes = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+91', country: 'India' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+31', country: 'Netherlands' },
    { code: '+32', country: 'Belgium' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+358', country: 'Finland' },
    { code: '+82', country: 'S.Korea' },
    { code: '+65', country: 'Singapore' },
    { code: '+60', country: 'Malaysia' },
    { code: '+66', country: 'Thailand' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi' },
    { code: '+974', country: 'Qatar' },
    { code: '+965', country: 'Kuwait' },
    { code: '+973', country: 'Bahrain' },
    { code: '+968', country: 'Oman' },
    { code: '+20', country: 'Egypt' },
    { code: '+234', country: 'Nigeria' },
    { code: '+27', country: 'S.Africa' },
    { code: '+55', country: 'Brazil' },
    { code: '+54', country: 'Argentina' },
    { code: '+56', country: 'Chile' },
    { code: '+52', country: 'Mexico' },
    { code: '+57', country: 'Colombia' },
    { code: '+51', country: 'Peru' },
    { code: '+58', country: 'Venezuela' },
    { code: '+7', country: 'Russia' },
    { code: '+48', country: 'Poland' },
    { code: '+420', country: 'Czech' },
    { code: '+36', country: 'Hungary' },
    { code: '+40', country: 'Romania' },
    { code: '+30', country: 'Greece' },
    { code: '+90', country: 'Turkey' }
  ];

  // Regions will be loaded dynamically from filter management

  const totalSteps = 6;

  useEffect(() => {
    fetchPreviewData();
    fetchDynamicPricing();
  }, []);

  useEffect(() => {
    filterVesselsBySelectedPorts();
  }, [formData.selectedPorts, vessels]);

  const fetchDynamicPricing = async () => {
    try {
      // Fetch pricing plans and discounts
      const [plansRes, discountsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('subscription_discounts').select('*').eq('is_active', true).or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
      ]);

      if (plansRes.data) {
        setDynamicPlans(plansRes.data);
      }
      
      if (discountsRes.data) {
        setDiscounts(discountsRes.data);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    }
  };

  const fetchPreviewData = async () => {
    try {
      // Fetch regions from filter management, ports and vessels for selection
      const [regionsRes, portsRes, vesselsRes] = await Promise.all([
        supabase.from('filter_options').select('label').eq('filter_type', 'region').eq('is_active', true).order('sort_order'),
        supabase.from('ports').select('id, name, country, region').limit(50),
        supabase.from('vessels').select('id, name, vessel_type, flag, current_region, currentport, destination_port, departure_port, port_id').limit(100)
      ]);

      if (regionsRes.data) {
        setRegions(regionsRes.data.map(r => r.label));
      }
      
      if (portsRes.data) setPorts(portsRes.data);
      
      if (vesselsRes.data) {
        setVessels(vesselsRes.data);
        setFilteredVessels([]); // Start with no vessels until ports are selected
      }
    } catch (error) {
      console.error('Error fetching preview data:', error);
      // Fallback to hardcoded regions if fetch fails
      setRegions(['Europe', 'North America', 'Asia Pacific', 'Middle East', 'Africa', 'South America']);
    }
  };

  const filterVesselsBySelectedPorts = () => {
    if (formData.selectedPorts.length === 0) {
      setFilteredVessels([]);
      return;
    }

    try {
      // Get selected port details for comprehensive matching
      const selectedPorts = ports.filter(port => formData.selectedPorts.includes(port.id.toString()));
      const selectedPortIds = formData.selectedPorts.map(id => parseInt(id));
      
      if (selectedPorts.length === 0) {
        setFilteredVessels([]);
        return;
      }

      // Method 1: Direct port_id matching (most accurate)
      const directIdMatches = vessels.filter(vessel => 
        vessel.port_id && selectedPortIds.includes(vessel.port_id)
      );

      if (directIdMatches.length > 0) {
        setFilteredVessels(directIdMatches.slice(0, 12));
        return;
      }

      // Method 2: Enhanced fuzzy matching for port names
      const portNames = selectedPorts.map(port => port.name?.toLowerCase().trim()).filter(Boolean);
      const portRegions = selectedPorts.map(port => port.region?.toLowerCase().trim()).filter(Boolean);

      // Enhanced fuzzy matching function
      const fuzzyMatch = (text1: string, text2: string): boolean => {
        if (!text1 || !text2) return false;
        
        // Normalize texts
        const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const norm1 = normalize(text1);
        const norm2 = normalize(text2);
        
        // Direct matching
        if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
        
        // Split into words and check matches
        const words1 = norm1.split(/\s+/).filter(w => w.length > 2);
        const words2 = norm2.split(/\s+/).filter(w => w.length > 2);
        
        // At least 70% word overlap
        const matches = words1.filter(w1 => 
          words2.some(w2 => w1.includes(w2) || w2.includes(w1) || levenshteinDistance(w1, w2) <= 1)
        );
        
        return matches.length >= Math.min(words1.length, words2.length) * 0.7;
      };

      // Simple Levenshtein distance for typo tolerance
      const levenshteinDistance = (str1: string, str2: string): number => {
        if (Math.abs(str1.length - str2.length) > 3) return 10;
        
        const matrix = Array.from({ length: str1.length + 1 }, (_, i) => [i]);
        matrix[0] = Array.from({ length: str2.length + 1 }, (_, i) => i);
        
        for (let i = 1; i <= str1.length; i++) {
          for (let j = 1; j <= str2.length; j++) {
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 1)
            );
          }
        }
        return matrix[str1.length][str2.length];
      };

      // Method 3: Fuzzy name matching with scoring
      const nameMatches = vessels.filter(vessel => {
        const vesselPorts = [
          vessel.currentport || '',
          vessel.destination_port || '',
          vessel.departure_port || ''
        ].filter(Boolean);
        
        return portNames.some(portName => 
          vesselPorts.some(vesselPort => fuzzyMatch(portName, vesselPort))
        );
      });

      if (nameMatches.length > 0) {
        setFilteredVessels(nameMatches.slice(0, 12));
        return;
      }

      // Method 4: Region matching as fallback
      const regionMatches = vessels.filter(vessel => {
        const vesselRegion = (vessel.current_region || '').toLowerCase().trim();
        return vesselRegion && portRegions.some(region => fuzzyMatch(region, vesselRegion));
      });

      if (regionMatches.length > 0) {
        setFilteredVessels(regionMatches.slice(0, 12));
      } else {
        // Show a diverse sample of vessels if no matches
        setFilteredVessels(vessels.slice(0, 12));
      }
    } catch (error) {
      console.error('Error filtering vessels:', error);
      setFilteredVessels(vessels.slice(0, 12));
    }
  };

  const handleInputChange = (field: keyof RegistrationForm, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'selectedPorts' | 'selectedVessels' | 'selectedRegions', id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(id) 
        ? prev[field].filter(item => item !== id)
        : [...prev[field], id]
    }));
  };

  const handleSelectAll = (type: 'ports' | 'vessels') => {
    if (type === 'ports') {
      const allPortIds = ports.map(port => port.id.toString());
      setFormData(prev => ({ ...prev, selectedPorts: allPortIds }));
    } else {
      const allVesselIds = filteredVessels.map(vessel => vessel.id.toString());
      setFormData(prev => ({ ...prev, selectedVessels: allVesselIds }));
    }
  };

  const handleSelectBest8 = (type: 'ports' | 'vessels') => {
    if (type === 'ports') {
      const best8PortIds = ports.slice(0, 8).map(port => port.id.toString());
      setFormData(prev => ({ ...prev, selectedPorts: best8PortIds }));
    } else {
      const best8VesselIds = filteredVessels.slice(0, 8).map(vessel => vessel.id.toString());
      setFormData(prev => ({ ...prev, selectedVessels: best8VesselIds }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.password && formData.confirmPassword && formData.termsAgreed);
      case 2:
        return !!(formData.fullName && formData.phone && formData.country);
      case 3:
        return formData.selectedRegions.length > 0;
      case 4:
        return formData.selectedPorts.length > 0 || formData.selectedVessels.length > 0 || true; // Allow skipping
      case 5:
        // دائماً نحتاج لاختيار خطة - كل الاشتراكات تأتي مع فترة تجربة 5 أيام
        return !!formData.selectedPlan;
      case 6:
        // Step 6 is now for final confirmation and completion
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1 && formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // كل الاشتراكات تأتي مع فترة تجربة 5 أيام
      if (formData.paymentMethod === 'subscribe_with_trial' && formData.selectedPlan) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive"
          });
          return;
        }

        // Store registration data securely (no password in localStorage)
        const registrationData = {
          email: formData.email,
          fullName: formData.fullName,
          company: formData.company,
          country: formData.country,
          selectedRegions: formData.selectedRegions,
          selectedPorts: formData.selectedPorts,
          selectedVessels: formData.selectedVessels,
          selectedPlan: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          paymentMethod: formData.paymentMethod
        };
        
        sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
        
        // Create Stripe checkout session
        try {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
            body: { 
              tier: formData.selectedPlan, 
              billing_cycle: formData.billingCycle,
              email: formData.email,
              payment_type: 'subscription_with_trial',
              trial_days: 5 // دائماً 5 أيام تجربة مجانية
            }
          });
          
          if (checkoutError) {
            console.error('Checkout error:', checkoutError);
            toast({
              title: "Payment Setup Failed",
              description: checkoutError.message || "Unable to create payment session. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          if (checkoutData?.url) {
            toast({
              title: "Redirecting to Subscription Setup",
              description: "Complete your subscription with 5-day free trial included!",
            });
            
            // Redirect to Stripe checkout in same window for better UX
            window.location.href = checkoutData.url;
            return;
          } else {
            toast({
              title: "Setup Failed", 
              description: "No checkout URL received. Please try again.",
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error('Failed to create checkout:', error);
          toast({
            title: "Setup Failed",
            description: "Unable to process request. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // Fallback for users without plan selection (shouldn't reach here with new flow)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            company: formData.company,
            country: formData.country,
            selected_regions: formData.selectedRegions,
            selected_ports: formData.selectedPorts,
            selected_vessels: formData.selectedVessels
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        // Send custom confirmation email - always try to send
        try {
          const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
            body: {
              user: {
                email: data.user.email,
                user_metadata: { full_name: formData.fullName }
              },
              email_data: {
                token: '',
                token_hash: '',
                redirect_to: `${window.location.origin}/dashboard`,
                email_action_type: 'signup',
                site_url: window.location.origin
              }
            }
          });

          if (emailError) {
            console.error('Custom email error:', emailError);
            // Don't fail the registration if custom email fails
            toast({
              title: "Registration Successful!",
              description: "Account created successfully. You may need to check your email for confirmation.",
            });
          } else {
            toast({
              title: "Registration Successful!",
              description: "Please check your email to verify your account.",
            });
          }
        } catch (emailError) {
          console.error('Failed to send custom confirmation email:', emailError);
          toast({
            title: "Registration Successful!",
            description: "Account created successfully. You may need to check your email for confirmation.",
          });
        }

        // Check if email confirmation is required
        if (!data.session) {
          // Email confirmation required - show verification waiting page
          toast({
            title: "Registration Successful!",
            description: `Please check your email to verify your account and start your 5-day free trial with the ${formData.selectedPlan} plan.`,
          });
          setShowVerificationWaiting(true);
        } else {
          // User is immediately signed in (email confirmation disabled)
          toast({
            title: "Registration Successful!",
            description: `Welcome to PetroDealHub! Starting your 5-day free trial with ${formData.selectedPlan} plan...`,
          });

          // Start trial for new users
          try {
            if (startTrial) {
              await startTrial();
            }
          } catch (trialError) {
            console.error('Error starting trial:', trialError);
            // Continue anyway as the user is registered
          }

          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/auth?mode=login');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <UserPlus className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Enter your email and password to start.</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password (at least 8 characters + number)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAgreed}
                  onCheckedChange={(checked) => handleInputChange('termsAgreed', checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-5">
                  I agree to Terms & Privacy Policy
                </Label>
              </div>

              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Secure 100%</span>
                </div>
                <span>–</span>
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>We do not share your data</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Step 2</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Note: You can edit this information later
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="flex gap-2 mt-1">
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => handleInputChange('countryCode', value)}
                  >
                    <SelectTrigger className="w-32 bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border z-50 max-h-60 overflow-y-auto">
                      {countryCodes.map((item) => (
                        <SelectItem key={item.code} value={item.code} className="hover:bg-muted focus:bg-muted">
                          {item.code} {item.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  placeholder="Your company or organization"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger className="mt-1 bg-background border-input">
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
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Globe className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Choose the regions you want to monitor.</h2>
              <p className="text-muted-foreground">
                (Europe, North America, Asia Pacific, Middle East, Africa, South America).
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Note: You can edit later.
              </p>
            </div>

            <div className="space-y-4">
              <Label>Select Regions (Choose at least 1)</Label>
              <div className="grid grid-cols-2 gap-3">
                {regions.map((region, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${index}`}
                      checked={formData.selectedRegions.includes(region)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleArrayToggle('selectedRegions', region);
                        } else {
                          handleArrayToggle('selectedRegions', region);
                        }
                      }}
                    />
                    <Label htmlFor={`region-${index}`} className="text-sm">
                      {region}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {formData.selectedRegions.length} regions
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center gap-4 mb-4">
                <Ship className="h-8 w-8 text-primary" />
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Select ports and vessels of interest.</h2>
              <p className="text-muted-foreground mb-4">
                You can skip this step and add later.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Real-time tracking</span>
                </div>
                <span>–</span>
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Accurate data</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Ports Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-medium">Ports of Interest</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('ports')}
                    >
                      SELECT ALL
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectBest8('ports')}
                    >
                      CHOOSE 8 BEST
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                  {ports.slice(0, 8).map((port) => (
                    <div key={port.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`port-${port.id}`}
                        checked={formData.selectedPorts.includes(port.id.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleArrayToggle('selectedPorts', port.id.toString());
                          } else {
                            handleArrayToggle('selectedPorts', port.id.toString());
                          }
                        }}
                      />
                      <Label htmlFor={`port-${port.id}`} className="text-sm flex-1">
                        <span className="font-medium">{port.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {port.country} • {port.region}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.selectedPorts.length} ports
                </p>
              </div>

              {/* Vessels Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-medium">Vessels to Track</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('vessels')}
                    >
                      SELECT ALL
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectBest8('vessels')}
                    >
                      CHOOSE 8 BEST
                    </Button>
                  </div>
                </div>
                 <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                   {vessels.length === 0 ? (
                     <div className="text-center py-4 text-sm text-muted-foreground">
                       <p>No vessels available in the system yet.</p>
                       <p className="text-xs mt-1">You can add vessels after registration from your dashboard.</p>
                     </div>
                   ) : formData.selectedPorts.length === 0 ? (
                     <div className="text-center py-4 text-sm text-muted-foreground">
                       Please select ports above to see connected vessels
                     </div>
                   ) : filteredVessels.length > 0 ? (
                     filteredVessels.map((vessel) => (
                       <div key={vessel.id} className="flex items-center space-x-2">
                         <Checkbox
                           id={`vessel-${vessel.id}`}
                           checked={formData.selectedVessels.includes(vessel.id.toString())}
                           onCheckedChange={(checked) => {
                             if (checked) {
                               handleArrayToggle('selectedVessels', vessel.id.toString());
                             } else {
                               handleArrayToggle('selectedVessels', vessel.id.toString());
                             }
                           }}
                         />
                         <Label htmlFor={`vessel-${vessel.id}`} className="text-sm flex-1">
                           <span className="font-medium">{vessel.name}</span>
                           <span className="text-muted-foreground ml-2">
                             {vessel.vessel_type} • {vessel.flag}
                           </span>
                         </Label>
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-4 text-sm text-muted-foreground">
                       <p>No vessels found connected to selected ports.</p>
                       <p className="text-xs mt-1">You can still proceed and add vessels later from your dashboard.</p>
                     </div>
                   )}
                 </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.selectedVessels.length} vessels
                </p>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You can skip this step and modify your selections anytime after registration.
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CreditCard className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold">Choose Your Plan</h2>
              <p className="text-muted-foreground mb-4">
                Start with a free trial or subscribe immediately
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>Cancel anytime</span>
                </div>
                <span>–</span>
                <div className="flex items-center gap-1">
                  <span>🔒</span>
                  <span>30-Day Money Back Guarantee</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-muted-foreground">
                  🎉 All plans include a <strong>5-day free trial</strong> with full access!
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800 mt-2">
                  <Clock className="h-4 w-4 mr-1" />
                  Start Your Free Trial Today
                </Badge>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className={`text-sm font-medium ${formData.billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Monthly
                </span>
                <div 
                  className="relative inline-flex items-center cursor-pointer"
                  onClick={() => handleInputChange('billingCycle', formData.billingCycle === 'monthly' ? 'annual' : 'monthly')}
                >
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    formData.billingCycle === 'annual' ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                      formData.billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </div>
                <span className={`text-sm font-medium ${formData.billingCycle === 'annual' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Annual
                </span>
                {formData.billingCycle === 'annual' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Save up to 20%
                  </Badge>
                )}
              </div>

              {/* Plan Selection */}
              <div className="grid gap-4">
                {(dynamicPlans.length > 0 ? dynamicPlans.map(dbPlan => ({
                  id: dbPlan.plan_tier,
                  name: dbPlan.plan_name,
                  monthlyPrice: dbPlan.monthly_price,
                  annualPrice: dbPlan.annual_price,
                  features: dbPlan.features || [],
                  popular: dbPlan.is_popular
                })) : [
                  { 
                    id: 'basic', 
                    name: 'Basic Plan', 
                    monthlyPrice: 29.99, 
                    annualPrice: 299.90,
                    features: ['4 Regions', '30 Ports', '90 Vessels', '15 Refineries']
                  },
                  { 
                    id: 'professional', 
                    name: 'Professional Plan', 
                    monthlyPrice: 89.99, 
                    annualPrice: 899.90,
                    features: ['6 Regions', '100+ Ports', '180+ Vessels', '70 Refineries'],
                    popular: true
                  },
                  { 
                    id: 'enterprise', 
                    name: 'Enterprise Plan', 
                    monthlyPrice: 199.99, 
                    annualPrice: 1999.90,
                    features: ['7 Regions', '120+ Ports', '500+ Vessels', 'Full Access']
                  }
                ]).map((plan) => {
                  const discount = discounts.find(d => d.plan_tier === plan.id && d.billing_cycle === formData.billingCycle);
                  const basePrice = formData.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                  const discountedPrice = discount ? basePrice * (100 - discount.discount_percentage) / 100 : basePrice;
                  
                  return (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all relative ${
                      formData.selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border'
                    } ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}
                    onClick={() => handleInputChange('selectedPlan', plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          formData.selectedPlan === plan.id ? 'bg-primary border-primary' : 'border-gray-300'
                        }`}>
                          {formData.selectedPlan === plan.id && (
                            <Check className="h-3 w-3 text-white m-0.5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{plan.name}</h3>
                          <div className="space-y-1">
                            {discount ? (
                              <>
                                <div className="text-lg line-through text-muted-foreground">
                                  ${basePrice.toFixed(2)}
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                  ${discountedPrice.toFixed(2)}
                                  <span className="text-sm font-normal text-muted-foreground">
                                    /{formData.billingCycle === 'annual' ? 'year' : 'month'}
                                  </span>
                                </div>
                                <div className="text-xs text-red-600">
                                  {discount.discount_percentage}% OFF{discount.discount_name ? ` - ${discount.discount_name}` : ''}
                                </div>
                              </>
                            ) : (
                              <div className="text-2xl font-bold text-primary">
                                ${basePrice.toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground">
                                  /{formData.billingCycle === 'annual' ? 'year' : 'month'}
                                </span>
                              </div>
                            )}
                            {formData.billingCycle === 'annual' && (
                              <p className="text-sm text-muted-foreground">
                                ${plan.monthlyPrice}/month when billed annually
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(plan.features || []).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        5-day free trial included
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                <h4 className="font-semibold text-green-800 mb-2">✨ What's Included in Your Free Trial:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Full access to all plan features for 5 days</li>
                  <li>• No credit card required to start</li>
                  <li>• Cancel anytime during trial period</li>
                  <li>• Automatic conversion to paid plan after trial</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Check className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold">Ready to Complete Registration!</h2>
              <p className="text-muted-foreground mb-4">
                You've chosen the {formData.selectedPlan} plan with a 5-day free trial. 
                Payment will be processed securely via Stripe after your trial period.
              </p>
            </div>

            {/* Summary Card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Registration Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Full Name:</span>
                    <span className="font-medium">{formData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Country:</span>
                    <span className="font-medium">{formData.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">
                      {formData.selectedPlan} Plan (5-day free trial)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing:</span>
                    <span className="font-medium">{formData.billingCycle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regions:</span>
                    <span className="font-medium">{formData.selectedRegions.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ports:</span>
                    <span className="font-medium">{formData.selectedPorts.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vessels:</span>
                    <span className="font-medium">{formData.selectedVessels.length} selected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What happens next */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-2">What happens next?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {formData.paymentMethod === 'subscribe_with_trial' ? (
                  <>
                    <li>• Your account will be created instantly</li>
                    <li>• You'll have 5 days of full access to all features</li>
                    <li>• No payment required during trial</li>
                    <li>• You can upgrade to a paid plan anytime</li>
                  </>
                ) : (
                  <>
                    <li>• You'll be redirected to Stripe for secure payment first</li>
                    <li>• Your account will be created after successful payment</li>
                    <li>• Your subscription will be activated immediately</li>
                    <li>• You'll receive a confirmation email with access details</li>
                  </>
                )}
              </ul>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your data is encrypted and secure</span>
                <Shield className="h-4 w-4" />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show verification waiting page if needed
  if (showVerificationWaiting) {
    return (
      <EmailVerificationWaiting 
        email={formData.email}
        onBack={() => setShowVerificationWaiting(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 light">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
              ))}
            </div>
            <Badge variant="outline">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {renderStep()}

          <Separator className="my-6" />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
              >
                {currentStep === 1 ? 'Create Account' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSignUp}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Processing...' : 'Start Free Trial & Subscribe'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={handleLoginRedirect}
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiStepRegistration;
