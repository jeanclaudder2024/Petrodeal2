#!/bin/bash
# Quick script to restart whatever is serving on port 3000

echo "=== Checking what's on port 3000 ==="
sudo lsof -i :3000 || echo "Nothing found with lsof"

echo -e "\n=== Checking PM2 ==="
pm2 list 2>/dev/null || echo "PM2 not found"

echo -e "\n=== Checking Node processes ==="
ps aux | grep -E "node|vite|3000" | grep -v grep

echo -e "\n=== Attempting to restart ==="

# Try PM2 first
if command -v pm2 &> /dev/null; then
    echo "Restarting PM2 processes..."
    pm2 restart all
    pm2 logs --lines 10
fi

# Kill any process on port 3000
echo "Killing any process on port 3000..."
sudo kill $(sudo lsof -t -i:3000) 2>/dev/null || echo "No process to kill"

# Wait a moment
sleep 2

# Check if port 3000 is free
if ! sudo lsof -i :3000 &> /dev/null; then
    echo "Port 3000 is now free. You may need to start your server manually."
    echo "Common commands:"
    echo "  - npm run preview -- --port 3000"
    echo "  - pm2 start npm --name frontend -- run preview -- --port 3000"
    echo "  - Or your custom start command"
fi






