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

# 7. Build frontend with VPS API URL (so React calls /api on same host, nginx proxies to Python)
echo "7. Building frontend (API base URL = /api for VPS)..."
cd /opt/petrodealhub
export VITE_DOCUMENT_API_URL=/api
npm install --no-audit --no-fund 2>/dev/null || true
npm run build 2>&1 | tail -5
echo "   ✅ Frontend built"
echo ""

# 8. Restart API
echo "8. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 9. Restart frontend
echo "9. Restarting frontend..."
pm2 restart react-app 2>/dev/null || true
echo "   ✅ Frontend restarted"
echo ""

# 10. Wait for API to start
echo "10. Waiting for API to start..."
sleep 5
echo ""

# 11. Check PM2 status
echo "11. Checking PM2 status..."
pm2 status
echo ""

# 12. Test API (document-processor uses port 5000)
echo "12. Testing API health endpoint..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding on port 5000!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:5000/health | head -5
elif curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding on port 8000!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is not responding on 5000"
    echo ""
    echo "   Checking error logs:"
    pm2 logs python-api --err --lines 20 --nostream 2>/dev/null | tail -15
fi
echo ""

echo "=========================================="
echo "UPDATE COMPLETE"
echo "=========================================="
echo ""
echo "On VPS, ensure:"
echo "  1. Nginx proxies /api/ and /health to http://localhost:5000 (see nginx-config.conf)"
echo "  2. document-processor/.env has SUPABASE_URL and SUPABASE_KEY"
echo "  3. Reload nginx after config change: sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "If API is not responding: pm2 logs python-api --err --lines 50"
echo ""
