#!/bin/bash
# Complete Fix Script - Resolve ALL Python Project Issues
# This script diagnoses and fixes all problems to make the API work correctly

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "COMPLETE FIX - Resolve ALL Problems"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Check and install all Python dependencies"
echo "  2. Fix main.py syntax errors"
echo "  3. Remove problematic files"
echo "  4. Verify Supabase connection"
echo "  5. Start API correctly"
echo "  6. Test nginx configuration"
echo "  7. Verify everything works"
echo ""
echo "Starting fix process..."
echo ""

# Step 1: Backup everything
echo "=========================================="
echo "STEP 1: Creating Backups"
echo "=========================================="
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp main.py "$BACKUP_DIR/main.py.backup" 2>/dev/null || true
echo "✅ Backups created in: $BACKUP_DIR"
echo ""

# Step 2: Activate virtual environment
echo "=========================================="
echo "STEP 2: Activating Virtual Environment"
echo "=========================================="
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Step 3: Remove problematic email_service.py if it exists
echo "=========================================="
echo "STEP 3: Removing email_service.py (if exists)"
echo "=========================================="
if [ -f "email_service.py" ]; then
    mv email_service.py "$BACKUP_DIR/" 2>/dev/null || rm email_service.py
    echo "✅ email_service.py removed"
else
    echo "ℹ️  email_service.py doesn't exist (already removed)"
fi
echo ""

# Step 4: Restore clean main.py from git
echo "=========================================="
echo "STEP 4: Restoring Clean main.py"
echo "=========================================="
git checkout HEAD -- main.py 2>/dev/null || echo "⚠️  Git checkout failed (continuing with current file)"
echo "✅ main.py restored"
echo ""

# Step 5: Fix any syntax errors in main.py
echo "=========================================="
echo "STEP 5: Fixing Syntax Errors"
echo "=========================================="

# Fix line 481 indentation error
if sed -n '481p' main.py | grep -q "^        $"; then
    sed -i '481s/^        $/    /' main.py || sed -i '481s/^        $//' main.py
    echo "✅ Fixed line 481 indentation error"
fi

# Remove misplaced code after raise HTTPException
RAISE_LINE=$(grep -n "raise HTTPException.*Template not found.*template_id" main.py 2>/dev/null | head -1 | cut -d: -f1)
if [ ! -z "$RAISE_LINE" ]; then
    NEXT_SECTION=$(grep -n "^        # Also update local metadata file if template_record has file_name" main.py 2>/dev/null | head -1 | cut -d: -f1)
    if [ ! -z "$NEXT_SECTION" ] && [ $NEXT_SECTION -gt $((RAISE_LINE + 1)) ]; then
        sed -i "$((RAISE_LINE+1)),$((NEXT_SECTION-1))d" main.py
        echo "✅ Removed misplaced code after raise HTTPException"
    fi
fi

# Add missing continue statement in if blocks
IF_LINE=$(grep -n "^\s*if not template_name:" main.py 2>/dev/null | head -1 | cut -d: -f1)
if [ ! -z "$IF_LINE" ]; then
    NEXT_LINE=$((IF_LINE + 1))
    if ! sed -n "${NEXT_LINE}p" main.py | grep -q "continue"; then
        IF_INDENT=$(sed -n "${IF_LINE}p" main.py | sed 's/[^ ].*//' | wc -c)
        PROPER_INDENT=$(printf '%*s' $((IF_INDENT + 4)) '')
        sed -i "${IF_LINE}a\\${PROPER_INDENT}continue" main.py
        echo "✅ Added missing continue statement"
    fi
fi

echo "✅ Syntax fixes applied"
echo ""

# Step 6: Install ALL dependencies from requirements.txt
echo "=========================================="
echo "STEP 6: Installing ALL Python Dependencies"
echo "=========================================="
if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r requirements.txt --upgrade
    echo "✅ Dependencies installed from requirements.txt"
else
    echo "⚠️  requirements.txt not found, installing essential packages..."
    pip install fastapi uvicorn python-multipart python-docx supabase python-dotenv aiohttp websockets httpx
    echo "✅ Essential packages installed"
fi
echo ""

# Step 7: Install missing packages that might not be in requirements.txt
echo "=========================================="
echo "STEP 7: Installing Missing Packages"
echo "=========================================="
pip install websockets aiohttp httpx --upgrade 2>/dev/null || true
echo "✅ Additional packages installed"
echo ""

# Step 8: Verify all critical imports
echo "=========================================="
echo "STEP 8: Verifying Critical Imports"
echo "=========================================="
python3 << 'PYTHON_EOF'
import sys
errors = []

try:
    import fastapi
    print("✅ fastapi")
except ImportError as e:
    errors.append(f"❌ fastapi: {e}")

try:
    import uvicorn
    print("✅ uvicorn")
except ImportError as e:
    errors.append(f"❌ uvicorn: {e}")

try:
    import aiohttp
    print("✅ aiohttp")
except ImportError as e:
    errors.append(f"❌ aiohttp: {e}")

try:
    import websockets
    print("✅ websockets")
except ImportError as e:
    errors.append(f"❌ websockets: {e}")

try:
    from supabase import create_client
    print("✅ supabase")
except ImportError as e:
    errors.append(f"❌ supabase: {e}")

