import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Shield, Globe, Palette, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';

const Settings = () => {
  const { toast } = useToast();
  const { t, currentLanguage, languages, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: true,
    twoFactorAuth: false,
    language: currentLanguage.code,
    currency: 'USD',
    timezone: 'UTC',
    theme: theme || 'system',
  });

  // Load saved settings from user metadata
  useEffect(() => {
    if (user?.user_metadata?.settings) {
      const saved = user.user_metadata.settings;
      setSettings(prev => ({
        ...prev,
        emailNotifications: saved.emailNotifications ?? prev.emailNotifications,
        pushNotifications: saved.pushNotifications ?? prev.pushNotifications,
        marketingEmails: saved.marketingEmails ?? prev.marketingEmails,
        twoFactorAuth: saved.twoFactorAuth ?? prev.twoFactorAuth,
        currency: saved.currency ?? prev.currency,
        timezone: saved.timezone ?? prev.timezone,
      }));
    }
    setSettings(prev => ({
      ...prev,
      language: currentLanguage.code,
      theme: theme || 'system',
    }));
  }, [user, currentLanguage.code, theme]);

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Apply language change immediately
    if (key === 'language') {
      const lang = languages.find(l => l.code === value);
      if (lang) changeLanguage(lang);
    }

    // Apply theme change immediately
    if (key === 'theme') {
      setTheme(value as string);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          settings: {
            emailNotifications: settings.emailNotifications,
            pushNotifications: settings.pushNotifications,
            marketingEmails: settings.marketingEmails,
            twoFactorAuth: settings.twoFactorAuth,
            currency: settings.currency,
            timezone: settings.timezone,
          }
        }
      });
      if (error) throw error;
      toast({ title: t('settings.settingsSaved'), description: t('settings.settingsDescription') });
    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('settings.managePreferences', 'Manage your account preferences and application settings')}</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notifications</CardTitle>
            <CardDescription>Configure how you receive notifications and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about your account via email</p>
              </div>
              <Switch id="email-notifications" checked={settings.emailNotifications} onCheckedChange={(checked) => updateSetting('emailNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified about important updates in real-time</p>
              </div>
              <Switch id="push-notifications" checked={settings.pushNotifications} onCheckedChange={(checked) => updateSetting('pushNotifications', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive emails about new features and promotions</p>
              </div>
              <Switch id="marketing-emails" checked={settings.marketingEmails} onCheckedChange={(checked) => updateSetting('marketingEmails', checked)} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Switch id="two-factor" checked={settings.twoFactorAuth} onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)} />
            </div>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Localization</CardTitle>
            <CardDescription>Set your language, currency, and regional preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.flag} {lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="JPY">¥ JPY</SelectItem>
                    <SelectItem value="SAR">﷼ SAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="trading-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" />Appearance</CardTitle>
            <CardDescription>Customize the look and feel of your interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="light">☀️ Light</SelectItem>
                  <SelectItem value="dark">🌙 Dark</SelectItem>
                  <SelectItem value="system">🖥️ System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="w-full md:w-auto" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
