# Fix Port 8000 and .env Encoding Issues

## Problem
- **Port 8000 already in use**: API can't start because another process is using port 8000
- **.env file encoding error**: UTF-8 decode error at byte 884 (file might be corrupted or wrong encoding)

## Solution

### Step 1: Find and Kill Process Using Port 8000

```bash
# Find what's using port 8000
sudo lsof -i :8000
# OR
sudo netstat -tlnp | grep :8000
# OR
sudo ss -tlnp | grep :8000

# Kill the process (replace PID with the actual process ID from above)
sudo kill -9 <PID>

# If it's a Python process, you can also do:
sudo pkill -f "python.*main.py"
sudo pkill -f "uvicorn.*main:app"
```

### Step 2: Stop PM2 App (to prevent restart loop)

```bash
# Stop the python-api app
pm2 stop python-api

# Or delete it if it's in a bad state
pm2 delete python-api
```

### Step 3: Fix .env File Encoding

```bash
cd /opt/petrodealhub/document-processor

# Backup the current .env file
cp .env .env.backup

# Check file encoding
file .env
# If it shows UTF-16 or something else, we need to convert it

# Option A: Recreate .env from backup (if you have a clean version)
# OR

# Option B: Convert encoding (if file is UTF-16 or has BOM)
# Remove BOM and convert to UTF-8
sed -i '1s/^\xEF\xBB\xBF//' .env  # Remove UTF-8 BOM if present
iconv -f UTF-16 -t UTF-8 .env > .env.utf8 && mv .env.utf8 .env

# OR

# Option C: Recreate .env manually (safest)
# Create a new .env file with proper encoding
cat > .env << 'EOF'
# Document Processor Environment Variables
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
OPENAI_API_KEY=your_openai_key_here_if_needed
DOCUMENT_PROCESSOR_DATA_DIR=/opt/petrodealhub/document-processor/data
EOF

# Make sure it's UTF-8
file .env
# Should show: .env: ASCII text or .env: UTF-8 Unicode text
```

### Step 4: Verify Port 8000 is Free

```bash
# Check again
sudo lsof -i :8000
# Should return nothing

# If something is still there, kill it more aggressively
sudo fuser -k 8000/tcp
```

### Step 5: Restart API with PM2

```bash
cd /opt/petrodealhub/document-processor

# If you have ecosystem.config.cjs, use it:
pm2 start ecosystem.config.cjs --only python-api

# OR if you start it manually:
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name python-api

# OR if you have a start script:
pm2 start start.sh --name python-api

# Save PM2 config
pm2 save
```

### Step 6: Verify It's Running

```bash
# Check PM2 status
pm2 status

# Check logs (should NOT see port errors)
pm2 logs python-api --lines 20

# Test the API
curl http://localhost:8000/health
```

## Alternative: If PM2 Config is Wrong

If PM2 keeps restarting and causing issues, check your PM2 config:

```bash
# Check PM2 ecosystem config
cat ecosystem.config.cjs

# Make sure it's not set to auto-restart on error
# Or set max_restarts to prevent infinite loops
```

## Quick One-Liner Fix (if you're confident)

```bash
# Kill everything on port 8000, fix .env, restart
sudo fuser -k 8000/tcp && \
cd /opt/petrodealhub/document-processor && \
cp .env .env.backup && \
sed -i '1s/^\xEF\xBB\xBF//' .env && \
pm2 delete python-api 2>/dev/null; \
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name python-api && \
pm2 save
```

## Prevention

1. **Check PM2 config**: Make sure `max_restarts` is set (e.g., 5) to prevent infinite loops
2. **Monitor logs**: `pm2 logs python-api` to catch issues early
3. **Use proper .env encoding**: Always create .env files as UTF-8 without BOM
