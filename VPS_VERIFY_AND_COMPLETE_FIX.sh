#!/bin/bash
# Verify nginx fix and complete the process

set -e

echo "=========================================="
echo "VERIFY AND COMPLETE NGINX FIX"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Verify proxy_set_header fixes
echo "1. Verifying proxy_set_header fixes..."
if grep -q "proxy_set_header Host ;\|proxy_set_header X-Real-IP ;\|proxy_set_header X-Forwarded-For ;" "$NGINX_CONFIG"; then
    echo "   ⚠️  Still found proxy_set_header with missing values"
    echo "   Fixing again..."
    
    # Fix again with more specific patterns
    sed -i 's/proxy_set_header Host ;/proxy_set_header Host $host;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header X-Real-IP ;/proxy_set_header X-Real-IP $remote_addr;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header X-Forwarded-For ;/proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header X-Forwarded-Proto ;/proxy_set_header X-Forwarded-Proto $scheme;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header Cookie ;/proxy_set_header Cookie $http_cookie;/g' "$NGINX_CONFIG"
    
    echo "   ✅ Fixed again"
else
    echo "   ✅ proxy_set_header directives are correct"
fi

# Show fixed lines
echo ""
echo "   Showing fixed lines (around line 96):"
sed -n '90,105p' "$NGINX_CONFIG" | cat -n -A
echo ""

# 2. Test nginx configuration
echo "2. Testing nginx configuration..."
NGINX_TEST=$(sudo nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid!"
    echo "$NGINX_TEST" | tail -1
else
    echo "   ❌ Nginx configuration still has errors:"
    echo "$NGINX_TEST"
    echo ""
    
    # Find the exact error line
    ERROR_LINE=$(echo "$NGINX_TEST" | grep -o "line [0-9]*" | head -1 | grep -o "[0-9]*")
    if [ -n "$ERROR_LINE" ]; then
        echo "   Showing problematic area around line $ERROR_LINE:"
        START_LINE=$((ERROR_LINE - 3))
        END_LINE=$((ERROR_LINE + 3))
        sed -n "${START_LINE},${END_LINE}p" "$NGINX_CONFIG" | cat -n -A
    fi
    exit 1
fi
echo ""

# 3. Reload nginx
echo "3. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 4. Wait for nginx to fully restart
echo "4. Waiting for nginx to fully restart..."
sleep 3
echo ""

# 5. Test endpoints
echo "5. Testing endpoints..."
ENDPOINTS=("/templates" "/data/all" "/plans-db" "/plans")

SUCCESS=0
for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
        echo "✅ $RESPONSE"
        SUCCESS=$((SUCCESS + 1))
    elif [ "$RESPONSE" = "404" ]; then
        echo "❌ 404"
    else
        echo "⚠️  $RESPONSE"
    fi
done
echo ""

# 6. Test health and auth endpoints
echo "6. Testing health and auth endpoints..."
HEALTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com/health" 2>/dev/null || echo "000")
AUTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com/auth/me" 2>/dev/null || echo "000")

echo "   /health: $HEALTH_RESPONSE"
echo "   /auth/me: $AUTH_RESPONSE"
echo ""

# 7. Final summary
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""

TOTAL=$((SUCCESS + 2))  # +2 for health and auth

if [ "$HEALTH_RESPONSE" = "200" ] && ([ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]) && [ $SUCCESS -eq 4 ]; then
    echo "🎉 ALL ENDPOINTS ARE WORKING!"
    echo ""
    echo "✅ /health: $HEALTH_RESPONSE"
    echo "✅ /auth/me: $AUTH_RESPONSE"
    echo "✅ /templates: Working"
    echo "✅ /data/all: Working"
    echo "✅ /plans-db: Working"
    echo "✅ /plans: Working"
    echo ""
    echo "The CMS should now work correctly!"
    echo "Please refresh the CMS page and try again!"
else
    echo "⚠️  Some endpoints may still have issues"
    echo ""
    echo "   /health: $HEALTH_RESPONSE (expected: 200)"
    echo "   /auth/me: $AUTH_RESPONSE (expected: 401 or 200)"
    echo "   Other endpoints: $SUCCESS/4 working"
    echo ""
    if [ "$HEALTH_RESPONSE" != "200" ] || [ "$AUTH_RESPONSE" != "401" ] && [ "$AUTH_RESPONSE" != "200" ]; then
        echo "   Check nginx error log: sudo tail -20 /var/log/nginx/error.log"
    fi
fi
echo ""
