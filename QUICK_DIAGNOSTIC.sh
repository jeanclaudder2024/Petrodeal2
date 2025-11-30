#!/bin/bash
# Quick 401 Diagnostic - Run this on VPS

cd /opt/petrodealhub

echo "=== 401 Error Quick Diagnostic ==="
echo ""

# Check .env
echo "1. .env file:"
[ -f .env ] && echo "   ✅ Exists" || echo "   ❌ Missing!"

# Check VITE key
echo ""
echo "2. VITE_SUPABASE_PUBLISHABLE_KEY:"
if grep -q "^VITE_SUPABASE_PUBLISHABLE_KEY=" .env 2>/dev/null; then
    KEY=$(grep "^VITE_SUPABASE_PUBLISHABLE_KEY=" .env | cut -d'=' -f2)
    LEN=${#KEY}
    echo "   ✅ Found (length: $LEN chars)"
    [ $LEN -lt 150 ] && echo "   ⚠️  TOO SHORT! Should be ~200+"
    
    # Test key
    echo ""
    echo "3. Testing API key..."
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $KEY" \
        -H "Authorization: Bearer $KEY" \
        "https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/")
    
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ Key is VALID (200)"
    elif [ "$STATUS" = "401" ]; then
        echo "   ❌ Key is INVALID (401)"
        echo "   📍 Get new key: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api"
    else
        echo "   ⚠️  Status: $STATUS"
    fi
else
    echo "   ❌ MISSING!"
fi

# Check build
echo ""
echo "4. Build status:"
[ -d "dist" ] && echo "   ✅ dist exists" || echo "   ❌ No dist - run: npm run build"

echo ""
echo "=== Fix ==="
echo "If key is invalid (401), get new key from Supabase Dashboard and run:"
echo "  cat > .env << 'EOF'"
echo "  VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co"
echo "  VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_KEY"
echo "  SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co"
echo "  SUPABASE_KEY=YOUR_NEW_KEY"
echo "  EOF"
echo "  npm run build && pm2 restart all"

