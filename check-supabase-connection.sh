#!/bin/bash
# Quick diagnostic script to check Supabase connection

echo "=== Supabase Connection Diagnostic ==="
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo "---"
    grep -E "VITE_SUPABASE|SUPABASE" .env | sed 's/=.*/=***HIDDEN***/'
    echo "---"
else
    echo "❌ .env file NOT found"
fi

echo ""
echo "=== Checking Supabase URL ==="
SUPABASE_URL="https://ozjhdxvwqbzcvcywhwjg.supabase.co"
echo "Testing: $SUPABASE_URL"

# Test if URL is reachable
if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" | grep -q "200\|401"; then
    echo "✅ Supabase URL is reachable"
else
    echo "❌ Supabase URL is NOT reachable"
fi

echo ""
echo "=== Build Check ==="
if [ -d "dist" ]; then
    echo "✅ dist folder exists"
    echo "Files in dist:"
    ls -la dist/ | head -5
else
    echo "❌ dist folder NOT found - need to run: npm run build"
fi

echo ""
echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "PM2 not running"

echo ""
echo "=== Quick Fix Commands ==="
echo "1. git pull origin main"
echo "2. npm run build"
echo "3. pm2 restart all"
echo "4. Clear browser cache (Ctrl+Shift+Delete)"

