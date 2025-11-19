# How to Restart the Backend

## Method 1: Using PM2 (Most Common)

### Check if backend is running with PM2:
```bash
pm2 list
```

### Restart the backend:
```bash
# If the process is named "python-api":
pm2 restart python-api

# OR if it's named "petrodealhub-api":
pm2 restart petrodealhub-api

# OR restart all PM2 processes:
pm2 restart all
```

### Check backend status:
```bash
pm2 status
pm2 logs python-api
# OR
pm2 logs petrodealhub-api
```

### Stop the backend:
```bash
pm2 stop python-api
# OR
pm2 stop petrodealhub-api
```

### Start the backend:
```bash
pm2 start python-api
# OR
pm2 start petrodealhub-api
```

---

## Method 2: Using systemd (If using systemd service)

### Check status:
```bash
sudo systemctl status python-api
# OR
sudo systemctl status document-processor
```

### Restart:
```bash
sudo systemctl restart python-api
# OR
sudo systemctl restart document-processor
```

### Stop:
```bash
sudo systemctl stop python-api
```

### Start:
```bash
sudo systemctl start python-api
```

---

## Method 3: Manual Restart (If running directly)

### Find and kill the process:
```bash
# Find the process
ps aux | grep "python.*main.py"
# OR
lsof -i :8000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

### Start manually:
```bash
cd /opt/petrodealhub/document-processor
# OR
cd /opt/aivessel-trade-flow/document-processor

source venv/bin/activate
python main.py
```

---

## Quick Restart Script

Run this on your VPS to restart the backend:

```bash
# Check PM2 first
if pm2 list | grep -q "python-api\|petrodealhub-api"; then
    echo "Restarting backend with PM2..."
    pm2 restart python-api 2>/dev/null || pm2 restart petrodealhub-api
    pm2 save
    echo "Backend restarted!"
    pm2 logs --lines 20 python-api 2>/dev/null || pm2 logs --lines 20 petrodealhub-api
else
    echo "Backend not found in PM2, checking systemd..."
    if systemctl is-active --quiet python-api; then
        sudo systemctl restart python-api
        echo "Backend restarted via systemd!"
    else
        echo "Backend not found. Please check how it's running."
    fi
fi
```

---

## Verify Backend is Running

After restarting, verify it's working:

```bash
# Check if port 8000 is responding
curl http://localhost:8000/health
# OR
curl http://localhost:8000/api/health

# Check PM2 logs
pm2 logs python-api --lines 50
```

