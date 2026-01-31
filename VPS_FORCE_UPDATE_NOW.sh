#!/bin/bash
set -e

echo "=========================================="
echo "  FORCE UPDATE - Placeholder Fixes"
echo "=========================================="

cd /opt/petrodealhub

# 1. Stop API first
echo "1. Stopping API..."
pm2 stop python-api 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# 2. Stash any local changes in main repo
echo ""
echo "2. Stashing local changes..."
git stash

# 3. Pull latest main repo
echo ""
echo "3. Pulling latest main repo..."
git fetch origin
git reset --hard origin/main

# 4. Force update document-processor submodule
echo ""
echo "4. Force updating document-processor submodule..."
cd document-processor

# Stash any local changes in submodule
git stash

# Fetch and reset to latest master
git fetch origin master
git reset --hard origin/master

echo ""
echo "Current document-processor commit:"
git log --oneline -1
cd ..

# 5. Ensure submodule is registered
echo ""
echo "5. Ensuring submodule is properly initialized..."
git submodule update --init --recursive --force

# 6. Verify we have the right commit
echo ""
echo "6. Verifying commit..."
cd document-processor
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "Current commit: $CURRENT_COMMIT"
echo "Expected: 5135f2a"

if [ "$CURRENT_COMMIT" = "5135f2a" ]; then
    echo "✅ Correct commit!"
else
    echo "⚠️  Commit mismatch. Forcing checkout..."
    git fetch origin
    git checkout 5135f2a
fi

# 7. Install/update dependencies
echo ""
echo "7. Updating Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt --quiet

# 8. Restart API
echo ""
echo "8. Starting API with pm2..."
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
pm2 save

echo ""
echo "=========================================="
echo "  Force Update Complete!"
echo "=========================================="
echo ""
echo "Verify with:"
echo "  pm2 logs python-api --lines 30"
echo "  curl http://localhost:8000/database-tables"
echo ""
echo "Then upload a template and check the mapping counts."
echo "=========================================="
