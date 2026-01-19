#!/bin/bash
# Check why API is not responding even though PM2 shows it as online

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Checking Why API is Not Responding"
echo "=========================================="
echo ""

echo "1. PM2 Status:"
pm2 status python-api
echo ""

echo "2. Checking PM2 Error Logs (last 30 lines):"
pm2 logs python-api --err --lines 30 --nostream
echo ""

echo "3. Checking PM2 Output Logs (last 20 lines):"
pm2 logs python-api --out --lines 20 --nostream
echo ""

echo "4. Checking if process is actually running:"
ps aux | grep "[p]ython.*main.py"
echo ""

echo "5. Checking port 8000:"
netstat -tulpn 2>/dev/null | grep ":8000" || echo "   ❌ Port 8000 is not in use"
echo ""

echo "6. Testing API directly:"
curl -v http://localhost:8000/health 2>&1 | head -15
echo ""

echo "7. Checking if there are startup errors:"
# Try to start manually to see errors
echo "   Attempting manual start (will timeout after 3 seconds)..."
timeout 3 python main.py 2>&1 || echo "   (Process stopped after 3 seconds or error occurred)"
echo ""

echo "8. Checking main.py syntax one more time:"
source venv/bin/activate
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Syntax is correct"
else
    echo "   ❌ Syntax error still exists!"
fi
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If PM2 shows 'online' but port 8000 is not in use:"
echo "  → API is crashing immediately - check error logs above"
echo ""
echo "If there are syntax errors in logs:"
echo "  → Fix the syntax errors and restart"
echo ""
echo "If API starts manually but PM2 fails:"
echo "  → PM2 configuration issue - check ecosystem.config.js"
echo ""
