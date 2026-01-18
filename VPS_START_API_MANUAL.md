# Quick Fix: Start Backend API (502 Error)

## Problem:
- PM2 process `python-api` not found
- Backend API not running on port 8000
- Result: 502 Bad Gateway

## Solution: Start the API

### Step 1: Navigate to document-processor directory

```bash
cd /opt/petrodealhub/document-processor
# OR if path is different:
cd /opt/aivessel-trade-flow/document-processor
```

### Step 2: Check if venv exists

```bash
ls -la venv
```

If venv doesn't exist:
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Start API with PM2

**Option A: Using ecosystem.config.js (if exists)**
```bash
pm2 start ecosystem.config.js
```

**Option B: Manual PM2 start**
```bash
source venv/bin/activate
pm2 start python --name python-api --interpreter venv/bin/python -- main.py --env FASTAPI_PORT=8000
```

**Option C: If ecosystem.config.js is in parent directory**
```bash
cd /opt/petrodealhub
pm2 start ecosystem.config.js
```

### Step 4: Verify it's running

```bash
# Check PM2 status
pm2 list

# Should show:
# ┌─────┬──────────────┬─────────┬─────────┬──────────┐
# │ id  │ name         │ status  │ restart │ uptime   │
# ├─────┼──────────────┼─────────┼─────────┼──────────┤
# │ 0   │ python-api   │ online  │ 0       │ 10s      │
# └─────┴──────────────┴─────────┴─────────┴──────────┘

# Test API
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

### Step 5: Save PM2 configuration (so it auto-starts on reboot)

```bash
pm2 save
pm2 startup
```

---

## Alternative: Use systemd service

If PM2 doesn't work, check if systemd service exists:

```bash
sudo systemctl status petrodealhub-api
# OR
sudo systemctl status document-processor
```

If service exists but not running:
```bash
sudo systemctl start petrodealhub-api
sudo systemctl enable petrodealhub-api  # Auto-start on boot
```

---

## If still not working:

1. **Check for errors:**
   ```bash
   pm2 logs python-api --lines 50
   ```

2. **Check if port 8000 is free:**
   ```bash
   sudo lsof -i:8000
   # If something is using it, kill it:
   sudo kill -9 <PID>
   ```

3. **Try starting manually to see errors:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   python main.py
   # (Look for errors, then press Ctrl+C)
   ```

---

## Quick One-Liner (if you're in /opt/petrodealhub):

```bash
cd document-processor && source venv/bin/activate && pm2 start python --name python-api --interpreter venv/bin/python -- main.py && pm2 save
```
