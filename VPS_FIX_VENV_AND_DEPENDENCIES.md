# Fix Virtual Environment and Dependencies on VPS

## Problem
- PM2 shows `ModuleNotFoundError: No module named 'fastapi'`
- One instance is using corrupted venv at wrong path
- Dependencies not installed in the correct virtual environment

## Solution: Fix Virtual Environment and Install Dependencies

### Step 1: Stop All PM2 Instances

```bash
pm2 stop python-api
pm2 delete python-api
```

### Step 2: Check Current Virtual Environment

```bash
cd /opt/petrodealhub/document-processor

# Check if venv exists
ls -la venv/

# Check if venv/bin/python exists and is valid
ls -la venv/bin/python
file venv/bin/python
```

### Step 3: Recreate Virtual Environment (if corrupted or missing)

```bash
cd /opt/petrodealhub/document-processor

# Remove old venv if corrupted
rm -rf venv

# Create new virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt

# Verify FastAPI is installed
pip list | grep fastapi
```

### Step 4: Verify Virtual Environment is Working

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate

# Test Python can import FastAPI
python -c "from fastapi import FastAPI; print('FastAPI imported successfully')"

# Test main.py can be imported (check for syntax errors)
python -c "import main; print('main.py imported successfully')"
```

### Step 5: Clean Up PM2 and Restart

```bash
# Delete all python-api instances
pm2 delete python-api

# Make sure ecosystem.config.cjs is correct
cd /opt/petrodealhub
cat ecosystem.config.cjs

# Restart using ecosystem config
pm2 start ecosystem.config.cjs

# Or start manually with correct path
cd /opt/petrodealhub/document-processor
pm2 start python --name python-api \
  --interpreter /opt/petrodealhub/document-processor/venv/bin/python \
  -- main.py

# Save PM2 configuration
pm2 save
```

### Step 6: Verify API is Running

```bash
# Check PM2 status
pm2 status

# Check logs (should NOT see ModuleNotFoundError)
pm2 logs python-api --lines 20 --nostream

# Test API
curl http://localhost:8000/health
```

## Alternative: Quick Fix Without Recreating Venv

If the venv exists but just needs dependencies:

```bash
cd /opt/petrodealhub/document-processor
source venv/bin/activate

# Install/upgrade dependencies
pip install --upgrade -r requirements.txt

# Verify
pip list | grep fastapi

# Restart PM2
pm2 restart python-api
```

## Verify Correct Python Path

The ecosystem.config.cjs should use:
```
interpreter: '/opt/petrodealhub/document-processor/venv/bin/python'
```

NOT:
```
interpreter: '/opt/petrodealhub/venv/bin/python'  ❌ Wrong path
```

## Check PM2 Configuration

```bash
# Check what PM2 is actually using
pm2 show python-api | grep interpreter

# If wrong, update ecosystem.config.cjs and restart
pm2 delete python-api
pm2 start ecosystem.config.cjs
pm2 save
```
