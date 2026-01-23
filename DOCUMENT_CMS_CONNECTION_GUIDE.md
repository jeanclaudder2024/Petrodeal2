# Document CMS - Python API Connection Guide

## Overview

The React Document Processing CMS has been successfully connected to the Python FastAPI backend. This guide explains what was done and how to use it.

## What Was Fixed

### 1. API Base URL Configuration
- **File**: `src/components/admin/document-cms/types.ts`
- **Change**: Updated `API_BASE_URL` to use environment variables
- **Behavior**: 
  - Uses `VITE_DOCUMENT_API_URL` if set
  - Falls back to `VITE_API_URL` if set
  - Uses `http://localhost:8000` in development
  - Uses `https://control.petrodealhub.com` in production

### 2. Enhanced Error Handling
- **File**: `src/components/admin/document-cms/hooks/useDocumentAPI.ts`
- **Changes**:
  - Added specific handling for 401 (authentication) errors
  - Improved error messages with toast notifications
  - Better error handling for upload operations

### 3. Authentication System
- **New Files**:
  - `src/components/admin/document-cms/hooks/useAuth.ts` - Authentication hook
  - `src/components/admin/document-cms/AuthDialog.tsx` - Login dialog component
- **Features**:
  - Automatic authentication status check
  - Login dialog for Python API authentication
  - Visual connection status indicator
  - Separate authentication from main Supabase auth

### 4. Fixed Hardcoded URLs
- **File**: `src/components/admin/document-cms/TemplatesTab.tsx`
- **Change**: Replaced hardcoded `http://localhost:8000` with `API_BASE_URL` variable

## How to Use

### 1. Set Environment Variable (Optional)

Create or update `.env` or `.env.local` in your project root:

```env
# For production
VITE_DOCUMENT_API_URL=https://control.petrodealhub.com

# For local development
VITE_DOCUMENT_API_URL=http://localhost:8000
```

### 2. Access the CMS

1. Navigate to Admin Panel
2. Go to the "Document CMS" tab
3. You'll see a connection status indicator in the header:
   - **Green "Connected"** - You're authenticated and ready to use
   - **"Login to API" button** - Click to authenticate

### 3. Authenticate with Python API

1. Click "Login to API" button if not connected
2. Enter your Python API credentials (separate from main account)
3. Click "Login"
4. You'll see "Connected" status once authenticated

### 4. Upload Documents

1. Go to "Templates" tab
2. Click "Upload Template"
3. Select a `.docx` file
4. Fill in template details (name, description, font settings)
5. Click "Upload"
6. The template will be uploaded to the Python API

### 5. Manage Data Sources

1. Go to "Data Sources" tab
2. Upload CSV files for placeholder data
3. Manage existing data sources
4. Configure data mappings

## API Endpoints Used

The CMS connects to these Python API endpoints:

- `GET /templates` - List all templates
- `POST /upload-template` - Upload new template
- `DELETE /templates/{name}` - Delete template
- `POST /templates/{id}/metadata` - Update template metadata
- `GET /placeholder-settings` - Get placeholder mappings
- `POST /placeholder-settings` - Save placeholder mappings
- `POST /upload-csv` - Upload CSV data source
- `GET /csv-files` - List CSV files
- `GET /data/all` - Get all data sources
- `POST /auth/login` - Authenticate
- `GET /auth/me` - Check authentication status
- `POST /auth/logout` - Logout

## Authentication

The Python API uses cookie-based session authentication:
- Login sets an HttpOnly session cookie
- All API requests include `credentials: 'include'` to send cookies
- Session persists across page refreshes
- Separate from Supabase authentication

## Troubleshooting

### "Authentication required" error
- Click "Login to API" button
- Enter correct Python API credentials
- Check that Python API is running

### "Failed to fetch templates" error
- Check Python API is running
- Verify API_BASE_URL is correct
- Check browser console for CORS errors
- Ensure Python API CORS settings allow your origin

### Upload fails
- Check file is `.docx` format
- Verify authentication is active
- Check Python API logs for errors
- Ensure file size is within limits

### Connection status not updating
- Refresh the page
- Check browser console for errors
- Verify Python API `/auth/me` endpoint is working

## Files Modified

1. `src/components/admin/document-cms/types.ts` - API URL configuration
2. `src/components/admin/document-cms/hooks/useDocumentAPI.ts` - Error handling
3. `src/components/admin/document-cms/TemplatesTab.tsx` - Fixed hardcoded URL
4. `src/components/admin/document-cms/DocumentProcessingCMS.tsx` - Added auth UI

## Files Created

1. `src/components/admin/document-cms/hooks/useAuth.ts` - Authentication hook
2. `src/components/admin/document-cms/AuthDialog.tsx` - Login dialog

## Next Steps

1. Test document upload functionality
2. Verify placeholder mapping works
3. Test CSV data source uploads
4. Configure subscription plans
5. Test document generation

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Python API logs
3. Verify environment variables are set correctly
4. Ensure Python API is running and accessible
