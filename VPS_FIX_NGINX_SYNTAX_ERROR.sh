#!/bin/bash
# Fix syntax errors in nginx config

set -e

echo "=========================================="
echo "FIX NGINX SYNTAX ERRORS"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Test nginx config to see exact error
echo "2. Testing nginx configuration to identify errors..."
NGINX_TEST=$(sudo nginx -t 2>&1)
echo "$NGINX_TEST"
echo ""

# 3. Check line 96 (and surrounding lines) for the error
echo "3. Checking problematic lines..."
sed -n '90,105p' "$NGINX_CONFIG" | cat -n -A
echo ""

# 4. Fix the syntax error
echo "4. Fixing syntax errors..."

python3 << 'PYTHON_FIX'
import re

with open('/etc/nginx/sites-available/control', 'r') as f:
    lines = f.readlines()

# Common issues:
# 1. proxy_set_header with missing or empty values
# 2. Unescaped $ in strings
# 3. Missing semicolons

fixed = False
for i, line in enumerate(lines):
    original = line
    
    # Fix proxy_set_header with empty arguments
    # Look for: proxy_set_header Host ; or proxy_set_header X-Real-IP ;
    if re.search(r'proxy_set_header\s+\w+\s*;\s*$', line):
        # Missing value after header name
        if 'Host' in line:
            line = re.sub(r'proxy_set_header\s+Host\s*;', 'proxy_set_header Host $host;', line)
            fixed = True
        elif 'X-Real-IP' in line:
            line = re.sub(r'proxy_set_header\s+X-Real-IP\s*;', 'proxy_set_header X-Real-IP $remote_addr;', line)
            fixed = True
        elif 'X-Forwarded-For' in line:
            line = re.sub(r'proxy_set_header\s+X-Forwarded-For\s*;', 'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;', line)
            fixed = True
        elif 'X-Forwarded-Proto' in line:
            line = re.sub(r'proxy_set_header\s+X-Forwarded-Proto\s*;', 'proxy_set_header X-Forwarded-Proto $scheme;', line)
            fixed = True
        elif 'Cookie' in line:
            line = re.sub(r'proxy_set_header\s+Cookie\s*;', 'proxy_set_header Cookie $http_cookie;', line)
            fixed = True
    
    # Fix lines with only spaces or empty proxy_set_header
    if line.strip() == 'proxy_set_header' or re.search(r'proxy_set_header\s+$', line):
        # Skip empty proxy_set_header lines
        line = ''
        fixed = True
    
    lines[i] = line

if fixed:
    with open('/etc/nginx/sites-available/control', 'w') as f:
        f.writelines(lines)
    print("   ✅ Fixed syntax errors")
else:
    print("   ⚠️  No obvious syntax errors found in proxy_set_header directives")
    print("   Checking for other issues...")
    
    # Check for other common issues
    content = ''.join(lines)
    
    # Check for unescaped $ in strings (should use \$)
    if re.search(r'[^\\]\$[^{]', content):
        print("   ⚠️  Found unescaped $ characters")
    
    # Check for missing semicolons after proxy_set_header
    if re.search(r'proxy_set_header[^;]+\n(?!\s*proxy_set_header|\s*})', content):
        print("   ⚠️  Found proxy_set_header without semicolon")

PYTHON_FIX

echo ""

# 5. Test nginx configuration again
echo "5. Testing nginx configuration after fix..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is now valid!"
else
    echo "   ❌ Nginx configuration still has errors:"
    sudo nginx -t 2>&1
    echo ""
    echo "   Showing problematic area:"
    ERROR_LINE=$(sudo nginx -t 2>&1 | grep -o "line [0-9]*" | head -1 | grep -o "[0-9]*")
    if [ -n "$ERROR_LINE" ]; then
        START_LINE=$((ERROR_LINE - 5))
        END_LINE=$((ERROR_LINE + 5))
        sed -n "${START_LINE},${END_LINE}p" "$NGINX_CONFIG" | cat -n -A
    fi
    echo ""
    echo "   Restoring backup and trying manual fix..."
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
    
    # Manual fix - remove empty proxy_set_header lines
    sed -i '/proxy_set_header[[:space:]]*$/d' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header[[:space:]]*Host[[:space:]]*;/proxy_set_header Host $host;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header[[:space:]]*X-Real-IP[[:space:]]*;/proxy_set_header X-Real-IP $remote_addr;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header[[:space:]]*X-Forwarded-For[[:space:]]*;/proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;/g' "$NGINX_CONFIG"
    sed -i 's/proxy_set_header[[:space:]]*X-Forwarded-Proto[[:space:]]*;/proxy_set_header X-Forwarded-Proto $scheme;/g' "$NGINX_CONFIG"
    
    # Test again
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Fixed with manual sed commands!"
    else
        echo "   ❌ Still has errors, showing details:"
        sudo nginx -t 2>&1 | head -10
        exit 1
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

ENDPOINTS=("/templates" "/data/all" "/plans-db" "/plans")

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
        echo "✅ $RESPONSE"
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
