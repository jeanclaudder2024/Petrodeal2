#!/bin/bash
# Quick verify syntax and start API

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "QUICK VERIFY AND START API"
echo "=========================================="
echo ""

# 1. Test syntax - show full output
echo "1. Testing Python syntax..."
python3 -m py_compile main.py
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -15
    exit 1
fi
echo ""

# 2. Verify imports
echo "2. Verifying imports..."
python3 -c "from supabase import create_client; from websockets.asyncio.client import ClientConnection; print('✅ All imports OK')" 2>&1
if [ $? -ne 0 ]; then
    echo "   ❌ Import error!"
    exit 1
fi
echo ""

# 3. Restart API
echo "3. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 4. Wait
echo "4. Waiting 10 seconds..."
sleep 10
echo ""

# 5. Check status
echo "5. Checking PM2 status..."
pm2 status python-api
echo ""

# 6. Check errors
echo "6. Checking for errors..."
ERROR_LOG=$(pm2 logs python-api --err --lines 20 --nostream 2>/dev/null)
if echo "$ERROR_LOG" | grep -q "IndentationError\|SyntaxError"; then
    echo "   ❌ Found syntax errors:"
    echo "$ERROR_LOG" | grep "IndentationError\|SyntaxError" | head -5
else
    echo "   ✅ No syntax errors in logs!"
fi
echo ""

# 7. Test API
echo "7. Testing API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -3
    echo ""
    echo "   🎉 SUCCESS! Everything is working!"
    echo "   ✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "   ❌ API not responding"
    echo "   Recent errors:"
    pm2 logs python-api --err --lines 30 --nostream | tail -15
fi
echo ""
