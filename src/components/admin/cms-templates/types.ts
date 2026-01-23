// CMS Template Manager Types

export interface DocumentTemplate {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  placeholders: string[] | null;
  placeholder_mappings: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  font_family: string | null;
  font_size: number | null;
  requires_broker_membership: boolean;
  mapping_confidence: number | null;
  supports_pdf: boolean | null;
}

export interface TemplatePlaceholder {
  id: string;
  template_id: string;
  placeholder: string;
  source: 'custom' | 'database' | 'csv' | 'random';
  custom_value: string | null;
  database_table: string | null;
  database_field: string | null;
  csv_id: string | null;
  csv_field: string | null;
  csv_row: number;
  random_option: string;
  created_at: string;
  updated_at: string;
}

export interface PlanTemplatePermission {
  id: string;
  plan_id: string;
  template_id: string;
  can_download: boolean;
  max_downloads_per_template: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_tier: string;
  is_active: boolean;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

export interface CSVFile {
  id: string;
  name: string;
  headers: string[];
  rowCount: number;
}

export type PlaceholderSource = 'custom' | 'database' | 'csv' | 'random';

export const AVAILABLE_TABLES = [
  'vessels',
  'ports',
  'refineries',
  'companies',
  'buyer_companies',
  'seller_companies',
  'broker_profiles',
  'oil_products'
] as const;

export const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' }
] as const;

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32] as const;
