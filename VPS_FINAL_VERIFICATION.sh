#!/bin/bash
# Final verification after all fixes

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FINAL VERIFICATION"
echo "=========================================="
echo ""

# 1. Python syntax check
echo "1. Python syntax check..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax errors found:"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi
echo ""

# 2. Critical imports
echo "2. Testing critical imports..."
python3 << 'PYTHON_EOF'
import sys
errors = []

try:
    from supabase import create_client, Client
    print("✅ Supabase import OK")
except Exception as e:
    errors.append(f"Supabase: {e}")
    print(f"❌ Supabase import failed: {e}")

try:
    from websockets.asyncio.client import ClientConnection
    print("✅ websockets.asyncio import OK")
except Exception as e:
    errors.append(f"websockets.asyncio: {e}")
    print(f"❌ websockets.asyncio import failed: {e}")

try:
    from fastapi import FastAPI
    print("✅ FastAPI import OK")
except Exception as e:
    errors.append(f"FastAPI: {e}")
    print(f"❌ FastAPI import failed: {e}")

if errors:
    print(f"\n❌ {len(errors)} import error(s) found")
    sys.exit(1)
else:
    print("\n✅ All critical imports successful!")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Import verification failed!"
    exit 1
fi
echo ""

# 3. PM2 status
echo "3. Checking PM2 status..."
pm2 status python-api
echo ""

# 4. API error logs
echo "4. Checking API error logs (last 20 lines)..."
ERROR_COUNT=$(pm2 logs python-api --err --lines 20 --nostream 2>/dev/null | grep -c "IndentationError\|SyntaxError\|ModuleNotFoundError\|Traceback" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No errors in API logs!"
else
    echo "   ⚠️  Found errors:"
    pm2 logs python-api --err --lines 20 --nostream | grep -E "IndentationError|SyntaxError|ModuleNotFoundError|Traceback" | head -10
fi
echo ""

# 5. Test API health endpoint
echo "5. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is NOT responding on port 8000"
    echo ""
    echo "   Recent error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -15
fi
echo ""

# 6. Check port 8000
echo "6. Checking if port 8000 is in use..."
if netstat -tlnp 2>/dev/null | grep -q ":8000 " || ss -tlnp 2>/dev/null | grep -q ":8000 "; then
    echo "   ✅ Port 8000 is in use"
    netstat -tlnp 2>/dev/null | grep ":8000 " || ss -tlnp 2>/dev/null | grep ":8000 "
else
    echo "   ❌ Port 8000 is NOT in use"
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
fi
echo ""

# 8. Summary
echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo ""

# Check all conditions
SYNTAX_OK=true
IMPORTS_OK=true
API_RUNNING=false
API_RESPONDING=false
NGINX_OK=false

python3 -m py_compile main.py > /dev/null 2>&1 || SYNTAX_OK=false
python3 -c "from supabase import create_client; from websockets.asyncio.client import ClientConnection" > /dev/null 2>&1 || IMPORTS_OK=false
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
    echo "✅ CMS should be accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain. Check the details above."
    echo ""
    if [ "$API_RESPONDING" = false ]; then
        echo "To debug API issues:"
        echo "  pm2 logs python-api --err --lines 50"
        echo "  pm2 restart python-api"
    fi
fi
echo ""
