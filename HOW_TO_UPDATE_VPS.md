# How to Update VPS with Latest Changes

## Quick Update (Recommended)

Run this single command on your VPS:

```bash
cd /opt/petrodealhub/document-processor && curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_PULL_UPDATE.sh && chmod +x VPS_PULL_UPDATE.sh && ./VPS_PULL_UPDATE.sh
```

## What This Script Does

1. ✅ Pulls latest changes from main repository
2. ✅ Updates document-processor submodule
3. ✅ Verifies Python syntax
4. ✅ Checks critical imports
5. ✅ Updates Python dependencies
6. ✅ Restarts API automatically
7. ✅ Tests API health endpoint

## Manual Update Steps (If Script Fails)

### Step 1: Update Main Repository
```bash
cd /opt/petrodealhub
git pull origin main
```

### Step 2: Update Submodule
```bash
cd /opt/petrodealhub
git submodule update --init --recursive document-processor
cd document-processor
git pull origin master
```

### Step 3: Verify Syntax
```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python3 -m py_compile main.py
```

### Step 4: Restart API
```bash
pm2 restart python-api
# OR if it's not running:
pm2 start venv/bin/python --name python-api -- main.py
```

### Step 5: Verify API is Working
```bash
curl http://localhost:8000/health
pm2 status python-api
pm2 logs python-api --err --lines 30
```

## Troubleshooting

### If "submodule update" fails:
```bash
cd /opt/petrodealhub/document-processor
git fetch origin master
git reset --hard origin/master
```

### If syntax errors occur:
```bash
# Check what's wrong
cd /opt/petrodealhub/document-processor
python3 -m py_compile main.py 2>&1 | head -20

# Or restore from git
git checkout .
git reset --hard HEAD
```

### If API won't start:
```bash
# Check error logs
pm2 logs python-api --err --lines 50

# Try starting manually to see errors
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python main.py
```

### If imports are missing:
```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

## Summary

**Easiest way:** Run the one-line command at the top of this document.

The script handles everything automatically and will restart your API with the latest changes.
