import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Store, Plus, Edit, Trash2, Search, Sparkles, CreditCard, Shield, Factory, Users, MapPin, FileText, Image, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBulkCompanyUpload, GeneratedCompanyData } from '@/hooks/useBulkCompanyUpload';
import { BulkCompanyUploadDialog } from './BulkCompanyUploadDialog';

interface SellerCompany {
  id: string;
  name: string;
  trade_name?: string;
  logo_url?: string;
  director_photo_url?: string;
  signatory_signature_url?: string;
  description?: string;
  company_objective?: string;
  website?: string;
  email?: string;
  official_email?: string;
  operations_email?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  industry?: string;
  employees_count?: number;
  annual_revenue?: number;
  founded_year?: number;
  is_verified?: boolean;
  primary_activity?: string;
  trading_regions?: string[];
  registration_number?: string;
  registration_country?: string;
  legal_address?: string;
  representative_name?: string;
  representative_title?: string;
  passport_number?: string;
  passport_country?: string;
  representative_email?: string;
  // Refinery details
  is_refinery_owner?: boolean;
  refinery_name?: string;
  refinery_location?: string;
  refinery_capacity_bpd?: number;
  products_supplied?: string[];
  loading_ports?: string[];
  // Compliance
  kyc_status?: string;
  sanctions_status?: string;
  country_risk?: string;
  compliance_notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface BankAccount {
  id?: string;
  company_id?: string;
  bank_name: string;
  bank_address: string;
  account_name: string;
  account_number: string;
  iban: string;
  swift_code: string;
  beneficiary_address: string;
  currency: string;
  is_primary: boolean;
}

const COUNTRIES = [
  'United States', 'United Kingdom', 'France', 'Germany', 'Netherlands', 'Belgium',
  'Switzerland', 'Italy', 'Spain', 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
  'Oman', 'Iraq', 'Iran', 'Russia', 'China', 'Japan', 'South Korea', 'Singapore',
  'Malaysia', 'Indonesia', 'India', 'Nigeria', 'Angola', 'Libya', 'Algeria', 'Egypt',
  'Brazil', 'Venezuela', 'Mexico', 'Canada', 'Australia', 'Norway', 'Denmark', 'Sweden'
];

const SellerCompanyManagement = () => {
  const [companies, setCompanies] = useState<SellerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<SellerCompany | null>(null);
  const [formData, setFormData] = useState<Partial<SellerCompany>>({});
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();
  
  // Bulk upload hook
  const bulkUpload = useBulkCompanyUpload('seller');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies((data || []) as SellerCompany[]);
    } catch (error) {
      console.error('Failed to fetch seller companies:', error);
      toast({
        title: "Error",
        description: "Failed to load seller companies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('seller_company_bank_accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const cleanData = {
        name: formData.name || '',
        trade_name: formData.trade_name || null,
        logo_url: formData.logo_url || null,
        director_photo_url: formData.director_photo_url || null,
        signatory_signature_url: formData.signatory_signature_url || null,
        description: formData.description || null,
        company_objective: formData.company_objective || null,
        website: formData.website || null,
        email: formData.email || null,
        official_email: formData.official_email || null,
        operations_email: formData.operations_email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        country: formData.country || null,
        city: formData.city || null,
        industry: formData.industry || null,
        employees_count: formData.employees_count || null,
        annual_revenue: formData.annual_revenue || null,
        founded_year: formData.founded_year || null,
        is_verified: formData.is_verified || false,
        primary_activity: formData.primary_activity || null,
        trading_regions: formData.trading_regions || null,
        registration_number: formData.registration_number || null,
        registration_country: formData.registration_country || null,
        legal_address: formData.legal_address || null,
        representative_name: formData.representative_name || null,
        representative_title: formData.representative_title || null,
        passport_number: formData.passport_number || null,
        passport_country: formData.passport_country || null,
        representative_email: formData.representative_email || null,
        is_refinery_owner: formData.is_refinery_owner || false,
        refinery_name: formData.refinery_name || null,
        refinery_location: formData.refinery_location || null,
        refinery_capacity_bpd: formData.refinery_capacity_bpd || null,
        products_supplied: formData.products_supplied || null,
        loading_ports: formData.loading_ports || null,
        kyc_status: formData.kyc_status || 'pending',
        sanctions_status: formData.sanctions_status || 'pending',
        country_risk: formData.country_risk || 'low',
        compliance_notes: formData.compliance_notes || null,
      };

      let companyId = editingCompany?.id;

      if (editingCompany) {
        const { error } = await supabase
          .from('seller_companies')
          .update(cleanData)
          .eq('id', editingCompany.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('seller_companies')
          .insert([cleanData])
          .select('id')
          .single();
        if (error) throw error;
        companyId = data?.id;
      }

      // Save bank accounts
      if (companyId && bankAccounts.length > 0) {
        await supabase
          .from('seller_company_bank_accounts')
          .delete()
          .eq('company_id', companyId);

        const accountsToInsert = bankAccounts.map(({ id, ...acc }) => ({
          ...acc,
          company_id: companyId
        }));

        const { error: bankError } = await supabase
          .from('seller_company_bank_accounts')
          .insert(accountsToInsert);

        if (bankError) throw bankError;
      }

      toast({ title: "Success", description: editingCompany ? "Seller company updated successfully" : "Seller company created successfully" });
      setIsDialogOpen(false);
      resetForm();
      fetchCompanies();
    } catch (error) {
      console.error('Failed to save seller company:', error);
      toast({
        title: "Error",
        description: "Failed to save seller company",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingCompany(null);
    setFormData({});
    setBankAccounts([]);
    setActiveTab('basic');
  };

  const handleAutoFill = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company name first",
        variant: "destructive"
      });
      return;
    }

    if (!formData.country) {
      toast({
        title: "Error",
        description: "Please select a country first for accurate data generation",
        variant: "destructive"
      });
      return;
    }

    setIsAutoFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke('autofill-company-data', {
        body: { 
          companyName: formData.name,
          country: formData.country,
          companyType: 'seller'
        }
      });

      if (error) throw error;
      
      if (data?.success && data?.data) {
        const aiData = data.data;
        setFormData(prev => ({
          ...prev,
          ...aiData,
          name: prev.name,
          country: prev.country,
        }));

        if (aiData.bankAccounts && aiData.bankAccounts.length > 0) {
          setBankAccounts(aiData.bankAccounts);
        }
        
        toast({
          title: "Success",
          description: "Seller company details auto-filled successfully!",
        });
      } else {
        throw new Error(data?.error || 'Failed to auto-fill data');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast({
        title: "Error",
        description: "Failed to auto-fill company data. Please fill manually.",
        variant: "destructive"
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seller company?')) return;
    
    try {
      const { error } = await supabase
        .from('seller_companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Seller company deleted successfully" });
      fetchCompanies();
    } catch (error) {
      console.error('Failed to delete seller company:', error);
      toast({
        title: "Error",
        description: "Failed to delete seller company",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (company: SellerCompany) => {
    setEditingCompany(company);
    setFormData(company);
    await fetchBankAccounts(company.id);
    setIsDialogOpen(true);
  };

  const addBankAccount = () => {
    setBankAccounts([...bankAccounts, {
      bank_name: '',
      bank_address: '',
      account_name: '',
      account_number: '',
      iban: '',
      swift_code: '',
      beneficiary_address: '',
      currency: 'USD',
      is_primary: bankAccounts.length === 0
    }]);
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string | boolean) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'is_primary' && value === true) {
      updated.forEach((acc, i) => {
        if (i !== index) acc.is_primary = false;
      });
    }
    
    setBankAccounts(updated);
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const filteredCompanies = companies.filter(company => {
    return company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           company.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Bulk upload handlers
  const handleBulkSaveCompany = async (company: GeneratedCompanyData) => {
    try {
      const cleanData = {
        name: company.name || '',
        trade_name: company.trade_name || null,
        description: company.description || null,
        company_objective: company.company_objective || null,
        website: company.website || null,
        email: company.email || null,
        official_email: company.official_email || null,
        operations_email: company.operations_email || null,
        phone: company.phone || null,
        address: company.address || null,
        country: company.country || null,
        city: company.city || null,
        industry: company.industry || null,
        employees_count: company.employees_count || null,
        annual_revenue: company.annual_revenue || null,
        founded_year: company.founded_year || null,
        is_verified: false,
        primary_activity: company.primary_activity || null,
        trading_regions: company.trading_regions || null,
        registration_number: company.registration_number || null,
        registration_country: company.registration_country || null,
        legal_address: company.legal_address || null,
        representative_name: company.representative_name || null,
        representative_title: company.representative_title || null,
        passport_number: company.passport_number || null,
        passport_country: company.passport_country || null,
        representative_email: company.representative_email || null,
        is_refinery_owner: company.is_refinery_owner || false,
        refinery_name: company.refinery_name || null,
        refinery_location: company.refinery_location || null,
        refinery_capacity_bpd: company.refinery_capacity_bpd || null,
        products_supplied: company.products_supplied || null,
        loading_ports: company.loading_ports || null,
        kyc_status: 'pending',
        sanctions_status: 'pending',
        country_risk: 'low',
      };

      const { data, error } = await supabase
        .from('seller_companies')
        .insert([cleanData])
        .select('id')
        .single();

      if (error) throw error;

      // Save bank accounts if present
      if (data?.id && company.bankAccounts?.length > 0) {
        const accountsToInsert = company.bankAccounts.map((acc: any) => ({
          company_id: data.id,
          bank_name: acc.bank_name || '',
          bank_address: acc.bank_address || '',
          account_name: acc.account_name || '',
          account_number: acc.account_number || '',
          iban: acc.iban || '',
          swift_code: acc.swift_code || '',
          beneficiary_address: acc.beneficiary_address || '',
          currency: acc.currency || 'USD',
          is_primary: acc.is_primary || false,
        }));

        await supabase.from('seller_company_bank_accounts').insert(accountsToInsert);
      }

      toast({ title: 'Success', description: `${company.name} saved successfully` });
    } catch (error) {
      console.error('Failed to save company:', error);
      toast({ title: 'Error', description: `Failed to save ${company.name}`, variant: 'destructive' });
      throw error;
    }
  };

  const handleBulkSaveAll = async () => {
    const validCompanies = bulkUpload.state.generatedCompanies.filter(c => !c._error);
    let successCount = 0;
    let errorCount = 0;

    for (const company of validCompanies) {
      try {
        await handleBulkSaveCompany(company);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    toast({
      title: 'Bulk Save Complete',
      description: `${successCount} companies saved${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    if (successCount > 0) {
      fetchCompanies();
      bulkUpload.closeDialog();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Seller Company Management
          </CardTitle>
          <CardDescription>
            Add, edit, and manage seller companies with refinery details (Admin only - not visible to users)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search seller companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={bulkUpload.openDialog}>
              <Upload className="h-4 w-4 mr-2" />
              Upload XLS / CSV
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Seller Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[95vh]">
                <DialogHeader>
                  <DialogTitle>{editingCompany ? 'Edit Seller Company' : 'Add New Seller Company'}</DialogTitle>
                  <DialogDescription>
                    {editingCompany ? 'Update seller company information' : 'Enter seller company details with refinery information'}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[75vh] pr-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-4">
                        <TabsTrigger value="basic" className="text-xs"><FileText className="h-3 w-3 mr-1" />Basic</TabsTrigger>
                        <TabsTrigger value="branding" className="text-xs"><Image className="h-3 w-3 mr-1" />Branding</TabsTrigger>
                        <TabsTrigger value="contact" className="text-xs"><MapPin className="h-3 w-3 mr-1" />Contact</TabsTrigger>
                        <TabsTrigger value="business" className="text-xs"><Users className="h-3 w-3 mr-1" />Business</TabsTrigger>
                        <TabsTrigger value="legal" className="text-xs"><Shield className="h-3 w-3 mr-1" />Legal</TabsTrigger>
                        <TabsTrigger value="refinery" className="text-xs"><Factory className="h-3 w-3 mr-1" />Refinery</TabsTrigger>
                        <TabsTrigger value="banking" className="text-xs"><CreditCard className="h-3 w-3 mr-1" />Banking</TabsTrigger>
                        <TabsTrigger value="compliance" className="text-xs"><Shield className="h-3 w-3 mr-1" />KYC</TabsTrigger>
                      </TabsList>

                      {/* Basic Info Tab */}
                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Company Legal Name *</Label>
                            <Input
                              id="name"
                              value={formData.name || ''}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="Enter company legal name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country *</Label>
                            <Select value={formData.country || ''} onValueChange={(value) => setFormData({...formData, country: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map(country => (
                                  <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAutoFill}
                            disabled={!formData.name?.trim() || !formData.country || isAutoFilling}
                            className="w-full"
                          >
                            {isAutoFilling ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            {isAutoFilling ? 'Auto-filling...' : 'AI Auto-Fill All Fields'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          AI will generate realistic seller company data including refinery details, passport, bank accounts, and legal details.
                        </p>

                        <div>
                          <Label htmlFor="trade_name">Trade Name (Optional)</Label>
                          <Input
                            id="trade_name"
                            value={formData.trade_name || ''}
                            onChange={(e) => setFormData({...formData, trade_name: e.target.value})}
                            placeholder="Trading name if different"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="industry">Industry</Label>
                            <Input
                              id="industry"
                              value={formData.industry || ''}
                              onChange={(e) => setFormData({...formData, industry: e.target.value})}
                              placeholder="e.g., Oil & Gas Trading"
                            />
                          </div>
                          <div>
                            <Label htmlFor="founded_year">Founded Year</Label>
                            <Input
                              id="founded_year"
                              type="number"
                              min="1800"
                              max="2025"
                              value={formData.founded_year || ''}
                              onChange={(e) => setFormData({...formData, founded_year: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Company Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Company description..."
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_verified"
                            checked={formData.is_verified || false}
                            onCheckedChange={(checked) => setFormData({...formData, is_verified: checked as boolean})}
                          />
                          <Label htmlFor="is_verified">Verified Company</Label>
                        </div>
                      </TabsContent>

                      {/* Branding Tab */}
                      <TabsContent value="branding" className="space-y-4">
                        <div>
                          <Label htmlFor="logo_url">Company Logo URL</Label>
                          <Input
                            id="logo_url"
                            value={formData.logo_url || ''}
                            onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                            placeholder="https://example.com/logo.png"
                          />
                          {formData.logo_url && (
                            <div className="mt-2 p-2 border rounded">
                              <img src={formData.logo_url} alt="Logo preview" className="max-h-20 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            </div>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="director_photo_url">Company Director Photo URL</Label>
                          <Input
                            id="director_photo_url"
                            value={formData.director_photo_url || ''}
                            onChange={(e) => setFormData({...formData, director_photo_url: e.target.value})}
                            placeholder="https://example.com/director.png"
                          />
                        </div>

                        <div>
                          <Label htmlFor="signatory_signature_url">Authorized Signatory Signature URL</Label>
                          <Input
                            id="signatory_signature_url"
                            value={formData.signatory_signature_url || ''}
                            onChange={(e) => setFormData({...formData, signatory_signature_url: e.target.value})}
                            placeholder="https://example.com/signature.png"
                          />
                        </div>
                      </TabsContent>

                      {/* Contact Tab */}
                      <TabsContent value="contact" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="official_email">Official Company Email</Label>
                            <Input
                              id="official_email"
                              type="email"
                              value={formData.official_email || formData.email || ''}
                              onChange={(e) => setFormData({...formData, official_email: e.target.value, email: e.target.value})}
                              placeholder="info@company.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="operations_email">Operations Email</Label>
                            <Input
                              id="operations_email"
                              type="email"
                              value={formData.operations_email || ''}
                              onChange={(e) => setFormData({...formData, operations_email: e.target.value})}
                              placeholder="operations@company.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={formData.phone || ''}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="+1 (202) 773-6521"
                            />
                          </div>
                          <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              value={formData.website || ''}
                              onChange={(e) => setFormData({...formData, website: e.target.value})}
                              placeholder="https://www.company.com"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="address">Registered Address</Label>
                          <Textarea
                            id="address"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            placeholder="Full registered address..."
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={formData.city || ''}
                              onChange={(e) => setFormData({...formData, city: e.target.value})}
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <Label>Country</Label>
                            <Input value={formData.country || ''} disabled className="bg-muted" />
                          </div>
                        </div>
                      </TabsContent>

                      {/* Business Tab */}
                      <TabsContent value="business" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="employees_count">Employee Count</Label>
                            <Input
                              id="employees_count"
                              type="number"
                              value={formData.employees_count || ''}
                              onChange={(e) => setFormData({...formData, employees_count: parseInt(e.target.value)})}
                              placeholder="Number of employees"
                            />
                          </div>
                          <div>
                            <Label htmlFor="annual_revenue">Annual Revenue (USD)</Label>
                            <Input
                              id="annual_revenue"
                              type="number"
                              value={formData.annual_revenue || ''}
                              onChange={(e) => setFormData({...formData, annual_revenue: parseFloat(e.target.value)})}
                              placeholder="Annual revenue in USD"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="primary_activity">Primary Business Activity</Label>
                          <Input
                            id="primary_activity"
                            value={formData.primary_activity || ''}
                            onChange={(e) => setFormData({...formData, primary_activity: e.target.value})}
                            placeholder="e.g., Crude Oil Trading, Refined Products Distribution"
                          />
                        </div>

                        <div>
                          <Label htmlFor="trading_regions">Main Trading Regions</Label>
                          <Input
                            id="trading_regions"
                            value={formData.trading_regions?.join(', ') || ''}
                            onChange={(e) => setFormData({...formData, trading_regions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            placeholder="Middle East, Europe, Asia (comma separated)"
                          />
                        </div>
                      </TabsContent>

                      {/* Legal Tab */}
                      <TabsContent value="legal" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="registration_number">Company Registration Number</Label>
                            <Input
                              id="registration_number"
                              value={formData.registration_number || ''}
                              onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                              placeholder="Registration number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="registration_country">Registration Country</Label>
                            <Select value={formData.registration_country || formData.country || ''} onValueChange={(value) => setFormData({...formData, registration_country: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map(country => (
                                  <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="legal_address">Legal Address</Label>
                          <Textarea
                            id="legal_address"
                            value={formData.legal_address || ''}
                            onChange={(e) => setFormData({...formData, legal_address: e.target.value})}
                            placeholder="Company registered legal address..."
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="representative_name">Representative Name</Label>
                            <Input
                              id="representative_name"
                              value={formData.representative_name || ''}
                              onChange={(e) => setFormData({...formData, representative_name: e.target.value})}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="representative_title">Representative Title</Label>
                            <Input
                              id="representative_title"
                              value={formData.representative_title || ''}
                              onChange={(e) => setFormData({...formData, representative_title: e.target.value})}
                              placeholder="e.g., CEO, Managing Director"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="passport_number">Passport Number</Label>
                            <Input
                              id="passport_number"
                              value={formData.passport_number || ''}
                              onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                              placeholder="Passport number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="passport_country">Passport Country</Label>
                            <Select value={formData.passport_country || ''} onValueChange={(value) => setFormData({...formData, passport_country: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map(country => (
                                  <SelectItem key={country} value={country}>{country}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="representative_email">Representative Email</Label>
                          <Input
                            id="representative_email"
                            type="email"
                            value={formData.representative_email || ''}
                            onChange={(e) => setFormData({...formData, representative_email: e.target.value})}
                            placeholder="representative@company.com"
                          />
                        </div>
                      </TabsContent>

                      {/* Refinery Tab */}
                      <TabsContent value="refinery" className="space-y-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Checkbox
                            id="is_refinery_owner"
                            checked={formData.is_refinery_owner || false}
                            onCheckedChange={(checked) => setFormData({...formData, is_refinery_owner: checked as boolean})}
                          />
                          <Label htmlFor="is_refinery_owner">Company owns/operates a refinery</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="refinery_name">Refinery Name</Label>
                            <Input
                              id="refinery_name"
                              value={formData.refinery_name || ''}
                              onChange={(e) => setFormData({...formData, refinery_name: e.target.value})}
                              placeholder="Refinery name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="refinery_location">Refinery Location</Label>
                            <Input
                              id="refinery_location"
                              value={formData.refinery_location || ''}
                              onChange={(e) => setFormData({...formData, refinery_location: e.target.value})}
                              placeholder="City, Country"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="refinery_capacity_bpd">Refinery Capacity (BPD)</Label>
                          <Input
                            id="refinery_capacity_bpd"
                            type="number"
                            value={formData.refinery_capacity_bpd || ''}
                            onChange={(e) => setFormData({...formData, refinery_capacity_bpd: parseInt(e.target.value)})}
                            placeholder="Barrels per day"
                          />
                        </div>

                        <div>
                          <Label htmlFor="products_supplied">Products Supplied</Label>
                          <Input
                            id="products_supplied"
                            value={formData.products_supplied?.join(', ') || ''}
                            onChange={(e) => setFormData({...formData, products_supplied: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            placeholder="Crude Oil, Gasoline, Diesel (comma separated)"
                          />
                        </div>

                        <div>
                          <Label htmlFor="loading_ports">Loading Ports</Label>
                          <Input
                            id="loading_ports"
                            value={formData.loading_ports?.join(', ') || ''}
                            onChange={(e) => setFormData({...formData, loading_ports: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                            placeholder="Port names (comma separated)"
                          />
                        </div>
                      </TabsContent>

                      {/* Banking Tab */}
                      <TabsContent value="banking" className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-base font-semibold">Bank Accounts</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addBankAccount}>
                            <Plus className="h-4 w-4 mr-1" /> Add Bank Account
                          </Button>
                        </div>

                        {bankAccounts.map((account, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={account.is_primary}
                                  onCheckedChange={(checked) => updateBankAccount(index, 'is_primary', checked as boolean)}
                                />
                                <Label className="text-sm">Primary Account</Label>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeBankAccount(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Bank Name *</Label>
                                <Input
                                  value={account.bank_name}
                                  onChange={(e) => updateBankAccount(index, 'bank_name', e.target.value)}
                                  placeholder="Bank name"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Account Name *</Label>
                                <Input
                                  value={account.account_name}
                                  onChange={(e) => updateBankAccount(index, 'account_name', e.target.value)}
                                  placeholder="Account holder name"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Account Number</Label>
                                <Input
                                  value={account.account_number}
                                  onChange={(e) => updateBankAccount(index, 'account_number', e.target.value)}
                                  placeholder="Account number"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">IBAN</Label>
                                <Input
                                  value={account.iban}
                                  onChange={(e) => updateBankAccount(index, 'iban', e.target.value)}
                                  placeholder="IBAN number"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">SWIFT/BIC Code</Label>
                                <Input
                                  value={account.swift_code}
                                  onChange={(e) => updateBankAccount(index, 'swift_code', e.target.value)}
                                  placeholder="SWIFT code"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Currency</Label>
                                <Select value={account.currency} onValueChange={(value) => updateBankAccount(index, 'currency', value)}>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="AED">AED</SelectItem>
                                    <SelectItem value="SAR">SAR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 mt-3">
                              <div>
                                <Label className="text-xs">Bank Address</Label>
                                <Input
                                  value={account.bank_address}
                                  onChange={(e) => updateBankAccount(index, 'bank_address', e.target.value)}
                                  placeholder="Full bank address"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Beneficiary Address</Label>
                                <Input
                                  value={account.beneficiary_address}
                                  onChange={(e) => updateBankAccount(index, 'beneficiary_address', e.target.value)}
                                  placeholder="Beneficiary address"
                                  className="h-9"
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </TabsContent>

                      {/* Compliance Tab */}
                      <TabsContent value="compliance" className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="kyc_status">KYC Status</Label>
                            <Select value={formData.kyc_status || 'pending'} onValueChange={(value) => setFormData({...formData, kyc_status: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="sanctions_status">Sanctions Check Status</Label>
                            <Select value={formData.sanctions_status || 'pending'} onValueChange={(value) => setFormData({...formData, sanctions_status: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="cleared">Cleared</SelectItem>
                                <SelectItem value="flagged">Flagged</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="country_risk">Country Risk Level</Label>
                            <Select value={formData.country_risk || 'low'} onValueChange={(value) => setFormData({...formData, country_risk: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="compliance_notes">Internal Compliance Notes</Label>
                          <Textarea
                            id="compliance_notes"
                            value={formData.compliance_notes || ''}
                            onChange={(e) => setFormData({...formData, compliance_notes: e.target.value})}
                            placeholder="Internal notes about compliance status..."
                            rows={4}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCompany ? 'Update Seller Company' : 'Create Seller Company'}
                      </Button>
                    </div>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Total Sellers</p>
              <p className="text-xl font-bold">{companies.length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">With Refinery</p>
              <p className="text-xl font-bold">{companies.filter(c => c.is_refinery_owner).length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Verified</p>
              <p className="text-xl font-bold">{companies.filter(c => c.is_verified).length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">KYC Verified</p>
              <p className="text-xl font-bold">{companies.filter(c => c.kyc_status === 'verified').length}</p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground">Pending Review</p>
              <p className="text-xl font-bold">{companies.filter(c => c.kyc_status === 'pending').length}</p>
            </Card>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Refinery</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No seller companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo_url ? (
                              <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Store className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{company.name}</p>
                              {company.trade_name && <p className="text-xs text-muted-foreground">{company.trade_name}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{company.country || '-'}</TableCell>
                        <TableCell>
                          {company.is_refinery_owner ? (
                            <Badge variant="default" className="bg-blue-500">
                              <Factory className="h-3 w-3 mr-1" />
                              {company.refinery_name || 'Yes'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.kyc_status === 'verified' ? 'default' : company.kyc_status === 'rejected' ? 'destructive' : 'secondary'}>
                            {company.kyc_status || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {company.is_verified ? (
                            <Badge variant="default" className="bg-green-500">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(company.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Upload Dialog */}
      <BulkCompanyUploadDialog
        open={bulkUpload.dialogOpen}
        onClose={bulkUpload.closeDialog}
        state={bulkUpload.state}
        companyType="seller"
        onFileUpload={bulkUpload.handleFileUpload}
        onRemoveCompany={bulkUpload.removeCompany}
        onGenerateAll={bulkUpload.generateAllWithAI}
        onRemoveGenerated={bulkUpload.removeGeneratedCompany}
        onGoBack={bulkUpload.goBackToPreview}
        onSaveCompany={handleBulkSaveCompany}
        onSaveAll={handleBulkSaveAll}
      />
    </div>
  );
};

export default SellerCompanyManagement;
