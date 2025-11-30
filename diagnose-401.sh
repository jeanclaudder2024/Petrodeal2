#!/bin/bash
# Complete diagnostic script for 401 error

echo "=== 401 Error Diagnostic Tool ==="
echo ""

cd /opt/petrodealhub || { echo "❌ Not in project directory!"; exit 1; }

echo "1. Checking .env file..."
if [ ! -f .env ]; then
    echo "   ❌ .env file NOT found!"
else
    echo "   ✅ .env file exists"
    
    # Check for required variables
    echo ""
    echo "2. Checking required variables..."
    
    if grep -q "^VITE_SUPABASE_URL=" .env; then
        VITE_URL=$(grep "^VITE_SUPABASE_URL=" .env | cut -d'=' -f2)
        echo "   ✅ VITE_SUPABASE_URL exists: $VITE_URL"
    else
        echo "   ❌ VITE_SUPABASE_URL MISSING!"
    fi
    
    if grep -q "^VITE_SUPABASE_PUBLISHABLE_KEY=" .env; then
        VITE_KEY=$(grep "^VITE_SUPABASE_PUBLISHABLE_KEY=" .env | cut -d'=' -f2)
        KEY_LEN=${#VITE_KEY}
        echo "   ✅ VITE_SUPABASE_PUBLISHABLE_KEY exists (length: $KEY_LEN chars)"
        
        if [ $KEY_LEN -lt 150 ]; then
            echo "   ⚠️  WARNING: Key seems too short! Should be ~200+ characters"
        fi
        
        # Check if key ends properly (JWT should end with signature)
        if [[ ! "$VITE_KEY" =~ ^eyJ.*\.[A-Za-z0-9_-]+$ ]]; then
            echo "   ⚠️  WARNING: Key format looks wrong!"
        fi
    else
        echo "   ❌ VITE_SUPABASE_PUBLISHABLE_KEY MISSING!"
    fi
fi

echo ""
echo "3. Testing API key..."
if [ -n "$VITE_KEY" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $VITE_KEY" \
        -H "Authorization: Bearer $VITE_KEY" \
        "https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ API Key is VALID (Status: $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "401" ]; then
        echo "   ❌ API Key is INVALID (Status: $HTTP_CODE)"
        echo "   ⚠️  You need to get a fresh key from Supabase Dashboard!"
        echo "   📍 Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api"
    else
        echo "   ⚠️  Unexpected status: $HTTP_CODE"
    fi
else
    echo "   ⚠️  Cannot test - VITE_SUPABASE_PUBLISHABLE_KEY not found"
fi

echo ""
echo "4. Checking build..."
if [ -d "dist" ]; then
    echo "   ✅ dist folder exists"
    
    # Check if keys are in build
    if grep -r "ozjhdxvwqbzcvcywhwjg" dist/ 2>/dev/null | head -1 > /dev/null; then
        echo "   ✅ Supabase URL found in build"
    else
        echo "   ⚠️  Supabase URL NOT found in build - keys might not be embedded!"
    fi
else
    echo "   ❌ dist folder NOT found - need to run: npm run build"
fi

echo ""
echo "5. Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    pm2 status | grep -q "petrodealhub" && echo "   ✅ PM2 processes running" || echo "   ⚠️  PM2 processes not found"
else
    echo "   ⚠️  PM2 not installed"
fi

echo ""
echo "=== Recommendations ==="
if [ "$HTTP_CODE" = "401" ]; then
    echo "1. ❌ API KEY IS WRONG - Get fresh key from Supabase Dashboard"
    echo "2. Update .env file with new key"
    echo "3. Run: npm run build"
    echo "4. Run: pm2 restart all"
elif [ ! -d "dist" ]; then
    echo "1. Run: npm run build"
    echo "2. Run: pm2 restart all"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API key is valid!"
    echo "If login still fails, check:"
    echo "1. User exists in Supabase Dashboard → Auth → Users"
    echo "2. Clear browser cache completely"
    echo "3. Check browser console for other errors"
fi

echo ""
echo "=== Quick Fix Command ==="
echo "If key is invalid, get new key and run:"
echo "cat > .env << 'EOF'"
echo "VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co"
echo "VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_KEY_HERE"
echo "SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co"
echo "SUPABASE_KEY=YOUR_NEW_KEY_HERE"
echo "EOF"
echo "npm run build && pm2 restart all"

