#!/bin/bash

# VPS Fix 502 Bad Gateway Script
# This script diagnoses and fixes 502 Bad Gateway errors

set -e

echo "=========================================="
echo "🔍 Diagnosing 502 Bad Gateway Error"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_DIR="/opt/petrodealhub"
SERVICE_NAME="petrodealhub-api"

# Step 1: Check if service exists
echo "📋 Step 1: Checking service status..."
if systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
    echo -e "${GREEN}✓${NC} Service $SERVICE_NAME found"
    
    # Check service status
    SERVICE_STATUS=$(systemctl is-active $SERVICE_NAME 2>/dev/null || echo "inactive")
    echo "   Service status: $SERVICE_STATUS"
    
    if [ "$SERVICE_STATUS" != "active" ]; then
        echo -e "${YELLOW}⚠${NC} Service is not active. Checking logs..."
        
        # Show recent logs
        echo ""
        echo "📋 Recent service logs:"
        echo "----------------------------------------"
        journalctl -u $SERVICE_NAME -n 50 --no-pager | tail -20 || true
        echo "----------------------------------------"
        echo ""
        
        echo -e "${YELLOW}⚠${NC} Attempting to start service..."
        sudo systemctl start $SERVICE_NAME
        sleep 3
        
        if systemctl is-active --quiet $SERVICE_NAME; then
            echo -e "${GREEN}✓${NC} Service started successfully"
        else
            echo -e "${RED}✗${NC} Service failed to start. Checking for errors..."
            
            # Check for syntax errors in Python code
            echo ""
            echo "📋 Checking for Python syntax errors..."
            if [ -f "$APP_DIR/document-processor/main.py" ]; then
                cd "$APP_DIR/document-processor"
                
                # Check if venv exists
                if [ -d "venv" ]; then
                    source venv/bin/activate
                    echo "   Checking Python syntax..."
                    python -m py_compile main.py 2>&1 | head -20 || echo "   Syntax check failed"
                else
                    echo -e "${RED}✗${NC} Virtual environment not found"
                fi
            fi
        fi
    else
        echo -e "${GREEN}✓${NC} Service is running"
    fi
else
    echo -e "${YELLOW}⚠${NC} Service $SERVICE_NAME not found. Checking for PM2 process..."
    
    # Check PM2
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "petrodealhub-api"; then
            echo -e "${GREEN}✓${NC} PM2 process found"
            pm2 status
        else
            echo -e "${RED}✗${NC} No PM2 process found for petrodealhub-api"
        fi
    fi
fi

echo ""
echo "📋 Step 2: Checking if API is listening on port 8000..."
if netstat -tuln 2>/dev/null | grep -q ":8000 " || ss -tuln 2>/dev/null | grep -q ":8000 "; then
    echo -e "${GREEN}✓${NC} Port 8000 is in use"
    
    # Test API endpoint
    echo "   Testing API health endpoint..."
    if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} API health check passed"
        curl -s http://localhost:8000/health | head -5
    else
        echo -e "${RED}✗${NC} API health check failed"
        echo "   Response:"
        curl -s http://localhost:8000/health || echo "   Connection refused"
    fi
else
    echo -e "${RED}✗${NC} Port 8000 is not in use - API is not running"
fi

echo ""
echo "📋 Step 3: Checking Nginx configuration..."
if sudo nginx -t 2>&1; then
    echo -e "${GREEN}✓${NC} Nginx configuration is valid"
else
    echo -e "${RED}✗${NC} Nginx configuration has errors"
    echo "   Fixing configuration..."
    
    # Check if nginx config exists
    if [ -f "/etc/nginx/sites-available/petrodealhub" ]; then
        echo "   Nginx config found at /etc/nginx/sites-available/petrodealhub"
    else
        echo -e "${RED}✗${NC} Nginx config not found"
    fi
fi

echo ""
echo "📋 Step 4: Checking for Python syntax errors..."
if [ -d "$APP_DIR/document-processor" ]; then
    cd "$APP_DIR/document-processor"
    
    # Check if venv exists
    if [ -d "venv" ]; then
        source venv/bin/activate
        
        echo "   Checking main.py syntax..."
        if python -m py_compile main.py 2>&1; then
            echo -e "${GREEN}✓${NC} No syntax errors in main.py"
        else
            echo -e "${RED}✗${NC} Syntax errors found in main.py"
            python -m py_compile main.py 2>&1 | head -20
        fi
        
        # Check imports
        echo "   Checking imports..."
        if python -c "import fastapi, uvicorn, supabase, docx" 2>&1; then
            echo -e "${GREEN}✓${NC} All required modules are available"
        else
            echo -e "${RED}✗${NC} Missing required modules"
            echo "   Installing requirements..."
            pip install -q -r requirements.txt 2>&1 | tail -5 || true
        fi
    else
        echo -e "${RED}✗${NC} Virtual environment not found at $APP_DIR/document-processor/venv"
        echo "   Creating virtual environment..."
        cd "$APP_DIR/document-processor"
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
    fi
else
    echo -e "${RED}✗${NC} Document processor directory not found at $APP_DIR/document-processor"
fi

echo ""
echo "📋 Step 5: Checking environment variables..."
if [ -f "$APP_DIR/document-processor/.env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
    # Don't show sensitive data, just check if file exists
else
    echo -e "${YELLOW}⚠${NC} .env file not found (may be using system environment variables)"
fi

echo ""
echo "=========================================="
echo "🔧 Attempting to fix issues..."
echo "=========================================="

# Fix 1: Restart service
echo ""
echo "🔄 Restarting $SERVICE_NAME service..."
if systemctl list-unit-files | grep -q "$SERVICE_NAME.service"; then
    sudo systemctl stop $SERVICE_NAME 2>/dev/null || true
    sleep 2
    sudo systemctl start $SERVICE_NAME
    sleep 3
    
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo -e "${GREEN}✓${NC} Service restarted successfully"
    else
        echo -e "${RED}✗${NC} Service failed to start. Checking logs:"
        journalctl -u $SERVICE_NAME -n 30 --no-pager | tail -15
    fi
fi

# Fix 2: Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓${NC} Nginx reloaded"
else
    echo -e "${RED}✗${NC} Cannot reload Nginx - configuration has errors"
    sudo nginx -t
fi

# Fix 3: Test API again
echo ""
echo "🔄 Testing API endpoint again..."
sleep 2
if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} API is responding correctly"
    echo "   Health check response:"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo -e "${RED}✗${NC} API is still not responding"
    echo ""
    echo "📋 Manual steps to fix:"
    echo "   1. Check service logs: sudo journalctl -u $SERVICE_NAME -f"
    echo "   2. Check if port is in use: sudo netstat -tuln | grep 8000"
    echo "   3. Try starting manually: cd $APP_DIR/document-processor && source venv/bin/activate && python main.py"
    echo "   4. Check for errors in main.py syntax"
fi

echo ""
echo "=========================================="
echo "✅ Diagnostic Complete"
echo "=========================================="
echo ""
echo "📋 Current status:"
echo "   - Service: $(systemctl is-active $SERVICE_NAME 2>/dev/null || echo 'not found')"
echo "   - Port 8000: $(netstat -tuln 2>/dev/null | grep -q ':8000 ' && echo 'in use' || echo 'not in use')"
echo "   - Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'not active')"
echo ""
echo "📋 If still experiencing issues, check:"
echo "   - Service logs: sudo journalctl -u $SERVICE_NAME -n 100"
echo "   - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   - API directly: curl http://localhost:8000/health"
echo ""

