import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DocumentTemplate, TemplatePlaceholder, PlanTemplatePermission, SubscriptionPlan } from '../types';

import { getDocumentApiUrl } from '@/config/documentApi';

export function useTemplates() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from Supabase directly
      const { data, error: dbError } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setTemplates(data as DocumentTemplate[] || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = async (id: string, updates: Partial<DocumentTemplate>) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Template updated successfully');
      await fetchTemplates();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update template';
      toast.error(message);
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      // Delete from API first
      const response = await fetch(`${getDocumentApiUrl()}/template/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.warn('API delete failed, continuing with database delete');
      }

      // Delete from database
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Template deleted successfully');
      await fetchTemplates();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      toast.error(message);
      return false;
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateTemplate(id, { is_active: isActive });
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    updateTemplate,
    deleteTemplate,
    toggleActive
  };
}

export function usePlaceholders(templateId: string | null) {
  const [placeholders, setPlaceholders] = useState<TemplatePlaceholder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlaceholders = useCallback(async () => {
    if (!templateId) {
      setPlaceholders([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('template_placeholders')
        .select('*')
        .eq('template_id', templateId)
        .order('placeholder');

      if (error) throw error;
      setPlaceholders(data as TemplatePlaceholder[] || []);
    } catch (err) {
      console.error('Error fetching placeholders:', err);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const savePlaceholder = async (placeholder: Partial<TemplatePlaceholder> & { template_id: string; placeholder: string }) => {
    try {
      const { data: existing } = await supabase
        .from('template_placeholders')
        .select('id')
        .eq('template_id', placeholder.template_id)
        .eq('placeholder', placeholder.placeholder)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('template_placeholders')
          .update({
            source: placeholder.source,
            custom_value: placeholder.custom_value,
            database_table: placeholder.database_table,
            database_field: placeholder.database_field,
            csv_id: placeholder.csv_id,
            csv_field: placeholder.csv_field,
            csv_row: placeholder.csv_row,
            random_option: placeholder.random_option,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('template_placeholders')
          .insert(placeholder);

        if (error) throw error;
      }

      toast.success('Placeholder saved');
      await fetchPlaceholders();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save placeholder';
      toast.error(message);
      return false;
    }
  };

  const deletePlaceholder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('template_placeholders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Placeholder removed');
      await fetchPlaceholders();
      return true;
    } catch (err) {
      toast.error('Failed to delete placeholder');
      return false;
    }
  };

  useEffect(() => {
    fetchPlaceholders();
  }, [fetchPlaceholders]);

  return {
    placeholders,
    loading,
    fetchPlaceholders,
    savePlaceholder,
    deletePlaceholder
  };
}

export function usePlanPermissions(templateId: string | null) {
  const [permissions, setPermissions] = useState<PlanTemplatePermission[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, plan_name, plan_tier, is_active')
        .eq('is_active', true)
        .order('plan_tier');

      setPlans(plansData as SubscriptionPlan[] || []);

      // Fetch permissions for this template
      if (templateId) {
        const { data: permData } = await supabase
          .from('plan_template_permissions')
          .select('*')
          .eq('template_id', templateId);

        setPermissions(permData as PlanTemplatePermission[] || []);
      } else {
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching plan permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  const togglePlanAccess = async (planId: string, canDownload: boolean) => {
    if (!templateId) return false;

    try {
      const existing = permissions.find(p => p.plan_id === planId);

      if (existing) {
        if (!canDownload) {
          // Remove permission
          const { error } = await supabase
            .from('plan_template_permissions')
            .delete()
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          // Update
          const { error } = await supabase
            .from('plan_template_permissions')
            .update({ can_download: canDownload, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (error) throw error;
        }
      } else if (canDownload) {
        // Create
        const { error } = await supabase
          .from('plan_template_permissions')
          .insert({
            plan_id: planId,
            template_id: templateId,
            can_download: true
          });
        if (error) throw error;
      }

      toast.success('Plan permission updated');
      await fetchData();
      return true;
    } catch (err) {
      toast.error('Failed to update plan permission');
      return false;
    }
  };

  const setDownloadLimit = async (planId: string, limit: number | null) => {
    if (!templateId) return false;

    try {
      const existing = permissions.find(p => p.plan_id === planId);

      if (existing) {
        const { error } = await supabase
          .from('plan_template_permissions')
          .update({ max_downloads_per_template: limit, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plan_template_permissions')
          .insert({
            plan_id: planId,
            template_id: templateId,
            can_download: true,
            max_downloads_per_template: limit
          });
        if (error) throw error;
      }

      toast.success('Download limit updated');
      await fetchData();
      return true;
    } catch (err) {
      toast.error('Failed to update download limit');
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    permissions,
    plans,
    loading,
    fetchData,
    togglePlanAccess,
    setDownloadLimit
  };
}
