#!/bin/bash
# Check status after fix

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "STATUS CHECK AFTER FIX"
echo "=========================================="
echo ""

# 1. Check Python syntax
echo "1. Checking Python syntax..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Python syntax errors found!"
    python3 -m py_compile main.py 2>&1 | head -10
fi
echo ""

# 2. Check PM2 status
echo "2. Checking PM2 status..."
pm2 status python-api
echo ""

# 3. Check API logs
echo "3. Checking API error logs (last 30 lines)..."
pm2 logs python-api --err --lines 30 --nostream
echo ""

# 4. Test API health
echo "4. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is NOT responding on port 8000"
fi
echo ""

# 5. Check if port 8000 is in use
echo "5. Checking port 8000..."
if netstat -tlnp 2>/dev/null | grep -q ":8000 " || ss -tlnp 2>/dev/null | grep -q ":8000 "; then
    echo "   ✅ Port 8000 is in use"
    netstat -tlnp 2>/dev/null | grep ":8000 " || ss -tlnp 2>/dev/null | grep ":8000 "
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 6. Check nginx
echo "6. Checking nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is not running"
fi
echo ""

echo "=========================================="
echo "SUMMARY"
echo "=========================================="
echo ""
echo "If syntax check passed but API is not working:"
echo "  - Restart API: pm2 restart python-api"
echo "  - Check logs: pm2 logs python-api --err --lines 50"
echo ""
echo "If API is working but CMS still shows 502:"
echo "  - Check nginx: systemctl status nginx"
echo "  - Check nginx config: nginx -t"
echo "  - Restart nginx: systemctl restart nginx"
echo ""
