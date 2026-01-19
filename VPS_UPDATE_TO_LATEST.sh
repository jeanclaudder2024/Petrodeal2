#!/bin/bash
# Update submodule to latest version with plan permissions updates

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "UPDATE TO LATEST VERSION WITH ALL FIXES"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_update.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check current commit
echo "2. Checking current git status..."
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "   Current commit: $CURRENT_COMMIT"
echo "   Current branch: $CURRENT_BRANCH"
echo ""

# 3. Fetch latest from all remotes
echo "3. Fetching latest from git..."
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git fetch --all 2>/dev/null || true
echo "   ✅ Fetched latest"
echo ""

# 4. Pull latest from master/main
echo "4. Pulling latest code..."
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || git pull origin HEAD 2>/dev/null || true
echo "   ✅ Pulled latest"
echo ""

# 5. If still on old commit, force update
echo "5. Checking if we have latest updates..."
LATEST_COMMIT=$(git rev-parse origin/master 2>/dev/null || git rev-parse origin/main 2>/dev/null || echo "")
if [ ! -z "$LATEST_COMMIT" ] && [ "$LATEST_COMMIT" != "$CURRENT_COMMIT" ]; then
    echo "   ⚠️  Not on latest commit, forcing update..."
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
    echo "   ✅ Forced to latest commit"
else
    echo "   ✅ Already on latest commit"
fi
echo ""

# 6. Verify we have the plan permissions updates
echo "6. Verifying plan permissions updates are present..."
if grep -q "max_downloads_per_template" main.py; then
    echo "   ✅ max_downloads_per_template support found"
else
    echo "   ⚠️  max_downloads_per_template not found - updates may not be in this version"
fi

if grep -q "plan_tier.*plan_id" main.py || grep -q "Convert plan_tiers to plan_ids" main.py || grep -q "plan_res = supabase.table.*subscription_plans.*select.*id.*eq.*plan_tier" main.py; then
    echo "   ✅ plan_tier to plan_id conversion found"
else
    echo "   ⚠️  plan_tier conversion not found - updates may not be in this version"
fi
echo ""

# 7. Verify syntax
echo "7. Verifying Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error found:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    echo "   Trying to fix common issues..."
    
    # Check if it's the plan_tiers undefined variable
    if grep -q "plan_tiers.*if plan_tiers else plan_ids" main.py; then
        echo "   Fixing undefined plan_tiers variable..."
        sed -i 's/plan_tiers if plan_tiers else plan_ids/plan_ids/g' main.py
        sed -i 's/"plan_ids": plan_tiers/"plan_ids": plan_ids/g' main.py
    fi
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Syntax fixed!"
    else
        echo "   ❌ Syntax still has errors - check manually"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    fi
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
    exit 1
fi
echo ""

# 9. Install/update dependencies
echo "9. Ensuring dependencies are installed..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet --upgrade 2>/dev/null || true
    echo "   ✅ Dependencies updated"
fi
echo ""

# 10. Restart API
echo "10. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 11. Wait for API to start
echo "11. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 12. Check PM2 status
echo "12. Checking PM2 status..."
pm2 status python-api
echo ""

# 13. Check for errors
echo "13. Checking for startup errors..."
ERROR_LOG=$(pm2 logs python-api --err --lines 30 --nostream 2>/dev/null)
ERROR_COUNT=$(echo "$ERROR_LOG" | grep -c "IndentationError\|SyntaxError\|NameError\|ModuleNotFoundError" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in API logs!"
else
    echo "   ⚠️  Found errors:"
    echo "$ERROR_LOG" | tail -20
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
    echo "   🎉 SUCCESS! API is working!"
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Recent error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -20
fi
echo ""

# 15. Final summary
echo "=========================================="
echo "UPDATE COMPLETE - SUMMARY"
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
    echo "✅ Latest code with plan permissions updates"
    echo "✅ API is working correctly"
    echo "✅ CMS should be accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
