#!/bin/bash
# Fix proxy_set_header syntax errors directly

set -e

echo "=========================================="
echo "FIX PROXY_SET_HEADER SYNTAX ERRORS"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic lines
echo "2. Checking line 96 and surrounding lines..."
sed -n '90,100p' "$NGINX_CONFIG" | cat -n -A
echo ""

# 3. Fix all proxy_set_header directives with missing values
echo "3. Fixing proxy_set_header directives..."

# Remove lines with only "proxy_set_header" or "proxy_set_header ;"
sed -i '/^[[:space:]]*proxy_set_header[[:space:]]*$/d' "$NGINX_CONFIG"
sed -i '/^[[:space:]]*proxy_set_header[[:space:]]*;[[:space:]]*$/d' "$NGINX_CONFIG"

# Fix proxy_set_header with missing arguments
sed -i 's/proxy_set_header[[:space:]]\+Host[[:space:]]*;/proxy_set_header Host $host;/g' "$NGINX_CONFIG"
sed -i 's/proxy_set_header[[:space:]]\+X-Real-IP[[:space:]]*;/proxy_set_header X-Real-IP $remote_addr;/g' "$NGINX_CONFIG"
sed -i 's/proxy_set_header[[:space:]]\+X-Forwarded-For[[:space:]]*;/proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;/g' "$NGINX_CONFIG"
sed -i 's/proxy_set_header[[:space:]]\+X-Forwarded-Proto[[:space:]]*;/proxy_set_header X-Forwarded-Proto $scheme;/g' "$NGINX_CONFIG"
sed -i 's/proxy_set_header[[:space:]]\+Cookie[[:space:]]*;/proxy_set_header Cookie $http_cookie;/g' "$NGINX_CONFIG"

# Fix lines that have proxy_set_header followed by semicolon without a value
sed -i 's/proxy_set_header[[:space:]]\+\([A-Za-z_-]\+\)[[:space:]]*;[[:space:]]*$/proxy_set_header \1 $\1;/' "$NGINX_CONFIG"

echo "   ✅ Fixed proxy_set_header directives"
echo ""

# 4. Test nginx configuration
echo "4. Testing nginx configuration..."
NGINX_TEST=$(sudo nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid!"
    echo "$NGINX_TEST" | tail -1
else
    echo "   ❌ Nginx configuration still has errors:"
    echo "$NGINX_TEST"
    echo ""
    
    # Try to find the exact error line
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

# 6. Test endpoints
echo "6. Testing endpoints..."
sleep 2

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

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""

if [ $SUCCESS -eq 4 ]; then
    echo "🎉 ALL ENDPOINTS ARE WORKING!"
    echo ""
    echo "✅ /templates: Working"
    echo "✅ /data/all: Working"
    echo "✅ /plans-db: Working"
    echo "✅ /plans: Working"
    echo ""
    echo "The CMS should now work correctly!"
else
    echo "⚠️  Some endpoints may still have issues ($SUCCESS/4 working)"
    echo "   Check nginx config: sudo nginx -t"
    echo "   Check nginx logs: sudo tail -20 /var/log/nginx/error.log"
fi
echo ""
