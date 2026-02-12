// Document Processing CMS Exports
export { default as DocumentProcessingCMS } from './DocumentProcessingCMS';
export { default as TemplatesTab } from './TemplatesTab';
export { default as PlaceholderMappingTab } from './PlaceholderMappingTab';
export { default as DataSourcesTab } from './DataSourcesTab';
export { default as PlansManagementTab } from './PlansManagementTab';
export { default as EnhancedPlaceholderMapping } from './EnhancedPlaceholderMapping';
export { default as TemplatePlanAccess } from './TemplatePlanAccess';
export { default as TestGenerationDialog } from './TestGenerationDialog';

// Hooks
export { useTemplates, usePlaceholderSettings, usePlans, useDataSources, useDatabaseSchema, useVessels } from './hooks/useDocumentAPI';
export { useSupabaseData, AVAILABLE_TABLES, detectTableFromPlaceholder } from './hooks/useSupabaseData';

// Types
export type { Template, PlaceholderSetting, PlaceholderSettings, Plan, CSVFile, DataSource, DatabaseTable, DatabaseColumn, APIResponse } from './types';
