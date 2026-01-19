#!/bin/bash
# Fix websockets.asyncio module error

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIXING websockets.asyncio MODULE ERROR"
echo "=========================================="
echo ""

# 1. Pull latest requirements.txt
echo "1. Pulling latest requirements.txt from GitHub..."
cd /opt/petrodealhub
git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null || true
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
cd /opt/petrodealhub/document-processor
echo "   ✅ Pulled latest code"
echo ""

# 2. Install compatible websockets version
echo "2. Installing compatible websockets version (>=13.0)..."
pip install "websockets>=13.0" --upgrade --force-reinstall
echo "   ✅ websockets installed"
echo ""

# 3. Install compatible Supabase packages (ensure all match version 2.27.2)
echo "3. Ensuring Supabase packages are compatible (2.27.2)..."
pip install "supabase==2.27.2" "realtime==2.27.2" "postgrest==2.27.2" "storage3==2.27.2" --upgrade --force-reinstall
echo "   ✅ Supabase packages updated"
echo ""

# 4. Install aiohttp (required for newer Supabase)
echo "4. Installing aiohttp..."
pip install "aiohttp>=3.8.0" --upgrade
echo "   ✅ aiohttp installed"
echo ""

# 5. Verify websockets.asyncio is available
echo "5. Verifying websockets.asyncio module..."
python3 << 'PYTHON_EOF'
try:
    from websockets.asyncio.client import ClientConnection
    print("✅ websockets.asyncio.client is available!")
except ImportError as e:
    print(f"❌ Error: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ websockets.asyncio.client verification failed!"
    echo "   Trying to install websockets 15.0.1 explicitly..."
    pip install "websockets==15.0.1" --upgrade --force-reinstall
    
    python3 << 'PYTHON_EOF'
try:
    from websockets.asyncio.client import ClientConnection
    print("✅ websockets.asyncio.client is now available!")
except ImportError as e:
    print(f"❌ Still failing: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Still failing - check Python version compatibility"
        exit 1
    fi
fi
echo ""

# 6. Test Supabase import
echo "6. Testing Supabase import..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client, Client
    print("✅ Supabase import successful!")
except Exception as e:
    print(f"❌ Supabase import failed: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Supabase import failed!"
    exit 1
fi
echo ""

# 7. Verify Python syntax
echo "7. Verifying Python syntax..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Python syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi
echo ""

# 8. Restart API
echo "8. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 9. Wait and check
echo "9. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 10. Check PM2 status
echo "10. Checking PM2 status..."
pm2 status python-api
echo ""

# 11. Check for errors
echo "11. Checking API error logs..."
ERROR_COUNT=$(pm2 logs python-api --err --lines 5 --nostream 2>/dev/null | grep -c "ModuleNotFoundError\|Traceback" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in recent logs!"
else
    echo "   ⚠️  Found errors in logs:"
    pm2 logs python-api --err --lines 10 --nostream | tail -5
fi
echo ""

# 12. Test API
echo "12. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API is NOT responding yet"
    echo "   Check logs: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "If API is still not working:"
echo "  - Check logs: pm2 logs python-api --err --lines 50"
echo "  - Check status: pm2 status python-api"
echo "  - Restart manually: pm2 restart python-api"
echo ""
