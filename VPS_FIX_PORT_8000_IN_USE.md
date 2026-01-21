# Fix Port 8000 Already in Use

## Problem
- PM2 shows: `ERROR: [Errno 98] error while attempting to bind on address ('0.0.0.0', 8000): address already in use`
- API health check works, meaning something else is running on port 8000
- PM2 can't start because the port is occupied

## Solution: Find and Kill Process Using Port 8000

### Step 1: Find What's Using Port 8000

```bash
# Method 1: Using lsof
sudo lsof -i:8000

# Method 2: Using netstat
sudo netstat -tulpn | grep :8000

# Method 3: Using ss
sudo ss -tulpn | grep :8000

# Method 4: Using fuser
sudo fuser 8000/tcp
```

### Step 2: Kill the Process

Once you find the PID (process ID), kill it:

```bash
# Replace <PID> with the actual process ID from step 1
sudo kill -9 <PID>

# Or if you got the PID from lsof, you can do:
sudo lsof -i:8000 | grep LISTEN | awk '{print $2}' | xargs sudo kill -9
```

### Step 3: Verify Port is Free

```bash
# Check port is now free
sudo lsof -i:8000
# Should return nothing

# Or
sudo netstat -tulpn | grep :8000
# Should return nothing
```

### Step 4: Restart PM2

```bash
# Restart the API
pm2 restart python-api

# Or if it's not running
pm2 start ecosystem.config.cjs --only python-api

# Check status
pm2 status python-api

# Check logs
pm2 logs python-api --lines 10 --nostream
```

### Step 5: Verify API is Working

```bash
# Test health endpoint
curl http://localhost:8000/health

# Should return JSON response
```

## Quick One-Liner Fix

Run this to find and kill the process on port 8000:

```bash
# Find and kill process on port 8000
sudo lsof -i:8000 | grep LISTEN | awk '{print $2}' | xargs sudo kill -9 2>/dev/null || echo "No process found on port 8000"

# Wait a moment
sleep 2

# Restart PM2
pm2 restart python-api || pm2 start ecosystem.config.cjs --only python-api

# Check status
sleep 3
pm2 status python-api
curl http://localhost:8000/health
```

## Alternative: Check if It's Another PM2 Instance

Sometimes there are multiple PM2 instances running:

```bash
# List all PM2 processes
pm2 list

# Check all Python processes
ps aux | grep python | grep main.py

# Kill all Python processes running main.py (be careful!)
ps aux | grep "[p]ython.*main.py" | awk '{print $2}' | xargs sudo kill -9
```

## Prevent Future Issues

Make sure only one instance is configured:

```bash
# Check ecosystem.config.cjs
cat ecosystem.config.cjs | grep instances

# Should show: instances: 1

# Save PM2 config
pm2 save
```
