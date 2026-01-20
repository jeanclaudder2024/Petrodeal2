#!/bin/bash
# Directly fix the if condition by replacing the broken line

set -e

echo "=========================================="
echo "DIRECTLY FIX IF CONDITION"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Find and fix the broken if statement
echo "2. Finding and fixing broken if statement..."

# Use sed to directly replace the broken pattern
sed -i "s/if ( = 'OPTIONS')/if (\$request_method = OPTIONS)/g" "$NGINX_CONFIG"
sed -i 's/if ( = "OPTIONS")/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"
sed -i 's/if ( = OPTIONS)/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"

# Also fix any variations
sed -i 's/if([[:space:]]*=[[:space:]]*'\''OPTIONS'\'')/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"
sed -i 's/if([[:space:]]*=[[:space:]]*"OPTIONS")/if ($request_method = OPTIONS)/g' "$NGINX_CONFIG"

echo "   ✅ Fixed if condition"
echo ""

# 3. Show fixed lines
echo "3. Showing fixed lines (around line 109):"
sed -n '105,115p' "$NGINX_CONFIG" | cat -n -A
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
    
    # Try Python to fix it precisely
    echo "   Using Python to fix precisely..."
    python3 << 'PYTHON_FIX'
with open('/etc/nginx/sites-available/control', 'r') as f:
    lines = f.readlines()

fixed = False
for i, line in enumerate(lines):
    if 'if ( = ' in line or 'if ( = OPTIONS' in line:
        # Replace with correct syntax
        if 'OPTIONS' in line:
            lines[i] = line.replace('if ( = ', 'if ($request_method = OPTIONS) {').replace("'OPTIONS'", 'OPTIONS').replace('"OPTIONS"', 'OPTIONS')
            # If the line doesn't already have opening brace, add it
            if '{' not in lines[i]:
                lines[i] = lines[i].rstrip() + ' {\n'
            fixed = True
            print(f"   Fixed line {i+1}: {lines[i].strip()}")

if fixed:
    with open('/etc/nginx/sites-available/control', 'w') as f:
        f.writelines(lines)
    print("   ✅ Fixed if condition using Python")
else:
    print("   ⚠️  Could not find broken if condition")
PYTHON_FIX

    # Test again
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Fixed with Python!"
    else
        echo "   ❌ Still has errors"
        sudo nginx -t 2>&1 | head -10
        exit 1
    fi
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

# 7. Final summary
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
fi
echo ""
