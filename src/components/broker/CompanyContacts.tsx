import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Search,
  Send,
  Loader2,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Company {
  id: number;
  name: string;
  company_type: string;
  email: string | null;
  official_email: string | null;
  operations_email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  representative_name: string | null;
  representative_email: string | null;
  is_verified: boolean;
}

const CompanyContacts: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, company_type, email, official_email, operations_email, phone, country, city, address, website, representative_name, representative_email, is_verified')
        .order('name', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const getCompanyEmail = (company: Company): string | null => {
    return company.official_email || company.operations_email || company.representative_email || company.email;
  };

  const handleSendEmail = async () => {
    if (!selectedCompany || !emailSubject.trim() || !emailBody.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const recipientEmail = getCompanyEmail(selectedCompany);
    if (!recipientEmail) {
      toast.error('No email address available for this company');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-smtp-email', {
        body: {
          to: recipientEmail,
          subject: emailSubject,
          html: `<div style="font-family: Arial, sans-serif;">
            <p>${emailBody.replace(/\n/g, '<br/>')}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">Sent via PetroDealHub Broker Platform</p>
          </div>`
        }
      });

      if (error) throw error;

      toast.success('Email sent successfully');
      setSelectedCompany(null);
      setEmailSubject('');
      setEmailBody('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.company_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, type, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompanies.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No companies found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{company.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {company.company_type}
                        </Badge>
                        {company.is_verified && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.representative_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{company.representative_name}</span>
                  </div>
                )}
                
                {(company.country || company.city) && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {[company.city, company.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                
                {getCompanyEmail(company) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {getCompanyEmail(company)}
                    </span>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{company.phone}</span>
                  </div>
                )}

                <div className="pt-3 flex gap-2">
                  {getCompanyEmail(company) && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedCompany(company)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  )}
                  {company.website && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(company.website!, '_blank')}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Email Dialog */}
      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email to {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Compose and send an email directly to this company
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <Mail className="h-4 w-4" />
              <span>To: {selectedCompany && getCompanyEmail(selectedCompany)}</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Write your message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCompany(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyContacts;