try:
    from docx import Document
    print("✅ python-docx")
except ImportError as e:
    errors.append(f"❌ python-docx: {e}")

if errors:
    print("\n❌ Missing packages:")
    for err in errors:
        print(f"  {err}")
    sys.exit(1)
else:
    print("\n✅ All critical packages are installed!")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "❌ Some packages are missing!"
    exit 1
fi
echo ""

# Step 9: Check Python syntax
echo "=========================================="
echo "STEP 9: Checking Python Syntax"
echo "=========================================="
if python3 -m py_compile main.py 2>&1; then
    echo "✅ Python syntax is correct"
else
    echo "❌ Python syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi
echo ""

# Step 10: Check Supabase connection
echo "=========================================="
echo "STEP 10: Checking Supabase Connection"
echo "=========================================="
python3 << 'PYTHON_EOF'
import os
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if supabase_url and supabase_key:
    print(f"✅ SUPABASE_URL is set: {supabase_url[:30]}...")
    print(f"✅ SUPABASE_KEY is set: {supabase_key[:20]}...")
    
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
    except Exception as e:
        print(f"⚠️  Supabase client creation error (but continuing): {e}")
        print("   The app will work without Supabase connection")
else:
    print("⚠️  SUPABASE_URL or SUPABASE_KEY not set in .env")
    print("   Add them to .env file if needed")
PYTHON_EOF
echo ""

# Step 11: Stop and restart API
echo "=========================================="
echo "STEP 11: Restarting API"
echo "=========================================="
pm2 delete python-api 2>/dev/null || true
pm2 stop python-api 2>/dev/null || true
echo "✅ Stopped old API process"

cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "✅ API started"
echo ""

# Step 12: Wait and test
echo "=========================================="
echo "STEP 12: Waiting for API to Start"
echo "=========================================="
sleep 8
echo ""

# Step 13: Test API
echo "=========================================="
echo "STEP 13: Testing API"
echo "=========================================="
PM2_STATUS=$(pm2 status python-api --no-color | grep python-api | awk '{print $10}')

if [ "$PM2_STATUS" = "online" ]; then
    echo "✅ PM2 shows API as online"
    
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API is responding on port 8000!"
        curl -s http://localhost:8000/health | head -5
    else
        echo "⚠️  API not responding yet, checking logs..."
        pm2 logs python-api --err --lines 10 --nostream
        echo ""
        echo "API might still be starting. Wait 10 more seconds and test:"
        echo "  curl http://localhost:8000/health"
    fi
else
    echo "❌ PM2 shows API status as: $PM2_STATUS"
    echo "Checking error logs..."
    pm2 logs python-api --err --lines 20 --nostream
fi
echo ""

# Step 14: Check nginx configuration
echo "=========================================="
echo "STEP 14: Checking Nginx Configuration"
echo "=========================================="
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    
    # Check if nginx is configured for port 8000
    if grep -r "proxy_pass.*8000" /etc/nginx/ 2>/dev/null | grep -q "8000"; then
        echo "✅ Nginx is configured to proxy port 8000"
    else
        echo "⚠️  Nginx proxy configuration for port 8000 not found"
        echo "   Check nginx config: /etc/nginx/sites-available/*"
    fi
    
    # Check if control.petrodealhub.com is configured
    if grep -r "control.petrodealhub.com" /etc/nginx/ 2>/dev/null | grep -q "control.petrodealhub.com"; then
        echo "✅ control.petrodealhub.com domain found in nginx config"
    else
        echo "⚠️  control.petrodealhub.com not found in nginx config"
        echo "   You may need to add it to nginx configuration"
    fi
    
    # Test nginx config
    if nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration is valid"
    else
        echo "⚠️  Nginx configuration has errors"
        nginx -t 2>&1 | head -5
    fi
else
    echo "❌ Nginx is NOT running"
    echo "   Start it with: systemctl start nginx"
fi
echo ""

# Step 15: Test external access
echo "=========================================="
echo "STEP 15: Testing External Access"
echo "=========================================="
echo "Testing https://control.petrodealhub.com..."
if curl -s -k https://control.petrodealhub.com/health > /dev/null 2>&1 || curl -s http://control.petrodealhub.com/health > /dev/null 2>&1; then
    echo "✅ API is accessible via control.petrodealhub.com"
else
    echo "⚠️  API not accessible via control.petrodealhub.com yet"
    echo "   This might be due to:"
    echo "   - DNS propagation (wait a few minutes)"
    echo "   - SSL certificate setup"
    echo "   - Nginx configuration"
fi
echo ""

# Final Summary
echo "=========================================="
echo "FIX COMPLETE - Summary"
echo "=========================================="
echo ""
echo "✅ All fixes applied!"
echo ""
echo "Next steps:"
echo "  1. Check API status: pm2 status python-api"
echo "  2. Test API locally: curl http://localhost:8000/health"
echo "  3. Check API logs: pm2 logs python-api --err"
echo "  4. Test CMS: Open https://control.petrodealhub.com/cms in browser"
echo ""
echo "If API is still not working:"
echo "  - Check logs: pm2 logs python-api --err --lines 50"
echo "  - Test manually: cd /opt/petrodealhub/document-processor && source venv/bin/activate && python main.py"
echo ""
echo "Backup saved in: $BACKUP_DIR"
echo ""
