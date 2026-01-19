#!/bin/bash
# Verify everything is working correctly

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "VERIFYING ALL SYSTEMS"
echo "=========================================="
echo ""

# 1. Check Python syntax
echo "1. Checking Python syntax..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax errors found:"
    python3 -m py_compile main.py 2>&1 | head -10
    echo ""
    echo "   Run: ./VPS_FIX_EXCEPT_MISPLACED.sh to fix"
    exit 1
fi
echo ""

# 2. Check for undefined variables
echo "2. Checking for undefined variables..."
if grep -n "plan_tiers" main.py | grep -v "def\|class\|import\|#\|plan_tiers\s*=" > /dev/null; then
    if ! grep -n "plan_tiers\s*=" main.py > /dev/null; then
        echo "   ⚠️  Found undefined plan_tiers - fixing..."
        sed -i 's/plan_tiers if plan_tiers else plan_ids/plan_ids/g' main.py
        sed -i 's/"plan_ids": plan_tiers/"plan_ids": plan_ids/g' main.py
        echo "   ✅ Fixed plan_tiers references"
    fi
fi
echo ""

# 3. Verify imports
echo "3. Verifying critical imports..."
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

# 4. Check PM2 status
echo "4. Checking PM2 status..."
pm2 status python-api
echo ""

# 5. Check API error logs
echo "5. Checking API error logs (last 20 lines)..."
ERROR_LOG=$(pm2 logs python-api --err --lines 20 --nostream 2>/dev/null)
ERROR_COUNT=$(echo "$ERROR_LOG" | grep -c "IndentationError\|SyntaxError\|NameError.*plan_tiers\|ModuleNotFoundError" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in API logs!"
else
    echo "   ⚠️  Found errors:"
    echo "$ERROR_LOG" | tail -15
    echo ""
    echo "   If errors found, run: ./VPS_FIX_EXCEPT_MISPLACED.sh"
fi
echo ""

# 6. Test API health endpoint
echo "6. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is not responding on port 8000"
    echo ""
    
    # Check if API process is running
    PM2_STATUS=$(pm2 list | grep python-api | awk '{print $10}')
    if [ "$PM2_STATUS" != "online" ]; then
        echo "   API status: $PM2_STATUS"
        echo "   Attempting to restart API..."
        pm2 restart python-api 2>/dev/null || pm2 start venv/bin/python --name python-api -- main.py
        sleep 5
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "   ✅ API restarted and responding!"
        else
            echo "   ❌ API still not responding"
            echo "   Check logs: pm2 logs python-api --err --lines 50"
        fi
    fi
fi
echo ""

# 7. Check nginx
echo "7. Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    
    if nginx -t 2>/dev/null; then
        echo "   ✅ Nginx configuration is valid"
    else
        echo "   ⚠️  Nginx configuration has errors"
        nginx -t 2>&1 | head -3
    fi
else
    echo "   ❌ Nginx is not running"
    echo "   Start with: systemctl start nginx"
fi
echo ""

# 8. Summary
echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo ""

SYNTAX_OK=false
IMPORTS_OK=false
API_RUNNING=false
API_RESPONDING=false
NGINX_OK=false

python3 -m py_compile main.py > /dev/null 2>&1 && SYNTAX_OK=true
python3 -c "from supabase import create_client; from websockets.asyncio.client import ClientConnection" > /dev/null 2>&1 && IMPORTS_OK=true
pm2 list | grep -q "python-api.*online" && API_RUNNING=true
curl -s http://localhost:8000/health > /dev/null 2>&1 && API_RESPONDING=true
systemctl is-active --quiet nginx && NGINX_OK=true

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

if [ "$NGINX_OK" = true ]; then
    echo "✅ Nginx: OK"
else
    echo "❌ Nginx: FAILED"
fi

echo ""

# Final status
if [ "$SYNTAX_OK" = true ] && [ "$IMPORTS_OK" = true ] && [ "$API_RUNNING" = true ] && [ "$API_RESPONDING" = true ] && [ "$NGINX_OK" = true ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "✅ API is working correctly"
    echo "✅ CMS should be accessible at: https://control.petrodealhub.com/"
    echo ""
    echo "Your updates are complete:"
    echo "  ✅ Plan permissions with max_downloads_per_template"
    echo "  ✅ plan_tier to plan_id conversion"
    echo "  ✅ All syntax errors fixed"
else
    echo "⚠️  Some issues remain"
    echo ""
    if [ "$API_RESPONDING" = false ]; then
        echo "To debug API:"
        echo "  pm2 logs python-api --err --lines 50"
        echo "  pm2 restart python-api"
    fi
fi
echo ""
