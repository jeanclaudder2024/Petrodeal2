import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Globe, 
  Clock, 
  Shield, 
  Save,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface TalentProgram {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  settings: {
    supported_languages?: string[];
    link_expiry_hours?: number;
    require_linkedin?: boolean;
    max_attempts?: number;
  } | null;
}

interface ContentTranslation {
  id: string;
  content_key: string;
  language_code: string;
  content_text: string;
  content_type: string;
}

const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
];

const TalentSettingsTab = () => {
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Fetch program settings
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['talent-program-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_programs')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data as TalentProgram;
    },
  });

  // Fetch content translations
  const { data: translations, isLoading: translationsLoading } = useQuery({
    queryKey: ['talent-content-translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('talent_content_translations')
        .select('*')
        .order('content_key');

      if (error) throw error;
      return data as ContentTranslation[];
    },
  });

  // Local state for form
  const [settings, setSettings] = useState({
    name: program?.name || 'Remote Growth Talent Assessment',
    description: program?.description || '',
    is_active: program?.is_active ?? true,
    supported_languages: (program?.settings as any)?.supported_languages || ['en', 'ar', 'es', 'fr', 'zh', 'nl', 'et'],
    link_expiry_hours: (program?.settings as any)?.link_expiry_hours || 72,
    require_linkedin: (program?.settings as any)?.require_linkedin || false,
    max_attempts: (program?.settings as any)?.max_attempts || 1,
  });

  const [disclaimerText, setDisclaimerText] = useState('');

  // Update settings when program loads
  React.useEffect(() => {
    if (program) {
      setSettings({
        name: program.name,
        description: program.description || '',
        is_active: program.is_active,
        supported_languages: (program.settings as any)?.supported_languages || ['en'],
        link_expiry_hours: (program.settings as any)?.link_expiry_hours || 72,
        require_linkedin: (program.settings as any)?.require_linkedin || false,
        max_attempts: (program.settings as any)?.max_attempts || 1,
      });
    }
  }, [program]);

  // Update disclaimer when translations load or language changes
  React.useEffect(() => {
    const disclaimer = translations?.find(
      (t) => t.content_key === 'assessment_disclaimer' && t.language_code === selectedLanguage
    );
    setDisclaimerText(disclaimer?.content_text || '');
  }, [translations, selectedLanguage]);

  // Save program settings
  const saveProgramMutation = useMutation({
    mutationFn: async () => {
      if (!program) return;

      const { error } = await supabase
        .from('talent_programs')
        .update({
          name: settings.name,
          description: settings.description,
          is_active: settings.is_active,
          settings: {
            supported_languages: settings.supported_languages,
            link_expiry_hours: settings.link_expiry_hours,
            require_linkedin: settings.require_linkedin,
            max_attempts: settings.max_attempts,
          },
        })
        .eq('id', program.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-program-settings'] });
      toast.success('Settings saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Save disclaimer translation
  const saveDisclaimerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('talent_content_translations')
        .upsert({
          content_key: 'assessment_disclaimer',
          language_code: selectedLanguage,
          content_text: disclaimerText,
          content_type: 'disclaimer',
        }, { onConflict: 'content_key,language_code' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talent-content-translations'] });
      toast.success('Disclaimer saved');
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const toggleLanguage = (code: string) => {
    const current = settings.supported_languages;
    if (current.includes(code)) {
      if (current.length > 1) {
        setSettings({
          ...settings,
          supported_languages: current.filter((c) => c !== code),
        });
      }
    } else {
      setSettings({
        ...settings,
        supported_languages: [...current, code],
      });
    }
  };

  if (programLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Program Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Program Settings
          </CardTitle>
          <CardDescription>Configure the main assessment program</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Program Name</Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.is_active}
                  onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
                />
                <Label>Program Active</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              rows={3}
            />
          </div>

          <Separator />

          {/* Supported Languages */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4" />
              Supported Languages
            </Label>
            <div className="flex flex-wrap gap-2">
              {supportedLanguages.map((lang) => (
                <Badge
                  key={lang.code}
                  variant={settings.supported_languages.includes(lang.code) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => toggleLanguage(lang.code)}
                >
                  {lang.flag} {lang.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Link & Access Settings */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Link Expiry (hours)
              </Label>
              <Select
                value={settings.link_expiry_hours.toString()}
                onValueChange={(v) => setSettings({ ...settings, link_expiry_hours: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                  <SelectItem value="336">2 weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Assessment Attempts</Label>
              <Select
                value={settings.max_attempts.toString()}
                onValueChange={(v) => setSettings({ ...settings, max_attempts: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 attempt</SelectItem>
                  <SelectItem value="2">2 attempts</SelectItem>
                  <SelectItem value="3">3 attempts</SelectItem>
                  <SelectItem value="0">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.require_linkedin}
                  onCheckedChange={(checked) => setSettings({ ...settings, require_linkedin: checked })}
                />
                <Label>Require LinkedIn Profile</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => saveProgramMutation.mutate()} disabled={saveProgramMutation.isPending}>
              {saveProgramMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Legal Disclaimer
          </CardTitle>
          <CardDescription>
            This disclaimer is shown to candidates before they start the assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Language:</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={disclaimerText}
            onChange={(e) => setDisclaimerText(e.target.value)}
            rows={5}
            placeholder="This program is a professional assessment and market simulation. Participation does not guarantee employment..."
          />

          <div className="flex justify-end">
            <Button onClick={() => saveDisclaimerMutation.mutate()} disabled={saveDisclaimerMutation.isPending}>
              {saveDisclaimerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Disclaimer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalentSettingsTab;
