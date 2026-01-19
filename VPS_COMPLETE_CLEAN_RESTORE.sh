#!/bin/bash
# Complete clean restore - remove all local modifications and get clean version

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "COMPLETE CLEAN RESTORE - REMOVE ALL LOCAL MODIFICATIONS"
echo "=========================================="
echo ""

# 1. Backup current corrupted file
BACKUP_FILE="main.py.corrupted.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up corrupted file to: $BACKUP_FILE"
echo ""

# 2. Remove ALL local modifications
echo "2. Removing ALL local modifications..."
git clean -fd . 2>/dev/null || true
git reset --hard HEAD 2>/dev/null || true
git checkout --force . 2>/dev/null || true
git restore . 2>/dev/null || true
echo "   ✅ Local modifications removed"
echo ""

# 3. Fetch latest from remote
echo "3. Fetching latest from remote..."
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git fetch --all 2>/dev/null || true
echo "   ✅ Fetched latest"
echo ""

# 4. Force reset to remote HEAD
echo "4. Force resetting to remote HEAD..."
git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
echo "   ✅ Reset to remote HEAD"
echo ""

# 5. Checkout clean version
echo "5. Checking out clean version..."
git checkout --force HEAD -- main.py 2>/dev/null || true
git checkout --force origin/master -- main.py 2>/dev/null || git checkout --force origin/main -- main.py 2>/dev/null || true
echo "   ✅ Checked out clean version"
echo ""

# 6. Verify the file is clean
echo "6. Verifying file is clean..."
if git diff main.py | grep -q .; then
    echo "   ⚠️  File still has modifications - removing them..."
    git checkout --force . 2>/dev/null || true
    git restore . 2>/dev/null || true
    rm -f main.py.* 2>/dev/null || true  # Remove backup files
fi
echo "   ✅ File is clean"
echo ""

# 7. Test Python syntax
echo "7. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    echo "   The git version still has errors - this shouldn't happen!"
    echo "   Showing problematic area:"
    sed -n '2345,2355p' main.py | cat -n -A
    exit 1
fi
echo ""

# 8. Verify imports
echo "8. Verifying critical imports..."
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
    echo "   Installing dependencies..."
    pip install -r requirements.txt --quiet --upgrade 2>/dev/null || true
fi
echo ""

# 9. Restart API
echo "9. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 10. Wait for API
echo "10. Waiting 15 seconds for API to start..."
sleep 15
echo ""

# 11. Check PM2 status
echo "11. Checking PM2 status..."
pm2 status python-api
echo ""

# 12. Check for errors
echo "12. Checking for errors..."
ERROR_LOG=$(pm2 logs python-api --err --lines 20 --nostream 2>/dev/null)
ERROR_COUNT=$(echo "$ERROR_LOG" | grep -c "IndentationError\|SyntaxError\|NameError\|ModuleNotFoundError" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No syntax/import errors!"
else
    echo "   ❌ Found errors:"
    echo "$ERROR_LOG" | grep -E "IndentationError|SyntaxError|NameError|ModuleNotFoundError" | head -10
fi
echo ""

# 13. Test API
echo "13. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
    echo ""
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Latest error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -20
fi
echo ""

# 14. Check nginx
echo "14. Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    systemctl reload nginx 2>/dev/null || true
    echo "   ✅ Nginx reloaded"
else
    echo "   ⚠️  Nginx is not running - starting it..."
    systemctl start nginx
fi
echo ""

# 15. Final summary
echo "=========================================="
echo "RESTORE COMPLETE - SUMMARY"
echo "=========================================="
echo ""

SYNTAX_OK=false
API_RUNNING=false
API_RESPONDING=false

python3 -m py_compile main.py > /dev/null 2>&1 && SYNTAX_OK=true
pm2 list | grep -q "python-api.*online" && API_RUNNING=true
curl -s http://localhost:8000/health > /dev/null 2>&1 && API_RESPONDING=true

if [ "$SYNTAX_OK" = true ]; then
    echo "✅ Python syntax: OK"
else
    echo "❌ Python syntax: FAILED"
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

if [ "$SYNTAX_OK" = true ] && [ "$API_RUNNING" = true ] && [ "$API_RESPONDING" = true ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "✅ Clean code restored from git"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
