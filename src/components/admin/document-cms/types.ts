// Document Processing CMS Types
// Use getDocumentApiUrl() from '@/config/documentApi' for API base URL at runtime.

export interface Template {
  id: string;
  name: string;
  file_name: string;
  description?: string;
  display_name?: string;
  font_family?: string;
  font_size?: number;
  placeholders: string[];
  placeholder_mappings?: Record<string, PlaceholderSetting>;
  file_size?: number;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  plan_ids?: string[];
  mime_type?: string;
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
  id: string;
  plan_id?: string;
  plan_name: string;
  plan_tier: string;
  is_active: boolean;
  can_download?: boolean;
  max_downloads_per_month?: number;
  template_limits?: Record<string, number>;
  allowed_templates?: string[] | 'all';
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
