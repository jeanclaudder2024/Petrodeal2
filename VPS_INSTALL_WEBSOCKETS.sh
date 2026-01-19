#!/bin/bash
# Install missing websockets module

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Installing Missing websockets Module"
echo "=========================================="
echo ""

# Activate venv
source venv/bin/activate

echo "1. Installing websockets..."
pip install websockets
if [ $? -eq 0 ]; then
    echo "   ✅ websockets installed"
else
    echo "   ❌ Failed to install websockets"
    exit 1
fi
echo ""

echo "2. Verifying websockets is installed..."
python -c "import websockets; print('✅ websockets can be imported')" 2>&1
if [ $? -ne 0 ]; then
    echo "   ❌ websockets still not working"
    exit 1
fi
echo ""

echo "3. Checking Supabase can import..."
python -c "from supabase import create_client, Client; print('✅ Supabase can be imported')" 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Supabase import works"
else
    echo "   ⚠️  Supabase still has issues, but continuing..."
fi
echo ""

echo "4. Restarting API..."
pm2 restart python-api
echo "   ✅ Restart command sent"
echo ""

echo "5. Waiting 5 seconds..."
sleep 5

echo "6. Testing API..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is working!"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API still not responding"
    echo ""
    echo "   Check logs:"
    pm2 logs python-api --err --lines 15 --nostream
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
