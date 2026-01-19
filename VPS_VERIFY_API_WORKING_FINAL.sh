#!/bin/bash
# Verify API is working after email_service.py removal

echo "=========================================="
echo "Verifying API is Working"
echo "=========================================="
echo ""

echo "1. Checking PM2 status..."
pm2 status python-api
echo ""

echo "2. Checking if API is responding on port 8000..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -10
else
    echo "   ❌ API is NOT responding on port 8000"
    echo ""
    echo "3. Checking error logs..."
    pm2 logs python-api --err --lines 20 --nostream
    echo ""
    echo "   The API might still be starting up or there's an error."
fi
echo ""

echo "4. Checking port 8000..."
netstat -tulpn 2>/dev/null | grep ":8000" || echo "   ❌ Port 8000 is not in use"
echo ""

echo "5. Testing API endpoint..."
curl -s http://localhost:8000/health 2>&1 | head -5
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API is WORKING!"
    echo ""
    echo "You can now access your CMS without 502 error."
    echo "Test the API: curl http://localhost:8000/health"
else
    echo "❌ API is still not responding"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 30"
    echo ""
    echo "Or try starting manually:"
    echo "  cd /opt/petrodealhub/document-processor"
    echo "  source venv/bin/activate"
    echo "  python main.py"
fi
echo ""
