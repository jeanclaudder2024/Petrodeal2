#!/bin/bash
# Quick VPS Update Script
# Run these commands on your VPS

echo "🚀 Starting VPS Update..."

# Step 1: Update document-processor submodule
echo "📦 Step 1: Updating document-processor submodule..."
cd /opt/petrodealhub/document-processor
git pull origin master

# Step 2: Update main repository (if needed)
echo "📦 Step 2: Updating main repository..."
cd /opt/petrodealhub
git pull origin main

# Step 3: Restart API service
echo "🔄 Step 3: Restarting API service..."
sudo systemctl restart petrodealhub-api

# Step 4: Check service status
echo "✅ Step 4: Checking service status..."
sleep 2
sudo systemctl status petrodealhub-api --no-pager -l

echo ""
echo "✨ Update complete!"
echo "📋 Check logs with: sudo journalctl -u petrodealhub-api -f --lines=50"

