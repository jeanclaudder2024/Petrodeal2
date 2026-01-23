# React CMS Component Test Checklist

## Prerequisites
1. React app is running (`npm run dev` or similar)
2. Python API is running on configured port
3. Browser console is open for debugging

## Test Steps

### 1. Access the CMS
- [ ] Navigate to Admin Panel
- [ ] Click on "Document CMS" tab
- [ ] Verify CMS component loads without errors

### 2. Check Authentication Status
- [ ] Look for connection status indicator in header
- [ ] If not connected, verify "Login to API" button appears
- [ ] If connected, verify green "Connected" indicator shows

### 3. Test Authentication Flow
- [ ] Click "Login to API" button
- [ ] Verify login dialog opens
- [ ] Enter Python API credentials
- [ ] Click "Login"
- [ ] Verify success message appears
- [ ] Verify connection status changes to "Connected"
- [ ] Verify dialog closes automatically

### 4. Test Template Management
- [ ] Go to "Templates" tab
- [ ] Verify templates list loads (or shows empty state)
- [ ] Click "Upload Template"
- [ ] Verify upload dialog opens
- [ ] Select a .docx file
- [ ] Fill in template details
- [ ] Click "Upload"
- [ ] Verify success message
- [ ] Verify template appears in list

### 5. Test Error Handling
- [ ] Try uploading without file (should show error)
- [ ] Try uploading non-.docx file (should show error)
- [ ] If not authenticated, try uploading (should show auth error)

### 6. Test Data Sources
- [ ] Go to "Data Sources" tab
- [ ] Verify CSV files list loads
- [ ] Try uploading a CSV file
- [ ] Verify upload works

### 7. Browser Console Checks
- [ ] Open browser DevTools Console
- [ ] Check for any JavaScript errors
- [ ] Check Network tab for API calls
- [ ] Verify API calls include credentials
- [ ] Verify API calls go to correct endpoint

## Common Issues to Check

### CORS Errors
- If you see CORS errors in console:
  - Check Python API CORS settings
  - Verify API_BASE_URL is correct
  - Check if API is running

### Authentication Errors
- If authentication fails:
  - Check Python API is running
  - Verify credentials are correct
  - Check browser cookies (should have 'session' cookie)
  - Check Network tab for 401 errors

### Upload Errors
- If upload fails:
  - Check file is .docx format
  - Verify authentication is active
  - Check Python API logs
  - Verify file size is within limits

## Manual Test Commands

### Check API Base URL
Open browser console and run:
```javascript
console.log('API Base URL:', import.meta.env.VITE_DOCUMENT_API_URL || 'https://control.petrodealhub.com');
```

### Test API Connection
Open browser console and run:
```javascript
fetch('http://localhost:8000/', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test Authentication
Open browser console and run:
```javascript
fetch('http://localhost:8000/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```
