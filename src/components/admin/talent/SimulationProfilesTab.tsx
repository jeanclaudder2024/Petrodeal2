import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, User, Briefcase, Building, Loader2 } from 'lucide-react';

interface SimulationProfile {
  id: string;
  name: string;
  role: string;
  seniority: string;
  company_type: string | null;
  industry: string;
  profile_image_url: string | null;
  is_enabled: boolean;
  display_order: number;
}

interface ProfileTranslation {
  id: string;
  profile_id: string;
  language_code: string;
  bio: string | null;
  challenge_description: string | null;
  objection_scenario: string | null;
}

const seniorityLevels = [
  { value: 'junior', label: 'Junior (0-3 years)' },
  { value: 'mid', label: 'Mid-Level (3-7 years)' },
  { value: 'senior', label: 'Senior (7-15 years)' },
  { value: 'executive', label: 'Executive (VP/Director)' },
  { value: 'c-level', label: 'C-Level (CEO/CTO/CFO)' },
];

const SimulationProfilesTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SimulationProfile | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    seniority: 'senior',
    company_type: '',
    industry: 'Oil & Energy',
    profile_image_url: '',
    is_enabled: true,
    bio: '',
    challenge_description: '',
    objection_scenario: '',
  });

  // Fetch profiles with translations
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['simulation-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_simulation_profiles')
        .select(`
          *,
          talent_simulation_profile_translations (*)
        `)
        .order('display_order');

      if (error) throw error;
      return data as (SimulationProfile & { talent_simulation_profile_translations: ProfileTranslation[] })[];
    },
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (editingProfile) {
        // Update profile
        const { error: pError } = await supabase
          .from('talent_simulation_profiles')
          .update({
            name: formData.name,
            role: formData.role,
            seniority: formData.seniority,
            company_type: formData.company_type || null,
            industry: formData.industry,
            profile_image_url: formData.profile_image_url || null,
            is_enabled: formData.is_enabled,
          })
          .eq('id', editingProfile.id);
        if (pError) throw pError;

        // Upsert translation
        const { error: tError } = await supabase
          .from('talent_simulation_profile_translations')
          .upsert({
            profile_id: editingProfile.id,
            language_code: selectedLanguage,
            bio: formData.bio || null,
            challenge_description: formData.challenge_description || null,
            objection_scenario: formData.objection_scenario || null,
          }, { onConflict: 'profile_id,language_code' });
        if (tError) throw tError;
      } else {
        // Get program ID
        const { data: programs } = await supabase
          .from('talent_programs')
          .select('id')
          .eq('is_active', true)
          .limit(1);

        const programId = programs?.[0]?.id;

        // Create profile
        const { data: newProfile, error: pError } = await supabase
          .from('talent_simulation_profiles')
          .insert({
            program_id: programId,
            name: formData.name,
            role: formData.role,
            seniority: formData.seniority,
            company_type: formData.company_type || null,
            industry: formData.industry,
            profile_image_url: formData.profile_image_url || null,
            is_enabled: formData.is_enabled,
            display_order: (profiles?.length || 0) + 1,
          })
          .select()
          .single();
        if (pError) throw pError;

        // Create translation
        const { error: tError } = await supabase
          .from('talent_simulation_profile_translations')
          .insert({
            profile_id: newProfile.id,
            language_code: selectedLanguage,
            bio: formData.bio || null,
            challenge_description: formData.challenge_description || null,
            objection_scenario: formData.objection_scenario || null,
          });
        if (tError) throw tError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation-profiles'] });
      toast.success(editingProfile ? 'Profile updated' : 'Profile created');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('talent_simulation_profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation-profiles'] });
      toast.success('Profile deleted');
    },
  });

  // Toggle profile status
  const toggleProfileMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('talent_simulation_profiles')
        .update({ is_enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulation-profiles'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      seniority: 'senior',
      company_type: '',
      industry: 'Oil & Energy',
      profile_image_url: '',
      is_enabled: true,
      bio: '',
      challenge_description: '',
      objection_scenario: '',
    });
    setEditingProfile(null);
  };

  const handleEdit = (profile: SimulationProfile & { talent_simulation_profile_translations: ProfileTranslation[] }) => {
    const translation = profile.talent_simulation_profile_translations?.find(
      (t) => t.language_code === selectedLanguage
    ) || profile.talent_simulation_profile_translations?.[0];

    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      role: profile.role,
      seniority: profile.seniority,
      company_type: profile.company_type || '',
      industry: profile.industry,
      profile_image_url: profile.profile_image_url || '',
      is_enabled: profile.is_enabled,
      bio: translation?.bio || '',
      challenge_description: translation?.challenge_description || '',
      objection_scenario: translation?.objection_scenario || '',
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getSeniorityBadge = (seniority: string) => {
    const config = seniorityLevels.find((s) => s.value === seniority);
    const colorMap: Record<string, string> = {
      junior: 'bg-green-500',
      mid: 'bg-blue-500',
      senior: 'bg-purple-500',
      executive: 'bg-orange-500',
      'c-level': 'bg-red-500',
    };
    return (
      <Badge className={`${colorMap[seniority] || 'bg-gray-500'} text-white`}>
        {config?.label.split(' ')[0] || seniority}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Simulation Profiles (Stage 4)</span>
          <div className="flex items-center gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Profile
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Manage the 5 fictional personas used in the Growth Simulation stage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profiles?.map((profile) => {
              const translation = profile.talent_simulation_profile_translations?.find(
                (t) => t.language_code === selectedLanguage
              );
              return (
                <Card key={profile.id} className={`${!profile.is_enabled ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={profile.profile_image_url || ''} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold truncate">{profile.name}</h4>
                          <Switch
                            checked={profile.is_enabled}
                            onCheckedChange={(checked) =>
                              toggleProfileMutation.mutate({ id: profile.id, is_enabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Briefcase className="h-3 w-3" />
                          <span className="truncate">{profile.role}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{profile.company_type || profile.industry}</span>
                        </div>
                        {getSeniorityBadge(profile.seniority)}
                      </div>
                    </div>

                    {translation?.bio && (
                      <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{translation.bio}</p>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(profile)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteProfileMutation.mutate(profile.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Edit Profile' : 'Create Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ahmed Al-Rashid"
                />
              </div>
              <div>
                <Label>Role/Position *</Label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Trading Operations Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seniority Level *</Label>
                <Select
                  value={formData.seniority}
                  onValueChange={(v) => setFormData({ ...formData, seniority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seniorityLevels.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Company Type</Label>
                <Input
                  value={formData.company_type}
                  onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                  placeholder="National Oil Company"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Industry</Label>
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Oil & Energy"
                />
              </div>
              <div>
                <Label>Profile Image URL</Label>
                <Input
                  value={formData.profile_image_url}
                  onChange={(e) => setFormData({ ...formData, profile_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">
                Content ({selectedLanguage.toUpperCase()})
              </h4>

              <div className="space-y-4">
                <div>
                  <Label>Bio/Background</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="15 years in oil trading across Middle East markets..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Challenge Description</Label>
                  <Textarea
                    value={formData.challenge_description}
                    onChange={(e) => setFormData({ ...formData, challenge_description: e.target.value })}
                    placeholder="Needs to modernize operations but faces resistance..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Objection Scenario</Label>
                  <Textarea
                    value={formData.objection_scenario}
                    onChange={(e) => setFormData({ ...formData, objection_scenario: e.target.value })}
                    placeholder='"We already have established relationships..."'
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SimulationProfilesTab;
