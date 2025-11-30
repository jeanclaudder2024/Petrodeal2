#!/bin/bash
# Quick fix script for 401 Unauthorized error

echo "=== Fixing 401 Unauthorized Error ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Frontend Supabase Keys (REQUIRED for login)
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q

# Backend Supabase Keys
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
    echo "✅ .env file created"
else
    echo "✅ .env file exists"
    
    # Check if VITE_SUPABASE_PUBLISHABLE_KEY exists
    if ! grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
        echo "⚠️  Missing VITE_SUPABASE_PUBLISHABLE_KEY in .env"
        echo "Adding it now..."
        echo "" >> .env
        echo "VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co" >> .env
        echo "VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q" >> .env
        echo "✅ Added VITE_SUPABASE_PUBLISHABLE_KEY"
    else
        echo "✅ VITE_SUPABASE_PUBLISHABLE_KEY exists"
    fi
fi

echo ""
echo "=== Testing API Key ==="
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $KEY" \
  -H "Authorization: Bearer $KEY" \
  "https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Key is VALID (Status: $HTTP_CODE)"
else
    echo "❌ API Key is INVALID (Status: $HTTP_CODE)"
    echo "⚠️  You need to get a fresh key from Supabase Dashboard"
    echo "   Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api"
fi

echo ""
echo "=== Rebuilding Frontend ==="
echo "This will embed the API keys into the build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo ""
    echo "=== Restarting Services ==="
    pm2 restart all
    echo "✅ Services restarted"
    echo ""
    echo "🎉 Fix complete! Clear browser cache and try logging in again."
else
    echo "❌ Build failed. Check the errors above."
fi

