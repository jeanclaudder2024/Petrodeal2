#!/bin/bash
# Verify HTTPS endpoints are working correctly

set -e

echo "=========================================="
echo "VERIFY HTTPS ENDPOINTS"
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

# 2. Test local API endpoints directly
echo "2. Testing local API endpoints directly..."
echo "   Testing http://localhost:8000/health..."
HEALTH_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HEALTH_LOCAL" = "200" ]; then
    echo "   ✅ Local /health endpoint works (200)"
else
    echo "   ❌ Local /health endpoint failed ($HEALTH_LOCAL)"
fi

echo "   Testing http://localhost:8000/auth/me..."
AUTH_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/me 2>/dev/null || echo "000")
if [ "$AUTH_LOCAL" = "401" ] || [ "$AUTH_LOCAL" = "200" ]; then
    echo "   ✅ Local /auth/me endpoint works ($AUTH_LOCAL - 401 is OK, means endpoint exists)"
else
    echo "   ⚠️  Local /auth/me endpoint responded with $AUTH_LOCAL"
fi
echo ""

# 3. Test HTTPS endpoints via nginx
echo "3. Testing HTTPS endpoints via nginx..."
echo "   Testing https://control.petrodealhub.com/health..."
HEALTH_HTTPS=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/health 2>/dev/null || echo "000")
if [ "$HEALTH_HTTPS" = "200" ]; then
    echo "   ✅ HTTPS /health endpoint works (200)"
    echo "   Response:"
    curl -s -k https://control.petrodealhub.com/health | head -3
elif [ "$HEALTH_HTTPS" = "301" ] || [ "$HEALTH_HTTPS" = "302" ]; then
    echo "   ⚠️  HTTPS /health redirects ($HEALTH_HTTPS) - checking redirect location..."
    curl -s -k -I https://control.petrodealhub.com/health 2>&1 | grep -i "location" | head -3
else
    echo "   ❌ HTTPS /health endpoint failed ($HEALTH_HTTPS)"
    echo "   Full response:"
    curl -s -k -I https://control.petrodealhub.com/health 2>&1 | head -10
fi

echo ""
echo "   Testing https://control.petrodealhub.com/auth/me..."
AUTH_HTTPS=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/auth/me 2>/dev/null || echo "000")
if [ "$AUTH_HTTPS" = "401" ] || [ "$AUTH_HTTPS" = "200" ]; then
    echo "   ✅ HTTPS /auth/me endpoint works ($AUTH_HTTPS - 401 is OK, means endpoint exists)"
elif [ "$AUTH_HTTPS" = "404" ]; then
    echo "   ❌ HTTPS /auth/me endpoint not found (404)"
    echo "   Checking nginx config..."
    sudo grep -A 5 "location /auth/" /etc/nginx/sites-available/control 2>/dev/null | head -10
else
    echo "   ⚠️  HTTPS /auth/me endpoint responded with $AUTH_HTTPS"
    echo "   Full response:"
    curl -s -k -I https://control.petrodealhub.com/auth/me 2>&1 | head -10
fi
echo ""

# 4. Check nginx configuration
echo "4. Checking nginx configuration for control.petrodealhub.com..."
echo "   Server blocks:"
sudo grep -n "server_name.*control.petrodealhub.com" /etc/nginx/sites-available/control 2>/dev/null | head -5

echo ""
echo "   Location blocks:"
sudo grep -n "location.*auth\|location.*health\|location.*cms" /etc/nginx/sites-available/control 2>/dev/null | head -10
echo ""

# 5. Check nginx error log
echo "5. Checking nginx error log for recent errors..."
if sudo tail -20 /var/log/nginx/error.log 2>/dev/null | grep -i "control\|auth\|health" | tail -5; then
    echo "   ⚠️  Found errors in nginx log"
else
    echo "   ✅ No recent errors related to control.petrodealhub.com"
fi
echo ""

# 6. Test OPTIONS request (CORS preflight)
echo "6. Testing CORS preflight (OPTIONS request)..."
OPTIONS_RESPONSE=$(curl -s -k -X OPTIONS -H "Origin: https://control.petrodealhub.com" \
    -H "Access-Control-Request-Method: GET" \
    -o /dev/null -w "%{http_code}" \
    https://control.petrodealhub.com/auth/me 2>/dev/null || echo "000")
if [ "$OPTIONS_RESPONSE" = "204" ] || [ "$OPTIONS_RESPONSE" = "200" ]; then
    echo "   ✅ CORS preflight works ($OPTIONS_RESPONSE)"
else
    echo "   ⚠️  CORS preflight responded with $OPTIONS_RESPONSE"
fi
echo ""

# 7. Summary
echo "=========================================="
echo "VERIFICATION SUMMARY"
echo "=========================================="
echo ""

if [ "$HEALTH_HTTPS" = "200" ] && [ "$AUTH_HTTPS" = "401" ] || [ "$AUTH_HTTPS" = "200" ]; then
    echo "🎉 ALL ENDPOINTS ARE WORKING!"
    echo ""
    echo "✅ HTTPS /health endpoint: OK ($HEALTH_HTTPS)"
    echo "✅ HTTPS /auth/me endpoint: OK ($AUTH_HTTPS)"
    echo ""
    echo "The CMS should now work correctly at:"
    echo "   https://control.petrodealhub.com/cms"
    echo ""
    echo "Please refresh the CMS page and try logging in!"
else
    echo "⚠️  Some endpoints may still have issues:"
    echo ""
    echo "   HTTPS /health: $HEALTH_HTTPS (expected: 200)"
    echo "   HTTPS /auth/me: $AUTH_HTTPS (expected: 401 or 200)"
    echo ""
    if [ "$HEALTH_LOCAL" = "200" ] && [ "$HEALTH_HTTPS" != "200" ]; then
        echo "   ⚠️  API is running, but nginx might not be proxying correctly"
        echo "   Check nginx configuration for control.petrodealhub.com"
    fi
fi
echo ""
