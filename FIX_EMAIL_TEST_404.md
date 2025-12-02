# Fix Email Test Connection 404 Error

## Problem
Getting 404 error when clicking "Test Connection" button for SMTP/IMAP.

## Quick Fixes

### 1. Check if Python Backend is Running

On your VPS, run:
```bash
# Check if Python API is running
pm2 list
# OR
ps aux | grep "python.*main.py"

# Check if port 8000 is listening
sudo netstat -tlnp | grep 8000
# OR
curl http://localhost:8000/health
```

If not running, start it:
```bash
cd /opt/petrodealhub
pm2 restart python-api
# OR
pm2 restart all
```

### 2. Check Nginx Proxy Configuration

Verify nginx is proxying `/api/` correctly:
```bash
# Test the proxy
curl http://localhost/api/health
# Should return: {"status":"healthy",...}

# Check nginx config
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Pull Latest Code and Restart

```bash
cd /opt/petrodealhub
git pull origin main
pm2 restart python-api
# OR restart all
pm2 restart all
```

### 4. Check Browser Console

Open browser DevTools (F12) → Network tab:
1. Click "Test Connection"
2. Look for the request to `/api/email/test-smtp`
3. Check the response status and error message

### 5. Test Endpoint Directly

Test if the endpoint exists:
```bash
# From VPS
curl -X POST http://localhost:8000/email/test-smtp \
  -H "Content-Type: application/json" \
  -d '{"host":"smtp.hostinger.com","port":587,"username":"test","password":"test","enableTLS":true}'

# Should return JSON response (even if connection fails)
```

### 6. Check Python Backend Logs

```bash
# View PM2 logs
pm2 logs python-api

# OR if using systemd
sudo journalctl -u document-processor -f
```

Look for errors when you click "Test Connection".

## Common Issues

### Issue 1: Python Backend Not Running
**Solution:** Start it with PM2 or systemd

### Issue 2: Nginx Not Proxying Correctly
**Solution:** Check nginx config has:
```nginx
location /api/ {
    proxy_pass http://localhost:8000/;
    ...
}
```

### Issue 3: Endpoint Not Registered
**Solution:** Make sure you pulled latest code and restarted backend

### Issue 4: CORS Error (not 404)
**Solution:** Already fixed with OPTIONS handlers

## Expected Behavior

When you click "Test Connection":
1. Frontend calls: `/api/email/test-smtp`
2. Nginx proxies to: `http://localhost:8000/email/test-smtp`
3. Python backend responds with: `{"success": true/false, "message": "..."}`

## Still Not Working?

Run this diagnostic script on your VPS:

```bash
#!/bin/bash
echo "=== Checking Python Backend ==="
curl -s http://localhost:8000/health || echo "❌ Backend not responding on port 8000"

echo ""
echo "=== Checking Nginx Proxy ==="
curl -s http://localhost/api/health || echo "❌ Nginx proxy not working"

echo ""
echo "=== Checking Email Endpoint ==="
curl -s -X POST http://localhost:8000/email/test-smtp \
  -H "Content-Type: application/json" \
  -d '{"host":"test","port":587,"username":"test","password":"test","enableTLS":true}' \
  || echo "❌ Email endpoint not found"

echo ""
echo "=== PM2 Status ==="
pm2 list
```

Save as `test-email-endpoint.sh`, make executable (`chmod +x test-email-endpoint.sh`), and run it.

