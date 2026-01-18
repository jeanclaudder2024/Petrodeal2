# Diagnose 502 Bad Gateway Error

## What causes 502?
- Backend API is not running
- Backend API crashed
- Backend is taking too long to respond
- Nginx can't reach the backend

## Steps to Fix on Ubuntu VPS:

### 1. Check if Backend Process is Running
```bash
ps aux | grep -E "python|uvicorn" | grep -v grep
```
Expected: Should see `python main.py` or `uvicorn` process

### 2. Check Backend Logs
```bash
# If using systemd service:
sudo journalctl -u document-processor -n 100 --no-pager

# If logs in file:
sudo tail -100 /var/log/app/backend.log

# If running in screen/tmux:
screen -ls
screen -r document-processor
```

### 3. Try to Reach Backend Directly
```bash
# From VPS, test if backend is listening:
curl -s http://localhost:8000/health || curl -s http://localhost:8000/ || echo "Backend not responding"

# Check what ports are listening:
sudo netstat -tlnp | grep 8000
# or
sudo ss -tlnp | grep 8000
```

### 4. Restart Backend
```bash
# If using systemd:
sudo systemctl restart document-processor

# If using PM2:
pm2 restart all

# If using supervisor:
sudo supervisorctl restart document-processor

# Manual restart:
cd /path/to/document-processor
pkill -f "python main.py"
python main.py &  # or with nohup for persistence
```

### 5. Check Nginx Configuration
```bash
# Test nginx config:
sudo nginx -t

# Restart nginx:
sudo systemctl restart nginx

# Check nginx error log:
sudo tail -50 /var/log/nginx/error.log

# Check nginx access log:
sudo tail -50 /var/log/nginx/access.log
```

### 6. View Current Backend Listening Address
```bash
# From backend startup output, should show:
# "Uvicorn running on http://0.0.0.0:8000"

# Or check in nginx config at /etc/nginx/sites-enabled/petrodealhub:
grep -A 5 "upstream" /etc/nginx/sites-enabled/petrodealhub
```

### 7. Full Restart Sequence
```bash
# 1. Stop backend
pkill -f "python main.py" || true
sleep 2

# 2. Stop nginx
sudo systemctl stop nginx
sleep 1

# 3. Start backend
cd /path/to/aivessel-trade-flow-main/document-processor
python main.py > /var/log/app/backend.log 2>&1 &
sleep 3

# 4. Start nginx
sudo systemctl start nginx
sleep 1

# 5. Test:
curl -s http://petrodealhub.com/api/templates | head -20 || echo "Still failing"
```

## Common Issues:

| Issue | Solution |
|-------|----------|
| Port 8000 already in use | `sudo lsof -i :8000` then kill the process |
| Permissions denied | Use `sudo` or check file ownership |
| Module not found | Reinstall: `pip install -r requirements.txt` |
| Supabase connection failed | Check `.env` file and SUPABASE_URL/SUPABASE_KEY |
| High memory usage | Check for infinite loops, restart backend |

## Quick Health Check Script
```bash
#!/bin/bash
echo "=== Backend Health Check ==="
echo "1. Process running?"
ps aux | grep -c "python main.py" | grep -q 2 && echo "✓ Backend running" || echo "✗ Backend NOT running"

echo "2. Port 8000 open?"
netstat -tlnp 2>/dev/null | grep -q 8000 && echo "✓ Port 8000 listening" || echo "✗ Port 8000 NOT listening"

echo "3. Responding to HTTP?"
curl -s http://localhost:8000/health 2>&1 | grep -q "200\|success" && echo "✓ Backend responding" || echo "✗ Backend NOT responding"

echo "4. Nginx configured?"
sudo nginx -t 2>&1 | grep -q "successful" && echo "✓ Nginx OK" || echo "✗ Nginx config error"
```

Save as `health-check.sh`, run with `bash health-check.sh`
