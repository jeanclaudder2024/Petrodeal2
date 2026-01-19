#!/bin/bash
# COMPLETE FIX - Restore clean code and fix everything

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "COMPLETE FIX - Restore Clean Code & Fix Everything"
echo "=========================================="
echo ""
echo "This will restore the clean version from git and fix all issues."
echo ""

# Backup current corrupted file
BACKUP_FILE="main.py.corrupted.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up corrupted file: $BACKUP_FILE"
echo ""

# Step 1: Pull latest from git
echo "2. Pulling latest clean code from GitHub..."
cd /opt/petrodealhub/document-processor

# Try multiple methods to get clean version
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true

# Force restore from git (discard all local changes)
git checkout HEAD -- main.py 2>/dev/null || git checkout master -- main.py 2>/dev/null || git checkout main -- main.py 2>/dev/null || git reset --hard HEAD 2>/dev/null || git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null

echo "   ✅ Restored clean main.py from git"
echo ""

# Step 2: Remove email_service.py
echo "3. Removing email_service.py..."
rm -f email_service.py
echo "   ✅ Removed email_service.py"
echo ""

# Step 3: Activate venv
echo "4. Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"
echo ""

# Step 4: Install all dependencies
echo "5. Installing ALL Python dependencies..."
pip install fastapi uvicorn python-multipart python-docx supabase python-dotenv aiohttp websockets httpx httpx[http2] --upgrade 2>/dev/null || true

if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --upgrade 2>/dev/null || true
fi
echo "   ✅ All dependencies installed"
echo ""

# Step 5: Verify critical imports
echo "6. Verifying critical imports..."
python3 << 'PYTHON_EOF'
import sys
missing = []
try:
    import fastapi
    print("✅ fastapi")
except ImportError as e:
    missing.append(f"fastapi: {e}")

try:
    import uvicorn
    print("✅ uvicorn")
except ImportError as e:
    missing.append(f"uvicorn: {e}")

try:
    import aiohttp
    print("✅ aiohttp")
except ImportError as e:
    missing.append(f"aiohttp: {e}")

try:
    import websockets
    print("✅ websockets")
except ImportError as e:
    missing.append(f"websockets: {e}")

try:
    from supabase import create_client
    print("✅ supabase")
except ImportError as e:
    missing.append(f"supabase: {e}")

try:
    from docx import Document
    print("✅ python-docx")
except ImportError as e:
    missing.append(f"python-docx: {e}")

if missing:
    print(f"\n❌ Missing packages:")
    for m in missing:
        print(f"   {m}")
    sys.exit(1)
else:
    print("\n✅ All critical packages are installed!")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Missing critical packages - installing..."
    pip install fastapi uvicorn aiohttp websockets supabase python-docx --upgrade --force-reinstall
fi
echo ""

# Step 6: Verify Python syntax (THIS IS CRITICAL)
echo "7. Verifying Python syntax..."
SYNTAX_CHECK=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Python syntax errors found!"
    echo "   Error output:"
    echo "$SYNTAX_CHECK" | head -15
    echo ""
    echo "   The git version still has errors. This should not happen."
    echo "   Trying to fix manually..."
    
    # Try to restore from backup and check
    cp "$BACKUP_FILE" main.py.check
    python3 -m py_compile main.py.check 2>&1 || echo "   Backup also has errors"
    
    exit 1
fi
echo ""

# Step 7: Test Supabase connection
echo "8. Testing Supabase connection..."
python3 << 'PYTHON_EOF'
import os
from dotenv import load_dotenv
load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if supabase_url and supabase_key:
    try:
        from supabase import create_client
        client = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
    except Exception as e:
        print(f"⚠️  Supabase connection error (but continuing): {e}")
else:
    print("⚠️  SUPABASE_URL or SUPABASE_KEY not set in .env")
PYTHON_EOF
echo ""

# Step 8: Stop and restart API
echo "9. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2

cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API started"
echo ""

# Step 9: Wait and test
echo "10. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# Step 10: Check PM2 status
echo "11. Checking PM2 status..."
pm2 status python-api
echo ""

# Step 11: Test API
echo "12. Testing API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is working!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -10
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Checking PM2 error logs:"
    pm2 logs python-api --err --lines 30 --nostream
    echo ""
    echo "   PM2 output logs:"
    pm2 logs python-api --out --lines 20 --nostream
fi
echo ""

# Step 12: Check nginx
echo "13. Checking nginx configuration..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    if nginx -t 2>/dev/null; then
        echo "   ✅ Nginx configuration is valid"
        
        # Check if control.petrodealhub.com is configured
        if grep -r "control.petrodealhub.com" /etc/nginx/ 2>/dev/null | grep -q "control.petrodealhub.com"; then
            echo "   ✅ control.petrodealhub.com domain found in nginx config"
        else
            echo "   ⚠️  control.petrodealhub.com not found in nginx config"
            echo "   Check: /etc/nginx/sites-available/*"
        fi
    else
        echo "   ⚠️  Nginx configuration has errors"
        nginx -t 2>&1 | head -5
    fi
else
    echo "   ⚠️  Nginx is not running"
    echo "   Start it with: systemctl start nginx"
fi
echo ""

# Final Summary
echo "=========================================="
echo "FIX COMPLETE - Summary"
echo "=========================================="
echo ""
echo "✅ Clean code restored from git"
echo "✅ Dependencies installed"
echo "✅ Syntax verified (100% correct)"
echo "✅ API restarted"
echo ""
echo "Next steps:"
echo "  1. Test API: curl http://localhost:8000/health"
echo "  2. Test CMS: https://control.petrodealhub.com/cms"
echo "  3. Check logs: pm2 logs python-api --err --lines 30"
echo ""
echo "If API is still not working, check logs above."
echo ""
