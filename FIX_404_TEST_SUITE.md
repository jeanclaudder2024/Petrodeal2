# Fix 404 Error for Test Suite

## Problem
Getting 404 error when accessing: `https://control.petrodealhub.com//cms/test-ai-random-data.html`

## Solution

### Step 1: Deploy File to VPS

The file `test-ai-random-data.html` needs to be on your VPS. Run these commands:

```bash
# SSH into your VPS
ssh root@control.petrodealhub.com

# Navigate to project directory
cd /opt/petrodealhub

# Pull latest changes
git pull origin main

# Update submodule (document-processor)
git submodule update --init --recursive

# Navigate to document-processor
cd document-processor

# Pull latest changes from submodule
git pull origin master

# Verify file exists
ls -la cms/test-ai-random-data.html

# If file exists, restart the service
# Check how your service is running:
ps aux | grep "python.*main.py"

# If using PM2:
pm2 restart document-processor

# If using systemd (if configured):
sudo systemctl restart document-processor

# If manual process, find and restart:
# Find the process
ps aux | grep "python.*main.py"
# Kill it (replace PID with actual process ID)
kill -9 <PID>
# Restart (adjust path as needed)
cd /opt/petrodealhub/document-processor
source venv/bin/activate  # if using venv
python main.py &
```

### Step 2: Verify File is Accessible

After restarting, test the URL:
```bash
# Test from VPS
curl http://localhost:8000/cms/test-ai-random-data.html

# Should return HTML content, not 404
```

### Step 3: Check URL Format

Make sure you're using the correct URL:
- ✅ Correct: `https://control.petrodealhub.com/cms/test-ai-random-data.html`
- ❌ Wrong: `https://control.petrodealhub.com//cms/test-ai-random-data.html` (double slash)

### Step 4: Check Static Files Mount

Verify that FastAPI is serving static files correctly. Check `main.py`:

```python
app.mount("/cms", StaticFiles(directory=CMS_DIR, html=True), name="cms")
```

The `CMS_DIR` should point to `/opt/petrodealhub/document-processor/cms`

### Step 5: Check File Permissions

```bash
# On VPS, check permissions
ls -la /opt/petrodealhub/document-processor/cms/

# Should show:
# -rw-r--r-- test-ai-random-data.html

# If permissions are wrong:
chmod 644 /opt/petrodealhub/document-processor/cms/test-ai-random-data.html
```

## Quick Fix Commands

```bash
# One-liner to update and restart
cd /opt/petrodealhub && \
git pull origin main && \
git submodule update --init --recursive && \
cd document-processor && \
git pull origin master && \
ls -la cms/test-ai-random-data.html && \
echo "File exists! Now restart your service."
```

## Troubleshooting

### If file still not found after deployment:

1. **Check file location:**
   ```bash
   find /opt/petrodealhub -name "test-ai-random-data.html"
   ```

2. **Check FastAPI logs:**
   ```bash
   # If using PM2
   pm2 logs document-processor
   
   # If using systemd
   sudo journalctl -u document-processor -f
   
   # If manual, check console output
   ```

3. **Test static file serving:**
   ```bash
   curl http://localhost:8000/cms/index.html
   # If this works but test-ai-random-data.html doesn't, file might not be deployed
   ```

4. **Check CMS_DIR path:**
   ```python
   # In main.py, verify:
   BASE_DIR = os.path.dirname(os.path.abspath(__file__))
   CMS_DIR = os.path.join(BASE_DIR, 'cms')
   # Should resolve to: /opt/petrodealhub/document-processor/cms
   ```

## Expected Result

After deployment, accessing:
- `https://control.petrodealhub.com/cms/test-ai-random-data.html`

Should show the test suite interface, not a 404 error.

