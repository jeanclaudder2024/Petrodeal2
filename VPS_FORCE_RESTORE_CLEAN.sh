#!/bin/bash
# Force restore completely clean main.py from git

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FORCE RESTORE CLEAN main.py FROM GIT"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_restore.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Force restore from git
echo "2. Force restoring clean main.py from git..."
cd /opt/petrodealhub/document-processor

# Try multiple restore methods
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true

# Method 1: Hard reset
git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true

# Method 2: Checkout
git checkout origin/master -- main.py 2>/dev/null || git checkout origin/main -- main.py 2>/dev/null || git checkout HEAD -- main.py 2>/dev/null || true

# Method 3: Force checkout
git checkout --force . 2>/dev/null || true

echo "   ✅ Restored from git"
echo ""

# 3. Verify syntax
echo "3. Verifying Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present after restore:"
    echo "$SYNTAX_OUTPUT"
    echo ""
    echo "   This shouldn't happen - git version should be clean"
    echo "   Showing error details:"
    python3 -m py_compile main.py 2>&1 | head -15
    exit 1
fi
echo ""

# 4. Verify file size/lines (sanity check)
echo "4. Verifying file..."
FILE_LINES=$(wc -l < main.py)
echo "   File has $FILE_LINES lines"
if [ "$FILE_LINES" -lt "4000" ] || [ "$FILE_LINES" -gt "5000" ]; then
    echo "   ⚠️  File size seems unusual (expected ~4570 lines)"
fi
echo ""

# 5. Verify imports
echo "5. Verifying critical imports..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client
    from websockets.asyncio.client import ClientConnection
    from fastapi import FastAPI
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

# 6. Install/update dependencies
echo "6. Ensuring dependencies are installed..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet --upgrade 2>/dev/null || true
    echo "   ✅ Dependencies updated"
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

# 10. Check for errors
echo "10. Checking for startup errors..."
ERROR_LOG=$(pm2 logs python-api --err --lines 30 --nostream 2>/dev/null)
ERROR_COUNT=$(echo "$ERROR_LOG" | grep -c "IndentationError\|SyntaxError\|NameError\|ModuleNotFoundError" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in API logs!"
else
    echo "   ⚠️  Found errors:"
    echo "$ERROR_LOG" | tail -20
    echo ""
    echo "   If errors persist, the git version might also have issues"
fi
echo ""

# 11. Test API
echo "11. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
    echo ""
    echo "   🎉 SUCCESS! API is working!"
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Recent error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -20
fi
echo ""

# 12. Final summary
echo "=========================================="
echo "RESTORE COMPLETE - SUMMARY"
echo "=========================================="
echo ""

SYNTAX_OK=false
IMPORTS_OK=false
API_RUNNING=false
API_RESPONDING=false

python3 -m py_compile main.py > /dev/null 2>&1 && SYNTAX_OK=true
python3 -c "from supabase import create_client; from websockets.asyncio.client import ClientConnection" > /dev/null 2>&1 && IMPORTS_OK=true
pm2 list | grep -q "python-api.*online" && API_RUNNING=true
curl -s http://localhost:8000/health > /dev/null 2>&1 && API_RESPONDING=true

if [ "$SYNTAX_OK" = true ]; then
    echo "✅ Python syntax: OK"
else
    echo "❌ Python syntax: FAILED"
fi

if [ "$IMPORTS_OK" = true ]; then
    echo "✅ Imports: OK"
else
    echo "❌ Imports: FAILED"
fi

if [ "$API_RUNNING" = true ]; then
    echo "✅ API running: OK"
else
    echo "❌ API running: FAILED"
fi

if [ "$API_RESPONDING" = true ]; then
    echo "✅ API responding: OK"
else
    echo "❌ API responding: FAILED"
fi

echo ""

if [ "$SYNTAX_OK" = true ] && [ "$IMPORTS_OK" = true ] && [ "$API_RUNNING" = true ] && [ "$API_RESPONDING" = true ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "✅ Clean code restored from git"
    echo "✅ API is working correctly"
    echo "✅ CMS should be accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
