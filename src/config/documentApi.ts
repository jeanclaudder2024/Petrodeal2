// Document Processing API Configuration
// Default: same-origin /api (when built with VITE_DOCUMENT_API_URL=/api) or petrodealhub.com

const DEFAULT_API_URL =
  import.meta.env.VITE_DOCUMENT_API_URL || 'https://petrodealhub.com/api';

// Get the configured API URL (from localStorage override or default)
export function getDocumentApiUrl(): string {
  try {
    const saved = localStorage.getItem('document_api_url');
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return DEFAULT_API_URL;
}

// Set a custom API URL
export function setDocumentApiUrl(url: string) {
  localStorage.setItem('document_api_url', url.trim());
}

// Reset to default
export function resetDocumentApiUrl() {
  localStorage.removeItem('document_api_url');
}

// For backward compatibility
export const DOCUMENT_API_URL = getDocumentApiUrl();

// Helper to check if API is available
export async function checkApiHealth(customUrl?: string): Promise<boolean> {
  const baseUrl = customUrl || getDocumentApiUrl();
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// AI Status interface
export interface AIStatus {
  available: boolean;
  message: string;
  credits_remaining?: number | null;
  last_error?: string | null;
}

// Check AI generation status from Replit endpoint
export async function checkAIStatus(): Promise<AIStatus> {
  try {
    const response = await fetch(`${getDocumentApiUrl()}/ai-status`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.status === 404) {
      // /ai-status endpoint not implemented on backend — treat as available
      // since the backend health check passed
      return { 
        available: true, 
        message: 'AI service available (status endpoint not configured)',
        credits_remaining: null,
        last_error: null
      };
    }
    
    if (!response.ok) {
      return { 
        available: false, 
        message: 'AI status endpoint returned an error',
        last_error: `HTTP ${response.status}`
      };
    }
    
    return await response.json();
  } catch (error) {
    return { 
      available: false, 
      message: 'Cannot check AI status - endpoint unreachable',
      last_error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Handle HTTP 402 quota exceeded errors from document generation
export function handle402Error(response: Response): boolean {
  return response.status === 402;
}

export async function parse402Error(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data.error_type === 'openai_quota_exceeded') {
      return 'AI generation is temporarily unavailable due to quota limits. Please try again later or contact support.';
    }
    return data.detail || data.message || 'Payment required';
  } catch {
    return 'AI generation quota exceeded. Please try again later.';
  }
}

// Fetch helper with error handling (shows backend message on 500)
export async function documentApiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${getDocumentApiUrl()}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const err = JSON.parse(text);
      detail = err.detail || err.message || err.error || detail;
    } catch {
      if (text && !text.trimStart().startsWith('<')) detail = text.slice(0, 300);
    }
    throw new Error(detail);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON response');
  }
}
