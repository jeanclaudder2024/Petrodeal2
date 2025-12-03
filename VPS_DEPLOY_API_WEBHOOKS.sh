#!/bin/bash

# ============================================================================
# VPS Deployment Script for API & Webhooks System
# Domain: https://petrodealhub.com/
# ============================================================================

set -e  # Exit on error

echo "=========================================="
echo "Deploying API & Webhooks System Update"
echo "Domain: https://petrodealhub.com/"
echo "=========================================="

# Navigate to project directory
cd /opt/petrodealhub || {
    echo "❌ Error: /opt/petrodealhub directory not found!"
    exit 1
}

echo ""
echo "📥 Step 1: Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "📦 Step 2: Installing/updating Python dependencies..."
cd document-processor

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install
source venv/bin/activate
pip install --upgrade pip --quiet
pip install aiohttp==3.9.1 --quiet
deactivate

cd ..

echo ""
echo "🔨 Step 3: Building frontend..."
npm install
npm run build

echo ""
echo "🔄 Step 4: Restarting services..."
pm2 restart all || {
    echo "⚠️  PM2 not running, starting services..."
    # If PM2 processes don't exist, you may need to start them
    # pm2 start document-processor/main.py --name python-api
    # pm2 start npm --name react-app -- start
}

echo ""
echo "📊 Step 5: Checking service status..."
pm2 status

echo ""
echo "✅ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: Don't forget to run the database migration!"
echo "   Go to Supabase Dashboard → SQL Editor and run:"
echo "   supabase/migrations/20250128000000_api_webhooks.sql"
echo ""
echo "🌐 Your site should be live at: https://petrodealhub.com/"
echo ""

