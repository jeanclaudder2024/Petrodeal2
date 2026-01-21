# PROMPT FOR LOVABLE: Build Document Processing CMS Inside React Admin Panel

## Overview
I need you to create a comprehensive Document Processing CMS component that integrates into the existing React admin panel. This CMS will connect to a Python FastAPI backend (running on http://localhost:8000) that handles document template management, placeholder mapping, subscription plan configuration, and document generation.

## Current Setup
- **React App**: TypeScript + React + Vite + shadcn/ui components (already exists)
- **Admin Panel**: Located at `src/components/admin/AdminPanel.tsx` with tabbed interface
- **Python API**: FastAPI server at `http://localhost:8000` with full REST API
- **Database**: Supabase (already integrated in React app)
- **Existing Component**: `src/components/admin/DocumentTemplateManager.tsx` (basic version - needs enhancement)

## What to Build

Create a new comprehensive CMS component called `DocumentProcessingCMS.tsx` that replaces/enhances the existing `DocumentTemplateManager.tsx`. This should be a full-featured admin interface with multiple tabs for:

### Tab 1: Templates Management
- **List all templates** from API endpoint `GET /templates`
- **Upload templates** via `POST /upload-template` (multipart/form-data)
- **Delete templates** via `DELETE /templates/{template_name}`
- **View template details**: Show placeholders, metadata, file size, creation date
- **Edit template metadata** via `POST /templates/{template_id}/metadata`
- **Test document generation**: Select vessel and generate a test document

Each template should show:
- Display name (from metadata)
- File name
- Description
- Font family and size (if set)
- List of placeholders found in the document
- Associated subscription plans
- File size and creation date
- Active/Inactive status

### Tab 2: Placeholder Mapping Editor
- **Load placeholder settings** from `GET /placeholder-settings?template_name={name}`
- **Save placeholder settings** to `POST /placeholder-settings`
- For each placeholder, allow selecting data source:
  - **Database**: Select table (vessels, ports, refineries, companies, brokers) and field
  - **CSV**: Select CSV file, field, and row index
  - **Random**: Select random option (auto, fixed, ai-generated)
  - **Custom**: Enter static value
- Use `GET /database-tables` and `GET /database-tables/{table}/columns` for database options
- Use `GET /csv-files` and `GET /csv-fields/{csv_id}` for CSV options

### Tab 3: Data Sources (CSV Management)
- **List CSV files** from `GET /data/all` endpoint
- **Upload CSV files** via `POST /upload-csv` (requires `file` and `data_type` form fields)
- **Delete CSV files** via `DELETE /csv-files/{csv_id}`
- Show for each CSV: filename, row count, file size, display name

### Tab 4: Subscription Plans Management
- **Load plans** from `GET /plans-db` (preferred) or `GET /plans` (fallback)
- **Edit plan permissions** via `POST /update-plan`
- **View plan details**: name, tier, max downloads, allowed templates
- For each plan, allow:
  - Setting which templates can be downloaded (select multiple templates or "all templates")
  - Setting max downloads per month (-1 for unlimited)
  - Setting per-template download limits (if applicable)
- Show broker membership separately if it exists

### Tab 5: Template Editor (Advanced)
- Link to or embed a more advanced editor for complex placeholder configuration
- This could open in a modal or separate route

## API Endpoints Reference

### Authentication (Cookie-based sessions)
- `POST /auth/login` - Login with `{username, password}` in JSON body
- `GET /auth/me` - Get current user (requires session cookie)
- `POST /auth/logout` - Logout

### Templates
- `GET /templates` - List all templates (returns `{templates: [...]}`)
- `GET /templates/{template_id}` - Get single template with settings
- `POST /upload-template` - Upload template (FormData: `file`, `name`, `description`, `font_family`, `font_size`, `plan_ids`)
- `POST /templates/{template_id}/metadata` - Update metadata (JSON body with `display_name`, `description`, `font_family`, `font_size`, `plan_ids`)
- `DELETE /templates/{template_name}` - Delete template
- `GET /templates/{template_id}/plan-info` - Get which plans can download a template

### Placeholder Settings
- `GET /placeholder-settings?template_name={name}` - Get settings for a template
- `POST /placeholder-settings` - Save settings (JSON: `{template_name, template_id, settings: {...}}`)

### Plans
- `GET /plans-db` - Get plans from database (returns `{plans: {...}}`)
- `GET /plans` - Get plans from JSON (fallback)
- `POST /update-plan` - Update plan (JSON: `{plan_id, plan_data: {can_download, max_downloads_per_month, template_limits}}`)
- `POST /update-broker-membership` - Update broker membership permissions

### Data Sources
- `GET /data/all` - Get all CSV data sources (returns `{data_sources: {...}}`)
- `POST /upload-csv` - Upload CSV (FormData: `file`, `data_type`)
- `DELETE /csv-files/{csv_id}` - Delete CSV
- `GET /csv-files` - List CSV files
- `GET /csv-fields/{csv_id}` - Get columns from CSV

### Database Info
- `GET /database-tables` - Get available database tables
- `GET /database-tables/{table_name}/columns` - Get columns for a table

### Vessels
- `GET /vessels` - Get list of vessels (for testing document generation)

### Document Generation
- `POST /process-document` - Process template with vessel data (JSON: `{template_name, vessel_imo}`)
- `POST /generate-document` - Alternative generation endpoint

## Important API Details

### Request Format
- **Cookies**: API uses HttpOnly session cookies. Include `credentials: 'include'` in fetch requests.
- **CORS**: API allows origins including `http://localhost:3000`, `http://localhost:5173`, etc.
- **Content-Type**: Use `application/json` for JSON requests, `multipart/form-data` for file uploads (browser will set boundary automatically)

### Response Format
- Success responses include `{"success": true, ...}`
- Error responses include `{"detail": "error message"}` with appropriate HTTP status codes

### Authentication
The API uses cookie-based authentication. Since the React app is on the same origin (after deployment) or can be configured, cookies should work. For now, you may need to handle authentication separately or use Supabase auth if available.

## UI/UX Requirements

### Design System
- Use existing shadcn/ui components (Card, Button, Input, Label, Textarea, Badge, Tabs, Dialog, etc.)
- Match the design style of existing admin panel components
- Use Tailwind CSS for styling (already configured)
- Use Lucide React icons (already installed)

### User Experience
- Show loading states during API calls
- Display toast notifications for success/error (use `sonner` - already installed)
- Implement proper error handling with user-friendly messages
- Use modals/dialogs for forms (upload, edit metadata, configure placeholders)
- Use data tables for lists (templates, plans, CSV files)
- Allow bulk operations where appropriate

### Features
1. **Template Upload Form**:
   - File input for .docx files
   - Display name input
   - Description textarea
   - Font family dropdown (Arial, Times New Roman, Calibri, etc.)
   - Font size input (number)
   - Plan checkboxes (multi-select which plans can access this template)
   - Show extracted placeholders after upload

2. **Template List**:
   - Sortable table/cards with: Name, Description, Placeholders count, File size, Created date, Actions
   - Filter/search functionality
   - Actions: View Details, Edit Metadata, Edit Placeholders, Test Generate, Delete

3. **Placeholder Mapping**:
   - Dropdown to select template
   - List of all placeholders found in template
   - For each placeholder, radio buttons or tabs for source type (Database/CSV/Random/Custom)
   - Conditional fields based on source type:
     - Database: Table dropdown, Field dropdown
     - CSV: CSV file dropdown, Field dropdown, Row input
     - Random: Option dropdown (auto/fixed/ai)
     - Custom: Text input
   - Save button to persist all settings

4. **Plans Management**:
   - List all subscription plans with their details
   - Edit button opens modal with:
     - Radio: "All templates" vs "Specific templates"
     - If specific: Checkbox list of all templates
     - Max downloads per month input
     - Per-template limits (if applicable)
   - Save updates plan permissions in database

5. **CSV Management**:
   - List CSV files with: Display name, Filename, Row count, File size
   - Upload form with file input and data type input
   - Delete action for each CSV

## Integration with Existing Admin Panel

1. **Add to AdminPanel.tsx**:
   - Import the new `DocumentProcessingCMS` component
   - Add a new TabsTrigger for "Document CMS" or "Templates CMS"
   - Add TabsContent that renders `<DocumentProcessingCMS />`
   - Use appropriate icon (FileText or similar)

2. **File Location**:
   - Create `src/components/admin/DocumentProcessingCMS.tsx`
   - Or enhance existing `DocumentTemplateManager.tsx` if you prefer

## API Base URL Configuration

Create a utility or constant for the API base URL:
```typescript
const API_BASE_URL = import.meta.env.VITE_DOCUMENT_API_URL || 'http://localhost:8000';
```

Or use environment variable if configured.

## Data Flow

1. **Fetch templates** → Display in list
2. **User uploads template** → POST to API → Refresh list
3. **User clicks "Edit Placeholders"** → Fetch placeholder settings → Show mapping editor → Save settings
4. **User edits plan** → Fetch current plan data → Show edit form → Update via API → Refresh list
5. **User tests template** → Select vessel → Generate document → Download PDF

## Error Handling

- Handle 401 errors (unauthorized) - redirect to login or show message
- Handle 404 errors (template not found) - show user-friendly message
- Handle 500 errors (server error) - show error toast with details
- Handle network errors - show connection error message
- Always provide user feedback via toasts

## Example Template Structure (from API)

```typescript
interface Template {
  id: string;
  name: string; // file name with .docx
  title: string; // display name
  file_name: string; // without extension
  file_with_extension: string; // with .docx
  description: string;
  size: number;
  created_at: string;
  placeholders: string[];
  placeholder_count: number;
  metadata: {
    display_name: string;
    description: string;
    font_family?: string;
    font_size?: number;
  };
  font_family?: string;
  font_size?: number;
  is_active: boolean;
}
```

## Example Placeholder Setting Structure

```typescript
interface PlaceholderSetting {
  source: 'database' | 'csv' | 'random' | 'custom';
  customValue?: string;
  databaseTable?: string;
  databaseField?: string;
  csvId?: string;
  csvField?: string;
  csvRow?: number;
  randomOption?: 'auto' | 'fixed' | 'ai';
}
```

## Implementation Notes

1. **Use React Query or SWR** for data fetching and caching (if available) - otherwise use useState + useEffect
2. **Use React Hook Form** for form handling (already installed)
3. **Use Zod** for validation (already installed)
4. **Handle file uploads** using FormData and fetch with proper content-type
5. **Implement debouncing** for search/filter inputs
6. **Use proper TypeScript types** for all API responses
7. **Handle pagination** if API supports it (currently doesn't, but design for it)
8. **Make it responsive** - work on mobile and desktop

## Testing Requirements

- Test with real templates that have various placeholder formats
- Test with different data sources (database, CSV, random, custom)
- Test plan assignment and permissions
- Test document generation with real vessel data
- Test error cases (network failures, invalid data, etc.)

## Success Criteria

✅ Users can upload, view, edit, and delete templates
✅ Users can map placeholders to data sources (database, CSV, random, custom)
✅ Users can manage subscription plan permissions per template
✅ Users can upload and manage CSV data sources
✅ Users can test document generation
✅ All API calls work correctly with proper error handling
✅ UI is intuitive and matches existing admin panel design
✅ Component is properly integrated into AdminPanel tabs

---

**Please build this component with full TypeScript types, proper error handling, loading states, and a beautiful, modern UI using shadcn/ui components. Make it production-ready and well-integrated with the existing admin panel.**
