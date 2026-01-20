#!/bin/bash
# Debug why nginx is returning 404 for endpoints

set -e

echo "=========================================="
echo "DEBUG NGINX 404 ERRORS"
echo "=========================================="
echo ""

# 1. Check if API is running
echo "1. Checking API status..."
pm2 status python-api
echo ""

# 2. Test API directly
echo "2. Testing API directly..."
echo "   Testing http://127.0.0.1:8000/health..."
curl -s http://127.0.0.1:8000/health | head -3 || echo "   ❌ API not accessible"
echo ""

echo "   Testing http://127.0.0.1:8000/auth/me..."
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://127.0.0.1:8000/auth/me || echo "   ❌ API not accessible"
echo ""

# 3. Check nginx config is being used
echo "3. Checking which nginx config is being used..."
NGINX_CONFIG="/etc/nginx/sites-available/control"
NGINX_ENABLED="/etc/nginx/sites-enabled/control"

if [ -L "$NGINX_ENABLED" ]; then
    echo "   ✅ Config is enabled via symlink"
    ls -la "$NGINX_ENABLED"
else
    echo "   ⚠️  Config might not be enabled!"
    echo "   Checking if symlink exists..."
    if [ -f "$NGINX_CONFIG" ]; then
        echo "   Creating symlink..."
        sudo ln -sf "$NGINX_CONFIG" "$NGINX_ENABLED"
        echo "   ✅ Symlink created"
    fi
fi
echo ""

# 4. Check for other nginx configs that might interfere
echo "4. Checking for other nginx configs..."
echo "   Enabled sites:"
ls -la /etc/nginx/sites-enabled/ | grep -v "^total"
echo ""

echo "   Looking for other configs with control.petrodealhub.com:"
grep -r "control.petrodealhub.com" /etc/nginx/ 2>/dev/null | grep -v ".backup" | head -10
echo ""

# 5. Test nginx location matching
echo "5. Testing nginx location block matching..."
echo "   Showing nginx config for control.petrodealhub.com:"
sudo grep -A 10 "server_name.*control.petrodealhub.com" /etc/nginx/sites-available/control | head -20
echo ""

echo "   Showing all location blocks:"
sudo grep -n "location" /etc/nginx/sites-available/control
echo ""

# 6. Check nginx access log for the requests
echo "6. Checking nginx access log for recent requests..."
if [ -f "/var/log/nginx/access.log" ]; then
    echo "   Recent requests to control.petrodealhub.com:"
    sudo tail -20 /var/log/nginx/access.log | grep "control.petrodealhub.com" | tail -5 || echo "   No recent requests found"
else
    echo "   ⚠️  Access log not found"
fi
echo ""

# 7. Check nginx error log for NEW errors
echo "7. Checking for NEW errors in nginx error log..."
echo "   Latest errors (last 10 lines):"
sudo tail -10 /var/log/nginx/error.log
echo ""

# 8. Test with verbose curl to see what nginx returns
echo "8. Testing with verbose curl..."
echo "   Testing /health endpoint:"
curl -v -k https://control.petrodealhub.com/health 2>&1 | grep -E "< HTTP|< Location|404" | head -5
echo ""

# 9. Check if nginx is actually serving from the right config
echo "9. Checking nginx server blocks order..."
echo "   Testing which server block matches:"
sudo nginx -T 2>/dev/null | grep -A 3 "server_name.*control.petrodealhub.com" | head -20
echo ""

# 10. Try direct curl to see response
echo "10. Direct endpoint test..."
echo "    /health:"
HEALTH_BODY=$(curl -s -k https://control.petrodealhub.com/health 2>&1)
HEALTH_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/health 2>&1)
echo "    Status: $HEALTH_CODE"
echo "    Body: $HEALTH_BODY"
echo ""

echo "    /auth/me:"
AUTH_BODY=$(curl -s -k https://control.petrodealhub.com/auth/me 2>&1)
AUTH_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/auth/me 2>&1)
echo "    Status: $AUTH_CODE"
echo "    Body: $AUTH_BODY"
echo ""

# 11. Check if the response is from nginx or API
echo "11. Analyzing response..."
if echo "$HEALTH_BODY" | grep -q "nginx\|Not Found"; then
    echo "    ⚠️  /health response appears to be from nginx (404 page), not API"
    echo "    This means nginx is not proxying the request"
elif echo "$HEALTH_BODY" | grep -q "status\|running\|OK"; then
    echo "    ✅ /health response appears to be from API"
fi

if echo "$AUTH_BODY" | grep -q "nginx\|Not Found"; then
    echo "    ⚠️  /auth/me response appears to be from nginx (404 page), not API"
    echo "    This means nginx is not proxying the request"
elif echo "$AUTH_BODY" | grep -q "authenticated\|user\|401"; then
    echo "    ✅ /auth/me response appears to be from API"
fi
echo ""

echo "=========================================="
echo "DEBUG COMPLETE"
echo "=========================================="
echo ""
echo "If endpoints still return 404 from nginx (not API), possible causes:"
echo "  1. Location blocks not matching (check order)"
echo "  2. Another server block matching first"
echo "  3. Nginx config not being used"
echo "  4. Default server block matching instead"
echo ""
