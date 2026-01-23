# Start Python API and Test React CMS

## Step 1: Start Python API

Open a terminal and run:

```bash
cd "D:\ia oile project prop\aivessel-trade-flow-main\document-processor"
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open!** The API needs to keep running.

## Step 2: Test Python API (Optional)

Open a NEW terminal and run:

```bash
cd "D:\ia oile project prop\aivessel-trade-flow-main"
python test_python_api.py
```

Expected output:
- Health check should pass
- Auth endpoints should work
- Login should work (username: `admin`, password: `admin`)

## Step 3: Start React App

Open a NEW terminal and run:

```bash
cd "D:\ia oile project prop\aivessel-trade-flow-main"
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 4: Test React CMS in Browser

1. Open browser to `http://localhost:5173`
2. Login to your admin account
3. Navigate to **Admin Panel** → **Document CMS** tab
4. You should see:
   - Connection status indicator (top right)
   - If not connected: "Login to API" button
   - If connected: Green "Connected" indicator

## Step 5: Authenticate with Python API

1. Click **"Login to API"** button
2. Enter credentials:
   - Username: `admin`
   - Password: `admin`
3. Click **"Login"**
4. You should see:
   - Success message
   - Status changes to "Connected"
   - Dialog closes automatically

## Step 6: Test Template Upload

1. Go to **"Templates"** tab
2. Click **"Upload Template"**
3. Select a `.docx` file
4. Fill in:
   - Display Name: (required)
   - Description: (optional)
   - Font settings: (optional)
5. Click **"Upload"**
6. You should see:
   - Success message
   - Template appears in the list

## Troubleshooting

### Python API won't start
- Check if port 8000 is in use: `netstat -ano | findstr :8000`
- Install dependencies: `pip install -r document-processor/requirements.txt`
- Check for errors in terminal

### React can't connect
- Verify Python API is running (check terminal)
- Check browser console for errors
- Verify API URL: Open browser console and run:
  ```javascript
  console.log('API URL:', import.meta.env.VITE_DOCUMENT_API_URL || 'http://localhost:8000');
  ```

### Authentication fails
- Default credentials: username=`admin`, password=`admin`
- Check `document-processor/storage/users.json` for users
- Check browser cookies (DevTools → Application → Cookies)
- Check Python API terminal for errors

### Upload fails
- Verify file is `.docx` format
- Check you're authenticated (green "Connected" indicator)
- Check Python API terminal for errors
- Check browser console for errors

## Quick Test Commands

### Test API Health (in browser console)
```javascript
fetch('http://localhost:8000/', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test Authentication (in browser console)
```javascript
fetch('http://localhost:8000/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test Login (in browser console)
```javascript
fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'admin', password: 'admin' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Expected Results

✅ Python API running on port 8000
✅ React app running on port 5173 (or configured port)
✅ Can authenticate from React CMS
✅ Can upload templates
✅ No console errors
✅ Connection status shows "Connected"

## Next Steps

Once everything works:
1. Test with real document templates
2. Test placeholder mapping
3. Test CSV data source uploads
4. Test document generation
