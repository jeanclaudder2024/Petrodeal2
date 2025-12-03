#!/bin/bash

# Quick fix script to install aiohttp in virtual environment
# Run this if you got the "externally-managed-environment" error

set -e

echo "🔧 Installing aiohttp in virtual environment..."

cd /opt/petrodealhub/document-processor

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
pip install --upgrade pip
pip install aiohttp==3.9.1
deactivate

echo "✅ aiohttp installed successfully!"
echo ""
echo "⚠️  IMPORTANT: Make sure your PM2 process uses the venv Python!"
echo "   Check: pm2 show python-api | grep interpreter"
echo "   If not using venv, update PM2 config to use:"
echo "   /opt/petrodealhub/document-processor/venv/bin/python"

