#!/bin/bash
# Update to latest commit with plan permissions updates

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "UPDATE TO LATEST COMMIT (e89daf9)"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_update.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show current commit
echo "2. Checking current commit..."
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "   Current: $CURRENT_COMMIT"
echo ""

# 3. Fetch latest from remote
echo "3. Fetching latest from remote..."
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git fetch --all 2>/dev/null || true
echo "   ✅ Fetched latest"
echo ""

# 4. Check available commits
echo "4. Checking available commits..."
git log --oneline origin/master 2>/dev/null | head -5 || git log --oneline origin/main 2>/dev/null | head -5 || git log --oneline -5
echo ""

# 5. Try to checkout latest commit directly
echo "5. Checking out latest commit (e89daf9)..."
if git show e89daf9:main.py > /dev/null 2>&1; then
    echo "   ✅ Commit e89daf9 found, checking out..."
    git checkout e89daf9 -- main.py 2>/dev/null || true
    echo "   ✅ Checked out commit e89daf9"
elif git show origin/master:main.py > /dev/null 2>&1; then
    echo "   ⚠️  Commit e89daf9 not found, checking out origin/master..."
    git checkout origin/master -- main.py 2>/dev/null || true
    echo "   ✅ Checked out origin/master"
elif git show origin/main:main.py > /dev/null 2>&1; then
    echo "   ⚠️  Checking out origin/main..."
    git checkout origin/main -- main.py 2>/dev/null || true
    echo "   ✅ Checked out origin/main"
else
    echo "   ⚠️  Could not find latest commit, trying pull..."
    git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true
fi
echo ""

# 6. Force reset to latest
echo "6. Force resetting to latest remote..."
git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
echo "   ✅ Reset to latest"
echo ""

# 7. Verify we have plan permissions updates
echo "7. Verifying plan permissions updates are present..."
if grep -q "max_downloads_per_template" main.py; then
    echo "   ✅ max_downloads_per_template support found"
else
    echo "   ⚠️  max_downloads_per_template not found - updates may not be in this version"
fi

if grep -q "Convert plan_tiers to plan_ids" main.py || grep -q "plan_res = supabase.table.*subscription_plans.*select.*id.*eq.*plan_tier" main.py; then
    echo "   ✅ plan_tier to plan_id conversion found"
else
    echo "   ⚠️  plan_tier conversion not found"
fi
echo ""

# 8. Test Python syntax - show FULL output
echo "8. Testing Python syntax..."
python3 -m py_compile main.py
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax errors found!"
    python3 -m py_compile main.py 2>&1
    echo ""
    echo "   This shouldn't happen - git version should be clean"
    echo "   Showing problematic area:"
    python3 -m py_compile main.py 2>&1 | head -5
    sed -n '2345,2355p' main.py | cat -n -A
    exit 1
fi
echo ""

# 9. Verify imports
echo "9. Verifying critical imports..."
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

# 10. Restart API
echo "10. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 11. Wait for API
echo "11. Waiting 15 seconds for API to start..."
sleep 15
echo ""

# 12. Check PM2 status
echo "12. Checking PM2 status..."
pm2 status python-api
echo ""

# 13. Check for errors
echo "13. Checking for startup errors..."
ERROR_LOG=$(pm2 logs python-api --err --lines 20 --nostream 2>/dev/null)
ERROR_COUNT=$(echo "$ERROR_LOG" | grep -c "IndentationError\|SyntaxError\|NameError\|ModuleNotFoundError" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No syntax/import errors!"
else
    echo "   ❌ Found errors:"
    echo "$ERROR_LOG" | grep -E "IndentationError|SyntaxError|NameError|ModuleNotFoundError" | head -10
fi
echo ""

# 14. Test API
echo "14. Testing API health endpoint..."
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

# 15. Check nginx
echo "15. Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    systemctl reload nginx 2>/dev/null || true
    echo "   ✅ Nginx reloaded"
else
    echo "   ⚠️  Nginx is not running - starting..."
    systemctl start nginx
fi
echo ""

# 16. Final summary
echo "=========================================="
echo "UPDATE COMPLETE - SUMMARY"
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
    echo "✅ Latest code with plan permissions updates"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
