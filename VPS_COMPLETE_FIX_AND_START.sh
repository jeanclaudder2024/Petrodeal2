#!/bin/bash
# Complete fix: Install missing dependencies and restart API

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Complete Fix: Install Dependencies & Start API"
echo "=========================================="
echo ""

# Activate venv
echo "1. Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"
echo ""

# Install missing aiohttp
echo "2. Installing missing aiohttp module..."
pip install aiohttp
if [ $? -eq 0 ]; then
    echo "   ✅ aiohttp installed"
else
    echo "   ❌ Failed to install aiohttp"
    exit 1
fi
echo ""

# Verify it's installed
echo "3. Verifying aiohttp is installed..."
python -c "import aiohttp" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ aiohttp can be imported"
else
    echo "   ❌ aiohttp still not working"
    exit 1
fi
echo ""

# Stop and delete existing API process
echo "4. Stopping existing API process..."
pm2 delete python-api 2>/dev/null || pm2 stop python-api 2>/dev/null || true
echo "   ✅ Stopped"
echo ""

# Start API
echo "5. Starting API..."
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ Started"
echo ""

# Wait for startup
echo "6. Waiting 5 seconds for API to start..."
sleep 5
echo ""

# Check PM2 status
echo "7. Checking PM2 status..."
pm2 status python-api
echo ""

# Test API
echo "8. Testing API..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is working!"
    echo ""
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is still not responding"
    echo ""
    echo "   Checking error logs..."
    pm2 logs python-api --err --lines 20 --nostream
    echo ""
    echo "   Try starting manually to see the error:"
    echo "   cd /opt/petrodealhub/document-processor"
    echo "   source venv/bin/activate"
    echo "   python main.py"
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
