#!/bin/bash
# Fix 502 Bad Gateway error for document-processor API

set -e

echo "=========================================="
echo "FIX 502 BAD GATEWAY ERROR"
echo "=========================================="
echo ""

# 1. Check PM2 status
echo "1. Checking python-api status..."
pm2 status python-api
echo ""

# 2. Check if API is responding on localhost
echo "2. Testing API on localhost:8000..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding on localhost:8000 (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is NOT responding on localhost:8000 (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 30 --nostream | tail -20
    echo ""
    echo "   Attempting to restart API..."
    cd /opt/petrodealhub/document-processor
    
    # Stop all python-api processes
    pm2 delete python-api 2>/dev/null || true
    sleep 2
    
    # Start fresh
    if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
        PYTHON_CMD="venv/bin/python"
    elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
        PYTHON_CMD="../venv/bin/python"
    else
        PYTHON_CMD="python3"
    fi
    
    pm2 start "$PYTHON_CMD" main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor || {
        pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
    }
    
    sleep 5
    
    # Test again
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ API is now responding after restart"
    else
        echo "   ❌ API still not responding"
        echo "   Checking for errors..."
        pm2 logs python-api --lines 20 --nostream | tail -10
    fi
fi
echo ""

# 3. Check nginx error log
echo "3. Checking nginx error log for 502 errors..."
if [ -f /var/log/nginx/error.log ]; then
    RECENT_502=$(sudo tail -50 /var/log/nginx/error.log | grep -i "502\|bad gateway\|upstream\|connection refused" | tail -10 || true)
    if [ -n "$RECENT_502" ]; then
        echo "   Recent 502 errors:"
        echo "$RECENT_502" | while read line; do
            echo "   $line"
        done
    else
        echo "   ✅ No recent 502 errors in log"
    fi
else
    echo "   ⚠️  Nginx error log not found"
fi
echo ""

# 4. Check nginx configuration for /cms/ location
echo "4. Checking nginx configuration for /cms/ location..."
NGINX_CONFIG="/etc/nginx/sites-available/control"
if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "location /cms" "$NGINX_CONFIG"; then
        echo "   ✅ /cms/ location block found"
        echo "   Configuration:"
        grep -A 10 "location /cms" "$NGINX_CONFIG" | head -12
        
        # Check if it's proxying correctly
        if grep -A 10 "location /cms" "$NGINX_CONFIG" | grep -q "proxy_pass.*localhost:8000"; then
            echo "   ✅ Correctly configured to proxy to localhost:8000"
        else
            echo "   ⚠️  May not be correctly configured to proxy to localhost:8000"
            echo "   Current proxy_pass setting:"
            grep -A 10 "location /cms" "$NGINX_CONFIG" | grep "proxy_pass" || echo "   Not found"
        fi
    else
        echo "   ❌ /cms/ location block NOT found!"
        echo "   Adding /cms/ location block..."
        
        # Find where to insert it (after other location blocks)
        INSERT_AFTER=$(grep -n "location /health\|location /api\|location /templates" "$NGINX_CONFIG" | tail -1 | cut -d: -f1 || echo "0")
        
        if [ "$INSERT_AFTER" != "0" ]; then
            # Insert after this line
            CMS_BLOCK='    # CMS static files
    location /cms {
        alias /opt/petrodealhub/document-processor/cms;
        try_files $uri $uri/ /cms/index.html;
        index index.html;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }'
            
            sudo sed -i "${INSERT_AFTER}a\\$CMS_BLOCK" "$NGINX_CONFIG"
            echo "   ✅ Added /cms/ location block"
        else
            echo "   ⚠️  Could not find insertion point, manual configuration needed"
        fi
    fi
else
    echo "   ❌ Nginx config file not found at $NGINX_CONFIG"
fi
echo ""

# 5. Check if CMS directory exists
echo "5. Checking if CMS directory exists..."
if [ -d "/opt/petrodealhub/document-processor/cms" ]; then
    echo "   ✅ CMS directory exists"
    echo "   Contents:"
    ls -la /opt/petrodealhub/document-processor/cms/ | head -10
else
    echo "   ❌ CMS directory NOT found!"
    echo "   Checking document-processor directory..."
    ls -la /opt/petrodealhub/document-processor/ | head -10
fi
echo ""

# 6. Test nginx configuration
echo "6. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
    sudo systemctl reload nginx || sudo systemctl restart nginx
    echo "   ✅ Nginx reloaded"
else
    echo "   ❌ Nginx configuration has errors:"
    sudo nginx -t 2>&1 | head -10
fi
echo ""

# 7. Test /cms/ endpoint
echo "7. Testing /cms/ endpoint..."
sleep 2
CMS_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/cms/ 2>/dev/null || echo "000")
if [ "$CMS_CODE" = "200" ] || [ "$CMS_CODE" = "301" ] || [ "$CMS_CODE" = "302" ]; then
    echo "   ✅ /cms/ endpoint is responding (HTTP $CMS_CODE)"
else
    echo "   ❌ /cms/ endpoint returns HTTP $CMS_CODE"
    
    # Check if API is the issue
    if [ "$CMS_CODE" = "502" ]; then
        echo "   502 Bad Gateway - nginx cannot reach the API"
        echo "   Checking if API process is running..."
        if pgrep -f "python.*main.py" > /dev/null || pgrep -f "python3.*main.py" > /dev/null; then
            echo "   ✅ Python process is running"
        else
            echo "   ❌ Python process is NOT running!"
            echo "   Starting API..."
            cd /opt/petrodealhub/document-processor
            if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
                PYTHON_CMD="venv/bin/python"
            else
                PYTHON_CMD="python3"
            fi
            pm2 start "$PYTHON_CMD" main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
            sleep 5
        fi
    fi
fi
echo ""

# 8. Check port 8000
echo "8. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   ✅ Port 8000 is in use"
    echo "   Process using port 8000:"
    lsof -i:8000 2>/dev/null | head -3 || netstat -tulpn 2>/dev/null | grep ":8000" | head -2
else
    echo "   ❌ Port 8000 is NOT in use!"
    echo "   API is not listening on port 8000"
fi
echo ""

# 9. Final test
echo "9. Final verification..."
echo "   Testing localhost:8000/health..."
LOCAL_HEALTH=$(curl -s http://localhost:8000/health 2>/dev/null || echo "ERROR")
if echo "$LOCAL_HEALTH" | grep -q "healthy\|status"; then
    echo "   ✅ API is healthy on localhost:8000"
else
    echo "   ❌ API is not healthy: $LOCAL_HEALTH"
fi

echo "   Testing https://control.petrodealhub.com/cms/..."
CMS_FINAL=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/cms/ 2>/dev/null || echo "000")
if [ "$CMS_FINAL" = "200" ]; then
    echo "   ✅ CMS endpoint is working (HTTP $CMS_FINAL)"
else
    echo "   ⚠️  CMS endpoint returns HTTP $CMS_FINAL"
fi
echo ""

# 10. Summary
echo "=========================================="
echo "502 FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  PM2 python-api: $(pm2 jlist | grep -A 3 python-api | grep status | head -1 | cut -d'"' -f4 || echo 'unknown')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo 'in use' || echo 'not in use')"
echo "  Nginx: $(systemctl is-active nginx && echo 'running' || echo 'not running')"
echo "  /cms/ endpoint: HTTP $CMS_FINAL"
echo ""
echo "If 502 persists, check:"
echo "  pm2 logs python-api"
echo "  sudo tail -f /var/log/nginx/error.log"
echo "  curl http://localhost:8000/health"
echo ""
