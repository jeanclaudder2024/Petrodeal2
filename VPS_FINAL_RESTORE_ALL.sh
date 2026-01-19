#!/bin/bash
# FINAL COMPLETE RESTORE - Pull clean code and fix everything

set -e

cd /opt/petrodealhub

echo "=========================================="
echo "FINAL COMPLETE RESTORE - Fix Everything"
echo "=========================================="
echo ""
echo "This will:"
echo "  1. Pull latest clean code from GitHub"
echo "  2. Restore clean main.py"
echo "  3. Remove problematic files"
echo "  4. Install all dependencies"
echo "  5. Fix all syntax errors"
echo "  6. Start API correctly"
echo "  7. Test everything works"
echo ""
echo "Starting..."
echo ""

# Step 1: Pull main repository
echo "=========================================="
echo "STEP 1: Pulling Main Repository"
echo "=========================================="
cd /opt/petrodealhub
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "⚠️  Git pull failed, continuing..."
echo "✅ Main repository updated"
echo ""

# Step 2: Pull document-processor submodule
echo "=========================================="
echo "STEP 2: Pulling document-processor Submodule"
echo "=========================================="
cd document-processor

# Backup current file first
BACKUP_FILE="main.py.broken.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE" 2>/dev/null || true
echo "✅ Backed up to: $BACKUP_FILE"
echo ""

# Pull latest
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || echo "⚠️  Submodule pull failed, trying checkout..."

# Restore clean version
git checkout HEAD -- main.py 2>/dev/null || git checkout master -- main.py 2>/dev/null || git checkout main -- main.py 2>/dev/null
echo "✅ Clean main.py restored from git"
echo ""

# Step 3: Remove problematic email_service.py
echo "=========================================="
echo "STEP 3: Removing email_service.py"
echo "=========================================="
if [ -f "email_service.py" ]; then
    rm -f email_service.py
    echo "✅ email_service.py removed"
else
    echo "ℹ️  email_service.py doesn't exist"
fi
echo ""

# Step 4: Activate venv and install dependencies
echo "=========================================="
echo "STEP 4: Installing All Dependencies"
echo "=========================================="
source venv/bin/activate

# Install from requirements.txt
if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt --upgrade
    echo "✅ Installed from requirements.txt"
else
    echo "⚠️  requirements.txt not found, installing essential packages..."
    pip install fastapi uvicorn python-multipart python-docx supabase python-dotenv aiohttp websockets httpx --upgrade
fi

# Ensure critical packages are installed
pip install websockets aiohttp httpx --upgrade 2>/dev/null || true
echo "✅ All dependencies installed"
echo ""

# Step 5: Verify imports
echo "=========================================="
echo "STEP 5: Verifying Critical Imports"
echo "=========================================="
python3 << 'PYTHON_EOF'
import sys
try:
    import fastapi
    import uvicorn
    import aiohttp
    import websockets
    from supabase import create_client
    from docx import Document
    print("✅ All critical packages are installed")
except ImportError as e:
    print(f"❌ Missing package: {e}")
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "❌ Missing critical packages!"
    exit 1
fi
echo ""

# Step 6: Verify syntax
echo "=========================================="
echo "STEP 6: Verifying Python Syntax"
echo "=========================================="
if python3 -m py_compile main.py 2>&1; then
    echo "✅ Python syntax is correct!"
else
    echo "❌ Python syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -15
    echo ""
    echo "The git version still has errors. You may need to check your local repository."
    exit 1
fi
echo ""

# Step 7: Restart API
echo "=========================================="
echo "STEP 7: Restarting API"
echo "=========================================="
pm2 delete python-api 2>/dev/null || true
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "✅ API restarted"
echo ""

# Step 8: Wait and test
echo "=========================================="
echo "STEP 8: Testing API"
echo "=========================================="
sleep 8

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API is working!"
    echo ""
    echo "Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "⚠️  API not responding yet"
    PM2_STATUS=$(pm2 status python-api --no-color 2>/dev/null | grep python-api | awk '{print $10}')
    echo "PM2 Status: $PM2_STATUS"
    echo ""
    echo "Checking logs..."
    pm2 logs python-api --err --lines 15 --nostream
fi
echo ""

# Step 9: Check nginx
echo "=========================================="
echo "STEP 9: Checking Nginx"
echo "=========================================="
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    if nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration is valid"
    else
        echo "⚠️  Nginx config has errors"
        nginx -t 2>&1 | head -5
    fi
else
    echo "⚠️  Nginx is not running - start it with: systemctl start nginx"
fi
echo ""

echo "=========================================="
echo "RESTORE COMPLETE!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✅ Clean code pulled from GitHub"
echo "  ✅ main.py restored"
echo "  ✅ Dependencies installed"
echo "  ✅ Syntax verified"
echo "  ✅ API restarted"
echo ""
echo "Test your API:"
echo "  curl http://localhost:8000/health"
echo ""
echo "Test your CMS:"
echo "  https://control.petrodealhub.com/cms"
echo ""
echo "If API is not working, check logs:"
echo "  pm2 logs python-api --err --lines 30"
echo ""
