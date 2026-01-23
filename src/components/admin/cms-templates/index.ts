// CMS Template Manager - Modular Components
export { default as CMSTemplateManager } from './CMSTemplateManager';
export { CMSTemplateList } from './CMSTemplateList';
export { CMSTemplateEditor } from './CMSTemplateEditor';
export { PlaceholderManager } from './PlaceholderManager';
export { PlanAssignment } from './PlanAssignment';
export { DatabaseExplorer } from './DatabaseExplorer';
export { TemplateUpload } from './TemplateUpload';

// Hooks
export { useTemplates, usePlaceholders, usePlanPermissions } from './hooks/useTemplates';
export { useDatabaseSchema } from './hooks/useDatabaseSchema';

// Types
export * from './types';
