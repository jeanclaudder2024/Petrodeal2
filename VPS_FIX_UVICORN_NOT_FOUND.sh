#!/bin/bash
# Fix "uvicorn: command not found" error in PM2

set -e

echo "🔧 Fixing uvicorn not found error..."

# Step 1: Stop PM2 app
echo "📛 Stopping PM2 python-api..."
pm2 stop python-api 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true

# Step 2: Navigate to document-processor
cd /opt/petrodealhub/document-processor || {
    echo "❌ Error: Cannot find /opt/petrodealhub/document-processor"
    exit 1
}

# Step 3: Check/create venv
echo "🐍 Checking virtual environment..."
if [ ! -d "venv" ]; then
    echo "⚠️  venv not found. Creating it..."
    python3 -m venv venv
fi

# Step 4: Activate venv and install/upgrade dependencies
echo "📦 Installing/upgrading dependencies..."
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip --quiet

# Install/upgrade uvicorn and other requirements
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
else
    # Install minimal required packages
    pip install fastapi uvicorn[standard] python-dotenv supabase python-docx --quiet
fi

# Verify uvicorn is installed
if ! venv/bin/python -c "import uvicorn" 2>/dev/null; then
    echo "❌ ERROR: uvicorn still not found after installation!"
    echo "   Trying to install uvicorn explicitly..."
    pip install uvicorn[standard] --quiet
fi

# Verify it works
echo "✅ Verifying uvicorn installation..."
venv/bin/python -c "import uvicorn; print(f'uvicorn version: {uvicorn.__version__}')" || {
    echo "❌ ERROR: uvicorn import failed!"
    exit 1
}

# Step 5: Check if main.py exists and is runnable
if [ ! -f "main.py" ]; then
    echo "❌ ERROR: main.py not found!"
    exit 1
fi

# Step 6: Update PM2 ecosystem config (if exists in project root)
echo "📝 Updating PM2 configuration..."
cd /opt/petrodealhub

if [ -f "ecosystem.config.cjs" ]; then
    # Update the interpreter path in ecosystem.config.cjs
    sed -i "s|interpreter:.*|interpreter: '/opt/petrodealhub/document-processor/venv/bin/python',|g" ecosystem.config.cjs
    echo "✅ Updated ecosystem.config.cjs"
elif [ -f "ecosystem.config.js" ]; then
    sed -i "s|interpreter:.*|interpreter: '/opt/petrodealhub/document-processor/venv/bin/python',|g" ecosystem.config.js
    echo "✅ Updated ecosystem.config.js"
else
    # Create ecosystem config
    echo "📝 Creating ecosystem.config.cjs..."
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'python-api',
      cwd: '/opt/petrodealhub/document-processor',
      script: 'main.py',
      interpreter: '/opt/petrodealhub/document-processor/venv/bin/python',
      env: {
        FASTAPI_PORT: 8000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/python-api-error.log',
      out_file: '/var/log/pm2/python-api-out.log',
      log_file: '/var/log/pm2/python-api.log',
      max_restarts: 5,
      min_uptime: '10s'
    },
    {
      name: 'react-app',
      cwd: '/opt/petrodealhub',
      script: 'npx',
      args: ['serve', '-s', 'dist', '-l', '3000'],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
EOF
    echo "✅ Created ecosystem.config.cjs"
fi

# Step 7: Start with PM2 using ecosystem config
echo "🚀 Starting python-api with PM2..."

if [ -f "ecosystem.config.cjs" ]; then
    pm2 start ecosystem.config.cjs --only python-api
elif [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --only python-api
else
    # Manual start as fallback
    cd /opt/petrodealhub/document-processor
    pm2 start venv/bin/python --name python-api --interpreter none -- main.py
fi

# Wait a moment
sleep 3

# Step 8: Verify it's running
echo "✅ Checking status..."
pm2 status python-api

# Check logs for errors
echo "📋 Recent logs:"
pm2 logs python-api --lines 10 --nostream || true

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 2
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ API is responding!"
    curl -s http://localhost:8000/health | head -3
else
    echo "⚠️  API health check failed. Check logs: pm2 logs python-api"
    echo "   Common issues:"
    echo "   - Port 8000 might be in use: sudo lsof -i :8000"
    echo "   - .env file might have encoding issues"
    echo "   - Dependencies might be missing"
fi

# Save PM2 config
pm2 save

echo ""
echo "✅ Done! Check status with: pm2 status"
echo "   View logs with: pm2 logs python-api"
