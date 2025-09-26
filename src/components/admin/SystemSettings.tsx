import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save } from 'lucide-react';
import { db } from '@/lib/supabase-helper';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

const SystemSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, newValue: any) => {
    setSaving(true);
    try {
      const { error } = await db
        .from('system_settings')
        .update({
          setting_value: newValue,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: newValue }
          : setting
      ));

      toast({
        title: "Success",
        description: "Setting updated successfully"
      });
    } catch (error) {
      console.error('Failed to update setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const { setting_key, setting_value, description } = setting;

    if (typeof setting_value === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{setting_key.replace(/_/g, ' ').toUpperCase()}</Label>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <Switch
            checked={setting_value}
            onCheckedChange={(checked) => updateSetting(setting_key, checked)}
            disabled={saving}
          />
        </div>
      );
    }

    if (typeof setting_value === 'number') {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">{setting_key.replace(/_/g, ' ').toUpperCase()}</Label>
          <Input
            type="number"
            value={setting_value}
            onChange={(e) => updateSetting(setting_key, parseInt(e.target.value))}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{setting_key.replace(/_/g, ' ').toUpperCase()}</Label>
        <Input
          value={typeof setting_value === 'string' ? setting_value.replace(/"/g, '') : setting_value}
          onChange={(e) => updateSetting(setting_key, `"${e.target.value}"`)}
          disabled={saving}
        />
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure platform-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="p-4 border border-border/50 rounded-lg">
              {renderSettingInput(setting)}
            </div>
          ))}

          {settings.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No system settings found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Status */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>
            Current platform operational status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">Operational</div>
              <div className="text-sm text-muted-foreground">Database</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">Active</div>
              <div className="text-sm text-muted-foreground">Authentication</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">Running</div>
              <div className="text-sm text-muted-foreground">Real-time Updates</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;