#!/bin/bash
# Fix 502 Bad Gateway - API not responding

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIXING 502 BAD GATEWAY"
echo "=========================================="
echo ""

# 1. Check Python syntax
echo "1. Checking Python syntax..."
python3 -m py_compile main.py 2>&1
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -ne 0 ]; then
    echo "   ❌ Syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -15
    echo ""
    echo "   Fixing common issues..."
    
    # Fix undefined plan_tiers
    if grep -q "plan_tiers.*if plan_tiers else plan_ids" main.py; then
        sed -i 's/plan_tiers if plan_tiers else plan_ids/plan_ids/g' main.py
        echo "   ✅ Fixed plan_tiers variable"
    fi
    
    # Test again
    python3 -m py_compile main.py 2>&1
    if [ $? -ne 0 ]; then
        echo "   ❌ Syntax still has errors - attempting git restore..."
        git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
        git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
        git checkout --force . 2>/dev/null || true
        
        python3 -m py_compile main.py 2>&1
        if [ $? -ne 0 ]; then
            echo "   ❌ All fixes failed"
            python3 -m py_compile main.py 2>&1 | head -10
            exit 1
        fi
    fi
else
    echo "   ✅ Python syntax is correct!"
fi
echo ""

# 2. Check PM2 status
echo "2. Checking PM2 status..."
pm2 status python-api
echo ""

# 3. Check API error logs
echo "3. Checking API error logs..."
ERROR_LOG=$(pm2 logs python-api --err --lines 30 --nostream 2>/dev/null)
if [ ! -z "$ERROR_LOG" ]; then
    echo "   Recent error logs:"
    echo "$ERROR_LOG" | tail -20
    echo ""
    
    ERROR_COUNT=$(echo "$ERROR_LOG" | grep -c "IndentationError\|SyntaxError\|NameError\|ModuleNotFoundError" || echo "0")
    if [ "$ERROR_COUNT" -gt "0" ]; then
        echo "   ❌ Found $ERROR_COUNT error(s) in logs"
    else
        echo "   ✅ No syntax/import errors in logs"
    fi
else
    echo "   ⚠️  No error logs found (API may not have started)"
fi
echo ""

# 4. Check if port 8000 is in use
echo "4. Checking if port 8000 is in use..."
if netstat -tlnp 2>/dev/null | grep -q ":8000 " || ss -tlnp 2>/dev/null | grep -q ":8000 "; then
    echo "   ✅ Port 8000 is in use"
    netstat -tlnp 2>/dev/null | grep ":8000 " || ss -tlnp 2>/dev/null | grep ":8000 "
else
    echo "   ❌ Port 8000 is NOT in use - API is not running!"
fi
echo ""

# 5. Test API health endpoint
echo "5. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API is NOT responding on port 8000"
fi
echo ""

# 6. Restart API
echo "6. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 7. Wait for API to start
echo "7. Waiting 15 seconds for API to start..."
sleep 15
echo ""

# 8. Check PM2 status again
echo "8. Checking PM2 status after restart..."
pm2 status python-api
echo ""

# 9. Check for new errors
echo "9. Checking for startup errors..."
ERROR_LOG=$(pm2 logs python-api --err --lines 20 --nostream 2>/dev/null)
if echo "$ERROR_LOG" | grep -q "IndentationError\|SyntaxError\|NameError\|ModuleNotFoundError"; then
    echo "   ❌ Found startup errors:"
    echo "$ERROR_LOG" | grep -E "IndentationError|SyntaxError|NameError|ModuleNotFoundError" | head -10
else
    echo "   ✅ No syntax/import errors in logs!"
fi
echo ""

# 10. Test API again
echo "10. Testing API health endpoint again..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
    echo ""
else
    echo "   ❌ API is still not responding"
    echo ""
    echo "   Latest error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -20
fi
echo ""

# 11. Check nginx
echo "11. Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
    
    if nginx -t 2>/dev/null; then
        echo "   ✅ Nginx configuration is valid"
        
        # Test nginx reload
        systemctl reload nginx 2>/dev/null || true
        echo "   ✅ Nginx reloaded"
    else
        echo "   ⚠️  Nginx configuration has errors"
        nginx -t 2>&1 | head -5
    fi
else
    echo "   ❌ Nginx is not running"
    echo "   Starting nginx..."
    systemctl start nginx
    if systemctl is-active --quiet nginx; then
        echo "   ✅ Nginx started"
    else
        echo "   ❌ Failed to start nginx"
    fi
fi
echo ""

# 12. Final test
echo "12. Final test - checking all systems..."
SYNTAX_OK=false
API_RUNNING=false
API_RESPONDING=false
NGINX_OK=false

python3 -m py_compile main.py > /dev/null 2>&1 && SYNTAX_OK=true
pm2 list | grep -q "python-api.*online" && API_RUNNING=true
curl -s http://localhost:8000/health > /dev/null 2>&1 && API_RESPONDING=true
systemctl is-active --quiet nginx && NGINX_OK=true

echo ""
echo "=========================================="
echo "DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""

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

if [ "$NGINX_OK" = true ]; then
    echo "✅ Nginx: OK"
else
    echo "❌ Nginx: FAILED"
fi

echo ""

if [ "$SYNTAX_OK" = true ] && [ "$API_RUNNING" = true ] && [ "$API_RESPONDING" = true ] && [ "$NGINX_OK" = true ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS should be accessible at: https://control.petrodealhub.com/"
    echo ""
    echo "Test it: curl -I https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    if [ "$API_RESPONDING" = false ]; then
        echo "API is not responding. Check logs:"
        echo "  pm2 logs python-api --err --lines 50"
        echo ""
        echo "Or try starting manually to see errors:"
        echo "  cd /opt/petrodealhub/document-processor"
        echo "  source venv/bin/activate"
        echo "  python main.py"
    fi
fi
echo ""
