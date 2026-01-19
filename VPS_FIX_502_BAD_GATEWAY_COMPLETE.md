# Fix 502 Bad Gateway Error - Complete Guide

## 🔍 What is 502 Bad Gateway?

A **502 Bad Gateway** error means:
- **Nginx** (your web server) received the request
- **Nginx** tried to forward it to your **Python API** on port 8000
- The **Python API** is **not responding** or **not running**

---

## 📋 Quick Diagnosis Steps

### Step 1: Check if API is Running

**On your VPS, run:**

```bash
# Check PM2 status
pm2 list

# Check if port 8000 is in use
netstat -tulpn | grep 8000

# Test API directly
curl http://localhost:8000/health
```

### Step 2: Check PM2 Logs

```bash
# Check error logs
pm2 logs python-api --err --lines 50

# Check output logs  
pm2 logs python-api --out --lines 20
```

### Step 3: Try to Start API Manually

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate

# Try to start manually to see errors
python main.py
```

This will show you the exact error preventing the API from starting.

---

## 🚀 Common Fixes

### Fix 1: API is Not Running

**If PM2 shows API as "stopped" or "errored":**

```bash
cd /opt/petrodealhub/document-processor

# Restart the API
pm2 restart python-api

# If that doesn't work, delete and restart
pm2 delete python-api
pm2 start python-api --name python-api --interpreter venv/bin/python -- main.py

# Check status
pm2 status

# Test it
sleep 3
curl http://localhost:8000/health
```

### Fix 2: API is Running but Crashing (Syntax Errors)

**If PM2 shows "online" but curl fails:**

```bash
# Check logs for syntax errors
pm2 logs python-api --err --lines 50

# If you see Python syntax errors, restore clean main.py
cd /opt/petrodealhub/document-processor
cp main.py main.py.backup.$(date +%Y%m%d_%H%M%S)
git checkout HEAD -- main.py

# Verify syntax
source venv/bin/activate
python3 -m py_compile main.py

# Restart
pm2 restart python-api
```

### Fix 3: API is Not Listening on Port 8000

**If port 8000 is free but API should be running:**

```bash
# Check what's actually running
ps aux | grep python

# Check PM2 ecosystem config
cat /opt/petrodealhub/ecosystem.config.js | grep python-api

# Make sure API is configured to run on port 8000
# Check main.py for uvicorn/app.run() - should have host="0.0.0.0", port=8000
```

### Fix 4: Restore Clean main.py (Most Likely Fix)

**If you have syntax errors or corrupted file:**

```bash
cd /opt/petrodealhub/document-processor

# Backup corrupted file
cp main.py main.py.corrupted.$(date +%Y%m%d_%H%M%S)

# Restore clean version from git
git checkout HEAD -- main.py

# Verify it's clean
source venv/bin/activate
python3 -m py_compile main.py

# If syntax check passes, restart API
pm2 restart python-api

# Wait and test
sleep 5
curl http://localhost:8000/health

# Check PM2 logs to confirm it started
pm2 logs python-api --err --lines 10
```

---

## 🔧 Complete Diagnostic Script

**Run this on your VPS to diagnose everything:**

```bash
cd /opt/petrodealhub/document-processor

# Download diagnostic script
curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_DIAGNOSE_502_ERROR.sh
chmod +x VPS_DIAGNOSE_502_ERROR.sh
./VPS_DIAGNOSE_502_ERROR.sh
```

This will show you:
- PM2 status
- Port 8000 status
- API response test
- PM2 error logs
- Running processes

---

## ✅ Quick Fix Command (One-Line)

**If you just want to restore clean main.py and restart:**

```bash
cd /opt/petrodealhub/document-processor && cp main.py main.py.backup.$(date +%Y%m%d_%H%M%S) && git checkout HEAD -- main.py && source venv/bin/activate && python3 -m py_compile main.py && pm2 restart python-api && sleep 5 && curl http://localhost:8000/health && echo "✅ API is working!" || echo "❌ Still not working - check: pm2 logs python-api --err"
```

---

## 📝 What to Check

After running the diagnostic, check:

1. **PM2 Status**: Is `python-api` showing as "online"?
   - If "stopped" or "errored" → restart it
   - If "online" but not working → check logs

2. **Port 8000**: Is it in use?
   - If not → API is not running
   - If yes → API might be crashing

3. **Curl Test**: Does `curl http://localhost:8000/health` work?
   - If yes → Nginx problem, not API problem
   - If no → API problem

4. **PM2 Logs**: What errors do you see?
   - Syntax errors → restore clean main.py
   - Import errors → check dependencies
   - Connection errors → check database/API keys

---

## 🆘 Still Not Working?

If after all this it still doesn't work:

1. **Share PM2 error logs:**
   ```bash
   pm2 logs python-api --err --lines 50
   ```

2. **Share manual startup error:**
   ```bash
   cd /opt/petrodealhub/document-processor
   source venv/bin/activate
   python main.py
   ```

3. **Check if main.py is actually clean:**
   ```bash
   cd /opt/petrodealhub/document-processor
   git status main.py
   # Should show: "nothing to commit, working tree clean"
   ```

---

## ✅ Summary

Most likely cause: **Corrupted main.py with syntax errors**

Most likely fix: **Restore clean main.py from git**

Quick command:
```bash
cd /opt/petrodealhub/document-processor && git checkout HEAD -- main.py && source venv/bin/activate && python3 -m py_compile main.py && pm2 restart python-api && sleep 5 && curl http://localhost:8000/health
```
