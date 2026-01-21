# Python API Connection Guide for Lovable - React Integration

## Python API Location and Base URL

### Production API
- **Base URL**: `https://control.petrodealhub.com`
- **Health Check**: `https://control.petrodealhub.com/health`
- **API Endpoints**: All endpoints are available at the root level (e.g., `/templates`, `/placeholder-settings`)

### Local Development (if needed)
- **Base URL**: `http://localhost:8000`
- **Health Check**: `http://localhost:8000/health`

## Python API Source Code Location

The Python FastAPI backend is located at:
- **Main file**: `document-processor/main.py`
- **Requirements**: `document-processor/requirements.txt`
- **Templates directory**: `document-processor/templates/`
- **Storage directory**: `document-processor/storage/`

## API Configuration for React

### 1. Create API Client Utility

Create a file `src/lib/api-client.ts` or `src/utils/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_DOCUMENT_API_URL || 'https://control.petrodealhub.com';

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  detail?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Important: Include cookies for session auth
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### 2. Environment Variable

Add to `.env` or `.env.local`:

```env
VITE_DOCUMENT_API_URL=https://control.petrodealhub.com
```

## Complete API Endpoints Reference

### Authentication Endpoints

```typescript
// Login
POST /auth/login
Body: { username: string, password: string }
Response: { success: true, message: string }
// Sets HttpOnly session cookie

// Get current user
GET /auth/me
Response: { username: string, ... }

// Logout
POST /auth/logout
Response: { success: true }
```

### Template Management Endpoints

```typescript
// Get all templates
GET /templates
Response: { templates: Template[] }

// Get single template
GET /templates/{template_id}
Response: Template

// Upload template
POST /upload-template
Content-Type: multipart/form-data
Body: FormData with:
  - file: File (docx)
  - name?: string
  - description?: string
  - font_family?: string
  - font_size?: number
  - plan_ids?: string[]
Response: { success: true, template: Template }

// Update template metadata
POST /templates/{template_id}/metadata
Body: {
  display_name?: string,
  description?: string,
  font_family?: string,
  font_size?: number,
  plan_ids?: string[]
}
Response: { success: true, template: Template }

// Delete template
DELETE /templates/{template_name}
Response: { success: true, message: string }
```

### Placeholder Settings Endpoints

```typescript
// Get placeholder settings
GET /placeholder-settings?template_id={id}
GET /placeholder-settings?template_name={name}
GET /placeholder-settings (all settings)
Response: {
  template?: string,
  template_id?: string,
  settings: { [placeholder: string]: PlaceholderSetting }
}

// Save placeholder settings
POST /placeholder-settings
Body: {
  template_name?: string,
  template_id?: string,
  settings: {
    [placeholder: string]: {
      source: 'database' | 'csv' | 'random' | 'custom',
      customValue?: string,
      databaseTable?: string,
      databaseField?: string,
      csvId?: string,
      csvField?: string,
      csvRow?: number,
      randomOption?: 'auto' | 'fixed' | 'ai'
    }
  }
}
Response: { success: true, message: string }
```

### Subscription Plans Endpoints

```typescript
// Get all plans
GET /plans-db
Response: { plans: { [planId: string]: Plan } }

// Update plan permissions
POST /update-plan
Body: {
  plan_id: string,
  plan_data: {
    can_download?: string[], // template IDs or ["all"]
    max_downloads_per_month?: number,
    template_limits?: { [templateId: string]: number }
  }
}
Response: { success: true, message: string }
```

### Data Sources (CSV) Endpoints

```typescript
// Get all CSV data sources
GET /data/all
Response: { data_sources: { [csvId: string]: CSVSource } }

// Upload CSV
POST /upload-csv
Content-Type: multipart/form-data
Body: FormData with:
  - file: File (csv)
  - data_type: string
Response: { success: true, csv_id: string }

// Get CSV files list
GET /csv-files
Response: { csv_files: CSVFile[] }

// Get CSV fields/columns
GET /csv-fields/{csv_id}
Response: { fields: string[] }

// Delete CSV
DELETE /csv-files/{csv_id}
Response: { success: true, message: string }
```

### Database Info Endpoints

```typescript
// Get database tables
GET /database-tables
Response: { tables: string[] }

// Get table columns
GET /database-tables/{table_name}/columns
Response: { columns: Column[] }
```

### Document Generation Endpoints

```typescript
// Process/generate document
POST /process-document
Body: {
  template_name: string,
  vessel_imo?: string
}
Response: { success: true, download_url: string }
```

## TypeScript Interfaces

Add these to your React project:

```typescript
// src/types/api.ts

