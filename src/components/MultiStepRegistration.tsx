import React, { useState, useEffect, useRef } from 'react';
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
  Anchor,
  IdCard,
  Lock,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Factory,
  FileText,
  Zap,
  Crown,
  Users,
  BarChart3,
  Phone,
  Calculator,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/contexts/AccessContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import EmailVerificationWaiting from './EmailVerificationWaiting';
import SponsorBanner from './SponsorBanner';
import zxcvbn from 'zxcvbn';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';

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
  securityAnswer: string;
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
  const [promotionFrame, setPromotionFrame] = useState<PromotionFrame | null>(null);
  const [securityQuestion, setSecurityQuestion] = useState({ num1: 0, num2: 0 });
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
    billingCycle: 'annual', // Default to annual
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    securityAnswer: ''
  });
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const emailCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generate random security question
  useEffect(() => {
    generateSecurityQuestion();
  }, []);

  const generateSecurityQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setSecurityQuestion({ num1, num2 });
  };

  const isSecurityAnswerCorrect = () => {
    const correctAnswer = securityQuestion.num1 + securityQuestion.num2;
    return parseInt(formData.securityAnswer) === correctAnswer;
  };

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
    { code: '+1', country: 'United States/Canada' },
    { code: '+44', country: 'United Kingdom' },
    { code: '+91', country: 'India' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+86', country: 'China' },
    { code: '+7', country: 'Russia' },
    { code: '+82', country: 'South Korea' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+971', country: 'United Arab Emirates' },
    { code: '+20', country: 'Egypt' },
    { code: '+90', country: 'Turkey' },
    { code: '+62', country: 'Indonesia' },
    { code: '+234', country: 'Nigeria' },
    { code: '+27', country: 'South Africa' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+63', country: 'Philippines' },
    { code: '+60', country: 'Malaysia' },
    { code: '+65', country: 'Singapore' },
    { code: '+64', country: 'New Zealand' },
    // Europe
    { code: '+351', country: 'Portugal' },
    { code: '+353', country: 'Ireland' },
    { code: '+354', country: 'Iceland' },
    { code: '+352', country: 'Luxembourg' },
    { code: '+32', country: 'Belgium' },
    { code: '+31', country: 'Netherlands' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+358', country: 'Finland' },
    { code: '+48', country: 'Poland' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+36', country: 'Hungary' },
    { code: '+40', country: 'Romania' },
    { code: '+359', country: 'Bulgaria' },
    { code: '+385', country: 'Croatia' },
    { code: '+381', country: 'Serbia' },
    { code: '+386', country: 'Slovenia' },
    { code: '+421', country: 'Slovakia' },
    { code: '+370', country: 'Lithuania' },
    { code: '+371', country: 'Latvia' },
    { code: '+372', country: 'Estonia' },
    { code: '+30', country: 'Greece' },
    { code: '+356', country: 'Malta' },
    { code: '+357', country: 'Cyprus' },
    { code: '+380', country: 'Ukraine' },
    { code: '+375', country: 'Belarus' },
    // Middle East
    { code: '+964', country: 'Iraq' },
    { code: '+98', country: 'Iran' },
    { code: '+962', country: 'Jordan' },
    { code: '+961', country: 'Lebanon' },
    { code: '+973', country: 'Bahrain' },
    { code: '+965', country: 'Kuwait' },
    { code: '+968', country: 'Oman' },
    { code: '+974', country: 'Qatar' },
    { code: '+967', country: 'Yemen' },
    { code: '+963', country: 'Syria' },
    { code: '+970', country: 'Palestine' },
    // Africa
    { code: '+233', country: 'Ghana' },
    { code: '+251', country: 'Ethiopia' },
    { code: '+255', country: 'Tanzania' },
    { code: '+237', country: 'Cameroon' },
    { code: '+254', country: 'Kenya' },
    { code: '+212', country: 'Morocco' },
    { code: '+213', country: 'Algeria' },
    { code: '+216', country: 'Tunisia' },
    { code: '+218', country: 'Libya' },
    { code: '+249', country: 'Sudan' },
    { code: '+256', country: 'Uganda' },
    { code: '+225', country: 'Ivory Coast' },
    { code: '+221', country: 'Senegal' },
    { code: '+244', country: 'Angola' },
    { code: '+258', country: 'Mozambique' },
    { code: '+260', country: 'Zambia' },
    { code: '+263', country: 'Zimbabwe' },
    // Americas
    { code: '+54', country: 'Argentina' },
    { code: '+56', country: 'Chile' },
    { code: '+57', country: 'Colombia' },
    { code: '+51', country: 'Peru' },
    { code: '+58', country: 'Venezuela' },
    { code: '+593', country: 'Ecuador' },
    { code: '+591', country: 'Bolivia' },
    { code: '+595', country: 'Paraguay' },
    { code: '+598', country: 'Uruguay' },
    { code: '+506', country: 'Costa Rica' },
    { code: '+507', country: 'Panama' },
    { code: '+1876', country: 'Jamaica' },
    { code: '+1868', country: 'Trinidad and Tobago' },
    { code: '+502', country: 'Guatemala' },
    { code: '+503', country: 'El Salvador' },
    { code: '+504', country: 'Honduras' },
    { code: '+505', country: 'Nicaragua' },
    // South/Central Asia
    { code: '+92', country: 'Pakistan' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+977', country: 'Nepal' },
    { code: '+93', country: 'Afghanistan' },
    // Southeast Asia
    { code: '+84', country: 'Vietnam' },
    { code: '+855', country: 'Cambodia' },
    { code: '+95', country: 'Myanmar' },
    { code: '+856', country: 'Laos' },
    { code: '+66', country: 'Thailand' },
    { code: '+886', country: 'Taiwan' },
    { code: '+852', country: 'Hong Kong' },
    // Pacific
    { code: '+679', country: 'Fiji' },
    { code: '+675', country: 'Papua New Guinea' },
  ].sort((a, b) => a.country.localeCompare(b.country));

  const codeToCountry: Record<string, string> = {
    '+1': 'US', '+44': 'GB', '+91': 'IN', '+61': 'AU', '+81': 'JP',
    '+49': 'DE', '+33': 'FR', '+39': 'IT', '+34': 'ES', '+86': 'CN',
    '+7': 'RU', '+82': 'KR', '+966': 'SA', '+971': 'AE', '+20': 'EG',
    '+90': 'TR', '+62': 'ID', '+234': 'NG', '+27': 'ZA', '+55': 'BR',
    '+52': 'MX', '+63': 'PH', '+60': 'MY', '+65': 'SG', '+64': 'NZ',
    '+351': 'PT', '+353': 'IE', '+354': 'IS', '+352': 'LU', '+32': 'BE',
    '+31': 'NL', '+41': 'CH', '+43': 'AT', '+46': 'SE', '+47': 'NO',
    '+45': 'DK', '+358': 'FI', '+48': 'PL', '+420': 'CZ', '+36': 'HU',
    '+40': 'RO', '+359': 'BG', '+385': 'HR', '+381': 'RS', '+386': 'SI',
    '+421': 'SK', '+370': 'LT', '+371': 'LV', '+372': 'EE', '+30': 'GR',
    '+356': 'MT', '+357': 'CY', '+380': 'UA', '+375': 'BY',
    '+964': 'IQ', '+98': 'IR', '+962': 'JO', '+961': 'LB', '+973': 'BH',
    '+965': 'KW', '+968': 'OM', '+974': 'QA', '+967': 'YE', '+963': 'SY',
    '+970': 'PS',
    '+233': 'GH', '+251': 'ET', '+255': 'TZ', '+237': 'CM', '+254': 'KE',
    '+212': 'MA', '+213': 'DZ', '+216': 'TN', '+218': 'LY', '+249': 'SD',
    '+256': 'UG', '+225': 'CI', '+221': 'SN', '+244': 'AO', '+258': 'MZ',
    '+260': 'ZM', '+263': 'ZW',
    '+54': 'AR', '+56': 'CL', '+57': 'CO', '+51': 'PE', '+58': 'VE',
    '+593': 'EC', '+591': 'BO', '+595': 'PY', '+598': 'UY',
    '+506': 'CR', '+507': 'PA', '+1876': 'JM', '+1868': 'TT',
    '+502': 'GT', '+503': 'SV', '+504': 'HN', '+505': 'NI',
    '+92': 'PK', '+880': 'BD', '+94': 'LK', '+977': 'NP', '+93': 'AF',
    '+84': 'VN', '+855': 'KH', '+95': 'MM', '+856': 'LA', '+66': 'TH',
    '+886': 'TW', '+852': 'HK',
    '+679': 'FJ', '+675': 'PG',
  };

  function validatePhoneNumber(phone: string, countryCode: string) {
    if (!phone) return false;
    const country = codeToCountry[countryCode];
    if (!country) return false;
    const phoneNumber = parsePhoneNumberFromString(phone, country as CountryCode);
    return phoneNumber ? phoneNumber.isValid() : false;
  }

  const isPhoneValid = validatePhoneNumber(formData.phone, formData.countryCode);
  const totalSteps = 6;

  // Password strength calculation
  const passwordStrength = formData.password ? (() => {
    const result = zxcvbn(formData.password);
    const strengthMap = [
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-orange-500' },
      { label: 'Good', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-green-500' },
      { label: 'Very Strong', color: 'bg-emerald-600' }
    ];
    return { ...strengthMap[result.score], score: result.score };
  })() : { label: '', color: '', score: 0 };

  useEffect(() => {
    fetchPreviewData();
    fetchDynamicPricing();
    fetchPromotionFrame();
  }, []);

  useEffect(() => {
    filterVesselsBySelectedPorts();
  }, [formData.selectedPorts, vessels]);

  useEffect(() => {
    if (!formData.email) {
      setEmailExists(null);
      return;
    }
    if (emailCheckTimeout.current) clearTimeout(emailCheckTimeout.current);
    emailCheckTimeout.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('get_users_with_roles');
      if (error) {
        setEmailExists(null);
        return;
      }
      const exists = data?.some((user: any) => user.email?.toLowerCase() === formData.email.toLowerCase());
      setEmailExists(!!exists);
    }, 500);
  }, [formData.email]);

  const fetchPromotionFrame = async () => {
    try {
      const { data, error } = await supabase
        .from('promotion_frames')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_registration', true)
        .gte('end_date', new Date().toISOString())
        .lte('start_date', new Date().toISOString())
        .order('discount_value', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && !error) {
        setPromotionFrame(data[0]);
      }
    } catch (error) {
      // No active promotion
    }
  };

  const fetchDynamicPricing = async () => {
    try {
      const [plansRes, discountsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('subscription_discounts').select('*').eq('is_active', true).or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
      ]);

      if (plansRes.data) setDynamicPlans(plansRes.data);
      if (discountsRes.data) setDiscounts(discountsRes.data);
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchPreviewData = async () => {
    try {
      const [regionsRes, portsRes, vesselsRes] = await Promise.all([
        supabase.from('filter_options').select('label').eq('filter_type', 'region').eq('is_active', true).order('sort_order'),
        supabase.from('ports').select('*'),
        supabase.from('vessels').select('*')
      ]);

      if (regionsRes.data) setRegions(regionsRes.data.map(r => r.label));
      if (portsRes.data) setPorts(portsRes.data);
      if (vesselsRes.data) {
        setVessels(vesselsRes.data);
        setFilteredVessels([]);
      }
    } catch (error) {
      setRegions(['Europe', 'North America', 'Asia Pacific', 'Middle East', 'Africa', 'South America']);
    }
  };

  const filterVesselsBySelectedPorts = () => {
    if (formData.selectedPorts.length === 0) {
      setFilteredVessels([]);
      return;
    }

    const selectedPorts = ports.filter(port => formData.selectedPorts.includes(port.id.toString()));
    const selectedPortIds = formData.selectedPorts.map(id => parseInt(id));
    
    if (selectedPorts.length === 0) {
      setFilteredVessels([]);
      return;
    }

    const directIdMatches = vessels.filter(vessel => 
      vessel.port_id && selectedPortIds.includes(vessel.port_id)
    );

    if (directIdMatches.length > 0) {
      setFilteredVessels(directIdMatches.slice(0, 12));
      return;
    }

    setFilteredVessels(vessels.slice(0, 12));
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

  // Updated Select All with toggle functionality
  const handleSelectAll = (type: 'ports' | 'vessels') => {
    if (type === 'ports') {
      const allPortIds = ports.map(port => port.id.toString());
      const allSelected = allPortIds.every(id => formData.selectedPorts.includes(id));
      if (allSelected) {
        // Unselect all
        setFormData(prev => ({ ...prev, selectedPorts: [] }));
      } else {
        // Select all
        setFormData(prev => ({ ...prev, selectedPorts: allPortIds }));
      }
    } else {
      // Use ALL vessels, not just filtered
      const allVesselIds = vessels.map(vessel => vessel.id.toString());
      const allSelected = allVesselIds.every(id => formData.selectedVessels.includes(id));
      if (allSelected) {
        // Unselect all
        setFormData(prev => ({ ...prev, selectedVessels: [] }));
      } else {
        // Select all
        setFormData(prev => ({ ...prev, selectedVessels: allVesselIds }));
      }
    }
  };

  // Updated Choose 8 Best with random selection
  const handleSelectBest8 = (type: 'ports' | 'vessels') => {
    if (type === 'ports') {
      const shuffled = [...ports].sort(() => Math.random() - 0.5);
      const best8PortIds = shuffled.slice(0, 8).map(port => port.id.toString());
      setFormData(prev => ({ ...prev, selectedPorts: best8PortIds }));
    } else {
      // Use ALL vessels for random selection
      const shuffled = [...vessels].sort(() => Math.random() - 0.5);
      const best8VesselIds = shuffled.slice(0, 8).map(vessel => vessel.id.toString());
      setFormData(prev => ({ ...prev, selectedVessels: best8VesselIds }));
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && isValidEmail(formData.email) && formData.password && formData.confirmPassword && formData.termsAgreed && isSecurityAnswerCorrect()) && emailExists !== true;
      case 2:
        return !!(formData.fullName && formData.phone && formData.country) && isPhoneValid;
      case 3:
        return formData.selectedRegions.length > 0;
      case 4:
        return true; // Allow skipping
      case 5:
        return !!formData.selectedPlan;
      case 6:
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
      if (currentStep === 1 && !isSecurityAnswerCorrect()) {
        toast({
          title: "Security Verification Failed",
          description: "Please enter the correct answer to the math question.",
          variant: "destructive"
        });
        generateSecurityQuestion();
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
      if (formData.paymentMethod === 'subscribe_with_trial' && formData.selectedPlan) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive"
          });
          return;
        }

        // SECURITY: Never store passwords in sessionStorage
        // Store only non-sensitive registration data
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
          // Password intentionally NOT stored - will be re-entered after payment
        };
        
        sessionStorage.setItem('pendingRegistration', JSON.stringify(registrationData));
        
        try {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
            body: { 
              tier: formData.selectedPlan, 
              billing_cycle: formData.billingCycle,
              email: formData.email,
              payment_type: 'subscription_with_trial',
              trial_days: 5
            }
          });
          
          if (checkoutError) {
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
          toast({
            title: "Setup Failed",
            description: "Unable to process request. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

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
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        try {
          await supabase.functions.invoke('send-confirmation-email', {
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
        } catch (emailError) {
          // Continue anyway
        }

        if (!data.session) {
          toast({
            title: "Registration Successful!",
            description: `Please check your email to verify your account.`,
          });
          setShowVerificationWaiting(true);
        } else {
          toast({
            title: "Registration Successful!",
            description: `Welcome to PetroDealHub!`,
          });

          if (formData.selectedPlan) {
            navigate(`/subscription?plan=${formData.selectedPlan}`);
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (error) {
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

  // Show verification waiting page if needed
  if (showVerificationWaiting) {
    return <EmailVerificationWaiting email={formData.email} onBack={() => setShowVerificationWaiting(false)} />;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Sponsor Banner */}
            <SponsorBanner location="registration" className="mb-4 bg-muted/30 rounded-lg border border-border/50" />

            <div className="text-center mb-6">
              <UserPlus className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Create your PetroDealHub account</h2>
              <p className="text-muted-foreground mt-2">
                Secure access to real-time oil market intelligence
              </p>
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
                  className={`mt-1 ${formData.email && !isValidEmail(formData.email) ? 'border-red-500' : ''}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll use this email for login and important notifications
                </p>
                {formData.email && !isValidEmail(formData.email) && (
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Please enter a valid email address (e.g., name@example.com)
                  </div>
                )}
                {emailExists === true && isValidEmail(formData.email) && (
                  <div className="text-xs text-red-600 mt-1">
                    This email is already registered. Please use another email or sign in.
                  </div>
                )}
                {emailExists === false && formData.email && isValidEmail(formData.email) && (
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    This email is available.
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="w-full h-2 rounded bg-muted overflow-hidden">
                      <div
                        className={`h-2 transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                      ></div>
                    </div>
                    <div className="text-xs mt-1 flex items-center gap-1">
                      {passwordStrength.score >= 3 ? (
                        <ShieldCheck className="h-3 w-3 text-green-600" />
                      ) : (
                        <Shield className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={passwordStrength.score >= 3 ? 'text-green-600' : 'text-muted-foreground'}>
                        {passwordStrength.label} password {passwordStrength.score >= 3 && '— your data is protected'}
                      </span>
                    </div>
                  </div>
                )}
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
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              {/* Security Verification */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <Label className="font-semibold">Security Verification</Label>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium">
                    {securityQuestion.num1} + {securityQuestion.num2} = ?
                  </span>
                  <Input
                    type="number"
                    placeholder="Enter answer"
                    value={formData.securityAnswer}
                    onChange={(e) => handleInputChange('securityAnswer', e.target.value)}
                    className="w-32"
                  />
                  {formData.securityAnswer && (
                    isSecurityAnswerCorrect() ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <span className="text-xs text-amber-600">Incorrect</span>
                    )
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.termsAgreed}
                  onCheckedChange={(checked) => handleInputChange('termsAgreed', checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-5">
                  I agree to the
                  <a href="/policies" target="_blank" rel="noopener noreferrer" className="text-primary underline mx-1">
                    Terms & Conditions
                  </a>
                  and
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline mx-1">
                    Privacy Policy
                  </a>
                </Label>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>Bank-grade security</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Your data is never shared</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <IdCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Tell us about yourself</h2>
              <p className="text-muted-foreground mt-2">
                This helps us personalize your experience
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
                    <SelectTrigger className="w-32 bg-background">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-background">
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>
                          {cc.code} {cc.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex-1"
                  />
                </div>
                {formData.phone && !isPhoneValid && (
                  <p className="text-xs text-amber-600 mt-1">Please enter a valid phone number</p>
                )}
              </div>

              <div>
                <Label htmlFor="company">Company (Optional)</Label>
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
                  <SelectTrigger className="mt-1 bg-background">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto bg-background">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
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
              <h2 className="text-2xl font-bold">Select the regions you want to monitor</h2>
              <p className="text-muted-foreground mt-2">
                Track vessels, ports, and oil flows across selected regions
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
                      onCheckedChange={() => handleArrayToggle('selectedRegions', region)}
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
              <p className="text-xs text-muted-foreground">
                You can change regions anytime from your dashboard
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="flex justify-center gap-4 mb-4">
                <Anchor className="h-8 w-8 text-primary" />
                <Ship className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Choose ports and vessels to track</h2>
              <p className="text-muted-foreground mb-4">
                Get real-time movements and verified data
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Lock className="h-3 w-3 mr-1" />
                  Real-time tracking
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified data
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              {/* Ports Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-primary" />
                    Ports of Interest
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('ports')}
                    >
                      {ports.every(p => formData.selectedPorts.includes(p.id.toString())) ? 'UNSELECT ALL' : 'SELECT ALL'}
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
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  {ports.map((port) => (
                    <div key={port.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`port-${port.id}`}
                        checked={formData.selectedPorts.includes(port.id.toString())}
                        onCheckedChange={() => handleArrayToggle('selectedPorts', port.id.toString())}
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
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Ship className="h-4 w-4 text-primary" />
                    Vessels to Track
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('vessels')}
                    >
                      {vessels.every(v => formData.selectedVessels.includes(v.id.toString())) ? 'UNSELECT ALL' : 'SELECT ALL'}
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
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                  {vessels.map((vessel) => (
                    <div key={vessel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vessel-${vessel.id}`}
                        checked={formData.selectedVessels.includes(vessel.id.toString())}
                        onCheckedChange={() => handleArrayToggle('selectedVessels', vessel.id.toString())}
                      />
                      <Label htmlFor={`vessel-${vessel.id}`} className="text-sm flex-1">
                        <span className="font-medium">{vessel.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {vessel.vessel_type} • {vessel.flag}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {formData.selectedVessels.length} vessels
                </p>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You can skip this step and customize later
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold">Choose Your Plan</h2>
              <p className="text-lg text-primary font-medium mt-2">
                Start with a free trial — no charge today
              </p>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>

            {/* Promotion Frame */}
            {promotionFrame && (
              <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{promotionFrame.title}</h3>
                    <p className="text-sm text-muted-foreground">{promotionFrame.description}</p>
                  </div>
                  {promotionFrame.show_countdown && promotionFrame.end_date && (
                    <Badge variant="secondary" className="bg-primary/20">
                      <Clock className="h-3 w-3 mr-1" />
                      Limited Time
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="text-center py-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-400 font-medium">
                ✨ All plans include a 5-day free trial with full access
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                You won't be charged today
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <span className={`text-sm font-medium ${formData.billingCycle === 'monthly' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Monthly
                </span>
                <div 
                  className="relative inline-flex items-center cursor-pointer"
                  onClick={() => handleInputChange('billingCycle', formData.billingCycle === 'monthly' ? 'annual' : 'monthly')}
                >
                  <div className={`w-14 h-7 rounded-full transition-colors ${
                    formData.billingCycle === 'annual' ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${
                      formData.billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </div>
                </div>
                <span className={`text-sm font-medium ${formData.billingCycle === 'annual' ? 'text-primary' : 'text-muted-foreground'}`}>
                  Annual
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Save more with annual billing</p>
            </div>

            {/* Plan Cards */}
            <div className="grid gap-4">
              {(dynamicPlans.length > 0 ? dynamicPlans.filter(p => !p.is_contact_sales).map(dbPlan => ({
                id: dbPlan.plan_tier,
                name: dbPlan.plan_name,
                monthlyPrice: dbPlan.monthly_price,
                annualPrice: dbPlan.annual_price,
                features: dbPlan.features || [],
                popular: dbPlan.is_popular,
                bestFor: dbPlan.description
              })) : [
                { 
                  id: 'basic', 
                  name: 'Basic Plan', 
                  monthlyPrice: 1999, 
                  annualPrice: 19990,
                  features: ['Geographic coverage (4 regions)', 'Port access (2 ports)', 'Vessel tracking (up to 10 vessels)', 'Refinery database access', 'Basic document library', 'Email notifications', 'Support during business hours'],
                  bestFor: 'Individual brokers and analysts'
                },
                { 
                  id: 'professional', 
                  name: 'Professional Plan', 
                  monthlyPrice: 189.99, 
                  annualPrice: 1899.90,
                  features: ['Geographic coverage (7 regions)', 'Port access (8 ports)', 'Vessel tracking (up to 25 vessels)', 'Advanced document templates (SPA, B/L, SGS, etc.)', 'AI-assisted market alerts', 'Priority email & chat support', 'Advanced dashboard & analytics'],
                  bestFor: 'Professional traders, brokers, and firms',
                  popular: true
                },
                { 
                  id: 'enterprise', 
                  name: 'Enterprise Plan', 
                  monthlyPrice: 599.99, 
                  annualPrice: 5999.90,
                  features: ['Global geographic coverage', 'Unlimited port access', 'Unlimited vessel tracking', 'Full document automation & AI insights', 'Custom alerts & reporting', 'Dedicated account manager', 'API & system integrations'],
                  bestFor: 'Institutions, large trading desks, enterprises'
                }
              ]).map((plan) => {
                // Check promotion frame first (higher priority)
                const isPromoted = promotionFrame?.eligible_plans?.includes(plan.id) && 
                  (promotionFrame.billing_cycle === formData.billingCycle || promotionFrame.billing_cycle === 'both');
                
                // Get discount from either promotion or subscription discounts
                const discount = discounts.find(d => d.plan_tier === plan.id && (d.billing_cycle === formData.billingCycle || d.billing_cycle === 'both'));
                const basePrice = formData.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                
                // Use promotion discount if active, otherwise use subscription discount
                let discountPercentage = 0;
                if (isPromoted && promotionFrame?.discount_value) {
                  discountPercentage = promotionFrame.discount_value;
                } else if (discount) {
                  discountPercentage = discount.discount_percentage;
                }
                
                const discountedPrice = discountPercentage > 0 ? basePrice * (100 - discountPercentage) / 100 : basePrice;
                const hasDiscount = discountPercentage > 0;
                
                return (
                  <Card 
                    key={plan.id}
                    className={`cursor-pointer transition-all relative overflow-hidden ${
                      formData.selectedPlan === plan.id ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'border-border hover:border-primary/50'
                    } ${plan.popular ? 'ring-1 ring-primary/30' : ''} ${isPromoted ? 'border-accent' : ''}`}
                    onClick={() => handleInputChange('selectedPlan', plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg bg-primary">
                          <Crown className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    {isPromoted && (
                      <div className="absolute top-0 left-0">
                        <Badge className="rounded-none rounded-br-lg bg-accent text-accent-foreground">
                          Limited-Time Offer
                        </Badge>
                      </div>
                    )}
                    
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                          formData.selectedPlan === plan.id ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {formData.selectedPlan === plan.id && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {plan.id === 'basic' && <Ship className="h-5 w-5 text-primary" />}
                            {plan.id === 'professional' && <Crown className="h-5 w-5 text-primary" />}
                            {plan.id === 'enterprise' && <Zap className="h-5 w-5 text-primary" />}
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Best for: {plan.bestFor}</p>
                          
                          <div className="mt-3">
                            {discount || isPromoted ? (
                              <div className="space-y-1">
                                <div className="text-lg line-through text-muted-foreground">
                                  ${basePrice.toFixed(2)}
                                </div>
                                <div className="text-2xl font-bold text-primary">
                                  ${discountedPrice.toFixed(2)}
                                  <span className="text-sm font-normal text-muted-foreground">
                                    /{formData.billingCycle === 'annual' ? 'year' : 'month'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-2xl font-bold text-primary">
                                ${basePrice.toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground">
                                  /{formData.billingCycle === 'annual' ? 'year' : 'month'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mt-3">
                            {(plan.features || []).slice(0, 4).map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                <Check className="h-3 w-3 mr-1 text-green-600" />
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="text-sm text-green-600 font-medium flex items-center gap-1 mt-3">
                            <CheckCircle className="h-4 w-4" />
                            5-day free trial included
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* What's Included */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-3">What's included in your free trial</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Full access to all selected plan features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  No card charged during the trial
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Cancel anytime before the trial ends
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Automatic activation to paid plan after trial (unless canceled)
                </li>
              </ul>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold">Ready to start your free trial</h2>
              <p className="text-lg text-green-600 dark:text-green-400 font-semibold mt-2">
                Full access — no payment during the trial
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your subscription will begin automatically after the 5-day trial unless you cancel
              </p>
            </div>

            {/* Summary */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Your setup summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected Plan</span>
                  <Badge variant="secondary">{formData.selectedPlan?.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-medium">{formData.billingCycle === 'annual' ? 'Annual' : 'Monthly'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Regions</span>
                  <span className="font-medium">{formData.selectedRegions.length} selected</span>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">What happens next:</h4>
              <ul className="space-y-2 text-sm text-green-600 dark:text-green-500">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Your account is created instantly
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  5 days full access to all features
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  No charges during the trial
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Cancel anytime with one click
                </li>
              </ul>
            </div>

            {/* Payment Info Box */}
            <div className="p-4 border rounded-lg bg-background space-y-3">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">A payment method is required to start your trial.</p>
                  <p className="text-sm text-muted-foreground">You will not be charged today.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm">You can cancel anytime during the trial with one click.</p>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Secure billing powered by Stripe</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-10 h-1 rounded-full transition-all ${
                  index + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </p>
        </CardHeader>
        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleLoginRedirect}>
                Already have an account? Sign In
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} className="ml-auto">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSignUp} 
                disabled={loading}
                className="ml-auto bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    Start Free Trial — No Payment Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default MultiStepRegistration;
