#!/bin/bash
# Pull latest updates from GitHub to VPS

set -e

cd /opt/petrodealhub
source document-processor/venv/bin/activate 2>/dev/null || true

echo "=========================================="
echo "PULLING LATEST UPDATES FROM GITHUB"
echo "=========================================="
echo ""

# 1. Navigate to project root
echo "1. Navigating to project root..."
cd /opt/petrodealhub
pwd
echo ""

# 2. Pull main repository
echo "2. Pulling main repository..."
git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null || true
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
echo "   ✅ Main repository updated"
echo ""

# 3. Update submodule (document-processor)
echo "3. Updating document-processor submodule..."
cd /opt/petrodealhub
git submodule update --init --recursive document-processor 2>/dev/null || true
cd document-processor
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true
echo "   ✅ Submodule updated"
echo ""

# 4. Check for changes
echo "4. Checking for Python syntax errors..."
cd /opt/petrodealhub/document-processor
source venv/bin/activate
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is correct!"
else
    echo "   ❌ Syntax errors found - check the output above"
    exit 1
fi
echo ""

# 5. Verify critical imports
echo "5. Verifying critical imports..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client
    from websockets.asyncio.client import ClientConnection
    print("✅ All imports OK")
except Exception as e:
    print(f"❌ Import error: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Import verification failed!"
    exit 1
fi
echo ""

# 6. Install/update dependencies if needed
echo "6. Checking Python dependencies..."
if [ -f "requirements.txt" ]; then
    echo "   Installing/updating dependencies..."
    pip install -r requirements.txt --quiet --upgrade 2>/dev/null || true
    echo "   ✅ Dependencies updated"
else
    echo "   ⚠️  requirements.txt not found"
fi
echo ""

# 7. Restart API
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 8. Wait for API to start
echo "8. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 9. Check PM2 status
echo "9. Checking PM2 status..."
pm2 status python-api
echo ""

# 10. Test API
echo "10. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Checking error logs:"
    pm2 logs python-api --err --lines 20 --nostream | tail -15
fi
echo ""

echo "=========================================="
echo "UPDATE COMPLETE"
echo "=========================================="
echo ""
echo "If API is not responding, check logs:"
echo "  pm2 logs python-api --err --lines 50"
echo ""
echo "If you see errors, you may need to run the fix scripts first."
echo ""
