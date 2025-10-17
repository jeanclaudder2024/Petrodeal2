#!/bin/bash

# Quick Deploy Script for AI Vessel Trade Flow on Ubuntu VPS
# This is a simplified version for quick deployment

echo "🚀 Quick Deploy - AI Vessel Trade Flow"
echo "======================================"

# Make scripts executable
chmod +x deploy-ubuntu.sh
chmod +x setup-systemd.sh

# Run the main deployment
echo "📦 Running main deployment..."
./deploy-ubuntu.sh

# Setup systemd services (optional)
echo ""
echo "🔧 Setting up systemd services..."
sudo ./setup-systemd.sh

echo ""
echo "🎉 Quick deployment completed!"
echo "Your application should now be running at:"
echo "   - React App: http://$(curl -s ifconfig.me)"
echo "   - Python API: http://$(curl -s ifconfig.me)/api/"
echo ""
echo "📝 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs"
