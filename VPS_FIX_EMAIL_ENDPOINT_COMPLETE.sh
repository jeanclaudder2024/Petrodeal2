#!/bin/bash
# Complete Fix for Email Test Connection 404 Error

echo "🔧 Complete Email Endpoint Fix for VPS"
echo "========================================"

cd /opt/petrodealhub || exit 1

echo ""
echo "📥 Step 1: Pulling latest code..."
git pull origin main

echo ""
echo "📦 Step 2: Updating document-processor submodule..."
cd document-processor
git pull origin master
cd ..

echo ""
echo "🔄 Step 3: Restarting Python backend..."
pm2 restart python-api 2>/dev/null || pm2 restart all

echo ""
echo "⏳ Step 4: Waiting 5 seconds for backend to start..."
sleep 5

echo ""
echo "🧪 Step 5: Testing endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:8000/email/test-smtp \
  -H "Content-Type: application/json" \
  -d '{"host":"test","port":587,"username":"test","password":"test","enableTLS":true}')

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success\|error\|Authentication\|Connection"; then
    echo ""
    echo "✅ SUCCESS! Endpoint is working!"
    echo "   You should see a JSON response (even if connection fails, that's OK)"
    echo "   The endpoint exists and is responding."
else
    echo ""
    echo "❌ Still getting 404. Checking logs..."
    echo ""
    echo "📋 PM2 Status:"
    pm2 list
    echo ""
    echo "📋 Last 20 lines of Python API logs:"
    pm2 logs python-api --lines 20 --nostream || echo "Could not get logs"
    echo ""
    echo "🔍 Checking if endpoint exists in main.py:"
    grep -n "email/test-smtp" document-processor/main.py || echo "❌ Endpoint not found in document-processor/main.py"
fi

echo ""
echo "✅ Fix script completed!"
echo ""
echo "Next steps:"
echo "1. If endpoint is working, test from browser: Admin Panel → Email Config → Test Connection"
echo "2. If still 404, check PM2 logs: pm2 logs python-api"
echo "3. Verify PM2 is using correct file: pm2 info python-api"

