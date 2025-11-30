#!/bin/bash
# VPS Deployment Script for OpenAI Integration
# Run this on your VPS after pulling the latest code

echo "🚀 Starting OpenAI integration deployment..."

# Navigate to project
cd /path/to/aivessel-trade-flow-main || exit 1

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Update submodule
echo "📦 Updating submodule..."
git submodule update --init --recursive
cd document-processor
git pull origin master
cd ..

# Install OpenAI package
echo "📦 Installing OpenAI package..."
cd document-processor
pip install openai==1.3.0
cd ..

# Add OpenAI API key to .env (if not exists)
echo "🔑 Adding OpenAI API key to .env..."
cd document-processor
if ! grep -q "OPENAI_API_KEY" .env 2>/dev/null; then
    echo "" >> .env
    echo "# OpenAI Configuration (for AI-powered random data generation)" >> .env
    echo "OPENAI_API_KEY=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" >> .env
    echo "✅ Added OPENAI_API_KEY to .env"
else
    echo "⚠️  OPENAI_API_KEY already exists in .env"
    echo "   Update it manually if needed:"
    echo "   nano document-processor/.env"
fi
cd ..

# Restart service
echo "🔄 Restarting document-processor service..."
if systemctl is-active --quiet document-processor; then
    sudo systemctl restart document-processor
    echo "✅ Service restarted (systemd)"
elif pm2 list | grep -q document-processor; then
    pm2 restart document-processor
    echo "✅ Service restarted (PM2)"
else
    echo "⚠️  Service not found. Please restart manually."
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Verifying deployment..."
sleep 3
curl -s http://localhost:8000/health | grep -i openai || echo "⚠️  Could not verify OpenAI status"

echo ""
echo "📝 Next steps:"
echo "   1. Check service status: sudo systemctl status document-processor"
echo "   2. Check logs: sudo journalctl -u document-processor -f"
echo "   3. Test in CMS: http://your-vps-ip:8000/cms/"

