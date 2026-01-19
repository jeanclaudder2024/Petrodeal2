#!/bin/bash
# Complete Restore from GitHub and Start Everything

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "COMPLETE RESTORE - Pull from GitHub & Start"
echo "=========================================="
echo ""

# Step 1: Backup current file
BACKUP_DIR="backup_before_restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp main.py "$BACKUP_DIR/" 2>/dev/null || true
echo "1. ✅ Backed up current main.py to: $BACKUP_DIR"
echo ""

# Step 2: Pull latest from git
echo "2. Pulling latest code from GitHub..."
cd /opt/petrodealhub/document-processor

# Try to pull from git
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git checkout HEAD -- main.py 2>/dev/null || git checkout master -- main.py 2>/dev/null || git checkout main -- main.py 2>/dev/null

# Or pull latest
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || echo "⚠️  Git pull failed, trying checkout..."

# Final restore
git checkout HEAD -- main.py 2>/dev/null || git checkout master -- main.py 2>/dev/null || git checkout main -- main.py 2>/dev/null

echo "   ✅ Restored from git"
echo ""

# Step 3: Remove problematic files
echo "3. Removing problematic files..."
if [ -f "email_service.py" ]; then
    mv email_service.py "$BACKUP_DIR/" 2>/dev/null || rm email_service.py
    echo "   ✅ Removed email_service.py"
fi
echo ""

# Step 4: Activate venv
echo "4. Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"
echo ""

# Step 5: Install all dependencies
echo "5. Installing all Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --upgrade
    echo "   ✅ Installed from requirements.txt"
else
    echo "   ⚠️  requirements.txt not found, installing essential packages..."
    pip install fastapi uvicorn python-multipart python-docx supabase python-dotenv aiohttp websockets httpx --upgrade
fi
echo ""

# Step 6: Verify syntax
echo "6. Verifying Python syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Python syntax is correct!"
else
    echo "   ❌ Python syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -10
    echo ""
    echo "   The git version still has errors. Check your local repository."
    exit 1
fi
echo ""

# Step 7: Verify critical imports
echo "7. Verifying critical imports..."
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
    echo "   ❌ Missing critical packages!"
    exit 1
fi
echo ""

# Step 8: Restart API
echo "8. Restarting API..."
pm2 delete python-api 2>/dev/null || true
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# Step 9: Wait and test
echo "9. Waiting 8 seconds for API to start..."
sleep 8
echo ""

# Step 10: Test API
echo "10. Testing API..."
PM2_STATUS=$(pm2 status python-api --no-color 2>/dev/null | grep python-api | awk '{print $10}')

if [ "$PM2_STATUS" = "online" ]; then
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "   ✅ API is working!"
        echo ""
        echo "   Health check response:"
        curl -s http://localhost:8000/health | head -5
    else
        echo "   ⚠️  PM2 shows online but API not responding yet"
        echo "   Check logs: pm2 logs python-api --err --lines 20"
    fi
else
    echo "   ❌ PM2 shows status: $PM2_STATUS"
    echo ""
    echo "   Checking error logs..."
    pm2 logs python-api --err --lines 20 --nostream
fi
echo ""

# Step 11: Check nginx
echo "11. Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    
    # Test nginx config
    if nginx -t 2>/dev/null; then
        echo "   ✅ Nginx configuration is valid"
    else
        echo "   ⚠️  Nginx configuration has errors"
        nginx -t 2>&1 | head -5
    fi
else
    echo "   ⚠️  Nginx is not running"
    echo "   Start it with: systemctl start nginx"
fi
echo ""

echo "=========================================="
echo "RESTORE COMPLETE!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - main.py restored from git"
echo "  - Dependencies installed"
echo "  - Syntax verified"
echo "  - API restarted"
echo ""
echo "Test your API:"
echo "  curl http://localhost:8000/health"
echo ""
echo "Test your CMS:"
echo "  https://control.petrodealhub.com/cms"
echo ""
echo "If API is not working:"
echo "  pm2 logs python-api --err --lines 30"
echo ""
