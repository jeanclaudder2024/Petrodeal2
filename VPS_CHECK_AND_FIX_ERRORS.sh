#!/bin/bash
# Check API errors and fix them

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "CHECKING API ERRORS AND FIXING"
echo "=========================================="
echo ""

# 1. Check error logs
echo "1. Checking API error logs..."
pm2 logs python-api --err --lines 30 --nostream
echo ""

# 2. Test Python syntax
echo "2. Testing Python syntax..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is correct!"
else
    echo "   ❌ Syntax errors found - attempting to fix..."
    SYNTAX_ERROR=$(python3 -m py_compile main.py 2>&1 | head -5)
    echo "$SYNTAX_ERROR"
    echo ""
    
    # Try to fix common issues
    if echo "$SYNTAX_ERROR" | grep -q "line 2350\|line 2351\|line 2352"; then
        echo "   Found line 2350 issue - trying to fix..."
        
        # Run the section restore script
        if [ -f "VPS_RESTORE_SECTION_COMPLETE.sh" ]; then
            ./VPS_RESTORE_SECTION_COMPLETE.sh
        else
            echo "   Downloading fix script..."
            curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_RESTORE_SECTION_COMPLETE.sh 2>/dev/null || true
            chmod +x VPS_RESTORE_SECTION_COMPLETE.sh 2>/dev/null || true
            if [ -f "VPS_RESTORE_SECTION_COMPLETE.sh" ]; then
                ./VPS_RESTORE_SECTION_COMPLETE.sh
            fi
        fi
    else
        echo "   Unknown syntax error - attempting git restore..."
        cd /opt/petrodealhub/document-processor
        git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
        git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
        git checkout --force . 2>/dev/null || true
    fi
    
    # Test again
    echo ""
    echo "   Testing syntax again..."
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Syntax fixed!"
    else
        echo "   ❌ Still has errors - check manually"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    fi
fi
echo ""

# 3. Verify imports
echo "3. Verifying critical imports..."
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

# 4. Restart API
echo "4. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 5. Wait and check
echo "5. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 6. Check status
echo "6. Checking PM2 status..."
pm2 status python-api
echo ""

# 7. Check for errors again
echo "7. Checking for startup errors..."
ERROR_COUNT=$(pm2 logs python-api --err --lines 10 --nostream 2>/dev/null | grep -c "IndentationError\|SyntaxError\|ModuleNotFoundError" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in API logs!"
else
    echo "   ⚠️  Found errors:"
    pm2 logs python-api --err --lines 20 --nostream | tail -15
fi
echo ""

# 8. Test API
echo "8. Testing API..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is not responding yet"
    echo ""
    echo "   Recent error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -20
fi
echo ""

echo "=========================================="
echo "CHECK COMPLETE"
echo "=========================================="
echo ""
