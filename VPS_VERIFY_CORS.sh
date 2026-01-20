#!/bin/bash
# Verify CORS configuration and API accessibility

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "VERIFY CORS CONFIGURATION"
echo "=========================================="
echo ""

# 1. Check if API is running
echo "1. Checking if API is running..."
if pm2 list | grep -q "python-api.*online"; then
    echo "   ✅ API is running"
else
    echo "   ❌ API is not running"
    exit 1
fi
echo ""

# 2. Test local API health endpoint
echo "2. Testing local API health endpoint..."
LOCAL_HEALTH=$(curl -s http://localhost:8000/health 2>&1)
if [ $? -eq 0 ] && [ ! -z "$LOCAL_HEALTH" ]; then
    echo "   ✅ Local API is responding"
    echo "   Response: $LOCAL_HEALTH"
else
    echo "   ❌ Local API is not responding"
    echo "   Error: $LOCAL_HEALTH"
fi
echo ""

# 3. Test CORS headers on local API
echo "3. Testing CORS headers on local API..."
CORS_TEST=$(curl -s -X OPTIONS -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -v http://localhost:8000/health 2>&1)

if echo "$CORS_TEST" | grep -q "access-control-allow-origin"; then
    echo "   ✅ CORS headers are present"
    echo "$CORS_TEST" | grep -i "access-control"
else
    echo "   ⚠️  CORS headers might not be present"
    echo "$CORS_TEST" | grep -i "access-control" || echo "   No CORS headers found"
fi
echo ""

# 4. Check nginx configuration
echo "4. Checking nginx configuration..."
if [ -f "/etc/nginx/sites-available/default" ]; then
    echo "   Checking nginx config for API proxy..."
    if grep -q "proxy_pass.*8000" /etc/nginx/sites-available/default; then
        echo "   ✅ Nginx is configured to proxy to port 8000"
    else
        echo "   ⚠️  Nginx might not be configured to proxy to port 8000"
    fi
    
    # Check for CORS headers in nginx config
    if grep -q "add_header.*Access-Control" /etc/nginx/sites-available/default; then
        echo "   ⚠️  Nginx has CORS headers - this might conflict with FastAPI CORS"
    else
        echo "   ✅ Nginx doesn't add CORS headers (FastAPI will handle it)"
    fi
else
    echo "   ⚠️  Nginx config not found at /etc/nginx/sites-available/default"
fi
echo ""

# 5. Test external API endpoint (if accessible)
echo "5. Testing external API endpoint..."
EXTERNAL_TEST=$(curl -s -X OPTIONS -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: GET" \
    -v https://petrodealhub.com/api/health 2>&1)

if echo "$EXTERNAL_TEST" | grep -q "access-control-allow-origin"; then
    echo "   ✅ External API CORS headers are present"
    echo "$EXTERNAL_TEST" | grep -i "access-control"
else
    echo "   ⚠️  External API CORS headers might not be present"
    echo "$EXTERNAL_TEST" | head -20
fi
echo ""

# 6. Check CORS configuration in main.py
echo "6. Checking CORS configuration in main.py..."
if grep -q "https://control.petrodealhub.com" main.py; then
    echo "   ✅ control.petrodealhub.com is in ALLOWED_ORIGINS"
else
    echo "   ❌ control.petrodealhub.com is NOT in ALLOWED_ORIGINS"
    echo "   This needs to be added!"
fi

if grep -q "https://petrodealhub.com" main.py; then
    echo "   ✅ petrodealhub.com is in ALLOWED_ORIGINS"
else
    echo "   ⚠️  petrodealhub.com is NOT in ALLOWED_ORIGINS"
fi
echo ""

# 7. Restart nginx if needed
echo "7. Reloading nginx..."
if systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx"
fi
echo ""

# 8. Restart API to ensure CORS config is loaded
echo "8. Restarting API to ensure CORS config is loaded..."
pm2 restart python-api
sleep 5
echo "   ✅ API restarted"
echo ""

# 9. Final test
echo "9. Final CORS test..."
sleep 3
FINAL_TEST=$(curl -s -X OPTIONS -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -I http://localhost:8000/health 2>&1)

if echo "$FINAL_TEST" | grep -qi "access-control-allow-origin.*control.petrodealhub.com"; then
    echo "   ✅ CORS is working correctly!"
    echo "$FINAL_TEST" | grep -i "access-control"
else
    echo "   ⚠️  CORS might still have issues"
    echo "$FINAL_TEST" | head -15
fi
echo ""

echo "=========================================="
echo "CORS VERIFICATION COMPLETE"
echo "=========================================="
echo ""
