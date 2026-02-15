import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getDocumentApiUrl } from '@/config/documentApi';
import { 
  Template, 
  PlaceholderSettings, 
  Plan, 
  CSVFile, 
  DatabaseTable, 
  DatabaseColumn,
  Vessel,
  DataSource
} from '../types';

// Fetch helper with credentials (uses current API URL from settings)
async function apiFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getDocumentApiUrl();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    try {
      const error = JSON.parse(text);
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('HTTP')) throw e;
      if (text.trimStart().startsWith('<')) {
        throw new Error(
          'API returned HTML instead of JSON. Set the API base URL to the document API root (e.g. https://petrodealhub.com/api), not the /portal page.'
        );
      }
      throw new Error(text || `Request failed (${response.status})`);
    }
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.trimStart().startsWith('<')) {
      throw new Error(
        'API returned HTML instead of JSON. Use API base URL https://petrodealhub.com/api (not .../portal).'
      );
    }
    throw new Error('Invalid JSON response');
  }
}

// Templates Hook
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ templates: Template[] }>('/templates');
      setTemplates(data.templates || []);
    } catch (error) {
      toast.error('Failed to fetch templates');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadTemplate = useCallback(async (
    file: File,
    name: string,
    description: string,
    fontFamily?: string,
    fontSize?: number,
    planIds?: string[]
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    if (fontFamily) formData.append('font_family', fontFamily);
    if (fontSize) formData.append('font_size', fontSize.toString());
    if (planIds?.length) formData.append('plan_ids', JSON.stringify(planIds));

    const response = await fetch(`${getDocumentApiUrl()}/upload-template`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const uploadResponseText = await response.text();
    if (!response.ok) {
      try {
        const error = JSON.parse(uploadResponseText);
        throw new Error(error.detail || error.message || 'Upload failed');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Upload failed') throw e;
        if (response.status === 413) {
          throw new Error('File too large. Server limit may need increasing (client_max_body_size in Nginx).');
        }
        if (uploadResponseText.trimStart().startsWith('<')) {
          throw new Error(
            'Upload endpoint returned HTML. Use API base URL https://petrodealhub.com/api (not .../portal).'
          );
        }
        throw new Error(uploadResponseText || 'Upload failed');
      }
    }
    await fetchTemplates();
    return JSON.parse(uploadResponseText || '{}');
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (templateName: string) => {
    await apiFetch(`/templates/${encodeURIComponent(templateName)}`, {
      method: 'DELETE',
    });
    await fetchTemplates();
  }, [fetchTemplates]);

  const updateMetadata = useCallback(async (
    templateId: string,
    metadata: {
      display_name?: string;
      description?: string;
      font_family?: string;
      font_size?: number;
      plan_ids?: string[];
    }
  ) => {
    await apiFetch(`/templates/${templateId}/metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
    await fetchTemplates();
  }, [fetchTemplates]);

  const getTemplateDetails = useCallback(async (templateId: string) => {
    return apiFetch<Template>(`/templates/${templateId}`);
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    uploadTemplate,
    deleteTemplate,
    updateMetadata,
    getTemplateDetails,
  };
}

// Placeholder Settings Hook
export function usePlaceholderSettings() {
  const [settings, setSettings] = useState<Record<string, PlaceholderSettings>>({});
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async (templateName: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<PlaceholderSettings>(
        `/placeholder-settings?template_name=${encodeURIComponent(templateName)}`
      );
      setSettings(prev => ({ ...prev, [templateName]: data }));
      return data;
    } catch (error) {
      console.error('Failed to fetch placeholder settings:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (placeholderSettings: PlaceholderSettings) => {
    await apiFetch('/placeholder-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placeholderSettings),
    });
    setSettings(prev => ({ ...prev, [placeholderSettings.template_name]: placeholderSettings }));
  }, []);

  return { settings, loading, fetchSettings, saveSettings };
}

// Plans Hook
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      // Try database plans first, fallback to JSON
      try {
        const data = await apiFetch<{ plans: Record<string, Plan> | Plan[] }>('/plans-db');
        const plansList = Array.isArray(data.plans) 
          ? data.plans 
          : Object.values(data.plans);
        setPlans(plansList);
      } catch {
        const data = await apiFetch<{ plans: Record<string, Plan> | Plan[] }>('/plans');
        const plansList = Array.isArray(data.plans) 
          ? data.plans 
          : Object.values(data.plans);
        setPlans(plansList);
      }
    } catch (error) {
      toast.error('Failed to fetch plans');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlan = useCallback(async (
    planId: string,
    planData: {
      can_download?: boolean;
      max_downloads_per_month?: number;
      template_limits?: Record<string, number>;
      allowed_templates?: string[] | 'all';
    }
  ) => {
    await apiFetch('/update-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, plan_data: planData }),
    });
    await fetchPlans();
  }, [fetchPlans]);

  const updateBrokerMembership = useCallback(async (
    permissions: {
      can_download?: boolean;
      max_downloads_per_month?: number;
      template_limits?: Record<string, number>;
    }
  ) => {
    await apiFetch('/update-broker-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });
  }, []);

  return { plans, loading, fetchPlans, updatePlan, updateBrokerMembership };
}

// CSV/Data Sources Hook
export function useDataSources() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [csvFiles, setCsvFiles] = useState<CSVFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDataSources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ data_sources: Record<string, DataSource> }>('/data/all');
      const sourcesList = Object.entries(data.data_sources || {}).map(([id, source]) => ({
        ...source,
        id,
      }));
      setDataSources(sourcesList);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCsvFiles = useCallback(async () => {
    try {
      const data = await apiFetch<{ csv_files: CSVFile[] }>('/csv-files');
      setCsvFiles(data.csv_files || []);
    } catch (error) {
      console.error('Failed to fetch CSV files:', error);
    }
  }, []);

  const uploadCsv = useCallback(async (file: File, dataType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', dataType);

    const response = await fetch(`${getDocumentApiUrl()}/upload-csv`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const csvResponseText = await response.text();
    if (!response.ok) {
      try {
        const error = JSON.parse(csvResponseText);
        throw new Error(error.detail || error.message || 'Upload failed');
      } catch (e) {
        if (e instanceof Error && e.message !== 'Upload failed') throw e;
        if (response.status === 413) {
          throw new Error('File too large. Server limit may need increasing (client_max_body_size in Nginx).');
        }
        throw new Error(csvResponseText || 'Upload failed');
      }
    }
    await fetchDataSources();
    await fetchCsvFiles();
    return JSON.parse(csvResponseText || '{}');
  }, [fetchDataSources, fetchCsvFiles]);

  const deleteCsv = useCallback(async (csvId: string) => {
    await apiFetch(`/csv-files/${csvId}`, { method: 'DELETE' });
    await fetchDataSources();
    await fetchCsvFiles();
  }, [fetchDataSources, fetchCsvFiles]);

  const getCsvFields = useCallback(async (csvId: string) => {
    return apiFetch<{ fields: string[] }>(`/csv-fields/${csvId}`);
  }, []);

  return {
    dataSources,
    csvFiles,
    loading,
    fetchDataSources,
    fetchCsvFiles,
    uploadCsv,
    deleteCsv,
    getCsvFields,
  };
}

// Database Schema Hook
export function useDatabaseSchema() {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ tables: string[] }>('/database-tables');
      const tablesList = (data.tables || []).map(name => ({ name, columns: [] }));
      setTables(tablesList);
    } catch (error) {
      console.error('Failed to fetch database tables:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchColumns = useCallback(async (tableName: string): Promise<DatabaseColumn[]> => {
    try {
      const data = await apiFetch<{ columns: DatabaseColumn[] }>(
        `/database-tables/${tableName}/columns`
      );
      return data.columns || [];
    } catch (error) {
      console.error('Failed to fetch columns:', error);
      return [];
    }
  }, []);

  return { tables, loading, fetchTables, fetchColumns };
}

// Vessels Hook (for testing)
export function useVessels() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVessels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ vessels: Vessel[] }>('/vessels');
      setVessels(data.vessels || []);
    } catch (error) {
      console.error('Failed to fetch vessels:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const processDocument = useCallback(async (templateName: string, vesselImo: string) => {
    return apiFetch<{ success: boolean; document_url?: string; document_id?: string }>(
      '/process-document',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_name: templateName, vessel_imo: vesselImo }),
      }
    );
  }, []);

  return { vessels, loading, fetchVessels, processDocument };
}
