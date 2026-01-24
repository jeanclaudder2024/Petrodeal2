import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  API_BASE_URL, 
  Template, 
  PlaceholderSettings, 
  Plan, 
  CSVFile, 
  DatabaseTable, 
  DatabaseColumn,
  Vessel,
  DataSource,
  normalizeTemplate
} from '../types';

// Fetch helper with credentials and proper error handling
async function apiFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      const error = await response.json().catch(() => ({ detail: 'Not authenticated' }));
      const errorMessage = error.detail || 'Authentication required. Please login to the Python API.';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Handle server errors (500) - might be temporary file issues
    if (response.status === 500) {
      const error = await response.json().catch(() => ({ 
        detail: 'Server error - some template files may be missing or corrupted' 
      }));
      const errorMessage = error.detail || 'Server error occurred';
      // Log but don't show toast for 500 errors in template listing
      console.warn('Server error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Handle other errors
    const error = await response.json().catch(() => ({ 
      detail: `Request failed with status ${response.status}` 
    }));
    const errorMessage = error.detail || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// Templates Hook
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ templates: any[] }>('/templates');
      // Normalize all templates to ensure consistent structure
      const normalizedTemplates = (data.templates || []).map(template => normalizeTemplate(template));
      setTemplates(normalizedTemplates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
      // Don't show error toast for 500 errors - they might be temporary file issues
      if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        console.warn('Template fetch error (may be temporary):', errorMessage);
        // Set empty array to prevent UI errors
        setTemplates([]);
      } else {
        toast.error(`Failed to fetch templates: ${errorMessage}`);
        console.error(error);
      }
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

    const response = await fetch(`${API_BASE_URL}/upload-template`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        const error = await response.json().catch(() => ({ detail: 'Not authenticated' }));
        const errorMessage = error.detail || 'Authentication required. Please login to the Python API.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      const errorMessage = error.detail || 'Upload failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    await fetchTemplates();
    return response.json();
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (templateName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${encodeURIComponent(templateName)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          const error = await response.json().catch(() => ({ detail: 'Not authenticated' }));
          const msg = error.detail || 'Authentication required. Please log in to the document API (control).';
          toast.error(msg);
          throw new Error(msg);
        }
        if (response.status === 404) {
          const err = await response.json().catch(() => ({}));
          const msg = err.detail || 'Template not found or delete endpoint unavailable (404). Check control subdomain and login.';
          toast.error(msg);
          throw new Error(msg);
        }
        const error = await response.json().catch(() => ({ detail: 'Delete failed' }));
        const msg = error.detail || `Delete failed: ${response.status}`;
        toast.error(msg);
        throw new Error(msg);
      }

      const result = await response.json();
      if (result.warnings && Array.isArray(result.warnings)) {
        result.warnings.forEach((w: string) => toast.warning(w));
      }
      await fetchTemplates();
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete template';
      if (!msg.toLowerCase().includes('not authenticated') && !msg.toLowerCase().includes('template not found') && !msg.toLowerCase().includes('delete failed')) {
        toast.error(`Delete failed: ${msg}`);
      }
      throw e;
    }
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
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${encodeURIComponent(templateId)}/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          const error = await response.json().catch(() => ({ detail: 'Not authenticated' }));
          const errorMessage = error.detail || 'Authentication required. Please login to the Python API.';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
        
        const error = await response.json().catch(() => ({ detail: 'Update failed' }));
        const errorMessage = error.detail || `Failed to update template: ${response.status}`;
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      await fetchTemplates();
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
      toast.error(errorMessage);
      throw error;
    }
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
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      // Try JSON endpoint first (more reliable for immediate updates)
      let data = null;
      try {
        data = await apiFetch<{ plans: Record<string, Plan> | Plan[] }>('/plans');
        if (data && data.plans) {
          // Convert to Record format if needed
          if (Array.isArray(data.plans)) {
            const plansRecord: Record<string, Plan> = {};
            data.plans.forEach((plan: Plan) => {
              const planId = plan.plan_id || plan.id || plan.name || '';
              if (planId) plansRecord[planId] = plan;
            });
            setPlans(plansRecord);
          } else {
            setPlans(data.plans);
          }
        }
      } catch {
        // Fallback to database endpoint
        try {
          data = await apiFetch<{ plans: Record<string, Plan> | Plan[] }>('/plans-db');
          if (data && data.plans) {
            if (Array.isArray(data.plans)) {
              const plansRecord: Record<string, Plan> = {};
              data.plans.forEach((plan: Plan) => {
                const planId = plan.plan_id || plan.id || plan.name || '';
                if (planId) plansRecord[planId] = plan;
              });
              setPlans(plansRecord);
            } else {
              setPlans(data.plans);
            }
          }
        } catch (e2) {
          console.error('Failed to load plans from both endpoints:', e2);
          setPlans({});
        }
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans({});
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

    const response = await fetch(`${API_BASE_URL}/upload-csv`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        const error = await response.json().catch(() => ({ detail: 'Not authenticated' }));
        const errorMessage = error.detail || 'Authentication required. Please login to the Python API.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      const errorMessage = error.detail || 'Upload failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    await fetchDataSources();
    await fetchCsvFiles();
    return response.json();
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
