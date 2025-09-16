import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  EyeOff,
  Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import EmailVerificationWaiting from './EmailVerificationWaiting';
import StripePaymentForm from './StripePaymentForm';

interface Discount {
  id: string;
  discount_percentage: number;
  discount_name: string;
  plan_tier: string;
  billing_cycle: 'monthly' | 'annual';
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
}

interface Vessel {
  id: number;
  name: string;
  mmsi?: string;
  imo?: string;
  vessel_type?: string;
  flag?: string;
  currentport?: string;
  destination?: string;
  loading_port?: string;
  current_region?: string;
  departure_port?: number;
  destination_port?: number;
  status?: string;
  cargo_type?: string;
  owner_name?: string;
  operator_name?: string;
}

interface Port {
  id: number;
  name: string;
  country?: string;
  region?: string;
  city?: string;
}

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
  paymentMethod: 'trial' | 'subscription';
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
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [showVerificationWaiting, setShowVerificationWaiting] = useState(false);
  const [trialPaymentCompleted, setTrialPaymentCompleted] = useState(false);
  const [ports, setPorts] = useState<Port[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [paymentValid, setPaymentValid] = useState(false);
  const [stripePaymentMethod, setStripePaymentMethod] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
    paymentMethod: 'trial',
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
    
    // Check for stored trial user ID
    const storedUserId = localStorage.getItem('trialUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    
    // Check URL parameters for trial payment success
    const urlParams = new URLSearchParams(window.location.search);
    const trialPayment = urlParams.get('trial_payment');
    const paymentSuccess = urlParams.get('payment_success');
    const sessionId = urlParams.get('session_id');
    const pendingActivation = localStorage.getItem('pendingTrialActivation');
    
    if ((trialPayment === 'success' && sessionId) || (paymentSuccess === 'true' && pendingActivation)) {
      // User completed external trial checkout successfully
      const storedUserId = localStorage.getItem('trialUserId');
      const storedEmail = localStorage.getItem('trialUserEmail');
      
      if (storedUserId || storedEmail) {
        // User has completed trial checkout, show step 6 waiting for verification
        setTrialPaymentCompleted(true);
        setCurrentStep(6);
        setFormData(prev => ({ 
          ...prev, 
          paymentMethod: 'trial',
          email: storedEmail || prev.email
        }));
        
        // Store session ID for webhook processing if available
        if (sessionId) {
          localStorage.setItem('trialSessionId', sessionId);
        }
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success message
        toast({
          title: "Payment Complete!",
          description: "Your 5-day free trial has been activated. Welcome to AIVessel!",
        });
        
        // Clean up stored data
        localStorage.removeItem('trialUserId');
        localStorage.removeItem('trialUserEmail');
        localStorage.removeItem('pendingTrialActivation');
      } else {
        // No stored user data, something went wrong
        toast({
          title: "Setup Error",
          description: "There was an issue with your trial setup. Please try again.",
          variant: "destructive"
        });
        setCurrentStep(5); // Go back to payment step
         window.history.replaceState({}, document.title, window.location.pathname);
       }
     } else if (urlParams.get('cancelled') === 'true' || urlParams.get('payment_cancelled') === 'true') {
       // User cancelled the external checkout
       toast({
         title: "Payment Cancelled",
         description: "Your payment was cancelled. You can try again or choose a different option.",
         variant: "destructive"
       });
       
       // Go back to payment step
       setCurrentStep(5);
       
       // Clear URL parameters
       window.history.replaceState({}, document.title, window.location.pathname);
     } else {
      // Check for legacy trial setup success
      const trialSetup = urlParams.get('trial_setup');
      if (trialSetup === 'success') {
        // User completed payment method setup, check for stored registration data
        const trialRegistration = localStorage.getItem('trialRegistration');
        if (trialRegistration) {
          try {
            const data = JSON.parse(trialRegistration);
            if (data.email) {
              // User has completed payment method setup, show step 6 waiting for verification
              setTrialPaymentCompleted(true);
              setCurrentStep(6);
              setFormData(prev => ({ 
                ...prev, 
                paymentMethod: 'trial', 
                email: data.email,
                fullName: data.fullName,
                company: data.company,
                country: data.country,
                selectedRegions: data.selectedRegions,
                selectedPorts: data.selectedPorts,
                selectedVessels: data.selectedVessels
              }));
              // Clear URL parameters
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Show success message
              toast({
                title: "Payment Method Setup Complete",
                description: "Your payment method has been set up successfully. Please complete your registration by creating your account.",
              });
            }
          } catch (error) {
            console.error('Error parsing trial registration data:', error);
            localStorage.removeItem('trialRegistration');
          }
        }
      } else {
        // Check if user is returning from trial payment method setup (fallback)
        const trialRegistration = localStorage.getItem('trialRegistration');
        if (trialRegistration) {
          try {
            const data = JSON.parse(trialRegistration);
            if (data.email) {
              // User has completed payment method setup, show step 6 waiting for verification
              setTrialPaymentCompleted(true);
              setCurrentStep(6);
              setFormData(prev => ({ 
                ...prev, 
                paymentMethod: 'trial', 
                email: data.email,
                fullName: data.fullName,
                company: data.company,
                country: data.country,
                selectedRegions: data.selectedRegions,
                selectedPorts: data.selectedPorts,
                selectedVessels: data.selectedVessels
              }));
            }
          } catch (error) {
            console.error('Error parsing trial registration data:', error);
            localStorage.removeItem('trialRegistration');
          }
        }
      }
    }

    // Check for cancelled or failed payment scenarios
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    if (pendingRegistration) {
      try {
        const registrationData = JSON.parse(pendingRegistration);
        // If user has pending registration data but is back on registration page,
        // they likely cancelled payment or payment failed
        if (registrationData.subscription_type === 'paid') {
          toast({
            title: "Payment Cancelled",
            description: "Your payment was cancelled. You can try again or choose the free trial option.",
            variant: "destructive"
          });
          
          // Restore form data so user doesn't have to re-enter everything
          setFormData(prev => ({
            ...prev,
            email: registrationData.email || '',
            fullName: registrationData.fullName || '',
            company: registrationData.company || '',
            country: registrationData.country || '',
            selectedRegions: registrationData.selectedRegions || [],
            selectedPorts: registrationData.selectedPorts || [],
            selectedVessels: registrationData.selectedVessels || [],
            selectedPlan: registrationData.selectedPlan || '',
            billingCycle: registrationData.billingCycle || 'monthly',
            paymentMethod: 'subscription'
          }));
          
          // Set to payment step so user can try again or choose trial
          setCurrentStep(5);
          
          // Clean up the pending registration after a delay to allow user to see the message
          setTimeout(() => {
            localStorage.removeItem('pendingRegistration');
          }, 5000);
        }
      } catch (error) {
        console.error('Error parsing pending registration data:', error);
        localStorage.removeItem('pendingRegistration');
      }
    }
  }, []);



  const fetchPreviewData = async () => {
    setDataLoading(true);
    setDataError(null);
    
    try {
      // Fetch regions from filter management, ports, vessels, and discounts for selection
      const [regionsRes, portsRes, vesselsRes, discountsRes] = await Promise.all([
        supabase.from('filter_options').select('label').eq('filter_type', 'region').eq('is_active', true).order('sort_order'),
        supabase.from('ports').select('id, name, country, region').limit(20),
        supabase.from('vessels').select('id, name, vessel_type, flag').limit(50),
        supabase.from('subscription_discounts').select('*').eq('is_active', true)
      ]);

      // Check for errors in any of the responses
      if (regionsRes.error) {
        throw new Error('Failed to load regions data');
      }
      if (portsRes.error) {
        throw new Error('Failed to load ports data');
      }
      if (vesselsRes.error) {
        throw new Error('Failed to load vessels data');
      }
      if (discountsRes.error) {
        console.warn('Failed to load discounts data:', discountsRes.error);
      }

      // Set data if successful
      if (regionsRes.data) {
        setRegions(regionsRes.data.map(r => r.label));
      } else {
        // Fallback to hardcoded regions
        setRegions(['Europe', 'North America', 'Asia Pacific', 'Middle East', 'Africa', 'South America']);
      }
      
      if (portsRes.data) {
        setPorts(portsRes.data);
      }
      
      if (vesselsRes.data && vesselsRes.data.length > 0) {
        setVessels(vesselsRes.data);
      } else {
        // Fallback sample vessels when database is empty
        const sampleVessels = [
          { id: 1, name: 'Atlantic Pioneer', vessel_type: 'Oil Tanker', flag: 'Liberia' },
          { id: 2, name: 'Pacific Explorer', vessel_type: 'Bulk Carrier', flag: 'Panama' },
          { id: 3, name: 'Mediterranean Star', vessel_type: 'Container Ship', flag: 'Marshall Islands' },
          { id: 4, name: 'Nordic Voyager', vessel_type: 'Oil Tanker', flag: 'Norway' },
          { id: 5, name: 'Arabian Gulf', vessel_type: 'LNG Carrier', flag: 'Qatar' },
          { id: 6, name: 'Baltic Trader', vessel_type: 'Bulk Carrier', flag: 'Denmark' },
          { id: 7, name: 'Caribbean Queen', vessel_type: 'Cruise Ship', flag: 'Bahamas' },
          { id: 8, name: 'Asian Dragon', vessel_type: 'Container Ship', flag: 'Singapore' },
          { id: 9, name: 'European Express', vessel_type: 'Ferry', flag: 'Greece' },
          { id: 10, name: 'American Eagle', vessel_type: 'Oil Tanker', flag: 'USA' }
        ];
        setVessels(sampleVessels);
      }
      
      if (discountsRes.data) {
        setDiscounts(discountsRes.data);
      }
      
      setDataLoading(false);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Failed to load data. Please try again.');
      
      // Fallback to hardcoded regions if fetch fails
      setRegions(['Europe', 'North America', 'Asia Pacific', 'Middle East', 'Africa', 'South America']);
      
      // Fallback sample vessels when database connection fails
      const sampleVessels = [
        { id: 1, name: 'Atlantic Pioneer', vessel_type: 'Oil Tanker', flag: 'Liberia' },
        { id: 2, name: 'Pacific Explorer', vessel_type: 'Bulk Carrier', flag: 'Panama' },
        { id: 3, name: 'Mediterranean Star', vessel_type: 'Container Ship', flag: 'Marshall Islands' },
        { id: 4, name: 'Nordic Voyager', vessel_type: 'Oil Tanker', flag: 'Norway' },
        { id: 5, name: 'Arabian Gulf', vessel_type: 'LNG Carrier', flag: 'Qatar' },
        { id: 6, name: 'Baltic Trader', vessel_type: 'Bulk Carrier', flag: 'Denmark' },
        { id: 7, name: 'Caribbean Queen', vessel_type: 'Cruise Ship', flag: 'Bahamas' },
        { id: 8, name: 'Asian Dragon', vessel_type: 'Container Ship', flag: 'Singapore' },
        { id: 9, name: 'European Express', vessel_type: 'Ferry', flag: 'Greece' },
        { id: 10, name: 'American Eagle', vessel_type: 'Oil Tanker', flag: 'USA' }
      ];
      setVessels(sampleVessels);
      
      setDataLoading(false);
    }
  };

  // Discount helper functions
  const getDiscountForPlan = (planName: string, billingCycle: 'monthly' | 'annual') => {
    return discounts.find(discount => 
      discount.plan_tier === planName && 
      discount.billing_cycle === billingCycle
    );
  };

  const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100);
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
      const allVesselIds = vessels.slice(0, 10).map(vessel => vessel.id.toString());
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
        if (formData.paymentMethod === 'subscription') {
          return !!formData.selectedPlan; // Must select a plan for subscription
        }
        return !!formData.paymentMethod;
      case 6:
        // For trial users adding payment method with Stripe
        if (formData.paymentMethod === 'trial') {
          return paymentValid && stripePaymentMethod;
        }
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
      
      // For trial users, after step 5, setup payment method first
      if (currentStep === 5 && formData.paymentMethod === 'trial') {
        handleTrialPaymentSetup();
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

  const handleTrialPaymentSetup = async () => {
    setLoading(true);
    try {
      // Create user account first for trial users
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
          data: {
            full_name: formData.fullName,
            company: formData.company,
            country: formData.country,
            selected_regions: formData.selectedRegions,
            selected_ports: formData.selectedPorts,
            selected_vessels: formData.selectedVessels,
            subscription_type: 'trial'
          }
        }
      });

      if (error) {
        console.error('Trial signup error:', error);
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      // Store user ID for payment setup
      setUserId(data.user.id);
      localStorage.setItem('trialUserId', data.user.id);
      
      // Go directly to step 6 for payment setup
      setCurrentStep(6);
      toast({
        title: "Free Trial Setup",
        description: "Please add your payment method to start your 5-day free trial.",
        });
    } catch (error) {
      console.error('Failed to setup trial:', error);
      toast({
        title: "Trial Setup Failed",
        description: `Error: ${error.message || 'Unable to setup trial. Please try again.'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentMethod: any) => {
    setStripePaymentMethod(paymentMethod);
    setPaymentValid(true);
    toast({
      title: "Payment Method Added",
      description: "Your payment method has been successfully added.",
    });
  };

  const handlePaymentValidationChange = (isValid: boolean) => {
    setPaymentValid(isValid);
  };

  const handleSignUp = async () => {
    // Prevent duplicate registration attempts
    if (loading) {
      toast({
        title: "Registration in Progress",
        description: "Please wait while we process your registration.",
        variant: "default"
      });
      return;
    }
    
    setLoading(true);
    try {
      // For free trial users, redirect to payment method setup
      if (formData.paymentMethod === 'trial') {
        await handleTrialPaymentSetup();
        return;
      }
      
      // For subscription users, create account and proceed with payment
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
          data: {
            full_name: formData.fullName,
            company: formData.company,
            country: formData.country,
            selected_regions: formData.selectedRegions,
            selected_ports: formData.selectedPorts,
            selected_vessels: formData.selectedVessels,
            subscription_type: 'paid'
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

      // If user chose paid subscription, handle payment first
      if (formData.paymentMethod === 'subscription' && formData.selectedPlan) {
        // Store registration data temporarily in localStorage
        const registrationData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          company: formData.company,
          country: formData.country,
          selectedRegions: formData.selectedRegions,
          selectedPorts: formData.selectedPorts,
          selectedVessels: formData.selectedVessels,
          selectedPlan: formData.selectedPlan,
          billingCycle: formData.billingCycle,
          subscription_type: 'paid'
        };
        
        localStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
        
        // Create Stripe checkout session for payment
        try {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
            body: { 
              tier: formData.selectedPlan, 
              billing_cycle: formData.billingCycle,
              email: formData.email
            }
          });
          
          if (checkoutError) {
            console.error('Checkout error:', checkoutError);
            toast({
              title: "Payment Setup Failed",
              description: "Unable to create payment session. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          if (checkoutData?.url) {
            toast({
              title: "Redirecting to Payment",
              description: "You'll complete registration after successful payment.",
            });
            // Redirect to Stripe checkout - registration will complete after payment
            window.location.href = checkoutData.url;
            return;
          } else {
            toast({
              title: "Payment Setup Failed", 
              description: "No checkout URL received. Please try again.",
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error('Failed to create checkout:', error);
          toast({
            title: "Payment Setup Failed",
            description: "Unable to process payment. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      // This should not be reached as both trial and subscription are handled above
       console.error('Unexpected payment method:', formData.paymentMethod);
       toast({
         title: "Invalid Payment Method",
         description: "Please select a valid payment option.",
         variant: "destructive"
       });
       return;
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
                  I agree to{' '}
                  <Link to="/policies" className="text-blue-400 hover:text-blue-300 underline">
                    Terms
                  </Link>
                  {' '}&{' '}
                  <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">
                    Privacy Policy
                  </Link>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('ports')}
                  >
                    SELECT ALL
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                  {dataLoading ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                      <p>Loading ports...</p>
                    </div>
                  ) : dataError ? (
                    <div className="text-center py-4 text-sm text-red-600">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Error loading ports</p>
                      <p className="text-xs mt-1">{dataError}</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={fetchPreviewData}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : ports.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No ports available yet.</p>
                      <p className="text-xs mt-1">You can add ports after registration.</p>
                    </div>
                  ) : (
                    ports.slice(0, 10).map((port) => (
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
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.selectedPorts.length} ports
                </p>
              </div>

              {/* Vessels Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-medium">Vessels to Track</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('vessels')}
                  >
                    SELECT ALL
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-3">
                  {dataLoading ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50 animate-spin" />
                      <p>Loading vessels...</p>
                    </div>
                  ) : dataError ? (
                    <div className="text-center py-4 text-sm text-red-600">
                      <Ship className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Error loading vessels</p>
                      <p className="text-xs mt-1">{dataError}</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={fetchPreviewData}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : vessels.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Ship className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No vessels available yet.</p>
                      <p className="text-xs mt-1">You can add vessels after registration.</p>
                    </div>
                  ) : (
                    vessels.slice(0, 10).map((vessel) => (
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
                          <span className="font-medium">{vessel.name || 'Unnamed Vessel'}</span>
                          <span className="text-muted-foreground block text-xs">
                            {vessel.vessel_type || 'Unknown Type'} • {vessel.flag || 'Unknown Flag'}
                          </span>
                        </Label>
                      </div>
                    ))
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
              {/* Free Trial Option */}
              <Card 
                className={`cursor-pointer transition-all ${
                  formData.paymentMethod === 'trial' ? 'border-green-500 bg-green-50/50' : 'border-border'
                }`}
                onClick={() => {
                  handleInputChange('paymentMethod', 'trial');
                  handleInputChange('selectedPlan', undefined);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.paymentMethod === 'trial' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {formData.paymentMethod === 'trial' && (
                        <Check className="h-3 w-3 text-white m-0.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Free 5-Day Trial</h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Recommended
                      </Badge>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Full features access
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Real-time tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Payment method required
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      No charges during trial
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Direct Subscription Option */}
              <Card 
                className={`cursor-pointer transition-all ${
                  formData.paymentMethod === 'subscription' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => handleInputChange('paymentMethod', 'subscription')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.paymentMethod === 'subscription' ? 'bg-primary border-primary' : 'border-gray-300'
                    }`}>
                      {formData.paymentMethod === 'subscription' && (
                        <Check className="h-3 w-3 text-white m-0.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Subscribe to a Paid Plan</h3>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Instant activation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Advanced features
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    Choose your subscription plan below.
                  </p>
                </CardContent>
              </Card>

              {/* Show subscription plans if subscription is selected */}
              {formData.paymentMethod === 'subscription' && (
                <div className="mt-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">Select Your Plan</h3>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <span className={`text-sm font-medium ${formData.billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground'}`}>
                        Monthly
                      </span>
                      <div 
                        className="relative inline-flex items-center cursor-pointer"
                        onClick={() => handleInputChange('billingCycle', formData.billingCycle === 'monthly' ? 'annual' : 'monthly')}
                      >
                        <div className={`w-11 h-6 rounded-full ${formData.billingCycle === 'annual' ? 'bg-primary' : 'bg-gray-300'} transition-colors`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.billingCycle === 'annual' ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`}></div>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${formData.billingCycle === 'annual' ? 'text-primary' : 'text-muted-foreground'}`}>
                        Annual
                      </span>
                      {formData.billingCycle === 'annual' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Save 17%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {/* Basic Plan */}
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.selectedPlan === 'basic' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleInputChange('selectedPlan', 'basic')}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Basic Plan</h4>
                            <p className="text-sm text-muted-foreground">Perfect for small brokers</p>
                          </div>
                          <div className="text-right">
                            {(() => {
                              const originalPrice = formData.billingCycle === 'annual' ? 24.99 : 29.99;
                              const discount = getDiscountForPlan('basic', formData.billingCycle);
                              const discountedPrice = discount ? calculateDiscountedPrice(originalPrice, discount.discount_percentage) : originalPrice;
                              
                              return (
                                <>
                                  {discount && (
                                    <div className="text-xs text-red-500 line-through">
                                      ${originalPrice.toFixed(2)}
                                    </div>
                                  )}
                                  <div className="text-lg font-bold">
                                    ${discountedPrice.toFixed(2)}
                                    <span className="text-sm font-normal text-muted-foreground">
                                      /{formData.billingCycle === 'annual' ? 'month' : 'month'}
                                    </span>
                                  </div>
                                  {discount && (
                                    <div className="text-xs text-green-600">
                                      {discount.discount_percentage}% OFF - {discount.discount_name}
                                    </div>
                                  )}
                                  {formData.billingCycle === 'annual' && !discount && (
                                    <div className="text-xs text-green-600">Save $60/year</div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <li>• 4 Regions Coverage</li>
                          <li>• 30 Global Ports</li>
                          <li>• 90 Vessels Tracking</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Premium Plan */}
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.selectedPlan === 'premium' ? 'border-primary bg-primary/5' : 'border-border'
                      } relative`}
                      onClick={() => handleInputChange('selectedPlan', 'premium')}
                    >
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Premium Plan</h4>
                            <p className="text-sm text-muted-foreground">For growing firms</p>
                          </div>
                          <div className="text-right">
                            {(() => {
                              const originalPrice = formData.billingCycle === 'annual' ? 74.99 : 89.99;
                              const discount = getDiscountForPlan('premium', formData.billingCycle);
                              const discountedPrice = discount ? calculateDiscountedPrice(originalPrice, discount.discount_percentage) : originalPrice;
                              
                              return (
                                <>
                                  {discount && (
                                    <div className="text-xs text-red-500 line-through">
                                      ${originalPrice.toFixed(2)}
                                    </div>
                                  )}
                                  <div className="text-lg font-bold">
                                    ${discountedPrice.toFixed(2)}
                                    <span className="text-sm font-normal text-muted-foreground">
                                      /{formData.billingCycle === 'annual' ? 'month' : 'month'}
                                    </span>
                                  </div>
                                  {discount && (
                                    <div className="text-xs text-green-600">
                                      {discount.discount_percentage}% OFF - {discount.discount_name}
                                    </div>
                                  )}
                                  {formData.billingCycle === 'annual' && !discount && (
                                    <div className="text-xs text-green-600">Save $180/year</div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <li>• 6 Regions Coverage</li>
                          <li>• 100+ Global Ports</li>
                          <li>• 180+ Vessels Tracking</li>
                          <li>• Advanced Documents</li>
                          <li>• Multi-User Access (5 seats)</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Enterprise Plan */}
                    <Card 
                      className={`cursor-pointer transition-all ${
                        formData.selectedPlan === 'enterprise' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleInputChange('selectedPlan', 'enterprise')}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">Enterprise Plan</h4>
                            <p className="text-sm text-muted-foreground">For large corporations</p>
                          </div>
                          <div className="text-right">
                            {(() => {
                              const discount = getDiscountForPlan('enterprise', formData.billingCycle);
                              const originalPrice = formData.billingCycle === 'annual' ? 166.66 : 199.99;
                              const discountedPrice = discount ? calculateDiscountedPrice(originalPrice, discount.discount_percentage) : originalPrice;
                              const hasDiscount = discount && discountedPrice < originalPrice;
                              
                              return (
                                <>
                                  <div className="text-lg font-bold">
                                    {hasDiscount && (
                                      <div className="text-sm line-through text-muted-foreground mb-1">
                                        ${originalPrice.toFixed(2)}
                                      </div>
                                    )}
                                    ${discountedPrice.toFixed(2)}
                                    <span className="text-sm font-normal text-muted-foreground">
                                      /{formData.billingCycle === 'annual' ? 'month' : 'month'}
                                    </span>
                                  </div>
                                  {hasDiscount ? (
                                    <div className="text-xs text-green-600">
                                      {discount.discount_percentage}% off - {discount.discount_name}
                                    </div>
                                  ) : formData.billingCycle === 'annual' ? (
                                    <div className="text-xs text-green-600">Save $400/year</div>
                                  ) : null}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                          <li>• 7 Global Regions</li>
                          <li>• 120+ Global Ports</li>
                          <li>• 500+ Vessels Real-Time</li>
                          <li>• Complete Documentation Suite</li>
                          <li>• API Integration</li>
                          <li>• 24/7 Dedicated Support</li>
                          <li>• Corporate Access (20+ users)</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              {formData.paymentMethod === 'trial' ? (
                <>
                  <CreditCard className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <h2 className="text-2xl font-bold">Complete Your Free Trial Setup</h2>
                  <p className="text-muted-foreground mb-4">
                    Add your payment method to start your 5-day free trial. You won't be charged until the trial ends.
                  </p>
                </>
              ) : (
                <>
                  <Check className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <h2 className="text-2xl font-bold">Ready to Complete Registration!</h2>
                  <p className="text-muted-foreground mb-4">
                    You've selected the {formData.selectedPlan} plan ({formData.billingCycle} billing). Payment will be processed securely via Stripe.
                  </p>
                </>
              )}
            </div>

            {/* Payment form for trial users */}
            {formData.paymentMethod === 'trial' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">5-Day Free Trial</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    No charges for 5 days. Cancel anytime during the trial period.
                  </p>
                </div>

                <StripePaymentForm 
                  onPaymentSuccess={handlePaymentSuccess}
                  onValidationChange={handlePaymentValidationChange}
                  loading={loading}
                  customerEmail={formData.email}
                  userId={userId || 'temp-' + Date.now()}
                />

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.termsAgreed}
                    onCheckedChange={(checked) => handleInputChange('termsAgreed', checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-5">
                    I agree to{' '}
                    <Link to="/policies" className="text-blue-400 hover:text-blue-300 underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300 underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>
            )}

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
                      {formData.paymentMethod === 'trial' ? 'Free 5-Day Trial' : `${formData.selectedPlan} Plan`}
                    </span>
                  </div>
                  {formData.paymentMethod === 'subscription' && (
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span className="font-medium">{formData.billingCycle}</span>
                    </div>
                  )}
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
                {formData.paymentMethod === 'trial' ? (
                  <>
                    <li>• You'll setup a payment method (required for security)</li>
                    <li>• Your account will be created after payment method setup</li>
                    <li>• Check your email and click the verification link</li>
                    <li>• Once verified, you'll get 5 days of full access to all features</li>
                    <li>• No charges during trial period</li>
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
        isTrialUser={formData.paymentMethod === 'trial'}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {/* Add Start Over button for payment step */}
              {currentStep === 5 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear form data and start over
                    setFormData({
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
                      paymentMethod: 'trial',
                      selectedPlan: undefined,
                      billingCycle: 'monthly',
                      cardNumber: '',
                      expiryDate: '',
                      cvv: '',
                      cardholderName: ''
                    });
                    setCurrentStep(1);
                    // Clean up any pending registration data
                    localStorage.removeItem('pendingRegistration');
                    toast({
                      title: "Form Reset",
                      description: "Starting fresh with a clean form.",
                    });
                  }}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Start Over
                </Button>
              )}
            </div>

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
                disabled={loading || !validateStep(currentStep)}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Processing...' : 
                 formData.paymentMethod === 'trial' ? 'Start Free Trial' : 'Proceed to Payment'}
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
