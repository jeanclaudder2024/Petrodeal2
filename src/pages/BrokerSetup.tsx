import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Twitter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

// Suggested specializations
const SUGGESTED_SPECIALIZATIONS = ['Crude Oil', 'EN590', 'Jet Fuel', 'LNG', 'Diesel', 'Gasoline', 'Naphtha', 'Fuel Oil'];

// Predefined trading regions
const TRADING_REGIONS = ['Middle East', 'Europe', 'Asia Pacific', 'Africa', 'North America', 'South America', 'CIS'];

// Experience options
const EXPERIENCE_OPTIONS = [
  { value: '0-2', label: '0–2 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10+', label: '10+ years' },
];

// Trading volume options
const VOLUME_OPTIONS = [
  { value: '< $1M', label: '< $1M' },
  { value: '$1M - $10M', label: '$1M – $10M' },
  { value: '$10M - $50M', label: '$10M – $50M' },
  { value: '$50M - $100M', label: '$50M – $100M' },
  { value: '$100M+', label: '$100M+' },
];

const BrokerSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [hasCheckedMembership, setHasCheckedMembership] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
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
  const [regionList, setRegionList] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [countryCode, setCountryCode] = useState('+1');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);

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
    { country: 'United States', code: '+1', flag: '🇺🇸' },
    { country: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { country: 'Canada', code: '+1', flag: '🇨🇦' },
    { country: 'Australia', code: '+61', flag: '🇦🇺' },
    { country: 'Germany', code: '+49', flag: '🇩🇪' },
    { country: 'France', code: '+33', flag: '🇫🇷' },
    { country: 'Italy', code: '+39', flag: '🇮🇹' },
    { country: 'Spain', code: '+34', flag: '🇪🇸' },
    { country: 'Netherlands', code: '+31', flag: '🇳🇱' },
    { country: 'Belgium', code: '+32', flag: '🇧🇪' },
    { country: 'Switzerland', code: '+41', flag: '🇨🇭' },
    { country: 'Austria', code: '+43', flag: '🇦🇹' },
    { country: 'Sweden', code: '+46', flag: '🇸🇪' },
    { country: 'Norway', code: '+47', flag: '🇳🇴' },
    { country: 'Denmark', code: '+45', flag: '🇩🇰' },
    { country: 'Finland', code: '+358', flag: '🇫🇮' },
    { country: 'Japan', code: '+81', flag: '🇯🇵' },
    { country: 'South Korea', code: '+82', flag: '🇰🇷' },
    { country: 'China', code: '+86', flag: '🇨🇳' },
    { country: 'India', code: '+91', flag: '🇮🇳' },
    { country: 'Singapore', code: '+65', flag: '🇸🇬' },
    { country: 'Malaysia', code: '+60', flag: '🇲🇾' },
    { country: 'Thailand', code: '+66', flag: '🇹🇭' },
    { country: 'Indonesia', code: '+62', flag: '🇮🇩' },
    { country: 'Philippines', code: '+63', flag: '🇵🇭' },
    { country: 'UAE', code: '+971', flag: '🇦🇪' },
    { country: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
    { country: 'Qatar', code: '+974', flag: '🇶🇦' },
    { country: 'Kuwait', code: '+965', flag: '🇰🇼' },
    { country: 'Bahrain', code: '+973', flag: '🇧🇭' },
    { country: 'Oman', code: '+968', flag: '🇴🇲' },
    { country: 'Egypt', code: '+20', flag: '🇪🇬' },
    { country: 'Nigeria', code: '+234', flag: '🇳🇬' },
    { country: 'South Africa', code: '+27', flag: '🇿🇦' },
    { country: 'Kenya', code: '+254', flag: '🇰🇪' },
    { country: 'Morocco', code: '+212', flag: '🇲🇦' },
    { country: 'Brazil', code: '+55', flag: '🇧🇷' },
    { country: 'Argentina', code: '+54', flag: '🇦🇷' },
    { country: 'Chile', code: '+56', flag: '🇨🇱' },
    { country: 'Mexico', code: '+52', flag: '🇲🇽' },
    { country: 'Colombia', code: '+57', flag: '🇨🇴' },
    { country: 'Peru', code: '+51', flag: '🇵🇪' },
    { country: 'Venezuela', code: '+58', flag: '🇻🇪' },
    { country: 'Russia', code: '+7', flag: '🇷🇺' },
    { country: 'Poland', code: '+48', flag: '🇵🇱' },
    { country: 'Czech Republic', code: '+420', flag: '🇨🇿' },
    { country: 'Hungary', code: '+36', flag: '🇭🇺' },
    { country: 'Romania', code: '+40', flag: '🇷🇴' },
    { country: 'Greece', code: '+30', flag: '🇬🇷' },
    { country: 'Turkey', code: '+90', flag: '🇹🇷' },
    { country: 'Israel', code: '+972', flag: '🇮🇱' },
    { country: 'Jordan', code: '+962', flag: '🇯🇴' },
    { country: 'Lebanon', code: '+961', flag: '🇱🇧' },
    { country: 'Iraq', code: '+964', flag: '🇮🇶' },
    { country: 'Iran', code: '+98', flag: '🇮🇷' },
    { country: 'Pakistan', code: '+92', flag: '🇵🇰' },
    { country: 'Bangladesh', code: '+880', flag: '🇧🇩' },
    { country: 'Sri Lanka', code: '+94', flag: '🇱🇰' },
    { country: 'Myanmar', code: '+95', flag: '🇲🇲' },
    { country: 'Vietnam', code: '+84', flag: '🇻🇳' },
    { country: 'Cambodia', code: '+855', flag: '🇰🇭' },
    { country: 'Laos', code: '+856', flag: '🇱🇦' },
    { country: 'Taiwan', code: '+886', flag: '🇹🇼' },
    { country: 'Hong Kong', code: '+852', flag: '🇭🇰' },
    { country: 'Macau', code: '+853', flag: '🇲🇴' },
    { country: 'Mongolia', code: '+976', flag: '🇲🇳' },
    { country: 'Kazakhstan', code: '+7', flag: '🇰🇿' },
    { country: 'Uzbekistan', code: '+998', flag: '🇺🇿' },
    { country: 'Turkmenistan', code: '+993', flag: '🇹🇲' },
    { country: 'Kyrgyzstan', code: '+996', flag: '🇰🇬' },
    { country: 'Tajikistan', code: '+992', flag: '🇹🇯' },
    { country: 'Afghanistan', code: '+93', flag: '🇦🇫' },
    { country: 'Nepal', code: '+977', flag: '🇳🇵' },
    { country: 'Bhutan', code: '+975', flag: '🇧🇹' },
    { country: 'Maldives', code: '+960', flag: '🇲🇻' },
    { country: 'New Zealand', code: '+64', flag: '🇳🇿' },
    { country: 'Papua New Guinea', code: '+675', flag: '🇵🇬' },
    { country: 'Fiji', code: '+679', flag: '🇫🇯' }
  ];

  // Phone validation
  const phoneValidation = useMemo(() => {
    const fullPhone = `${countryCode}${formData.phone.replace(/\D/g, '')}`;
    if (!formData.phone) return null;
    try {
      const valid = isValidPhoneNumber(fullPhone);
      return valid ? 'valid' : 'invalid';
    } catch {
      return formData.phone.length >= 6 ? 'invalid' : null;
    }
  }, [countryCode, formData.phone]);

  // Website validation
  const websiteValidation = useMemo(() => {
    if (!formData.website) return null;
    try {
      const url = formData.website.startsWith('http') ? formData.website : `https://${formData.website}`;
      new URL(url);
      return 'valid';
    } catch { return 'invalid'; }
  }, [formData.website]);

  // LinkedIn validation
  const linkedinValidation = useMemo(() => {
    if (!formData.linkedin_url) return null;
    return formData.linkedin_url.includes('linkedin.com') ? 'valid' : 'invalid';
  }, [formData.linkedin_url]);

  // Profile completion percentage
  const profileCompletion = useMemo(() => {
    const requiredFields = ['full_name', 'phone', 'bio'];
    const optionalFields = ['email', 'country', 'city', 'company_name', 'years_experience', 'trading_volume', 'website', 'linkedin_url'];
    const allFields = [...requiredFields, ...optionalFields];
    
    let filled = 0;
    allFields.forEach(f => {
      if ((formData as any)[f]) filled++;
    });
    if (specializationList.length > 0) filled++;
    if (regionList.length > 0) filled++;
    if (passportDocument || profileImagePreview) filled++;
    
    const total = allFields.length + 3; // +3 for specializations, regions, passport
    return Math.round((filled / total) * 100);
  }, [formData, specializationList, regionList, passportDocument, profileImagePreview]);

  useEffect(() => {
    if (user && !hasCheckedMembership) {
      checkSetupStatus();
    }
  }, [user, hasCheckedMembership]);

  useEffect(() => {
    if (user && !hasProfile) {
      setFormData(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || '',
        email: user.email || ''
      }));
    }
  }, [user, hasProfile]);

  // Auto-detect country code when country changes
  useEffect(() => {
    if (formData.country) {
      const match = countryCodes.find(c => c.country === formData.country);
      if (match) setCountryCode(match.code);
    }
  }, [formData.country]);

  const checkSetupStatus = async () => {
    try {
      const { data: membershipData } = await supabase.functions.invoke('check-broker-membership');
      setMembershipStatus(membershipData);

      if (!membershipData.has_membership || membershipData.payment_status !== 'paid') {
        navigate('/broker-membership');
        return;
      }

      const { data: profile } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profile) {
        setHasProfile(true);
        
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
        if (profile.specializations) setSpecializationList(profile.specializations);
        if ((profile as any).preferred_regions) setRegionList((profile as any).preferred_regions);
        if (profile.profile_image_url) setProfileImagePreview(profile.profile_image_url);

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
      setHasCheckedMembership(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    
    // Auto-prepend https:// for website
    if (fieldName === 'website' && formData.website && !formData.website.startsWith('http')) {
      setFormData(prev => ({ ...prev, website: `https://${prev.website}` }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100)) {
      setFormData(prev => ({ ...prev, commission_rate: value }));
    }
  };

  const isFieldInvalid = (fieldName: string) => {
    if (!touchedFields.has(fieldName)) return false;
    const value = (formData as any)[fieldName];
    if (['full_name', 'phone'].includes(fieldName)) return !value;
    if (fieldName === 'city' && formData.country && !value) return true;
    return false;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 10MB', variant: 'destructive' });
        return;
      }
      setPassportDocument(file);
      simulateUploadProgress('passport');
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

  const simulateUploadProgress = (key: string) => {
    setUploadProgress(prev => ({ ...prev, [key]: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(prev => ({ ...prev, [key]: Math.min(progress, 100) }));
      if (progress >= 100) clearInterval(interval);
    }, 200);
  };

  const handleDrop = (e: React.DragEvent, target: 'passport' | 'documents') => {
    e.preventDefault();
    setDragOver(null);
    const files = Array.from(e.dataTransfer.files);
    if (target === 'passport' && files[0]) {
      if (files[0].size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 10MB', variant: 'destructive' });
        return;
      }
      setPassportDocument(files[0]);
      simulateUploadProgress('passport');
    } else if (target === 'documents') {
      setDocuments(files);
      simulateUploadProgress('documents');
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

  const toggleRegion = (region: string) => {
    setRegionList(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const removeRegion = (region: string) => {
    setRegionList(prev => prev.filter(r => r !== region));
  };

  const uploadDocument = async (file: File, userId: string, folder: string = 'documents'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('broker-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('broker-documents')
      .createSignedUrl(fileName, 31536000);

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
      const { data: membership } = await supabase
        .from('broker_memberships')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!membership) throw new Error('Membership not found');

      let profileImageUrl = profileImagePreview;
      if (profileImage) {
        profileImageUrl = await uploadProfileImage(profileImage, user.id);
      }

      if (!passportDocument && !hasProfile) {
        throw new Error('Passport document is required for verification');
      }
      
      let passportUrl = '';
      if (passportDocument) {
        passportUrl = await uploadDocument(passportDocument, user.id, 'passport');
      }

      let documentUrls: string[] = [];
      if (documents.length > 0) {
        documentUrls = await Promise.all(
          documents.map(doc => uploadDocument(doc, user.id))
        );
      }

      // Parse years_experience for DB (extract numeric start value)
      let yearsExp: number | null = null;
      if (formData.years_experience) {
        const match = formData.years_experience.match(/\d+/);
        if (match) yearsExp = parseInt(match[0]);
      }

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
        years_experience: yearsExp,
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
        preferred_regions: regionList.length > 0 ? regionList : null,
        company_size: formData.company_size || null,
        company_type: formData.company_type || null,
        business_registration: formData.business_registration || null,
        tax_id: formData.tax_id || null,
        id_document_url: passportUrl || documentUrls[0] || null,
        additional_documents: documentUrls.length > 1 ? documentUrls.slice(1) : null,
      };

      if (hasProfile) {
        const { error } = await supabase
          .from('broker_profiles')
          .update(profileData)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('broker_profiles')
          .insert(profileData);
        if (error) throw error;
      }

      toast({
        title: "Profile Submitted",
        description: "Your broker profile has been submitted for verification.",
      });

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
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const getStatusBadge = () => {
    const status = membershipStatus?.verification_status || 'pending';
    if (status === 'approved' || status === 'verified') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">{status}</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{status}</Badge>;
    }
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">{status}</Badge>;
  };

  const getStatusColor = () => {
    const status = membershipStatus?.verification_status || 'pending';
    if (status === 'approved' || status === 'verified') return 'border-emerald-500';
    if (status === 'rejected') return 'border-destructive';
    return 'border-amber-500';
  };

  return (
    <TooltipProvider>
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

          {/* Profile Completion Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Profile Completion</span>
              <span className="text-sm font-semibold text-primary">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
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
            <Card className={`mb-6 ${getStatusColor()}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {membershipStatus.verification_status === 'approved' || membershipStatus.verification_status === 'verified' ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : membershipStatus.verification_status === 'rejected' ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="font-medium">Membership Active</span>
                  <div className="ml-auto">
                    {getStatusBadge()}
                  </div>
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
                        <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('full_name')}
                          className={isFieldInvalid('full_name') ? 'border-destructive' : ''}
                          required
                        />
                        {isFieldInvalid('full_name') && (
                          <p className="text-xs text-destructive mt-1">Full name is required</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                        <div className="flex gap-2">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border z-50 max-h-60 overflow-y-auto">
                              {countryCodes.map((item, idx) => (
                                <SelectItem key={`${item.code}-${idx}`} value={item.code} className="hover:bg-muted focus:bg-muted">
                                  {item.flag} {item.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1">
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handlePhoneChange}
                              onBlur={() => handleBlur('phone')}
                              placeholder="123456789"
                              className={`pr-8 ${isFieldInvalid('phone') ? 'border-destructive' : ''}`}
                              required
                            />
                            {phoneValidation === 'valid' && (
                              <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                            )}
                            {phoneValidation === 'invalid' && (
                              <XCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>
                        {phoneValidation === 'valid' && (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Valid number</p>
                        )}
                        {phoneValidation === 'invalid' && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1"><XCircle className="h-3 w-3" /> Invalid phone number</p>
                        )}
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
                        <Select
                          value={formData.years_experience}
                          onValueChange={(value) => setFormData(prev => ({...prev, years_experience: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience range" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPERIENCE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          onBlur={() => handleBlur('city')}
                          className={isFieldInvalid('city') ? 'border-destructive' : ''}
                        />
                        {isFieldInvalid('city') && (
                          <p className="text-xs text-destructive mt-1">City is required when country is selected</p>
                        )}
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
                      <Label htmlFor="bio">Professional Bio <span className="text-destructive">*</span></Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        placeholder="Tell us about your experience and expertise in oil trading..."
                        value={formData.bio}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('bio')}
                        className={isFieldInvalid('bio') ? 'border-destructive' : ''}
                      />
                    </div>

                    <div>
                      <Label>Specializations</Label>
                      {/* Quick-add suggestions */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {SUGGESTED_SPECIALIZATIONS.filter(s => !specializationList.includes(s)).map(s => (
                          <Button
                            key={s}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addSpecialization(s)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> {s}
                          </Button>
                        ))}
                      </div>
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
                            placeholder="Add custom specialization"
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
                        <Select
                          value={formData.trading_volume}
                          onValueChange={(value) => setFormData(prev => ({...prev, trading_volume: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select volume range" />
                          </SelectTrigger>
                          <SelectContent>
                            {VOLUME_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="commission_rate">Commission Rate</Label>
                        <div className="relative">
                          <Input
                            id="commission_rate"
                            name="commission_rate"
                            type="text"
                            inputMode="decimal"
                            value={formData.commission_rate}
                            onChange={handleCommissionChange}
                            placeholder="0"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                        {parseFloat(formData.commission_rate) > 20 && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            High commission rates may reduce deal competitiveness.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Preferred Trading Regions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {TRADING_REGIONS.map(region => (
                          <Button
                            key={region}
                            type="button"
                            variant={regionList.includes(region) ? "default" : "outline"}
                            size="sm"
                            className="h-8"
                            onClick={() => toggleRegion(region)}
                          >
                            {region}
                          </Button>
                        ))}
                      </div>
                      {regionList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {regionList.filter(r => !TRADING_REGIONS.includes(r)).map((region, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {region}
                              <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeRegion(region)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Add custom region"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !regionList.includes(val)) {
                                setRegionList(prev => [...prev, val]);
                              }
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="website"
                          placeholder="https://example.com"
                          value={formData.website}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('website')}
                        />
                        {websiteValidation === 'valid' && (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Valid URL</p>
                        )}
                        {websiteValidation === 'invalid' && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1"><XCircle className="h-3 w-3" /> Invalid URL format</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                        <Input
                          id="linkedin_url"
                          name="linkedin_url"
                          placeholder="https://linkedin.com/in/username"
                          value={formData.linkedin_url}
                          onChange={handleInputChange}
                          onBlur={() => handleBlur('linkedin_url')}
                        />
                        {linkedinValidation === 'valid' && (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Valid LinkedIn</p>
                        )}
                        {linkedinValidation === 'invalid' && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Must contain linkedin.com</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="twitter_url">Twitter Profile</Label>
                        <Input
                          id="twitter_url"
                          name="twitter_url"
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
                    {/* Passport Upload */}
                    <div>
                      <Label htmlFor="passport" className="text-base font-semibold">Passport Document <span className="text-destructive">*</span></Label>
                      <p className="text-sm text-muted-foreground mb-2">Upload a clear photo or scan of your passport (required for verification)</p>
                      <div 
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 transition-colors ${
                          dragOver === 'passport' ? 'border-primary bg-primary/5' : 'border-primary/25'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver('passport'); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, 'passport')}
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-primary" />
                          <div className="mt-2">
                            <Label htmlFor="passport" className="cursor-pointer">
                              <span className="text-primary hover:text-primary/80 font-medium">
                                {passportDocument ? 'Change Passport' : 'Upload Passport or Drag & Drop'}
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
                          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <Check className="h-4 w-4" />
                                <span className="text-sm font-medium">{passportDocument.name}</span>
                                <span className="text-xs text-muted-foreground">({(passportDocument.size / 1024 / 1024).toFixed(1)} MB)</span>
                              </div>
                              <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPassportDocument(null)}>
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                            {uploadProgress['passport'] !== undefined && uploadProgress['passport'] < 100 && (
                              <Progress value={uploadProgress['passport']} className="h-1 mt-2" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="documents">Additional Documents (License, Certificates, etc.)</Label>
                      <div 
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 transition-colors ${
                          dragOver === 'documents' ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver('documents'); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, 'documents')}
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <div className="mt-2">
                            <Label htmlFor="documents" className="cursor-pointer">
                              <span className="text-primary hover:text-primary/80">Upload files or Drag & Drop</span>
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
                          <div className="mt-4 space-y-2">
                            {documents.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2 text-sm">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>{file.name}</span>
                                  <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                                </div>
                                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                                  setDocuments(prev => prev.filter((_, i) => i !== index));
                                }}>
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Verification Required</p>
                        <p className="text-amber-700 dark:text-amber-400">
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
    </TooltipProvider>
  );
};

export default BrokerSetup;
