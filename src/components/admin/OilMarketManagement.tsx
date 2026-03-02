import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Fuel, Loader2, RefreshCw, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type OilMode = 'api' | 'manual' | 'hybrid';

interface OilPriceSettings {
  id: string;
  mode: OilMode;
  show_refresh_button: boolean;
  show_last_updated: boolean;
  auto_refresh_interval_minutes: number | null;
}

interface OilPriceRow {
  id: string;
  oil_type: string;
  symbol: string;
  current_price: number;
  previous_price: number | null;
  currency: string;
  unit: string;
}

const DEFAULT_SETTINGS: Omit<OilPriceSettings, 'id'> = {
  mode: 'manual',
  show_refresh_button: false,
  show_last_updated: false,
  auto_refresh_interval_minutes: null,
};

const OilMarketManagement = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [settings, setSettings] = useState<OilPriceSettings | null>(null);
  const [prices, setPrices] = useState<OilPriceRow[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});

  const pendingChangesCount = useMemo(() => Object.keys(editedPrices).length, [editedPrices]);

  const fetchOilMarketData = async () => {
    setLoading(true);
    try {
      const [{ data: settingsRows, error: settingsError }, { data: priceRows, error: pricesError }] = await Promise.all([
        supabase.from('oil_price_settings').select('*').order('created_at', { ascending: true }).limit(1),
        supabase.from('oil_prices').select('*').order('oil_type', { ascending: true }),
      ]);

      if (settingsError) throw settingsError;
      if (pricesError) throw pricesError;

      let settingsRow = settingsRows?.[0] as OilPriceSettings | undefined;

      if (!settingsRow) {
        const { data: inserted, error: insertError } = await supabase
          .from('oil_price_settings')
          .insert(DEFAULT_SETTINGS)
          .select('*')
          .single();

        if (insertError) throw insertError;
        settingsRow = inserted as OilPriceSettings;
      }

      setSettings(settingsRow);
      setPrices((priceRows as OilPriceRow[]) ?? []);
      setEditedPrices({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load oil market settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOilMarketData();
  }, []);

  const updateSettingsField = <K extends keyof Omit<OilPriceSettings, 'id'>>(key: K, value: OilPriceSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSavingSettings(true);
    try {
      const payload = {
        mode: settings.mode,
        show_refresh_button: settings.show_refresh_button,
        show_last_updated: settings.show_last_updated,
        auto_refresh_interval_minutes: settings.auto_refresh_interval_minutes,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('oil_price_settings').update(payload).eq('id', settings.id);
      if (error) throw error;

      toast({ title: 'Saved', description: 'Oil market settings updated successfully.' });
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Could not save oil market settings',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const refreshFromApi = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-oil-prices');
      if (error) throw error;

      toast({
        title: 'Refresh completed',
        description: `Updated ${data?.updated_count ?? 0} oil prices from API.`,
      });

      await fetchOilMarketData();
    } catch (error: any) {
      toast({
        title: 'API refresh failed',
        description: error?.message || 'Could not refresh oil prices from API',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePriceEdit = (id: string, value: string) => {
    setEditedPrices((prev) => ({ ...prev, [id]: value }));
  };

  const saveManualPrices = async () => {
    const now = new Date().toISOString();
    const changes = prices
      .map((price) => {
        const edited = editedPrices[price.id];
        if (edited === undefined) return null;

        const parsed = Number(edited);
        if (!Number.isFinite(parsed) || parsed <= 0 || parsed === price.current_price) return null;

        const previous = price.current_price;
        const delta = parsed - previous;
        const deltaPercent = previous > 0 ? (delta / previous) * 100 : 0;

        return {
          id: price.id,
          current_price: parsed,
          previous_price: previous,
          price_change: delta,
          price_change_percent: deltaPercent,
          last_updated: now,
          updated_at: now,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      current_price: number;
      previous_price: number;
      price_change: number;
      price_change_percent: number;
      last_updated: string;
      updated_at: string;
    }>;

    if (changes.length === 0) {
      toast({ title: 'No changes', description: 'Edit at least one valid price before saving.' });
      return;
    }

    setSavingPrices(true);
    try {
      await Promise.all(
        changes.map((change) =>
          supabase
            .from('oil_prices')
            .update({
              current_price: change.current_price,
              previous_price: change.previous_price,
              price_change: change.price_change,
              price_change_percent: change.price_change_percent,
              last_updated: change.last_updated,
              updated_at: change.updated_at,
            })
            .eq('id', change.id)
        )
      );

      toast({ title: 'Saved', description: `${changes.length} oil prices were updated manually.` });
      await fetchOilMarketData();
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Could not save manual oil price changes',
        variant: 'destructive',
      });
    } finally {
      setSavingPrices(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            Oil Market Management
          </CardTitle>
          <CardDescription>Control oil price source mode and update market prices from one admin panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={settings?.mode ?? 'manual'} onValueChange={(value: OilMode) => updateSettingsField('mode', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end">
              <Button onClick={saveSettings} disabled={savingSettings} className="w-full md:w-auto">
                {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="toggle-refresh">Show Refresh Button on /oil-prices</Label>
              <Switch
                id="toggle-refresh"
                checked={settings?.show_refresh_button ?? false}
                onCheckedChange={(checked) => updateSettingsField('show_refresh_button', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="toggle-updated">Show Last Updated Badge on /oil-prices</Label>
              <Switch
                id="toggle-updated"
                checked={settings?.show_last_updated ?? false}
                onCheckedChange={(checked) => updateSettingsField('show_last_updated', checked)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <Button onClick={refreshFromApi} disabled={refreshing} variant="outline">
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh from API now
            </Button>
            <Badge variant="secondary">Mode: {settings?.mode ?? 'manual'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Price Grid</CardTitle>
          <CardDescription>Edit prices inline, then save all updates together.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left">Commodity</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-left">Price ({prices[0]?.currency ?? 'USD'})</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price) => (
                  <tr key={price.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{price.oil_type}</td>
                    <td className="px-4 py-3">{price.symbol}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editedPrices[price.id] ?? String(price.current_price)}
                        onChange={(event) => handlePriceEdit(price.id, event.target.value)}
                        className="max-w-[180px]"
                      />
                    </td>
                    <td className="px-4 py-3">{price.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline">Pending changes: {pendingChangesCount}</Badge>
            <Button onClick={saveManualPrices} disabled={savingPrices || pendingChangesCount === 0}>
              {savingPrices ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Manual Updates
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OilMarketManagement;
