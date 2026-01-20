#!/bin/bash
# Verify upload endpoint is working

set -e

echo "=========================================="
echo "VERIFY UPLOAD ENDPOINT"
echo "=========================================="
echo ""

# 1. Test nginx configuration
echo "1. Testing nginx configuration..."
NGINX_TEST=$(sudo nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid!"
    echo "$NGINX_TEST" | tail -1
else
    echo "   ❌ Nginx configuration has errors:"
    echo "$NGINX_TEST"
    echo ""
    echo "   Trying to fix syntax errors..."
    
    # Check for common issues
    NGINX_CONFIG="/etc/nginx/sites-available/control"
    
    # Fix if condition syntax if needed
    if grep -q "if (\$request_method = 'OPTIONS')" "$NGINX_CONFIG"; then
        echo "   Fixing if condition syntax..."
        sudo sed -i "s/if (\$request_method = 'OPTIONS')/if (\$request_method = OPTIONS)/g" "$NGINX_CONFIG"
    fi
    
    # Test again
    NGINX_TEST=$(sudo nginx -t 2>&1)
    if echo "$NGINX_TEST" | grep -q "successful"; then
        echo "   ✅ Fixed and configuration is now valid!"
    else
        echo "   ❌ Still has errors:"
        echo "$NGINX_TEST"
        exit 1
    fi
fi
echo ""

# 2. Reload nginx
echo "2. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 3. Check if /upload-template location exists
echo "3. Checking /upload-template location block..."
NGINX_CONFIG="/etc/nginx/sites-available/control"
if grep -q "location.*upload-template" "$NGINX_CONFIG"; then
    echo "   ✅ Location block found:"
    grep -A 5 "location.*upload-template" "$NGINX_CONFIG" | head -6
else
    echo "   ❌ Location block not found!"
fi
echo ""

# 4. Test upload endpoint
echo "4. Testing upload endpoint..."
echo "   Testing OPTIONS (preflight)..."
OPTIONS_CODE=$(curl -s -k -X OPTIONS \
    -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: POST" \
    -o /dev/null -w "%{http_code}" \
    "https://control.petrodealhub.com/upload-template" 2>/dev/null || echo "000")

if [ "$OPTIONS_CODE" = "200" ] || [ "$OPTIONS_CODE" = "204" ]; then
    echo "   ✅ OPTIONS request successful ($OPTIONS_CODE)"
else
    echo "   ⚠️  OPTIONS request returned $OPTIONS_CODE"
fi

echo "   Testing POST (actual upload endpoint)..."
POST_CODE=$(curl -s -k -X POST \
    -H "Origin: https://control.petrodealhub.com" \
    -H "Content-Type: multipart/form-data" \
    -o /dev/null -w "%{http_code}" \
    "https://control.petrodealhub.com/upload-template" 2>/dev/null || echo "000")

if [ "$POST_CODE" = "401" ] || [ "$POST_CODE" = "400" ]; then
    echo "   ✅ POST endpoint accessible ($POST_CODE - auth/validation error is expected)"
elif [ "$POST_CODE" = "404" ]; then
    echo "   ❌ POST endpoint still returns 404"
    echo "   ⚠️  Location block might not be working correctly"
    echo "   Checking nginx access logs..."
    tail -5 /var/log/nginx/access.log 2>/dev/null | grep upload-template || echo "   No recent upload-template requests in logs"
elif [ "$POST_CODE" = "413" ]; then
    echo "   ❌ POST endpoint returns 413 (Request Entity Too Large)"
    echo "   ⚠️  File size limit might still be an issue"
else
    echo "   ℹ️  POST endpoint returned $POST_CODE"
fi
echo ""

# 5. Check API is running
echo "5. Checking API status..."
if pm2 status python-api 2>/dev/null | grep -q "online"; then
    echo "   ✅ API is running"
else
    echo "   ⚠️  API might not be running, restarting..."
    pm2 restart python-api
    sleep 3
    if pm2 status python-api 2>/dev/null | grep -q "online"; then
        echo "   ✅ API restarted and running"
    else
        echo "   ❌ API failed to start"
        echo "   Check logs: pm2 logs python-api --err"
    fi
fi
echo ""

# 6. Test API directly
echo "6. Testing API directly (localhost:8000)..."
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://localhost:8000/upload-template" \
    -H "Authorization: Bearer test" 2>/dev/null || echo "000")

if [ "$API_CODE" = "401" ] || [ "$API_CODE" = "400" ] || [ "$API_CODE" = "422" ]; then
    echo "   ✅ API endpoint is accessible ($API_CODE - auth/validation error is expected)"
elif [ "$API_CODE" = "404" ]; then
    echo "   ❌ API endpoint returns 404"
    echo "   ⚠️  The /upload-template endpoint might not exist in the API"
else
    echo "   ℹ️  API endpoint returned $API_CODE"
fi
echo ""

# 7. Summary
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
if [ "$POST_CODE" = "401" ] || [ "$POST_CODE" = "400" ]; then
    echo "✅ Upload endpoint is working!"
    echo "✅ Nginx is correctly proxying to the API"
    echo ""
    echo "The upload should now work in the CMS."
    echo "Clear your browser cache (Ctrl+Shift+R) and try uploading again."
else
    echo "⚠️  Upload endpoint might still have issues."
    echo "POST endpoint returned: $POST_CODE"
    echo ""
    if [ "$POST_CODE" = "404" ]; then
        echo "If it's still 404, check:"
        echo "1. Nginx location block is in the correct server block"
        echo "2. API endpoint /upload-template exists"
        echo "3. Nginx was reloaded correctly"
    fi
fi
echo ""
