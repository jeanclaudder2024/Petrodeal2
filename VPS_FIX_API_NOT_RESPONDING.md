# Fix: API Not Responding Even Though PM2 Shows Online

## Problem:
- PM2 shows `python-api` as "online"
- But `curl http://localhost:8000/health` fails
- API crashed or failed to start properly

## Quick Fix Steps:

### Step 1: Check PM2 Logs to See What Happened

```bash
pm2 logs python-api --lines 50
```

Look for:
- Python errors
- Import errors
- Port already in use
- Missing dependencies

### Step 2: Check if Process is Actually Running

```bash
pm2 list
ps aux | grep python | grep main.py
```

### Step 3: Stop and Restart Cleanly

```bash
# Stop the process
pm2 stop python-api
pm2 delete python-api

# Check port 8000 is free
sudo lsof -i:8000
# If something is there, kill it:
sudo kill -9 <PID>

# Navigate to directory
cd /opt/petrodealhub/document-processor

# Activate venv
source venv/bin/activate

# Check if main.py exists
ls -la main.py

# Try starting manually first to see errors
python main.py
# (Press Ctrl+C after seeing if it starts)

# If manual start works, start with PM2:
pm2 start python --name python-api --interpreter venv/bin/python -- main.py
pm2 save
```

### Step 4: Verify It's Working

```bash
# Wait 3 seconds
sleep 3

# Check PM2 status
pm2 list

# Test API
curl http://localhost:8000/health
```

---

## Common Issues and Fixes:

### Issue 1: Port 8000 Already in Use

```bash
sudo lsof -i:8000
# Kill the process:
sudo kill -9 <PID>
# Then restart API
```

### Issue 2: Python Import Errors

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt
```

### Issue 3: Missing .env File

```bash
cd /opt/petrodealhub/document-processor
ls -la .env
# If missing, create it with necessary variables
```

### Issue 4: Virtual Environment Issues

```bash
cd /opt/petrodealhub/document-processor
# Recreate venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Debug: Start Manually to See Errors

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
```

This will show you **exactly** what error is preventing the API from starting.

Look for:
- `ImportError: No module named...`
- `Port 8000 already in use`
- `Permission denied`
- Any Python traceback errors

---

## After Fixing:

1. **Verify API works:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Save PM2 config:**
   ```bash
   pm2 save
   ```

3. **Test CMS in browser**