export interface Template {
  id: string;
  template_id?: string;
  name: string;
  title: string;
  file_name: string;
  file_with_extension: string;
  description?: string;
  size: number;
  created_at: string;
  placeholders: string[];
  placeholder_count: number;
  metadata?: {
    display_name: string;
    description?: string;
    font_family?: string;
    font_size?: number;
  };
  font_family?: string;
  font_size?: number;
  is_active: boolean;
}

export interface PlaceholderSetting {
  source: 'database' | 'csv' | 'random' | 'custom';
  customValue?: string;
  databaseTable?: string;
  databaseField?: string;
  csvId?: string;
  csvField?: string;
  csvRow?: number;
  randomOption?: 'auto' | 'fixed' | 'ai';
}

export interface Plan {
  id: string;
  name: string;
  tier: string;
  can_download?: string[];
  max_downloads_per_month?: number;
  template_limits?: { [templateId: string]: number };
}

export interface CSVSource {
  id: string;
  display_name: string;
  filename: string;
  row_count: number;
  file_size: number;
}

export interface CSVFile {
  csv_id: string;
  display_name: string;
  filename: string;
  row_count: number;
  file_size: number;
}

export interface DatabaseColumn {
  name: string;
  type: string;
}
```

## Example Usage in React Component

```typescript
import { apiClient } from '@/lib/api-client';
import { Template, PlaceholderSetting } from '@/types/api';
import { toast } from 'sonner';

// Get templates
const fetchTemplates = async (): Promise<Template[]> => {
  try {
    const response = await apiClient.get<{ templates: Template[] }>('/templates');
    return response.templates;
  } catch (error) {
    toast.error('Failed to load templates');
    throw error;
  }
};

// Upload template
const uploadTemplate = async (file: File, metadata: {
  name?: string;
  description?: string;
  font_family?: string;
  font_size?: number;
}): Promise<Template> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.font_family) formData.append('font_family', metadata.font_family);
    if (metadata.font_size) formData.append('font_size', metadata.font_size.toString());

    const response = await apiClient.postFormData<{ success: boolean; template: Template }>(
      '/upload-template',
      formData
    );
    return response.template;
  } catch (error) {
    toast.error('Failed to upload template');
    throw error;
  }
};

// Get placeholder settings
const getPlaceholderSettings = async (templateId: string) => {
  try {
    const response = await apiClient.get<{
      template: string;
      template_id: string;
      settings: { [key: string]: PlaceholderSetting };
    }>(`/placeholder-settings?template_id=${templateId}`);
    return response;
  } catch (error) {
    toast.error('Failed to load placeholder settings');
    throw error;
  }
};

// Save placeholder settings
const savePlaceholderSettings = async (
  templateId: string,
  settings: { [key: string]: PlaceholderSetting }
) => {
  try {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/placeholder-settings',
      {
        template_id: templateId,
        settings,
      }
    );
    toast.success('Placeholder settings saved');
    return response;
  } catch (error) {
    toast.error('Failed to save placeholder settings');
    throw error;
  }
};
```

## Important Notes

1. **CORS**: The API is configured to accept requests from your React app domain
2. **Cookies**: Use `credentials: 'include'` in all fetch requests to send/receive session cookies
3. **File Uploads**: Use `FormData` for file uploads, not JSON
4. **Error Handling**: All endpoints return JSON with `detail` field for errors
5. **Authentication**: Uses HttpOnly session cookies (set via `/auth/login`)
6. **Nginx Rewrite**: The API also accepts `/cmsplaceholder-settings` as an alias for `/placeholder-settings`

## Testing the Connection

```typescript
// Test API connection
const testConnection = async () => {
  try {
    const health = await apiClient.get('/health');
    console.log('API Health:', health);
    return true;
  } catch (error) {
    console.error('API Connection failed:', error);
    return false;
  }
};
```

## React Query Example (if using React Query)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Fetch templates
export const useTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await apiClient.get<{ templates: Template[] }>('/templates');
      return response.templates;
    },
  });
};

// Upload template mutation
export const useUploadTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: any }) => {
      return uploadTemplate(file, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};
```

---

**API Base URL**: `https://control.petrodealhub.com`
**Python API Source**: `document-processor/main.py`
**All endpoints are at root level** (e.g., `/templates`, `/placeholder-settings`, `/auth/login`)
