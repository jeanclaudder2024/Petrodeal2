# 502 Bad Gateway - Quick Fix for CMS

## 🔴 Problem: 
**502 Bad Gateway** when opening CMS = **Backend API is NOT running on port 8000**

## ✅ Solution (Most Likely):

### Step 1: Check if backend is running
```bash
curl http://localhost:8000/health
```

**If you get:** `Connection refused` or `curl: (7) Failed to connect`
→ **Backend is NOT running** ← THIS IS YOUR PROBLEM

**If you get:** `{"status":"ok"}`  
→ Backend is running, problem is elsewhere (nginx config, etc.)

---

### Step 2: Check what's managing the backend

```bash
# Check PM2 (most common)
pm2 list

# Check systemd service
sudo systemctl status petrodealhub-api
```

---

### Step 3: Restart the backend

**If using PM2:**
```bash
cd /opt/petrodealhub/document-processor
pm2 restart python-api
pm2 logs python-api --lines 20
```

**If using systemd:**
```bash
sudo systemctl restart petrodealhub-api
sudo systemctl status petrodealhub-api
```

**If neither works, start manually:**
```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pm2 start ecosystem.config.js
```

---

## 📋 Full Diagnostic Commands:

```bash
# 1. Is port 8000 in use?
sudo netstat -tuln | grep 8000

# 2. Test API directly
curl http://localhost:8000/health

# 3. Check PM2
pm2 list
pm2 logs python-api --lines 30

# 4. Check systemd (if using service)
sudo systemctl status petrodealhub-api

# 5. Check nginx can reach backend
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 Most Common Fix (90% of cases):

```bash
# Just restart the backend:
pm2 restart python-api

# Then verify it works:
curl http://localhost:8000/health
```

**If curl works but CMS still shows 502:**
```bash
# Reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## ❌ Common Causes:

1. **Backend crashed/stopped** (most common - 90%)
   - Fix: `pm2 restart python-api`

2. **Port conflict** (another process on 8000)
   - Check: `sudo lsof -i:8000`
   - Fix: Kill conflicting process

3. **Python syntax error** (code error prevents startup)
   - Check: `pm2 logs python-api` for errors
   - Fix: Check recent code changes

4. **Missing dependencies** (import errors)
   - Fix: `cd /opt/petrodealhub/document-processor && source venv/bin/activate && pip install -r requirements.txt`

---

## ✅ Verify It's Fixed:

```bash
# Should return: {"status":"ok"}
curl http://localhost:8000/health

# Then open CMS in browser - should work now!
```
