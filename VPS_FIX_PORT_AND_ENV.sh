#!/bin/bash
# Fix Port 8000 and .env encoding issues on VPS

set -e

echo "🔧 Fixing Port 8000 and .env encoding issues..."

# Step 1: Stop PM2 app to prevent restart loop
echo "📛 Stopping PM2 python-api..."
pm2 stop python-api 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true

# Step 2: Kill any process using port 8000
echo "🔪 Killing processes on port 8000..."
sudo fuser -k 8000/tcp 2>/dev/null || true
sleep 2

# Verify port is free
if sudo lsof -i :8000 >/dev/null 2>&1; then
    echo "⚠️  Port 8000 still in use. Trying more aggressive kill..."
    PID=$(sudo lsof -ti :8000)
    if [ ! -z "$PID" ]; then
        sudo kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
fi

# Step 3: Fix .env file encoding
echo "📝 Fixing .env file encoding..."
cd /opt/petrodealhub/document-processor || {
    echo "❌ Error: Cannot find /opt/petrodealhub/document-processor"
    exit 1
}

if [ -f .env ]; then
    # Backup
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    
    # Remove BOM if present
    sed -i '1s/^\xEF\xBB\xBF//' .env 2>/dev/null || true
    
    # Check if file is valid UTF-8
    if ! iconv -f UTF-8 -t UTF-8 .env >/dev/null 2>&1; then
        echo "⚠️  .env file has encoding issues. Attempting to fix..."
        # Try to convert from UTF-16 if that's what it is
        if file .env | grep -q "UTF-16"; then
            iconv -f UTF-16LE -t UTF-8 .env > .env.utf8 2>/dev/null && mv .env.utf8 .env || true
        fi
    fi
    
    echo "✅ .env file processed"
else
    echo "⚠️  .env file not found. Creating a basic one..."
    cat > .env << 'EOF'
# Document Processor Environment Variables
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
fi

# Step 4: Verify port is free
echo "🔍 Verifying port 8000 is free..."
if sudo lsof -i :8000 >/dev/null 2>&1; then
    echo "❌ ERROR: Port 8000 is still in use!"
    echo "   Run: sudo lsof -i :8000"
    exit 1
fi
echo "✅ Port 8000 is free"

# Step 5: Start API with PM2
echo "🚀 Starting python-api with PM2..."

# Check if ecosystem.config.cjs exists
if [ -f ecosystem.config.cjs ]; then
    pm2 start ecosystem.config.cjs --only python-api
elif [ -f ecosystem.config.js ]; then
    pm2 start ecosystem.config.js --only python-api
else
    # Start manually
    pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name python-api
fi

# Wait a moment
sleep 3

# Step 6: Verify it's running
echo "✅ Checking status..."
pm2 status python-api

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -s http://localhost:8000/health >/dev/null; then
    echo "✅ API is responding!"
    curl -s http://localhost:8000/health | head -3
else
    echo "⚠️  API health check failed. Check logs: pm2 logs python-api"
fi

# Save PM2 config
pm2 save

echo ""
echo "✅ Done! Check logs with: pm2 logs python-api"
