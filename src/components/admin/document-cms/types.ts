// Document Processing CMS Types

// API Base URL - uses environment variable or falls back to production URL
export const API_BASE_URL = 
  import.meta.env.VITE_DOCUMENT_API_URL || 
  import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://control.petrodealhub.com');

export interface Template {
  id?: string;
  template_id?: string;
  name: string;
  file_name?: string;
  file_with_extension?: string;
  title?: string;
  description?: string;
  display_name?: string;
  font_family?: string;
  font_size?: number;
  placeholders: string[];
  placeholder_mappings?: Record<string, PlaceholderSetting>;
  size?: number;
  file_size?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  plan_ids?: string[];
  mime_type?: string;
  metadata?: {
    display_name?: string;
    description?: string;
    font_family?: string;
    font_size?: number;
    updated_at?: string;
  };
}

export interface PlaceholderSetting {
  source: 'database' | 'csv' | 'random' | 'custom';
  value?: string;
  table?: string;
  field?: string;
  csv_id?: string;
  csv_field?: string;
  csv_row?: number;
  random_option?: 'auto' | 'fixed' | 'ai-generated';
}

export interface PlaceholderSettings {
  template_name: string;
  template_id: string;
  settings: Record<string, PlaceholderSetting>;
}

export interface Plan {
  id?: string;
  plan_id?: string;
  name?: string;
  plan_name?: string;
  plan_tier?: string;
  is_active?: boolean;
  can_download?: boolean | string[] | '*';
  max_downloads_per_month?: number;
  template_limits?: Record<string, number>;
  allowed_templates?: string[] | 'all';
  features?: string[];
}

export interface CSVFile {
  id: string;
  name: string;
  display_name?: string;
  filename: string;
  row_count: number;
  file_size?: number;
  headers?: string[];
  data_type?: string;
  created_at?: string;
}

export interface DataSource {
  id: string;
  type: string;
  name: string;
  data: Record<string, unknown>[];
  headers: string[];
  row_count: number;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable?: boolean;
}

export interface Vessel {
  id: string;
  name: string;
  imo: string;
  vessel_type?: string;
  flag?: string;
}

export interface APIResponse<T = unknown> {
  success?: boolean;
  data?: T;
  detail?: string;
  message?: string;
}

// Helper function to normalize template name
export function normalizeTemplateName(name: string): string {
  if (!name) return '';
  const normalized = name.trim();
  return normalized.endsWith('.docx') ? normalized : `${normalized}.docx`;
}

// Helper function to normalize template data structure
export function normalizeTemplate(template: any): Template {
  // Handle both nested metadata and flat structure
  const metadata = template.metadata || {};
  const flatMetadata = {
    display_name: template.display_name || metadata.display_name || template.title || '',
    description: template.description || metadata.description || '',
    font_family: template.font_family || metadata.font_family || '',
    font_size: template.font_size || metadata.font_size,
  };

  return {
    id: template.id || template.template_id || '',
    template_id: template.template_id || template.id || '',
    name: template.name || template.file_name || template.file_with_extension || '',
    file_name: template.file_name || template.name || '',
    file_with_extension: template.file_with_extension || template.file_name || template.name || '',
    title: template.title || flatMetadata.display_name || template.name || '',
    description: flatMetadata.description,
    display_name: flatMetadata.display_name,
    font_family: flatMetadata.font_family,
    font_size: flatMetadata.font_size,
    placeholders: template.placeholders || [],
    placeholder_mappings: template.placeholder_mappings || {},
    size: template.size || template.file_size || 0,
    file_size: template.file_size || template.size || 0,
    created_at: template.created_at || '',
    updated_at: template.updated_at || metadata.updated_at || '',
    is_active: template.is_active !== undefined ? template.is_active : true,
    plan_ids: template.plan_ids || [],
    mime_type: template.mime_type,
    metadata: {
      display_name: flatMetadata.display_name,
      description: flatMetadata.description,
      font_family: flatMetadata.font_family,
      font_size: flatMetadata.font_size,
      updated_at: template.updated_at || metadata.updated_at,
    },
  };
}
