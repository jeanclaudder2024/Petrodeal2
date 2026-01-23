# Running Tests for Document CMS

## Quick Start

### 1. Test Python API

#### Option A: Run Test Script
```bash
cd "D:\ia oile project prop\aivessel-trade-flow-main"
python test_python_api.py
```

#### Option B: Manual Test
1. Start Python API:
```bash
cd document-processor
python main.py
```

2. In another terminal, test endpoints:
```bash
# Health check
curl http://localhost:8000/

# Check auth (should return 401)
curl http://localhost:8000/auth/me

# Login (replace with your credentials)
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -c cookies.txt

# Check auth with cookie (should return user info)
curl http://localhost:8000/auth/me -b cookies.txt

# Get templates
curl http://localhost:8000/templates -b cookies.txt
```

### 2. Test React CMS

#### Start React App
```bash
npm run dev
```

#### Browser Testing
1. Open browser to `http://localhost:5173` (or your dev port)
2. Navigate to Admin Panel → Document CMS tab
3. Open browser console (F12)
4. Run test script:
```javascript
// Copy and paste test_api_connection.js content into console
// Or use the testAPI() function if available
```

#### Manual Checklist
- [ ] CMS component loads without errors
- [ ] Connection status shows (Connected or Login button)
- [ ] Can click "Login to API" and authenticate
- [ ] Templates tab loads (may be empty)
- [ ] Can open upload dialog
- [ ] Upload form validates correctly
- [ ] No console errors

### 3. Integration Test

#### Test Full Flow
1. **Start Python API:**
   ```bash
   cd document-processor
   python main.py
   ```

2. **Start React App:**
   ```bash
   npm run dev
   ```

3. **In Browser:**
   - Go to Admin Panel
   - Click "Document CMS" tab
   - Click "Login to API"
   - Enter credentials (check `document-processor/storage/users.json` for users)
   - Verify "Connected" status appears
   - Go to Templates tab
   - Click "Upload Template"
   - Select a .docx file
   - Fill in details and upload
   - Verify template appears in list

### 4. Verify API Connection

#### Check API Base URL
In browser console:
```javascript
// Check what URL is being used
console.log('API URL:', import.meta.env.VITE_DOCUMENT_API_URL || 'http://localhost:8000');
```

#### Test Direct API Call
In browser console:
```javascript
fetch('http://localhost:8000/', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### 5. Common Issues

#### Python API Not Starting
- Check if port 8000 is already in use
- Verify all dependencies installed: `pip install -r document-processor/requirements.txt`
- Check for syntax errors in main.py

#### React Can't Connect
- Verify Python API is running
- Check CORS settings in Python API
- Verify API_BASE_URL in React matches Python API URL
- Check browser console for errors

#### Authentication Fails
- Check `document-processor/storage/users.json` exists and has users
- Verify username/password are correct
- Check browser cookies (should have 'session' cookie after login)
- Check Python API logs for errors

#### Upload Fails
- Verify file is .docx format
- Check authentication is active (green "Connected" indicator)
- Check Python API logs
- Verify file size is reasonable

## Test Results

After running tests, you should see:
- ✓ Python API responds to health check
- ✓ Authentication endpoints work
- ✓ React CMS loads without errors
- ✓ Can authenticate from React
- ✓ Can upload templates (if authenticated)

## Next Steps

If all tests pass:
1. Test with actual .docx file upload
2. Test placeholder mapping
3. Test CSV data source upload
4. Test document generation

If tests fail:
1. Check error messages
2. Verify Python API is running
3. Check browser console for React errors
4. Review Python API logs
5. Check network tab in browser DevTools
