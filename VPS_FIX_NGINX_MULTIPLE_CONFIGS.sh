#!/bin/bash
# Disable duplicate nginx configs and ensure only one is active

set -e

echo "=========================================="
echo "FIX MULTIPLE NGINX CONFIGS"
echo "=========================================="
echo ""

# 1. List all enabled configs
echo "1. Current enabled configs:"
ls -la /etc/nginx/sites-enabled/ | grep -E "control|petrodealhub"
echo ""

# 2. Disable duplicate configs
echo "2. Disabling duplicate configs..."
cd /etc/nginx/sites-enabled/

# Keep only 'control', disable others
if [ -L "control.petrodealhub.com" ]; then
    echo "   Disabling control.petrodealhub.com..."
    sudo rm -f control.petrodealhub.com
    echo "   ✅ Disabled control.petrodealhub.com"
fi

if [ -L "control-petrodealhub" ]; then
    echo "   Disabling control-petrodealhub..."
    sudo rm -f control-petrodealhub
    echo "   ✅ Disabled control-petrodealhub"
fi

# Ensure 'control' is enabled
if [ ! -L "control" ]; then
    echo "   Enabling control config..."
    sudo ln -sf /etc/nginx/sites-available/control control
    echo "   ✅ Enabled control config"
fi

echo ""
echo "   Enabled configs after cleanup:"
ls -la /etc/nginx/sites-enabled/ | grep -E "control|petrodealhub"
echo ""

# 3. Verify the control config has correct location blocks
echo "3. Verifying control config has correct location blocks..."
NGINX_CONFIG="/etc/nginx/sites-available/control"

if grep -q "location /health" "$NGINX_CONFIG" && grep -q "location /auth/" "$NGINX_CONFIG"; then
    echo "   ✅ Location blocks are present"
else
    echo "   ❌ Location blocks are missing!"
    echo "   Re-running clean config script..."
    # Re-run the clean config script
    cd /opt/petrodealhub
    if [ -f "VPS_CLEAN_NGINX_CONFIG.sh" ]; then
        sudo ./VPS_CLEAN_NGINX_CONFIG.sh
    fi
fi
echo ""

# 4. Test nginx configuration
echo "4. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1
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
echo "   Testing https://control.petrodealhub.com/health..."
HEALTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/health 2>/dev/null || echo "000")
HEALTH_BODY=$(curl -s -k https://control.petrodealhub.com/health 2>/dev/null || echo "")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ /health endpoint works (200)"
    echo "   Response: $HEALTH_BODY" | head -1
elif echo "$HEALTH_BODY" | grep -q "detail.*Not Found"; then
    echo "   ⚠️  /health returns 404 from API (not nginx)"
    echo "   This means nginx is proxying, but API route might be wrong"
    echo "   Checking if API has /health endpoint..."
    curl -s http://127.0.0.1:8000/health | head -1
else
    echo "   ❌ /health returned $HEALTH_RESPONSE"
    echo "   Response: $HEALTH_BODY"
fi

echo ""
echo "   Testing https://control.petrodealhub.com/auth/me..."
AUTH_RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/auth/me 2>/dev/null || echo "000")
AUTH_BODY=$(curl -s -k https://control.petrodealhub.com/auth/me 2>/dev/null || echo "")

if [ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]; then
    echo "   ✅ /auth/me endpoint works ($AUTH_RESPONSE)"
elif echo "$AUTH_BODY" | grep -q "detail.*Not Found"; then
    echo "   ⚠️  /auth/me returns 404 from API (not nginx)"
    echo "   This means nginx is proxying, but API route might be wrong"
    echo "   Checking if API has /auth/me endpoint..."
    curl -s -o /dev/null -w "   Direct API: %{http_code}\n" http://127.0.0.1:8000/auth/me
else
    echo "   ❌ /auth/me returned $AUTH_RESPONSE"
    echo "   Response: $AUTH_BODY"
fi
echo ""

# 8. Check which server block nginx is using
echo "8. Checking which server block nginx is using..."
sudo nginx -T 2>/dev/null | grep -B 5 -A 15 "server_name.*control.petrodealhub.com" | head -30
echo ""

# 9. Final summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""

if [ "$HEALTH_RESPONSE" = "200" ] && ([ "$AUTH_RESPONSE" = "401" ] || [ "$AUTH_RESPONSE" = "200" ]); then
    echo "🎉 ALL ENDPOINTS ARE NOW WORKING!"
    echo ""
    echo "✅ /health: $HEALTH_RESPONSE"
    echo "✅ /auth/me: $AUTH_RESPONSE"
    echo ""
    echo "The CMS should now work correctly!"
else
    echo "⚠️  Some endpoints may still have issues"
    echo "   /health: $HEALTH_RESPONSE (expected: 200)"
    echo "   /auth/me: $AUTH_RESPONSE (expected: 401 or 200)"
    echo ""
    if echo "$HEALTH_BODY" | grep -q "detail.*Not Found"; then
        echo "   The 404 is coming from the API, not nginx."
        echo "   This means nginx is proxying correctly, but the API route might be wrong."
        echo "   Check if the API endpoints exist at the expected paths."
    fi
fi
echo ""
