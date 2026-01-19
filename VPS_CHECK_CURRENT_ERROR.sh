#!/bin/bash
# Check what error is preventing the API from starting

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Checking Current API Error"
echo "=========================================="
echo ""

echo "1. Checking PM2 error logs (last 30 lines):"
pm2 logs python-api --err --lines 30 --nostream
echo ""

echo "2. Checking if aiohttp is actually installed:"
source venv/bin/activate
python -c "import aiohttp; print('✅ aiohttp is installed')" 2>&1 || echo "❌ aiohttp is NOT installed"
echo ""

echo "3. Testing if main.py can import all modules:"
python -c "import sys; sys.path.insert(0, '.'); import main" 2>&1 | head -20
echo ""

echo "4. Checking port 8000:"
netstat -tulpn 2>/dev/null | grep ":8000" || echo "   ❌ Port 8000 is not in use"
echo ""

echo "5. Try starting manually (will show error):"
echo "   (Press Ctrl+C after 3 seconds if it hangs)"
timeout 3 python main.py 2>&1 || echo "   (Timeout or error occurred)"
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Check the error logs above to see what's wrong."
echo ""
