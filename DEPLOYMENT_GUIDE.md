# 🚀 Complete Guide: Deploy Document Processor API as Windows Service

## 📋 Table of Contents
1. [What is NSSM?](#what-is-nssm)
2. [Download and Setup](#download-and-setup)
3. [Install as Windows Service](#install-as-windows-service)
4. [Configure React Project](#configure-react-project)
5. [Testing and Verification](#testing-and-verification)
6. [Service Management](#service-management)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 What is NSSM?

**NSSM (Non-Sucking Service Manager)** is a tool that allows you to run any executable as a Windows Service. This means:
- ✅ Runs automatically when Windows starts
- ✅ Runs even when you're not logged in
- ✅ Automatically restarts if it crashes
- ✅ Easy to manage (start/stop/restart)
- ✅ Professional service management

---

## 📥 Download and Setup

### Step 1: Download NSSM
1. Go to: https://nssm.cc/download
2. Download: `nssm-2.24.zip` (or latest version)
3. Extract to: `C:\nssm\`

### Step 2: Verify Python Path
1. Open Command Prompt
2. Run: `python --version`
3. Note your Python path (usually `C:\Python311\python.exe` or `C:\Users\YourName\AppData\Local\Programs\Python\Python311\python.exe`)

### Step 3: Verify Project Path
Your project should be at:
```
D:\ia oile project prop\aivessel-trade-flow-main\document-processor
```

---

## ⚙️ Install as Windows Service

### Step 1: Open Command Prompt as Administrator
1. Press `Win + X`
2. Select "Command Prompt (Admin)" or "PowerShell (Admin)"

### Step 2: Navigate to NSSM
```cmd
cd C:\nssm\win64
```

### Step 3: Install the Service
```cmd
nssm install DocumentProcessor
```

### Step 4: Configure the Service
A GUI window will open. Fill in these details:

**Application Tab:**
- **Path**: `C:\Python311\python.exe` (or your Python path)
- **Startup directory**: `D:\ia oile project prop\aivessel-trade-flow-main\document-processor`
- **Arguments**: `-m uvicorn main:app --host 0.0.0.0 --port 8000`

**Details Tab:**
- **Display name**: `Document Processor API`
- **Description**: `Oil Trading Document Processing API Service`

**Log on Tab:**
- **Log on as**: `Local System account`
- Check: `Allow service to interact with desktop`

### Step 5: Save Configuration
Click "Install service"

### Step 6: Start the Service
```cmd
nssm start DocumentProcessor
```

---

## 🔗 Configure React Project

### Step 1: Update API URL in React
Open your React project and update the API URL:

**File**: `src/components/VesselDocumentGenerator.tsx`

**Change this line:**
```typescript
const API_BASE_URL = 'https://document-processor-production-8a35.up.railway.app';
```

**To this:**
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

### Step 2: Update Other API References
Search for any other API references in your React project:

**Files to check:**
- `src/components/VesselDocumentGenerator.tsx`
- `src/pages/VesselDetail.tsx`
- Any other components that call the API

**Replace all instances of:**
```typescript
'https://document-processor-production-8a35.up.railway.app'
```

**With:**
```typescript
'http://localhost:8000'
```

### Step 3: Handle CORS (if needed)
If you get CORS errors, update your Python API:

**File**: `document-processor/main.py`

**Add this import at the top:**
```python
from fastapi.middleware.cors import CORSMiddleware
```

**Add this after creating the app:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Add your React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🧪 Testing and Verification

### Step 1: Check Service Status
```cmd
nssm status DocumentProcessor
```

### Step 2: Test API Endpoints
Open your browser and test:

1. **Health Check**: http://localhost:8000/health
2. **Root Endpoint**: http://localhost:8000/
3. **Templates**: http://localhost:8000/templates

### Step 3: Test React Integration
1. Start your React development server:
   ```cmd
   npm start
   # or
   yarn start
   ```

2. Open your React app in browser
3. Try to generate a document
4. Check browser console for any errors

### Step 4: Check Service Logs
```cmd
nssm get DocumentProcessor AppStdout
nssm get DocumentProcessor AppStderr
```

---

## 🎛️ Service Management

### Start Service
```cmd
nssm start DocumentProcessor
```

### Stop Service
```cmd
nssm stop DocumentProcessor
```

### Restart Service
```cmd
nssm restart DocumentProcessor
```

### Check Service Status
```cmd
nssm status DocumentProcessor
```

### Remove Service
```cmd
nssm remove DocumentProcessor
```

### View Service Logs
```cmd
nssm get DocumentProcessor AppStdout
nssm get DocumentProcessor AppStderr
```

---

## 🔧 Troubleshooting

### Problem: Service won't start
**Solution:**
1. Check Python path: `python --version`
2. Check project path exists
3. Check if port 8000 is free: `netstat -an | findstr :8000`
4. Check service logs: `nssm get DocumentProcessor AppStderr`

### Problem: CORS errors in React
**Solution:**
1. Add CORS middleware to Python API (see above)
2. Restart the service: `nssm restart DocumentProcessor`
3. Clear browser cache

### Problem: API not responding
**Solution:**
1. Check service status: `nssm status DocumentProcessor`
2. Check if port is listening: `netstat -an | findstr :8000`
3. Test with curl: `curl http://localhost:8000/health`

### Problem: Service stops unexpectedly
**Solution:**
1. Check service logs: `nssm get DocumentProcessor AppStderr`
2. Check Windows Event Viewer
3. Verify Python dependencies are installed

### Problem: React can't connect to API
**Solution:**
1. Verify API URL in React code
2. Check if service is running
3. Test API directly in browser
4. Check firewall settings

---

## 🌐 Network Access (Optional)

If you want to access the API from other computers on your network:

### Step 1: Find Your IP Address
```cmd
ipconfig
```

### Step 2: Update React API URL
```typescript
const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000';
```

### Step 3: Configure Windows Firewall
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" → "Allow another app"
4. Browse to: `C:\Python311\python.exe`
5. Check both "Private" and "Public"

---

## 📊 Monitoring

### Check Service Status
```cmd
nssm status DocumentProcessor
```

### View Real-time Logs
```cmd
nssm get DocumentProcessor AppStdout
```

### Check Port Usage
```cmd
netstat -an | findstr :8000
```

### Test API Health
```cmd
curl http://localhost:8000/health
```

---

## 🎉 Success Checklist

- [ ] NSSM downloaded and extracted
- [ ] Service installed and configured
- [ ] Service started successfully
- [ ] API responds at http://localhost:8000/health
- [ ] React project updated with local API URL
- [ ] Document generation works in React app
- [ ] Service runs automatically on Windows startup
- [ ] Service restarts automatically if it crashes

---

## 🚀 Final Result

After completing this setup:

1. **Your Python API runs 24/7** as a Windows Service
2. **Automatically starts** when Windows boots
3. **Runs even when you're not logged in**
4. **Your React app connects** to the local API
5. **Document generation works** seamlessly
6. **Professional service management** with NSSM

Your document processor is now running as a professional Windows service! 🎯

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all paths and configurations
3. Check Windows Event Viewer for errors
4. Test each component individually

**Happy Document Processing!** 🚀

---

## 🔄 Quick Commands Reference

### Service Management
```cmd
# Install service
nssm install DocumentProcessor

# Start service
nssm start DocumentProcessor

# Stop service
nssm stop DocumentProcessor

# Restart service
nssm restart DocumentProcessor

# Check status
nssm status DocumentProcessor

# Remove service
nssm remove DocumentProcessor
```

### Testing Commands
```cmd
# Check if port is in use
netstat -an | findstr :8000

# Test API health
curl http://localhost:8000/health

# Check service logs
nssm get DocumentProcessor AppStdout
nssm get DocumentProcessor AppStderr
```

### React Development
```cmd
# Start React dev server
npm start

# Build React for production
npm run build

# Install dependencies
npm install
```

---

## 📁 File Structure

```
D:\ia oile project prop\aivessel-trade-flow-main\
├── document-processor/           # Python API
│   ├── main.py                  # Main API file
│   ├── requirements.txt         # Python dependencies
│   ├── templates/               # Word templates
│   └── temp/                    # Temporary files
├── src/                         # React frontend
│   ├── components/
│   │   └── VesselDocumentGenerator.tsx
│   └── pages/
│       └── VesselDetail.tsx
└── DEPLOYMENT_GUIDE.md          # This file
```

---

## 🎯 Next Steps

1. **Follow the setup guide** step by step
2. **Test the service** thoroughly
3. **Update your React app** to use local API
4. **Monitor the service** for any issues
5. **Enjoy 24/7 document processing!** 🚀
