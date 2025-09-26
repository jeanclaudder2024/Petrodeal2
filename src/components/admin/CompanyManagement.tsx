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
import { Building2, Plus, Edit, Trash2, Search, Eye, EyeOff, Link, Sparkles } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: number;
  name: string;
  company_type: 'real' | 'fake';
  logo_url?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  industry?: string;
  employees_count?: number;
  annual_revenue?: number;
  founded_year?: number;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState<'all' | 'real' | 'fake'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({
    company_type: 'real'
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setFormData({...formData, logo_url: url});
    setLogoPreview(url || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate logo requirement for real companies
    if (formData.company_type === 'real' && !formData.logo_url?.trim()) {
      toast({
        title: "Error",
        description: "Logo URL is required for real companies",
        variant: "destructive"
      });
      return;
    }

    try {
      // Clean form data - only include fields that can be updated
      const cleanData: Partial<Company> = {
        name: formData.name,
        company_type: formData.company_type,
        logo_url: formData.logo_url,
        description: formData.description,
        website: formData.website,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        city: formData.city,
        industry: formData.industry,
        employees_count: formData.employees_count,
        annual_revenue: formData.annual_revenue,
        founded_year: formData.founded_year,
        is_verified: formData.is_verified
      };

      if (editingCompany) {
        const { error } = await db
          .from('companies')
          .update(cleanData)
          .eq('id', editingCompany.id);
        if (error) throw error;
        toast({ title: "Success", description: "Company updated successfully" });
      } else {
        const { error } = await db
          .from('companies')
          .insert([cleanData]);
        if (error) throw error;
        toast({ title: "Success", description: "Company created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingCompany(null);
      setFormData({company_type: 'real'});
      setLogoPreview(null);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to save company:', error);
      toast({
        title: "Error",
        description: "Failed to save company",
        variant: "destructive"
      });
    }
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

    setIsAutoFilling(true);
    try {
      const response = await fetch(`https://ozjhdxvwqbzcvcywhwjg.supabase.co/functions/v1/autofill-company-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: formData.name }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const aiData = result.data;
        setFormData({
          ...formData,
          description: aiData.description || formData.description,
          industry: aiData.industry || formData.industry,
          country: aiData.country || formData.country,
          city: aiData.city || formData.city,
          website: aiData.website || formData.website,
          email: aiData.email || formData.email,
          phone: aiData.phone || formData.phone,
          founded_year: aiData.founded_year || formData.founded_year,
          employees_count: aiData.employees_count || formData.employees_count,
          annual_revenue: aiData.annual_revenue || formData.annual_revenue,
        });
        
        toast({
          title: "Success",
          description: "Company details auto-filled successfully!",
        });
      } else {
        throw new Error(result.error || 'Failed to auto-fill data');
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    
    try {
      const { error } = await db
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Company deleted successfully" });
      fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive"
      });
    }
  };

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.industry?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = companyTypeFilter === 'all' || company.company_type === companyTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Management
          </CardTitle>
          <CardDescription>
            Add, edit, and manage companies in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={companyTypeFilter} onValueChange={(value: 'all' | 'real' | 'fake') => setCompanyTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="real">Real Companies</SelectItem>
                <SelectItem value="fake">Test Companies</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCompany(null);
                  setFormData({company_type: 'real'});
                  setLogoPreview(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                  <DialogDescription>
                    {editingCompany ? 'Update company information' : 'Enter company details to add to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="logo">Logo</TabsTrigger>
                      <TabsTrigger value="contact">Contact & Location</TabsTrigger>
                      <TabsTrigger value="business">Business Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div>
                        <Label htmlFor="name">Company Name *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter company name"
                            required
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAutoFill}
                            disabled={!formData.name?.trim() || isAutoFilling}
                            className="shrink-0"
                          >
                            {isAutoFilling ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            {isAutoFilling ? 'Auto-filling...' : 'AI Fill'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter company name and click "AI Fill" to automatically populate details
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="company_type">Company Type *</Label>
                        <Select value={formData.company_type} onValueChange={(value: 'real' | 'fake') => setFormData({...formData, company_type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="real">Real Company (visible on public page)</SelectItem>
                            <SelectItem value="fake">Test Company (admin only)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                          Real companies appear on the public companies page. Test companies are only visible in admin panel.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ''}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Company description..."
                          rows={3}
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
                            max="2024"
                            value={formData.founded_year || ''}
                            onChange={(e) => setFormData({...formData, founded_year: parseInt(e.target.value)})}
                          />
                        </div>
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

                    <TabsContent value="contact" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="contact@company.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
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
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Street address..."
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
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.country || ''}
                            onChange={(e) => setFormData({...formData, country: e.target.value})}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="employees_count">Employee Count</Label>
                          <Input
                            id="employees_count"
                            type="number"
                            min="1"
                            value={formData.employees_count || ''}
                            onChange={(e) => setFormData({...formData, employees_count: parseInt(e.target.value)})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="annual_revenue">Annual Revenue (USD)</Label>
                          <Input
                            id="annual_revenue"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.annual_revenue || ''}
                            onChange={(e) => setFormData({...formData, annual_revenue: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="logo" className="space-y-4">
                      <div>
                        <Label htmlFor="logo_url">
                          Company Logo URL {formData.company_type === 'real' && <span className="text-red-500">*</span>}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          {formData.company_type === 'real' 
                            ? 'Logo URL is required for real companies that appear on the public page.'
                            : 'Logo URL is optional for test companies.'
                          }
                        </p>
                        
                        {/* Logo URL Input */}
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                id="logo_url"
                                value={formData.logo_url || ''}
                                onChange={(e) => handleLogoUrlChange(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                type="url"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Enter a direct link to the company logo image
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setFormData({...formData, logo_url: ''});
                                setLogoPreview(null);
                              }}
                              disabled={!formData.logo_url}
                            >
                              Clear
                            </Button>
                          </div>

                          {/* Logo Preview */}
                          {logoPreview && (
                            <div className="mt-4">
                              <Label className="text-sm font-medium mb-2 block">Preview:</Label>
                              <div className="border rounded-lg p-4 bg-muted/50 inline-block">
                                <img
                                  src={logoPreview}
                                  alt="Company logo preview"
                                  className="w-32 h-32 object-contain"
                                  onError={() => {
                                    setLogoPreview(null);
                                    toast({
                                      title: "Invalid Image",
                                      description: "The logo URL is not accessible or not a valid image",
                                      variant: "destructive"
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCompany ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{companies.length}</div>
              <div className="text-sm text-muted-foreground">Total Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {companies.filter(c => c.company_type === 'real').length}
              </div>
              <div className="text-sm text-muted-foreground">Real Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {companies.filter(c => c.company_type === 'fake').length}
              </div>
              <div className="text-sm text-muted-foreground">Test Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {companies.filter(c => c.is_verified).length}
              </div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gold">
                {filteredCompanies.length}
              </div>
              <div className="text-sm text-muted-foreground">Filtered Results</div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/50">
                      <TableCell>
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={`${company.name} logo`}
                            className="w-12 h-12 object-contain rounded border bg-muted/50"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{company.name}</span>
                          {company.company_type === 'fake' && (
                            <div title="Test company - not visible on public page">
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.company_type === 'real' ? 'default' : 'secondary'}>
                          {company.company_type === 'real' ? 'Real' : 'Test'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {company.email && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">📧</span>
                              <span className="truncate max-w-32">{company.email}</span>
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">📞</span>
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center gap-1">
                              <Link className="h-3 w-3 text-muted-foreground" />
                              <a 
                                href={company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate max-w-32"
                              >
                                {company.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                          {!company.email && !company.phone && !company.website && (
                            <span className="text-muted-foreground">No contact info</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{company.industry || 'N/A'}</TableCell>
                      <TableCell>{company.country || 'N/A'}</TableCell>
                      <TableCell>{company.employees_count ? company.employees_count.toLocaleString() : 'N/A'}</TableCell>
                      <TableCell>
                        {company.is_verified ? (
                          <Badge variant="outline" className="text-green-600">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {company.created_at 
                          ? new Date(company.created_at).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCompany(company);
                              setFormData({
                                name: company.name,
                                company_type: company.company_type,
                                logo_url: company.logo_url,
                                description: company.description,
                                website: company.website,
                                email: company.email,
                                phone: company.phone,
                                address: company.address,
                                country: company.country,
                                city: company.city,
                                industry: company.industry,
                                employees_count: company.employees_count,
                                annual_revenue: company.annual_revenue,
                                founded_year: company.founded_year,
                                is_verified: company.is_verified
                              });
                              setLogoPreview(company.logo_url || null);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(company.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManagement;