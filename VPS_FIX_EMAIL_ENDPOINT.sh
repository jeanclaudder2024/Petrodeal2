#!/bin/bash
# Fix Email Test Endpoint 404 Error on VPS

echo "🔧 Fixing Email Test Endpoint..."

# Navigate to project
cd /opt/petrodealhub || exit 1

echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "🔄 Restarting Python backend..."
pm2 restart python-api || pm2 restart all

echo ""
echo "⏳ Waiting 3 seconds for backend to start..."
sleep 3

echo ""
echo "🧪 Testing endpoint..."
curl -X POST http://localhost:8000/email/test-smtp \
  -H "Content-Type: application/json" \
  -d '{"host":"test","port":587,"username":"test","password":"test","enableTLS":true}'

echo ""
echo ""
echo "✅ Done! If you see a JSON response (not 404), the endpoint is working."
echo "   If still 404, check:"
echo "   1. pm2 logs python-api"
echo "   2. Make sure main.py has the email endpoints"

