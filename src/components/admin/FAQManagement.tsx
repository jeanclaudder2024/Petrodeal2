import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, MoveUp, MoveDown, HelpCircle, Phone, Loader2, Save, RefreshCw } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface ContactInfo {
  id: string;
  email_support: string;
  phone_support: string;
  business_hours: string;
}

const FAQManagement = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [activeTab, setActiveTab] = useState('faqs');

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    is_active: true
  });

  const categories = [
    'General',
    'Getting Started',
    'Trading',
    'Pricing',
    'Subscription',
    'Verification',
    'Security',
    'Vessels',
    'Ports',
    'Payment'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [faqRes, contactRes] = await Promise.all([
        db.from('support_faqs').select('*').order('sort_order', { ascending: true }),
        db.from('support_contact_info').select('*').limit(1).single()
      ]);

      if (faqRes.data) setFaqs(faqRes.data);
      if (contactRes.data) setContactInfo(contactRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        is_active: faq.is_active
      });
    } else {
      setEditingFaq(null);
      setFormData({
        question: '',
        answer: '',
        category: 'General',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const saveFaq = async () => {
    if (!formData.question || !formData.answer) {
      toast.error('Question and answer are required');
      return;
    }

    setSaving(true);
    try {
      if (editingFaq) {
        const { error } = await db
          .from('support_faqs')
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFaq.id);

        if (error) throw error;
        toast.success('FAQ updated');
      } else {
        const maxOrder = Math.max(...faqs.map(f => f.sort_order), -1);
        const { error } = await db
          .from('support_faqs')
          .insert({
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            is_active: formData.is_active,
            sort_order: maxOrder + 1
          });

        if (error) throw error;
        toast.success('FAQ created');
      }

      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;

    try {
      const { error } = await db.from('support_faqs').delete().eq('id', id);
      if (error) throw error;
      toast.success('FAQ deleted');
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const moveFaq = async (id: string, direction: 'up' | 'down') => {
    const index = faqs.findIndex(f => f.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === faqs.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const otherFaq = faqs[newIndex];

    try {
      await Promise.all([
        db.from('support_faqs').update({ sort_order: newIndex }).eq('id', id),
        db.from('support_faqs').update({ sort_order: index }).eq('id', otherFaq.id)
      ]);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await db
        .from('support_faqs')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const saveContactInfo = async () => {
    if (!contactInfo) return;

    setSaving(true);
    try {
      const { error } = await db
        .from('support_contact_info')
        .update({
          email_support: contactInfo.email_support,
          phone_support: contactInfo.phone_support,
          business_hours: contactInfo.business_hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactInfo.id);

      if (error) throw error;
      toast.success('Contact information updated');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const syncFAQsFromSupport = async () => {
    setSyncing(true);
    try {
      // Default FAQs to import if none exist
      const defaultFAQs = [
        { question: 'What is PetroDealHub?', answer: 'PetroDealHub is a comprehensive oil trading platform that connects buyers, sellers, and brokers in the petroleum industry.', category: 'General' },
        { question: 'How do I create an account?', answer: 'Click on the "Sign Up" button in the top navigation, fill in your details, and verify your email to get started.', category: 'Getting Started' },
        { question: 'What subscription plans are available?', answer: 'We offer Basic, Professional, and Enterprise plans with various features tailored to different trading needs.', category: 'Subscription' },
        { question: 'How do I track vessels?', answer: 'Navigate to the Vessels section in your dashboard to access real-time vessel tracking and AIS data.', category: 'Vessels' },
        { question: 'How do I become a verified broker?', answer: 'Purchase a broker membership, complete your profile, and submit verification documents. Our team will review within 1-2 business days.', category: 'Verification' },
        { question: 'Is my data secure?', answer: 'Yes, we use industry-standard encryption and security measures to protect your data. See our Privacy Policy for details.', category: 'Security' },
        { question: 'How do I contact support?', answer: 'You can reach our support team via the Contact Us page, create a support ticket, or use our AI assistant for quick answers.', category: 'General' },
        { question: 'What payment methods are accepted?', answer: 'We accept all major credit cards through our secure Stripe payment gateway.', category: 'Payment' },
      ];

      // First try to sync from support page content if available
      const { data: supportContent } = await db
        .from('cms_page_content')
        .select('content_sections')
        .eq('page_slug', 'support')
        .single();

      let syncedCount = 0;
      
      if (supportContent?.content_sections) {
        const sections = Array.isArray(supportContent.content_sections) ? supportContent.content_sections : [];
        const faqSections = sections.filter((s: any) => s.type === 'faq' || s.title?.toLowerCase().includes('faq'));
        
        for (const section of faqSections) {
          if (section.items && Array.isArray(section.items)) {
            for (const item of section.items) {
              if (item.question && item.answer) {
                const { data: existing } = await db
                  .from('support_faqs')
                  .select('id')
                  .eq('question', item.question)
                  .maybeSingle();

                if (!existing) {
                  await db.from('support_faqs').insert({
                    question: item.question,
                    answer: item.answer,
                    category: section.category || 'General',
                    is_active: true,
                    sort_order: faqs.length + syncedCount
                  });
                  syncedCount++;
                }
              }
            }
          }
        }
      }
      
      // If no FAQs synced and database is empty, populate with defaults
      if (syncedCount === 0 && faqs.length === 0) {
        for (let i = 0; i < defaultFAQs.length; i++) {
          const faq = defaultFAQs[i];
          const { data: existing } = await db
            .from('support_faqs')
            .select('id')
            .eq('question', faq.question)
            .maybeSingle();

          if (!existing) {
            await db.from('support_faqs').insert({
              question: faq.question,
              answer: faq.answer,
              category: faq.category,
              is_active: true,
              sort_order: i
            });
            syncedCount++;
          }
        }
        
        if (syncedCount > 0) {
          toast.success(`Populated ${syncedCount} default FAQs`);
        }
      } else if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} FAQs from support page`);
      } else {
        toast.info('No new FAQs to sync');
      }
      
      loadData();
    } catch (error: any) {
      toast.error('Failed to sync FAQs: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contact Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Manage FAQs displayed on the Support page
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={syncFAQsFromSupport} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync from Support'}
                  </Button>
                  <Button onClick={() => openEditDialog()}>
                    <Plus className="h-4 w-4 mr-2" /> Add FAQ
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {faqs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No FAQs configured yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq, index) => (
                      <TableRow key={faq.id}>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => moveFaq(faq.id, 'up')} disabled={index === 0}>
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => moveFaq(faq.id, 'down')} disabled={index === faqs.length - 1}>
                              <MoveDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="font-medium truncate">{faq.question}</div>
                          <div className="text-xs text-muted-foreground truncate">{faq.answer}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{faq.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={faq.is_active}
                            onCheckedChange={() => toggleActive(faq.id, faq.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(faq)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteFaq(faq.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update the contact information displayed on the Support page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo && (
                <>
                  <div>
                    <Label>Email Support</Label>
                    <Input
                      value={contactInfo.email_support}
                      onChange={(e) => setContactInfo({ ...contactInfo, email_support: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone Support</Label>
                    <Input
                      value={contactInfo.phone_support}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone_support: e.target.value })}
                      placeholder="+1 (202) 773-6521"
                    />
                  </div>
                  <div>
                    <Label>Business Hours</Label>
                    <Input
                      value={contactInfo.business_hours}
                      onChange={(e) => setContactInfo({ ...contactInfo, business_hours: e.target.value })}
                      placeholder="Mon-Fri: 9AM-6PM EST"
                    />
                  </div>
                  <Button onClick={saveContactInfo} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit FAQ Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
            <DialogDescription>
              {editingFaq ? 'Update the FAQ details' : 'Add a new frequently asked question'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question *</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question"
              />
            </div>
            <div>
              <Label>Answer *</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Enter the answer"
                rows={4}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveFaq} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingFaq ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FAQManagement;
