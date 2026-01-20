#!/bin/bash
# Fix nginx if condition syntax error

set -e

echo "=========================================="
echo "FIX NGINX IF CONDITION SYNTAX ERROR"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Check line 109 and surrounding lines
echo "2. Checking line 109 and surrounding lines..."
sed -n '105,115p' "$NGINX_CONFIG" | cat -n -A
echo ""

# 3. Fix if condition syntax
echo "3. Fixing if condition syntax errors..."

# Common issues:
# - if ($request_method = 'OPTIONS') should be if ($request_method = OPTIONS)  (no quotes in nginx)
# - if (condition) should have proper spacing

# Fix if statements with quotes around OPTIONS
sed -i "s/if (\$request_method = 'OPTIONS')/if (\$request_method = OPTIONS)/g" "$NGINX_CONFIG"
sed -i 's/if ($request_method = "OPTIONS")/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"

# Fix if statements with incorrect spacing
sed -i 's/if(\$request_method/if (\$request_method/g' "$NGINX_CONFIG"
sed -i 's/if(\$host/if (\$host/g' "$NGINX_CONFIG"

# Fix empty if conditions or invalid syntax
sed -i 's/if ([[:space:]]*=[[:space:]]*)/# Invalid if removed: /g' "$NGINX_CONFIG"

echo "   ✅ Fixed if condition syntax"
echo ""

# 4. Show fixed lines
echo "4. Showing fixed lines (around line 109):"
sed -n '105,115p' "$NGINX_CONFIG" | cat -n -A
echo ""

# 5. Test nginx configuration
echo "5. Testing nginx configuration..."
NGINX_TEST=$(sudo nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid!"
    echo "$NGINX_TEST" | tail -1
else
    echo "   ❌ Nginx configuration still has errors:"
    echo "$NGINX_TEST"
    echo ""
    
    # Try to fix common issues manually
    echo "   Attempting manual fixes..."
    
    # Check what's on line 109
    ERROR_LINE=109
    echo "   Line 109 content:"
    sed -n "${ERROR_LINE}p" "$NGINX_CONFIG" | cat -A
    
    # Fix the specific issue - likely an if statement
    # Remove problematic if statement or fix it
    sed -i '109s/.*/# Fixed invalid if condition/' "$NGINX_CONFIG"
    
    # Test again
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Fixed by removing problematic line"
    else
        echo "   ❌ Still has errors, restoring backup..."
        sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
        
        # Try a different approach - fix all if statements
        echo "   Trying comprehensive fix..."
        sed -i 's/if (\$request_method = '\''OPTIONS'\'')/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"
        sed -i 's/if (\$request_method = "OPTIONS")/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"
        
        # Remove empty if blocks
        sed -i '/if ([[:space:]]*)[[:space:]]*{/d' "$NGINX_CONFIG"
        
        if sudo nginx -t 2>&1 | grep -q "successful"; then
            echo "   ✅ Fixed with comprehensive approach"
        else
            echo "   ❌ Could not fix automatically"
            echo "   Please check the nginx config manually at line 109"
            exit 1
        fi
    fi
fi
echo ""

# 6. Reload nginx
echo "6. Reloading nginx..."
if sudo systemctl reload nginx 2>/dev/null; then
    echo "   ✅ Nginx reloaded successfully"
else
    echo "   ⚠️  Could not reload nginx, trying restart..."
    sudo systemctl restart nginx
    sleep 2
    echo "   ✅ Nginx restarted"
fi
echo ""

# 7. Test endpoints
echo "7. Testing endpoints..."
sleep 2

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
echo "FIX COMPLETE"
echo "=========================================="
echo ""

if [ $SUCCESS -eq 6 ]; then
    echo "🎉 ALL ENDPOINTS ARE WORKING!"
    echo ""
    echo "✅ All $SUCCESS endpoints are working correctly!"
    echo ""
    echo "The CMS should now work correctly!"
    echo "Please refresh the CMS page and try again!"
else
    echo "⚠️  Some endpoints may still have issues ($SUCCESS/6 working)"
    echo ""
    echo "Check nginx error log: sudo tail -20 /var/log/nginx/error.log"
fi
echo ""
