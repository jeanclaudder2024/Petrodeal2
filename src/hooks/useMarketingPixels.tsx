import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface MarketingSetting {
  id: string;
  provider: string;
  tracking_id: string;
  name: string | null;
  is_enabled: boolean;
  config: Json;
  created_at: string;
  updated_at: string;
}

export interface MarketingEvent {
  id: string;
  event_name: string;
  display_name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  providers: string[];
  event_params: Json;
  created_at: string;
  updated_at: string;
}

export const useMarketingPixels = () => {
  const [pixels, setPixels] = useState<MarketingSetting[]>([]);
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPixels = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('marketing_settings')
        .select('*')
        .order('provider');

      if (fetchError) throw fetchError;
      setPixels((data || []) as MarketingSetting[]);
    } catch (err: any) {
      console.error('Error fetching marketing pixels:', err);
      setError(err.message);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('marketing_events')
        .select('*')
        .order('category', { ascending: true });

      if (fetchError) throw fetchError;
      setEvents((data || []) as MarketingEvent[]);
    } catch (err: any) {
      console.error('Error fetching marketing events:', err);
      setError(err.message);
    }
  };

  const addPixel = async (pixel: Omit<MarketingSetting, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('marketing_settings')
        .insert([pixel])
        .select()
        .single();

      if (insertError) throw insertError;
      setPixels(prev => [...prev, data as MarketingSetting]);
      return { success: true, data };
    } catch (err: any) {
      console.error('Error adding pixel:', err);
      return { success: false, error: err.message };
    }
  };

  const updatePixel = async (id: string, updates: Partial<MarketingSetting>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('marketing_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setPixels(prev => prev.map(p => p.id === id ? data as MarketingSetting : p));
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating pixel:', err);
      return { success: false, error: err.message };
    }
  };

  const deletePixel = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('marketing_settings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setPixels(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting pixel:', err);
      return { success: false, error: err.message };
    }
  };

  const togglePixel = async (id: string, is_enabled: boolean) => {
    return updatePixel(id, { is_enabled });
  };

  const updateEvent = async (id: string, updates: Partial<MarketingEvent>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('marketing_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setEvents(prev => prev.map(e => e.id === id ? data as MarketingEvent : e));
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating event:', err);
      return { success: false, error: err.message };
    }
  };

  const toggleEvent = async (id: string, is_enabled: boolean) => {
    return updateEvent(id, { is_enabled });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPixels(), fetchEvents()]);
      setLoading(false);
    };
    loadData();
  }, []);

  return {
    pixels,
    events,
    loading,
    error,
    addPixel,
    updatePixel,
    deletePixel,
    togglePixel,
    updateEvent,
    toggleEvent,
    refetch: () => Promise.all([fetchPixels(), fetchEvents()])
  };
};

// Get enabled pixels for public use (no auth required for loading pixels)
export const getEnabledPixels = async (): Promise<MarketingSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('marketing_settings')
      .select('*')
      .eq('is_enabled', true);

    if (error) {
      console.error('Error fetching enabled pixels:', error);
      return [];
    }
    return (data || []) as MarketingSetting[];
  } catch (err) {
    console.error('Error in getEnabledPixels:', err);
    return [];
  }
};
