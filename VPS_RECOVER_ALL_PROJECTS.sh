#!/bin/bash
# Recover all stopped projects and check nginx

set -e

echo "=========================================="
echo "RECOVER ALL PROJECTS"
echo "=========================================="
echo ""

# 1. Check PM2 status
echo "1. Checking PM2 status..."
pm2 list
echo ""

# 2. Check PM2 daemon
echo "2. Starting PM2 daemon if needed..."
pm2 ping || {
    echo "   PM2 daemon not running, starting..."
    pm2 kill || true
    sleep 2
    pm2 resurrect || pm2 list
}
echo ""

# 3. Check for saved PM2 configuration
echo "3. Checking for saved PM2 configuration..."
if [ -f ~/.pm2/dump.pm2 ] || [ -f /root/.pm2/dump.pm2 ]; then
    echo "   Found saved PM2 configuration, restoring..."
    pm2 resurrect || echo "   ⚠️  Could not restore saved configuration"
else
    echo "   ⚠️  No saved PM2 configuration found"
fi
echo ""

# 4. Check for petrodealhub-app (main project)
echo "4. Checking petrodealhub-app (main project)..."
if pm2 list | grep -q "petrodealhub-app"; then
    STATUS=$(pm2 jlist | grep -A 5 "petrodealhub-app" | grep -o '"pm2_env":{[^}]*"status":"[^"]*' | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "unknown")
    if [ "$STATUS" != "online" ]; then
        echo "   petrodealhub-app is not online (status: $STATUS), restarting..."
        pm2 restart petrodealhub-app || pm2 start petrodealhub-app || echo "   ⚠️  Could not restart petrodealhub-app"
    else
        echo "   ✅ petrodealhub-app is running"
    fi
else
    echo "   ⚠️  petrodealhub-app not found in PM2"
    echo "   Checking for start script..."
    if [ -f "/opt/petrodealhub/ecosystem.config.js" ]; then
        echo "   Found ecosystem.config.js, trying to start..."
        cd /opt/petrodealhub
        pm2 start ecosystem.config.js || echo "   ⚠️  Could not start from ecosystem.config.js"
    elif [ -f "/opt/petrodealhub/package.json" ]; then
        echo "   Found package.json, checking for start command..."
        cd /opt/petrodealhub
        pm2 start npm --name petrodealhub-app -- start || pm2 start node --name petrodealhub-app -- server.js || echo "   ⚠️  Could not start petrodealhub-app"
    else
        echo "   ⚠️  Could not find start script for petrodealhub-app"
    fi
fi
echo ""

# 5. Check document-processor API
echo "5. Checking document-processor API..."
if pm2 list | grep -q "python-api"; then
    STATUS=$(pm2 jlist | grep -A 5 "python-api" | grep -o '"pm2_env":{[^}]*"status":"[^"]*' | grep -o '"status":"[^"]*' | cut -d'"' -f4 || echo "unknown")
    if [ "$STATUS" != "online" ]; then
        echo "   python-api is not online (status: $STATUS), restarting..."
        cd /opt/petrodealhub/document-processor
        
        # Find Python executable
        if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
            PYTHON_CMD="venv/bin/python"
        elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
            PYTHON_CMD="../venv/bin/python"
        else
            PYTHON_CMD="python3"
        fi
        
        pm2 restart python-api || pm2 start "$PYTHON_CMD" main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor || {
            echo "   Trying system python3..."
            pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
        }
    else
        echo "   ✅ python-api is running"
    fi
else
    echo "   ⚠️  python-api not found, starting..."
    cd /opt/petrodealhub/document-processor
    
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
fi
echo ""

# 6. List all PM2 processes
echo "6. Current PM2 status:"
pm2 list
echo ""

# 7. Save PM2 configuration
echo "7. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save PM2 configuration"
echo ""

# 8. Check nginx status
echo "8. Checking nginx status..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
elif systemctl is-enabled --quiet nginx; then
    echo "   ⚠️  Nginx is not running but is enabled, starting..."
    sudo systemctl start nginx
    sleep 2
    if systemctl is-active --quiet nginx; then
        echo "   ✅ Nginx started successfully"
    else
        echo "   ❌ Failed to start nginx"
        sudo systemctl status nginx | head -10
    fi
else
    echo "   ⚠️  Nginx is not enabled, checking if it exists..."
    if command -v nginx >/dev/null 2>&1; then
        echo "   Starting nginx..."
        sudo systemctl start nginx || sudo nginx
        sleep 2
        if systemctl is-active --quiet nginx || pgrep -x nginx >/dev/null; then
            echo "   ✅ Nginx started"
        else
            echo "   ❌ Failed to start nginx"
        fi
    else
        echo "   ❌ Nginx not installed"
    fi
fi
echo ""

# 9. Test nginx configuration
echo "9. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is valid"
    sudo nginx -s reload 2>/dev/null || echo "   ⚠️  Could not reload nginx"
else
    echo "   ⚠️  Nginx configuration has errors:"
    sudo nginx -t 2>&1 | head -10
fi
echo ""

# 10. Test endpoints
echo "10. Testing endpoints..."

# Test main site
echo "   Testing main site..."
MAIN_SITE=$(curl -s -o /dev/null -w "%{http_code}" https://petrodealhub.com 2>/dev/null || echo "000")
if [ "$MAIN_SITE" = "200" ] || [ "$MAIN_SITE" = "301" ] || [ "$MAIN_SITE" = "302" ]; then
    echo "   ✅ Main site responding (HTTP $MAIN_SITE)"
else
    echo "   ⚠️  Main site returns HTTP $MAIN_SITE"
fi

# Test control subdomain
echo "   Testing control subdomain..."
CONTROL_SITE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com 2>/dev/null || echo "000")
if [ "$CONTROL_SITE" = "200" ] || [ "$CONTROL_SITE" = "301" ] || [ "$CONTROL_SITE" = "302" ]; then
    echo "   ✅ Control subdomain responding (HTTP $CONTROL_SITE)"
else
    echo "   ⚠️  Control subdomain returns HTTP $CONTROL_SITE"
fi

# Test document-processor API
echo "   Testing document-processor API..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$API_HEALTH" = "200" ]; then
    echo "   ✅ Document-processor API responding (HTTP $API_HEALTH)"
else
    echo "   ⚠️  Document-processor API returns HTTP $API_HEALTH"
fi
echo ""

# 11. Summary
echo "=========================================="
echo "RECOVERY COMPLETE"
echo "=========================================="
echo ""
echo "PM2 Processes:"
pm2 list --no-color | grep -E "id|name|status|online|errored" | head -10
echo ""
echo "Nginx Status:"
systemctl is-active nginx && echo "   ✅ Running" || echo "   ❌ Not running"
echo ""
echo "All services have been checked and restarted as needed."
echo ""
echo "To check logs:"
echo "  pm2 logs"
echo "  pm2 logs petrodealhub-app"
echo "  pm2 logs python-api"
echo "  sudo systemctl status nginx"
echo ""
