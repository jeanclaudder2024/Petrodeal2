#!/bin/bash
# Diagnose 502 Bad Gateway error

echo "=========================================="
echo "Diagnosing 502 Bad Gateway Error"
echo "=========================================="
echo ""

echo "1. Checking PM2 status..."
pm2 list
echo ""

echo "2. Checking if API is running on port 8000..."
if netstat -tulpn 2>/dev/null | grep -q ":8000"; then
    echo "   ✅ Port 8000 is in use"
    netstat -tulpn 2>/dev/null | grep ":8000"
else
    echo "   ❌ Port 8000 is NOT in use - API is not running!"
fi
echo ""

echo "3. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is responding!"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is NOT responding!"
    echo "   Error details:"
    curl -v http://localhost:8000/health 2>&1 | head -10
fi
echo ""

echo "4. Checking PM2 logs for errors..."
pm2 logs python-api --err --lines 30 --nostream
echo ""

echo "5. Checking PM2 output logs..."
pm2 logs python-api --out --lines 20 --nostream
echo ""

echo "6. Checking if Python process is actually running..."
ps aux | grep "[p]ython.*main.py" || echo "   ❌ No Python process found running main.py"
echo ""

echo "7. Checking Nginx configuration..."
echo "   Checking if nginx can reach backend..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is NOT running!"
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If port 8000 is not in use:"
echo "  → The API is not running - restart it with: pm2 restart python-api"
echo ""
echo "If port 8000 is in use but curl fails:"
echo "  → The API is running but not responding - check PM2 logs"
echo ""
echo "If PM2 shows 'online' but curl fails:"
echo "  → The API might be crashing immediately - check error logs"
echo ""
