# How to Restart Your API

## Quick Restart Commands

### Method 1: Using PM2 (Recommended)

**Restart the Python API:**

```bash
pm2 restart python-api
```

**Or if it's not running, start it:**

```bash
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
```

**Check status:**

```bash
pm2 status
```

**Check if API is responding:**

```bash
curl http://localhost:8000/health
```

---

### Method 2: Stop and Start

**Stop the API:**

```bash
pm2 stop python-api
```

**Start the API:**

```bash
pm2 start python-api
```

**Or delete and recreate:**

```bash
pm2 delete python-api
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
```

---

### Method 3: Start Manually (For Testing)

**Start manually to see errors:**

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
```

Press `Ctrl+C` to stop.

---

## Complete Restart Procedure

**If you want to completely restart everything:**

```bash
# 1. Stop the API
pm2 stop python-api

# 2. Check status
pm2 status

# 3. Start the API
pm2 start python-api

# 4. Wait a few seconds
sleep 5

# 5. Test if it's working
curl http://localhost:8000/health
```

---

## One-Line Quick Restart

**Copy and paste this:**

```bash
cd /opt/petrodealhub/document-processor && pm2 restart python-api && sleep 3 && curl http://localhost:8000/health && echo "✅ API is running!" || echo "❌ Check logs: pm2 logs python-api --err"
```

---

## Common PM2 Commands

```bash
# List all processes
pm2 list

# Restart API
pm2 restart python-api

# Stop API
pm2 stop python-api

# Start API
pm2 start python-api

# Delete API (remove from PM2)
pm2 delete python-api

# View logs
pm2 logs python-api

# View error logs only
pm2 logs python-api --err

# View last 50 error lines
pm2 logs python-api --err --lines 50

# Monitor (real-time)
pm2 monit

# Save PM2 configuration
pm2 save

# Restart all processes
pm2 restart all
```

---

## If API Won't Start

**Check logs for errors:**

```bash
pm2 logs python-api --err --lines 50
```

**Try starting manually to see the error:**

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Restart API | `pm2 restart python-api` |
| Start API | `pm2 start python-api` |
| Stop API | `pm2 stop python-api` |
| Check status | `pm2 status` |
| View logs | `pm2 logs python-api` |
| Test API | `curl http://localhost:8000/health` |
