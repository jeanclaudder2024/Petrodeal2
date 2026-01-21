# Fix PM2 Python Interpreter Issue

## Problem
- API is actually working (health endpoint responds)
- PM2 shows process as "errored"
- Error: `SyntaxError: source code cannot contain null bytes` with "ELF" message
- This means PM2 is trying to execute the Python binary as a script

## Solution: Fix PM2 Configuration

### Step 1: Check What's Actually Running

```bash
# Check what process is using port 8000
sudo lsof -i:8000

# Or
netstat -tulpn | grep :8000

# Check if Python is running
ps aux | grep "[p]ython.*main.py"
```

### Step 2: Stop Everything and Clean Up

```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Kill any Python processes on port 8000
sudo lsof -i:8000 | grep LISTEN | awk '{print $2}' | xargs sudo kill -9 2>/dev/null || true
```

### Step 3: Verify Python Interpreter

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate

# Test Python works
python --version
which python

# Test main.py can run
python -c "import main; print('OK')"
```

### Step 4: Fix PM2 Configuration

The issue is likely in `ecosystem.config.cjs`. Update it to use the correct format:

```bash
cd /opt/petrodealhub
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'python-api',
      cwd: '/opt/petrodealhub/document-processor',
      script: 'main.py',
      interpreter: '/opt/petrodealhub/document-processor/venv/bin/python',
      interpreter_args: '',
      env: {
        FASTAPI_PORT: 8000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/python-api-error.log',
      out_file: '/var/log/pm2/python-api-out.log',
      log_file: '/var/log/pm2/python-api.log'
    },
    {
      name: 'react-app',
      cwd: '/opt/petrodealhub/src',
      script: 'serve',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/react-app-error.log',
      out_file: '/var/log/pm2/react-app-out.log',
      log_file: '/var/log/pm2/react-app.log'
    }
  ]
};
EOF
```

### Step 5: Start PM2 Correctly

```bash
# Start using ecosystem config
pm2 start ecosystem.config.cjs --only python-api

# Or start manually with explicit paths
cd /opt/petrodealhub/document-processor
pm2 start /opt/petrodealhub/document-processor/venv/bin/python \
  --name python-api \
  --interpreter none \
  -- main.py

# Save configuration
pm2 save
```

### Step 6: Verify It's Working

```bash
# Wait a few seconds
sleep 5

# Check PM2 status
pm2 status

# Check logs
pm2 logs python-api --lines 20 --nostream

# Test API
curl http://localhost:8000/health
```

## Alternative: Use Direct Python Command

If PM2 continues to have issues, use this format:

```bash
pm2 delete python-api
cd /opt/petrodealhub/document-processor
pm2 start "venv/bin/python main.py" \
  --name python-api \
  --interpreter bash \
  --cwd /opt/petrodealhub/document-processor
pm2 save
```

## Quick Fix Command

Run this all at once:

```bash
pm2 delete python-api
cd /opt/petrodealhub/document-processor
pm2 start "venv/bin/python main.py" \
  --name python-api \
  --interpreter bash \
  --cwd /opt/petrodealhub/document-processor \
  --env FASTAPI_PORT=8000
pm2 save
sleep 3
pm2 status python-api
curl http://localhost:8000/health
```
