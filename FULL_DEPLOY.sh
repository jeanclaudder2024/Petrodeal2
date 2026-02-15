#!/bin/bash
# Full deploy on VPS: run this ON THE VPS after you have pushed updates to GitHub.
# Usage: ssh user@your-vps "cd /opt/petrodealhub && bash FULL_DEPLOY.sh"
# Or on the VPS: cd /opt/petrodealhub && bash FULL_DEPLOY.sh

set -e

PROJECT_ROOT="${PROJECT_ROOT:-/opt/petrodealhub}"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "FULL DEPLOY – PetroDealHub + Document API"
echo "=========================================="
echo ""

# 1. Backup .env files
echo "1. Backing up .env files..."
[ -f document-processor/.env ] && cp document-processor/.env /tmp/document-processor.env.bak || true
[ -f .env ] && cp .env /tmp/petrodealhub.env.bak || true
echo "   ✅ Backed up"
echo ""

# 2. Pull main repo
echo "2. Pulling main repository..."
git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null || true
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
echo "   ✅ Main repo updated"
echo ""

# 3. Update document-processor submodule
echo "3. Updating document-processor submodule..."
git submodule update --init --recursive document-processor 2>/dev/null || true
cd document-processor
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git pull origin master 2>/dev/null || git pull origin main 2>/dev/null || true
cd "$PROJECT_ROOT"
echo "   ✅ Submodule updated"
echo ""

# 4. Restore .env
echo "4. Restoring .env files..."
[ -f /tmp/document-processor.env.bak ] && cp /tmp/document-processor.env.bak document-processor/.env || true
[ -f /tmp/petrodealhub.env.bak ] && cp /tmp/petrodealhub.env.bak .env || true
echo "   ✅ .env restored"
echo ""

# 5. Python venv and dependencies
echo "5. Setting up Python (venv + dependencies)..."
cd "$PROJECT_ROOT/document-processor"
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q --upgrade 2>/dev/null || true
deactivate
cd "$PROJECT_ROOT"
echo "   ✅ Python ready"
echo ""

# 6. Frontend: install and build with /api
echo "6. Building frontend (VITE_DOCUMENT_API_URL=/api)..."
cd "$PROJECT_ROOT"
export VITE_DOCUMENT_API_URL=/api
npm install --no-audit --no-fund 2>/dev/null || true
npm run build 2>&1 | tail -10
echo "   ✅ Frontend built"
echo ""

# 7. Restart PM2
echo "7. Restarting PM2..."
cd "$PROJECT_ROOT"
if [ -f ecosystem.config.cjs ]; then
  pm2 delete python-api 2>/dev/null || true
  pm2 delete react-app 2>/dev/null || true
  sleep 2
  pm2 start ecosystem.config.cjs
  echo "   ✅ PM2 started from ecosystem.config.cjs"
else
  pm2 delete python-api 2>/dev/null || true
  pm2 delete react-app 2>/dev/null || true
  sleep 2
  cd document-processor
  pm2 start venv/bin/python --name python-api -- main.py
  cd "$PROJECT_ROOT"
  pm2 start npx --name react-app -- serve -s dist -l 3000
  echo "   ✅ PM2 started (python-api + react-app)"
fi
pm2 save
echo ""

# 8. Wait and verify
echo "8. Waiting 5s then checking..."
sleep 5
pm2 status
echo ""
echo "API health:"
curl -s http://localhost:8000/health 2>/dev/null || echo "   (wait a few seconds and run: curl http://localhost:8000/health)"
echo ""
echo "API portal:"
echo "   http://localhost:8000/portal (or https://petrodealhub.com/api/portal)"
echo ""

echo "=========================================="
echo "FULL DEPLOY DONE"
echo "=========================================="
echo ""
echo "Ensure Nginx proxies /api and /health to http://localhost:8000"
echo "Reload nginx if needed: sudo nginx -t && sudo systemctl reload nginx"
echo ""
