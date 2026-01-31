#!/bin/bash
set -e

echo "=========================================="
echo "  Deploy Placeholder Mapping Fixes"
echo "=========================================="

cd /opt/petrodealhub

# 1. Pull latest code
echo "1. Pulling latest code..."
git pull origin main

# 2. Update document-processor submodule to latest commit
echo "2. Updating document-processor submodule..."
cd document-processor
git fetch origin
git checkout master
git pull origin master
cd ..

git submodule update --init --recursive

# Verify we have the latest commit
echo ""
echo "Current document-processor commit:"
cd document-processor
git log --oneline -1
cd ..

# 3. Install/update Python dependencies
echo ""
echo "3. Checking Python dependencies..."
cd document-processor
source venv/bin/activate
pip install -r requirements.txt --quiet

# 4. Restart API
echo ""
echo "4. Restarting API..."
pm2 stop python-api 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true

# Kill any process on port 8000
echo "   Freeing port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start API with pm2
pm2 start venv/bin/python --name python-api -- main.py
pm2 save

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Expected commit: dc85bf8 (ATSC validation, date format, etc.)"
echo ""
echo "Verify deployment:"
echo "  1. Check logs: pm2 logs python-api"
echo "  2. Test API: curl http://localhost:8000/health"
echo "  3. Upload a template and verify mapping counts"
echo ""
echo "=========================================="
