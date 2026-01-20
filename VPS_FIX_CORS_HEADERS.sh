#!/bin/bash
# Fix CORS headers with missing values

set -e

echo "=========================================="
echo "FIX CORS HEADERS"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check for CORS header issues
echo "2. Checking for CORS header issues..."
if grep -q "add_header Access-Control-Allow-Origin[[:space:]]*always" "$NGINX_CONFIG"; then
    echo "   ⚠️  Found CORS headers with missing values"
    
    # Fix CORS headers missing $http_origin
    sed -i 's/add_header Access-Control-Allow-Origin[[:space:]]*always/add_header Access-Control-Allow-Origin $http_origin always/g' "$NGINX_CONFIG"
    
    echo "   ✅ Fixed CORS headers"
else
    echo "   ✅ CORS headers are correct"
fi
echo ""

# 3. Verify the fix
echo "3. Showing fixed CORS headers (around line 14):"
sed -n '10,20p' "$NGINX_CONFIG" | grep -A 5 "CORS\|Access-Control" | head -10
echo ""

# 4. Test nginx configuration
echo "4. Testing nginx configuration..."
NGINX_TEST=$(sudo nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid!"
    echo "$NGINX_TEST" | tail -1
else
    echo "   ❌ Nginx configuration has errors:"
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
    
    echo ""
    echo "   Restoring backup..."
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi
echo ""

# 5. Reload nginx
echo "5. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 6. Wait for nginx to fully restart
echo "6. Waiting for nginx to fully restart..."
sleep 3
echo ""

# 7. Test endpoints
echo "7. Testing endpoints..."
ENDPOINTS=("/health" "/auth/me" "/templates" "/data/all" "/plans-db" "/plans")

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

# 8. Final summary
echo "=========================================="
echo "FIX COMPLETE - SUMMARY"
echo "=========================================="
echo ""

if [ $SUCCESS -eq 6 ]; then
    echo "🎉 ALL ENDPOINTS ARE WORKING!"
    echo ""
    echo "✅ /health: Working"
    echo "✅ /auth/me: Working"
    echo "✅ /templates: Working"
    echo "✅ /data/all: Working"
    echo "✅ /plans-db: Working"
    echo "✅ /plans: Working"
    echo ""
    echo "The CMS should now work correctly!"
    echo "Please refresh the CMS page and try again!"
else
    echo "⚠️  Some endpoints may still have issues ($SUCCESS/6 working)"
    echo ""
    echo "If endpoints still return 404, check:"
    echo "   1. Nginx config: sudo nginx -t"
    echo "   2. Nginx error log: sudo tail -20 /var/log/nginx/error.log"
    echo "   3. API is running: pm2 status python-api"
fi
echo ""
