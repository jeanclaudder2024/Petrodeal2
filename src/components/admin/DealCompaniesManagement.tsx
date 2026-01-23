import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  Trash2,
  Fuel,
  Globe,
  MapPin,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: number;
  name: string;
  country: string | null;
  is_verified: boolean | null;
  logo_url: string | null;
}

interface DealCompany {
  id: string;
  company_id: number;
  role: string;
  product_tags: string[];
  display_order: number;
  is_enabled: boolean;
  companies?: Company;
}

const ROLES = ['Principal', 'Mandated Seller', 'Mandated Buyer', 'Authorized Distributor', 'Trading Partner'];
const PRODUCT_OPTIONS = ['ULSD', 'EN590', 'Jet A1', 'D2', 'D6', 'Crude Oil', 'LNG', 'LPG', 'Gasoline', 'Fuel Oil', 'BLCO', 'Bitumen', 'Naphtha'];

const DealCompaniesManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dealCompanies, setDealCompanies] = useState<DealCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Local state for form editing - supports dynamic number of positions
  const [formState, setFormState] = useState<{
    id?: string;
    companyId: string;
    role: string;
    productTags: string[];
    isEnabled: boolean;
  }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, country, is_verified, logo_url')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Fetch existing deal companies
      const { data: dealCompaniesData, error: dealCompaniesError } = await supabase
        .from('broker_deal_companies')
        .select(`
          id,
          company_id,
          role,
          product_tags,
          display_order,
          is_enabled,
          companies (
            id,
            name,
            country,
            is_verified,
            logo_url
          )
        `)
        .order('display_order');

      if (dealCompaniesError) throw dealCompaniesError;

      setDealCompanies((dealCompaniesData || []) as DealCompany[]);

      // Initialize form state from existing data
      if (dealCompaniesData && dealCompaniesData.length > 0) {
        const formSlots = dealCompaniesData.map((dc: any) => ({
          id: dc.id,
          companyId: dc.company_id.toString(),
          role: dc.role,
          productTags: dc.product_tags || [],
          isEnabled: dc.is_enabled,
        }));
        setFormState(formSlots);
      } else {
        // Start with 3 empty slots
        setFormState([
          { companyId: '', role: 'Principal', productTags: [], isEnabled: true },
          { companyId: '', role: 'Principal', productTags: [], isEnabled: true },
          { companyId: '', role: 'Principal', productTags: [], isEnabled: true },
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (index: number, field: string, value: any) => {
    setFormState(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleProductTagToggle = (index: number, tag: string) => {
    setFormState(prev => {
      const updated = [...prev];
      const currentTags = updated[index].productTags;
      if (currentTags.includes(tag)) {
        updated[index].productTags = currentTags.filter(t => t !== tag);
      } else {
        updated[index].productTags = [...currentTags, tag];
      }
      return updated;
    });
  };

  const handleAddPosition = () => {
    const nextOrder = formState.length + 1;
    setFormState(prev => [...prev, {
      companyId: '',
      role: 'Principal',
      productTags: [],
      isEnabled: true
    }]);
  };

  const handleRemovePosition = async (index: number) => {
    const form = formState[index];
    
    if (form.id) {
      setDeleting(form.id);
      try {
        const { error } = await supabase
          .from('broker_deal_companies')
          .delete()
          .eq('id', form.id);
        
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Position removed successfully',
        });
      } catch (error: any) {
        console.error('Error removing position:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to remove position',
          variant: 'destructive',
        });
        setDeleting(null);
        return;
      } finally {
        setDeleting(null);
      }
    }

    setFormState(prev => prev.filter((_, i) => i !== index));
    fetchData();
  };

  const handleSave = async (index: number) => {
    const form = formState[index];
    if (!form.companyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setSaving(index);
    try {
      const data = {
        company_id: parseInt(form.companyId),
        role: form.role,
        product_tags: form.productTags,
        display_order: index + 1,
        is_enabled: form.isEnabled,
      };

      if (form.id) {
        // Update existing
        const { error } = await supabase
          .from('broker_deal_companies')
          .update(data)
          .eq('id', form.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('broker_deal_companies')
          .insert(data);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Position ${index + 1} saved successfully`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const getCompanyById = (id: number) => companies.find(c => c.id === id);

  const getCompanyInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Fuel className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Deal Companies Configuration
                <Badge variant="secondary" className="text-xs">
                  {formState.filter(f => f.companyId).length} Active
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Configure featured companies that brokers can select when creating deals. 
                These appear as selectable trading partners in the broker workflow.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Setup Guide */}
      {formState.every(f => !f.companyId) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-400">Quick Setup Guide</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  No companies configured yet. To get started:
                </p>
                <ol className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1 list-decimal list-inside">
                  <li>Select a company from the dropdown in each position card below</li>
                  <li>Choose the company's role (Principal, Mandated Seller, etc.)</li>
                  <li>Select product tags for filtering</li>
                  <li>Click "Save Position" to activate</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Position Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {formState.map((form, index) => {
          const selectedCompany = form.companyId ? getCompanyById(parseInt(form.companyId)) : null;

          return (
            <Card 
              key={index} 
              className={`relative overflow-hidden transition-all ${
                form.isEnabled 
                  ? 'border-2 hover:shadow-lg' 
                  : 'border border-dashed opacity-60'
              }`}
            >
              {/* Position Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                      selectedCompany 
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
                        : 'bg-gradient-to-br from-primary to-primary/70'
                    }`}>
                      {selectedCompany?.logo_url ? (
                        <img 
                          src={selectedCompany.logo_url} 
                          alt={selectedCompany.name}
                          className="w-8 h-8 object-contain rounded"
                        />
                      ) : selectedCompany ? (
                        <span className="text-lg font-bold text-white">
                          {getCompanyInitials(selectedCompany.name)}
                        </span>
                      ) : (
                        <span className="text-2xl font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">Position {index + 1}</CardTitle>
                      {selectedCompany && (
                        <p className="text-xs text-muted-foreground">{selectedCompany.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isEnabled}
                      onCheckedChange={(checked) => handleFormChange(index, 'isEnabled', checked)}
                    />
                    {formState.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePosition(index)}
                        disabled={deleting === form.id}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Company Selection */}
                <div>
                  <Label className="text-sm font-medium">Company *</Label>
                  <Select
                    value={form.companyId}
                    onValueChange={(value) => handleFormChange(index, 'companyId', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a company..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
                              {company.logo_url ? (
                                <img src={company.logo_url} alt="" className="w-5 h-5 object-contain" />
                              ) : (
                                getCompanyInitials(company.name)
                              )}
                            </div>
                            <span>{company.name}</span>
                            {company.is_verified && (
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            )}
                            {company.country && (
                              <span className="text-muted-foreground text-xs">
                                • {company.country}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection */}
                <div>
                  <Label className="text-sm font-medium">Role *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => handleFormChange(index, 'role', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Tags */}
                <div>
                  <Label className="text-sm font-medium">Product Tags</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {PRODUCT_OPTIONS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={form.productTags.includes(tag) ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs transition-all ${
                          form.productTags.includes(tag) 
                            ? 'bg-primary hover:bg-primary/80' 
                            : 'hover:bg-primary/10'
                        }`}
                        onClick={() => handleProductTagToggle(index, tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Preview Card */}
                {selectedCompany && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border">
                    <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-lg">
                        {selectedCompany.logo_url ? (
                          <img 
                            src={selectedCompany.logo_url} 
                            alt={selectedCompany.name}
                            className="w-10 h-10 object-contain rounded"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {getCompanyInitials(selectedCompany.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{selectedCompany.name}</span>
                          {selectedCompany.is_verified && (
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {form.role}
                          </Badge>
                          {selectedCompany.country && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {selectedCompany.country}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {form.productTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        {form.productTags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {form.productTags.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{form.productTags.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Save Button */}
                <Button
                  onClick={() => handleSave(index)}
                  disabled={saving === index || !form.companyId}
                  className="w-full"
                  variant={form.id ? "secondary" : "default"}
                >
                  {saving === index ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {form.id ? 'Update Position' : 'Save Position'} {index + 1}
                </Button>
              </CardContent>

              {/* Disabled Overlay */}
              {!form.isEnabled && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                  <div className="text-center p-4">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Position Disabled</p>
                    <p className="text-xs text-muted-foreground mt-1">Toggle switch to enable</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {/* Add New Position Card */}
        <Card 
          className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer group min-h-[300px] flex items-center justify-center"
          onClick={handleAddPosition}
        >
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Add New Position
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click to add another company slot
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Footer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How This Works</p>
              <p className="mt-1">
                Configured companies appear in the broker's "Create Deal" workflow. 
                Brokers select from these pre-approved trading partners when initiating new transactions.
                Each position can have different product specializations and roles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealCompaniesManagement;
