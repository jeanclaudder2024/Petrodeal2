import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/supabase-helper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import LoadingFallback from '@/components/LoadingFallback';
import { ArrowLeft, Send, Paperclip, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface FormData {
  category_id: string;
  email: string;
  subject: string;
  description: string;
  service_domain: string;
  consent: boolean;
}

const NewTicket = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [formData, setFormData] = useState<FormData>({
    category_id: '',
    email: user?.email || '',
    subject: '',
    description: '',
    service_domain: '',
    consent: false,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('support_categories')
        .select('id, name_en, description_en')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Map to expected format
      const mappedCategories = (data || []).map(cat => ({
        id: cat.id,
        name: cat.name_en,
        description: cat.description_en
      }));

      setCategories(mappedCategories);

    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast({
        title: "Error",
        description: "Failed to load support categories.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.category_id) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email) {
      toast({
        title: "Validation Error",
        description: "Please provide your email address.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.subject.length < 8 || formData.subject.length > 120) {
      toast({
        title: "Validation Error",
        description: "Subject must be between 8 and 120 characters.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.description.length < 30) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 30 characters long.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.consent) {
      toast({
        title: "Validation Error",
        description: "Please agree to be contacted via email.",
        variant: "destructive",
      });
      return false;
    }

    if (attachments && attachments.length > 5) {
      toast({
        title: "Validation Error",
        description: "Maximum 5 files allowed.",
        variant: "destructive",
      });
      return false;
    }

    // Check file sizes
    if (attachments) {
      for (let i = 0; i < attachments.length; i++) {
        const ext = attachments[i].name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
          toast({
            title: "Validation Error",
            description: `File type not allowed: ${attachments[i].name}`,
            variant: "destructive",
          });
          return false;
        }
        if (attachments[i].size > 10 * 1024 * 1024) { // 10MB
          toast({
            title: "Validation Error",
            description: `File "${attachments[i].name}" exceeds 10MB limit.`,
            variant: "destructive",
          });
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Generate ticket number
      const ticketNumber = `TKT-${Date.now()}`;

      // Create ticket
      const { data: ticketData, error: ticketError } = await db
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          category_id: formData.category_id,
          email: formData.email,
          subject: formData.subject,
          description: formData.description,
          service_domain: formData.service_domain || null,
          user_id: user?.id || null,
          status: 'open',
          priority: 'medium',
          language: 'en',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      let attachmentUrls: string[] = [];
      if (attachments && attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          const ext = file.name.split('.').pop()?.toLowerCase();
          const fileName = `ticket_${ticketData.id}_${Date.now()}_${i}.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('support-attachments')
            .upload(fileName, file);
          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('support-attachments')
              .getPublicUrl(fileName);
            attachmentUrls.push(publicUrl);
          }
        }
      }
      // Save attachment URLs to the first message (or ticket record if you prefer)
      if (attachmentUrls.length > 0) {
        await db.from('support_ticket_messages').insert({
          ticket_id: ticketData.id,
          message: '[User uploaded attachments]',
          user_id: user?.id || null,
          is_internal: false,
          attachments: attachmentUrls,
        });
      }

      // Send notification email
      await supabase.functions.invoke('send-support-notification', {
        body: {
          type: 'new_ticket',
          ticket: ticketData,
          attachments: attachments ? Array.from(attachments).map(f => f.name) : [],
        },
      });

      toast({
        title: "Ticket Created Successfully!",
        description: `Your ticket #${ticketNumber} has been created. We'll get back to you soon.`,
      });

      // Redirect to ticket detail or my tickets
      navigate(user ? '/my-tickets' : '/support');

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/support')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>

        <h1 className="text-3xl font-bold mb-2">Open a New Ticket</h1>
        <p className="text-muted-foreground">
          Describe your issue and we'll help you resolve it as quickly as possible.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Brief description of your issue (8-120 characters)"
                minLength={8}
                maxLength={120}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.subject.length}/120 characters
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Please provide detailed information about your issue (minimum 30 characters)"
                rows={6}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description.length} characters (minimum 30)
              </p>
            </div>

            <div>
              <Label htmlFor="service_domain">Service/Domain (optional)</Label>
              <Input
                id="service_domain"
                value={formData.service_domain}
                onChange={(e) => handleInputChange('service_domain', e.target.value)}
                placeholder="e.g., yourcompany.com or specific service"
              />
            </div>

            <div>
              <Label htmlFor="attachments">Attachments (optional)</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAttachments(e.target.files)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Max 5 files, 10MB each. Supported: PDF, JPG, PNG
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => handleInputChange('consent', checked as boolean)}
              />
              <Label htmlFor="consent" className="text-sm">
                I agree to be contacted via email regarding this support ticket *
              </Label>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Ticket...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Support Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewTicket;