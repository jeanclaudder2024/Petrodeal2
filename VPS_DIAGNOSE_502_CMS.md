# 502 Bad Gateway - CMS Not Working - Quick Diagnosis

## The Problem
When accessing CMS, you get **502 Bad Gateway**. This means nginx cannot connect to the Python backend API.

## Most Common Causes (in order):

1. **Backend API is NOT running** (90% of cases)
2. **Backend crashed or stopped**  
3. **Port 8000 not listening**
4. **PM2 service not running**

## Quick Diagnosis Commands (Run on your VPS):

```bash
# 1. Check if backend is running on port 8000
sudo netstat -tuln | grep 8000
# OR
sudo ss -tuln | grep 8000

# 2. Check PM2 processes
pm2 list

# 3. Check if Python API service exists
sudo systemctl status petrodealhub-api

# 4. Test API directly (should work if backend is running)
curl http://localhost:8000/health

# 5. Check backend logs
pm2 logs python-api --lines 50
# OR if using systemd:
sudo journalctl -u petrodealhub-api -n 50
```

## Quick Fix Commands:

```bash
# Option 1: Restart via PM2 (if using PM2)
cd /opt/petrodealhub/document-processor
pm2 restart python-api
pm2 logs python-api --lines 20

# Option 2: Start via PM2 (if not running)
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pm2 start ecosystem.config.js

# Option 3: Restart via systemd (if using systemd service)
sudo systemctl restart petrodealhub-api
sudo systemctl status petrodealhub-api

# Option 4: Manual start (for testing)
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
# (Press Ctrl+C to stop, then use PM2/systemd to run in background)
```

## What to Check:

### ✅ If Port 8000 is LISTENING:
- Backend is running ✓
- Problem might be nginx config or firewall
- Check: `sudo nginx -t` (should show "successful")
- Check: `sudo tail -f /var/log/nginx/error.log`

### ❌ If Port 8000 is NOT LISTENING:
- Backend is NOT running ✗
- **This is your problem!**
- Start the backend using commands above

## Expected Output When Working:

```bash
# Port check should show:
tcp        0      0 0.0.0.0:8000            0.0.0.0:*               LISTEN

# PM2 should show:
┌─────┬──────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ status  │ restart │ uptime   │
├─────┼──────────────┼─────────┼─────────┼──────────┤
│ 0   │ python-api   │ online  │ 0       │ 2h       │
└─────┴──────────────┴─────────┴─────────┴──────────┘

# Health check should return:
{"status":"ok"}
```

## Most Likely Fix:

**90% chance the backend just stopped. Restart it:**

```bash
pm2 restart python-api
# OR
sudo systemctl restart petrodealhub-api
```

Then test: `curl http://localhost:8000/health`
