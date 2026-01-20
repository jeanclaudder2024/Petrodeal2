#!/bin/bash
# Diagnose upload and plan editing issues

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "DIAGNOSE UPLOAD AND PLAN EDITING ERRORS"
echo "=========================================="
echo ""

# 1. Check API status
echo "1. Checking API status..."
if pm2 status python-api 2>/dev/null | grep -q "online"; then
    echo "   ✅ API is running"
    pm2 status python-api | grep -E "python-api|status|online|errored"
else
    echo "   ❌ API is not running"
    echo "   Checking logs..."
    pm2 logs python-api --err --lines 10 --nostream 2>/dev/null | tail -10 || echo "   Could not get logs"
fi
echo ""

# 2. Test API endpoints directly
echo "2. Testing API endpoints directly (localhost:8000)..."
ENDPOINTS=("/health" "/templates" "/plans-db" "/upload-template")

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000$endpoint" -H "Authorization: Bearer test" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
        echo "✅ $HTTP_CODE"
    elif [ "$HTTP_CODE" = "405" ]; then
        echo "⚠️  Method Not Allowed ($HTTP_CODE)"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ Not Found ($HTTP_CODE)"
    else
        echo "⚠️  $HTTP_CODE"
    fi
done
echo ""

# 3. Test endpoints via nginx
echo "3. Testing endpoints via nginx (https://control.petrodealhub.com)..."
ENDPOINTS_VIA_NGINX=("/health" "/templates" "/plans-db" "/upload-template" "/templates/test/metadata")

for endpoint in "${ENDPOINTS_VIA_NGINX[@]}"; do
    echo -n "   Testing $endpoint... "
    HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ]; then
        echo "✅ $HTTP_CODE"
    elif [ "$HTTP_CODE" = "405" ]; then
        echo "⚠️  Method Not Allowed ($HTTP_CODE)"
    elif [ "$HTTP_CODE" = "502" ] || [ "$HTTP_CODE" = "503" ]; then
        echo "❌ Bad Gateway/Service Unavailable ($HTTP_CODE)"
    else
        echo "⚠️  $HTTP_CODE"
    fi
done
echo ""

# 4. Check nginx configuration for upload endpoint
echo "4. Checking nginx configuration for upload endpoint..."
NGINX_CONFIG="/etc/nginx/sites-available/control"

if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "location.*upload" "$NGINX_CONFIG"; then
        echo "   ✅ Found upload location block:"
        grep -A 5 "location.*upload" "$NGINX_CONFIG" | head -6
    else
        echo "   ❌ No upload location block found"
        echo "   Checking for /templates location:"
        if grep -q "location /templates" "$NGINX_CONFIG"; then
            echo "   ✅ Found /templates location block:"
            grep -A 5 "location /templates" "$NGINX_CONFIG" | head -6
        else
            echo "   ❌ No /templates location block found"
        fi
    fi
    
    echo ""
    echo "   Checking for client_max_body_size (file upload size limit):"
    if grep -q "client_max_body_size" "$NGINX_CONFIG"; then
        echo "   ✅ Found client_max_body_size:"
        grep "client_max_body_size" "$NGINX_CONFIG"
    else
        echo "   ⚠️  No client_max_body_size found (default is 1MB, might be too small)"
    fi
else
    echo "   ❌ Nginx config file not found at $NGINX_CONFIG"
fi
echo ""

# 5. Check nginx error logs
echo "5. Checking nginx error logs for recent errors..."
if [ -f "/var/log/nginx/error.log" ]; then
    echo "   Recent errors (last 10 lines):"
    tail -10 /var/log/nginx/error.log 2>/dev/null | grep -i "error\|failed\|denied" || echo "   No recent errors found"
else
    echo "   ⚠️  Could not access nginx error log"
fi
echo ""

# 6. Check API logs for errors
echo "6. Checking API logs for recent errors..."
if pm2 logs python-api --err --lines 20 --nostream 2>/dev/null | grep -i "error\|exception\|traceback" | tail -10; then
    echo ""
else
    echo "   No recent errors in API logs"
fi
echo ""

# 7. Check CORS configuration
echo "7. Checking CORS configuration in nginx..."
if grep -q "Access-Control-Allow-Origin" "$NGINX_CONFIG"; then
    echo "   ✅ CORS headers found:"
    grep "Access-Control-Allow-Origin" "$NGINX_CONFIG" | head -3
else
    echo "   ⚠️  No CORS headers found in nginx config"
fi
echo ""

# 8. Check if OPTIONS requests are handled
echo "8. Checking if OPTIONS requests are handled..."
if grep -q "OPTIONS\|if.*request_method" "$NGINX_CONFIG"; then
    echo "   ✅ OPTIONS handling found:"
    grep -A 3 "if.*OPTIONS\|if.*request_method" "$NGINX_CONFIG" | head -5
else
    echo "   ⚠️  No explicit OPTIONS handling found"
fi
echo ""

# 9. Test CORS preflight
echo "9. Testing CORS preflight request..."
PREFLIGHT_RESPONSE=$(curl -s -k -X OPTIONS \
    -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -o /dev/null -w "%{http_code}" \
    "https://control.petrodealhub.com/upload-template" 2>/dev/null || echo "000")

if [ "$PREFLIGHT_RESPONSE" = "200" ] || [ "$PREFLIGHT_RESPONSE" = "204" ]; then
    echo "   ✅ Preflight request successful ($PREFLIGHT_RESPONSE)"
else
    echo "   ⚠️  Preflight request returned $PREFLIGHT_RESPONSE"
fi

# Check CORS headers in response
CORS_HEADERS=$(curl -s -k -X OPTIONS \
    -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -I "https://control.petrodealhub.com/upload-template" 2>/dev/null | grep -i "access-control" || echo "")

if [ -n "$CORS_HEADERS" ]; then
    echo "   CORS headers in preflight response:"
    echo "$CORS_HEADERS" | sed 's/^/      /'
else
    echo "   ⚠️  No CORS headers in preflight response"
fi
echo ""

# 10. Check editor.js API URL
echo "10. Checking editor.js API base URL..."
if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "   ✅ editor.js uses correct API URL"
else
    echo "   ❌ editor.js might be using wrong API URL"
    echo "   Current API base setting:"
    grep -A 1 "apiBase = " cms/editor.js | grep "https://" | head -1 || echo "   Could not find API base URL"
fi
echo ""

# 11. Summary and recommendations
echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="
echo ""

echo "Common issues and fixes:"
echo ""
echo "1. If upload endpoint returns 404:"
echo "   - Add location block for /upload-template in nginx config"
echo "   - Or ensure /templates location includes upload-template"
echo ""
echo "2. If upload fails with 413 (Request Entity Too Large):"
echo "   - Add 'client_max_body_size 50M;' to nginx config"
echo ""
echo "3. If CORS errors persist:"
echo "   - Ensure OPTIONS requests are handled correctly"
echo   "   - Check Access-Control-Allow-Origin header includes https://control.petrodealhub.com"
echo ""
echo "4. If plan editing crashes:"
echo "   - Check API logs for errors: pm2 logs python-api --err"
echo "   - Verify /templates/{id}/metadata endpoint is accessible"
echo "   - Check browser console for JavaScript errors"
echo ""
