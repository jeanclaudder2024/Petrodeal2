import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, MoveUp, MoveDown, ExternalLink, Image, Loader2 } from 'lucide-react';

interface SponsorBanner {
  id: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
  sponsor_text: string;
  sponsor_website_url: string | null;
  display_order: number;
  is_active: boolean;
  show_on_registration: boolean;
  show_on_footer: boolean;
  show_on_dashboard_map: boolean;
  created_at: string;
}

const SponsorshipManagement = () => {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<SponsorBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<SponsorBanner | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    sponsor_name: '',
    sponsor_logo_url: '',
    sponsor_text: '',
    sponsor_website_url: '',
    is_active: true,
    show_on_registration: false,
    show_on_footer: false,
    show_on_dashboard_map: false
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSponsors((data as SponsorBanner[]) || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sponsor-${Date.now()}.${fileExt}`;
      const filePath = `sponsors/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('landing-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, sponsor_logo_url: publicUrl }));
      toast({ title: 'Logo Uploaded', description: 'Sponsor logo uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = (sponsor?: SponsorBanner) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setFormData({
        sponsor_name: sponsor.sponsor_name,
        sponsor_logo_url: sponsor.sponsor_logo_url || '',
        sponsor_text: sponsor.sponsor_text,
        sponsor_website_url: sponsor.sponsor_website_url || '',
        is_active: sponsor.is_active,
        show_on_registration: sponsor.show_on_registration,
        show_on_footer: sponsor.show_on_footer,
        show_on_dashboard_map: sponsor.show_on_dashboard_map
      });
    } else {
      setEditingSponsor(null);
      setFormData({
        sponsor_name: '',
        sponsor_logo_url: '',
        sponsor_text: '',
        sponsor_website_url: '',
        is_active: true,
        show_on_registration: false,
        show_on_footer: false,
        show_on_dashboard_map: false
      });
    }
    setDialogOpen(true);
  };

  const saveSponsor = async () => {
    if (!formData.sponsor_name || !formData.sponsor_text) {
      toast({ title: 'Error', description: 'Name and text are required', variant: 'destructive' });
      return;
    }

    if (formData.sponsor_text.length > 120) {
      toast({ title: 'Error', description: 'Sponsor text must be 120 characters or less', variant: 'destructive' });
      return;
    }

    // Check max 3 sponsors per location
    const activeLocations = [
      formData.show_on_registration && 'registration',
      formData.show_on_footer && 'footer', 
      formData.show_on_dashboard_map && 'dashboard_map'
    ].filter(Boolean);

    for (const location of activeLocations) {
      const locationKey = `show_on_${location}` as keyof typeof formData;
      const currentInLocation = sponsors.filter(s => 
        s[locationKey as keyof SponsorBanner] && s.id !== editingSponsor?.id
      );
      if (currentInLocation.length >= 3) {
        toast({ 
          title: 'Maximum Reached', 
          description: `Maximum 3 sponsors allowed in ${location?.replace('_', ' ')}`, 
          variant: 'destructive' 
        });
        return;
      }
    }

    setSaving(true);
    try {
      if (editingSponsor) {
        const { error } = await supabase
          .from('sponsor_banners')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSponsor.id);
        if (error) throw error;
        toast({ title: 'Sponsor Updated' });
      } else {
        const maxOrder = Math.max(...sponsors.map(s => s.display_order), -1);
        const { error } = await supabase
          .from('sponsor_banners')
          .insert({
            ...formData,
            display_order: maxOrder + 1
          });
        if (error) throw error;
        toast({ title: 'Sponsor Added' });
      }
      setDialogOpen(false);
      loadSponsors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm('Delete this sponsor?')) return;
    try {
      const { error } = await supabase
        .from('sponsor_banners')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Sponsor Deleted' });
      loadSponsors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const moveSponsor = async (id: string, direction: 'up' | 'down') => {
    const index = sponsors.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sponsors.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const otherSponsor = sponsors[newIndex];
    
    try {
      await Promise.all([
        supabase.from('sponsor_banners').update({ display_order: newIndex }).eq('id', id),
        supabase.from('sponsor_banners').update({ display_order: index }).eq('id', otherSponsor.id)
      ]);
      loadSponsors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const toggleVisibility = async (id: string, field: string, value: boolean) => {
    // Check max 3 sponsors per location when enabling
    if (value) {
      const currentInLocation = sponsors.filter(s => 
        s[field as keyof SponsorBanner] && s.id !== id
      );
      if (currentInLocation.length >= 3) {
        toast({ 
          title: 'Maximum Reached', 
          description: 'Maximum 3 sponsors allowed per location', 
          variant: 'destructive' 
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('sponsor_banners')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
      loadSponsors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Sponsorship & Innovation Support</CardTitle>
              <CardDescription>
                Manage sponsor banners displayed across the platform. Maximum 3 sponsors per location.
              </CardDescription>
            </div>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" /> Add Sponsor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sponsors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sponsors configured yet.</p>
              <p className="text-sm mt-2">Add sponsors to display innovation support acknowledgments.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsors.map((sponsor, index) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => moveSponsor(sponsor.id, 'up')} disabled={index === 0}>
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => moveSponsor(sponsor.id, 'down')} disabled={index === sponsors.length - 1}>
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sponsor.sponsor_logo_url ? (
                        <img 
                          src={sponsor.sponsor_logo_url} 
                          alt={sponsor.sponsor_name}
                          className="h-10 w-auto max-w-20 object-contain grayscale"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{sponsor.sponsor_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{sponsor.sponsor_text}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={sponsor.show_on_registration} 
                            onCheckedChange={(v) => toggleVisibility(sponsor.id, 'show_on_registration', v)}
                          />
                          <span className="text-xs">Registration</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={sponsor.show_on_footer} 
                            onCheckedChange={(v) => toggleVisibility(sponsor.id, 'show_on_footer', v)}
                          />
                          <span className="text-xs">Footer</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={sponsor.show_on_dashboard_map} 
                            onCheckedChange={(v) => toggleVisibility(sponsor.id, 'show_on_dashboard_map', v)}
                          />
                          <span className="text-xs">Map Page</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sponsor.is_active ? 'default' : 'secondary'}>
                        {sponsor.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(sponsor)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {sponsor.sponsor_website_url && (
                          <Button size="icon" variant="ghost" asChild>
                            <a href={sponsor.sponsor_website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => deleteSponsor(sponsor.id)}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}</DialogTitle>
            <DialogDescription>
              Configure sponsor banner for innovation support acknowledgment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sponsor Name *</Label>
              <Input
                placeholder="e.g., Innovation Foundation"
                value={formData.sponsor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, sponsor_name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Sponsor Logo</Label>
              <div className="flex gap-2 items-center mt-1">
                {formData.sponsor_logo_url && (
                  <img 
                    src={formData.sponsor_logo_url} 
                    alt="Preview" 
                    className="h-12 w-auto max-w-24 object-contain grayscale border rounded"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Logo will be displayed in grayscale</p>
            </div>

            <div>
              <Label>Support Text * (max 120 characters)</Label>
              <Textarea
                placeholder="e.g., Supporting innovation in the oil & energy sector"
                value={formData.sponsor_text}
                onChange={(e) => setFormData(prev => ({ ...prev, sponsor_text: e.target.value.slice(0, 120) }))}
                maxLength={120}
                rows={2}
              />
              <p className="text-xs text-muted-foreground text-right">{formData.sponsor_text.length}/120</p>
            </div>

            <div>
              <Label>Website URL (optional)</Label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={formData.sponsor_website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, sponsor_website_url: e.target.value }))}
              />
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Display Locations</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Create Account Page (Step 1)</span>
                <Switch
                  checked={formData.show_on_registration}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_on_registration: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Global Footer</span>
                <Switch
                  checked={formData.show_on_footer}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_on_footer: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Dashboard Map Page</span>
                <Switch
                  checked={formData.show_on_dashboard_map}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, show_on_dashboard_map: v }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active</span>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveSponsor} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingSponsor ? 'Update' : 'Add'} Sponsor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SponsorshipManagement;
