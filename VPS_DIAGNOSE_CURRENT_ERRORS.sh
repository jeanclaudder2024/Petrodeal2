#!/bin/bash
# Diagnose current errors after pull and update

set -e

echo "=========================================="
echo "DIAGNOSE CURRENT ERRORS"
echo "=========================================="
echo ""

# 1. Check API status
echo "1. Checking API status..."
pm2 status python-api
echo ""

# 2. Check API logs for errors
echo "2. Checking API logs for recent errors..."
echo "   Last 50 lines of API logs:"
pm2 logs python-api --lines 50 --nostream | tail -50
echo ""

# 3. Check for Python syntax errors
echo "3. Checking Python syntax..."
cd /opt/petrodealhub/document-processor
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ No syntax errors in main.py"
else
    echo "   ❌ Syntax errors found in main.py"
    python3 -m py_compile main.py 2>&1 | head -10
fi
echo ""

# 4. Check if fixes are present
echo "4. Verifying fixes are present..."
cd /opt/petrodealhub/document-processor

# Check DEBUG_LOG_PATH
if grep -q "DEBUG_LOG_PATH = os.path.join(BASE_DIR" main.py; then
    echo "   ✅ DEBUG_LOG_PATH fix present"
else
    echo "   ❌ DEBUG_LOG_PATH fix NOT found"
fi

# Check cms.js API URL
if grep -q "apiBase = 'https://control.petrodealhub.com'" cms/cms.js; then
    echo "   ✅ cms.js API URL fix present"
else
    echo "   ❌ cms.js API URL fix NOT found"
    echo "   Current API base setting:"
    grep -A 2 "hostname === 'control.petrodealhub.com'" cms/cms.js || echo "   Could not find API base setting"
fi

# Check for merge conflicts
if grep -q "<<<<<<< HEAD\|>>>>>>>" main.py; then
    echo "   ❌ Merge conflict markers still present!"
    echo "   Found at lines:"
    grep -n "<<<<<<< HEAD\|>>>>>>>" main.py | head -5
else
    echo "   ✅ No merge conflict markers"
fi
echo ""

# 5. Check debug log file
echo "5. Checking debug log file..."
DEBUG_LOG="/opt/petrodealhub/document-processor/.cursor/debug.log"
if [ -f "$DEBUG_LOG" ]; then
    echo "   ✅ Debug log file exists"
    LOG_SIZE=$(wc -l < "$DEBUG_LOG" 2>/dev/null || echo "0")
    echo "   Log file has $LOG_SIZE lines"
    if [ "$LOG_SIZE" -gt 0 ]; then
        echo "   Last 10 log entries:"
        tail -10 "$DEBUG_LOG" | while read line; do
            echo "   $line"
        done
    fi
else
    echo "   ⚠️  Debug log file does not exist yet (will be created on first API call)"
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$DEBUG_LOG")" || true
fi
echo ""

# 6. Test API endpoints
echo "6. Testing API endpoints..."
echo "   Testing /health..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HEALTH_CODE" = "200" ]; then
    echo "   ✅ /health returns 200"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ /health returns $HEALTH_CODE"
fi

echo "   Testing /templates..."
TEMPLATES_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer test" http://localhost:8000/templates 2>/dev/null || echo "000")
if [ "$TEMPLATES_CODE" = "200" ] || [ "$TEMPLATES_CODE" = "401" ]; then
    echo "   ✅ /templates returns $TEMPLATES_CODE (expected)"
else
    echo "   ⚠️  /templates returns $TEMPLATES_CODE"
fi
echo ""

# 7. Check nginx configuration
echo "7. Checking nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1 | head -10
fi
echo ""

# 8. Test endpoints via nginx
echo "8. Testing endpoints via nginx..."
echo "   Testing https://control.petrodealhub.com/health..."
NGINX_HEALTH=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/health 2>/dev/null || echo "000")
if [ "$NGINX_HEALTH" = "200" ]; then
    echo "   ✅ /health via nginx returns 200"
else
    echo "   ❌ /health via nginx returns $NGINX_HEALTH"
fi

echo "   Testing https://control.petrodealhub.com/templates..."
NGINX_TEMPLATES=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/templates 2>/dev/null || echo "000")
if [ "$NGINX_TEMPLATES" = "200" ] || [ "$NGINX_TEMPLATES" = "401" ]; then
    echo "   ✅ /templates via nginx returns $NGINX_TEMPLATES (expected)"
else
    echo "   ⚠️  /templates via nginx returns $NGINX_TEMPLATES"
fi
echo ""

# 9. Check for common error patterns in logs
echo "9. Searching for common error patterns..."
cd /opt/petrodealhub/document-processor

# Check PM2 logs for exceptions
EXCEPTIONS=$(pm2 logs python-api --lines 100 --nostream 2>&1 | grep -i "exception\|error\|traceback" | tail -5 || true)
if [ -n "$EXCEPTIONS" ]; then
    echo "   Found exceptions/errors in logs:"
    echo "$EXCEPTIONS" | while read line; do
        echo "   $line"
    done
else
    echo "   ✅ No recent exceptions found in logs"
fi
echo ""

# 10. Check nginx error log
echo "10. Checking nginx error log..."
if [ -f /var/log/nginx/error.log ]; then
    RECENT_ERRORS=$(sudo tail -20 /var/log/nginx/error.log | grep -i "error\|failed\|refused" | tail -5 || true)
    if [ -n "$RECENT_ERRORS" ]; then
        echo "   Recent nginx errors:"
        echo "$RECENT_ERRORS" | while read line; do
            echo "   $line"
        done
    else
        echo "   ✅ No recent nginx errors"
    fi
else
    echo "   ⚠️  Nginx error log not found"
fi
echo ""

# 11. Summary and recommendations
echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Try uploading a template and note any errors"
echo "2. Try editing plan assignments and note any errors"
echo "3. Check browser console (F12) for JavaScript errors"
echo "4. Share the specific error messages you see"
echo ""
echo "To check debug logs in real-time:"
echo "  tail -f /opt/petrodealhub/document-processor/.cursor/debug.log"
echo ""
echo "To check API logs in real-time:"
echo "  pm2 logs python-api"
echo ""
