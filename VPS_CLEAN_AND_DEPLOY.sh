#!/bin/bash
# Clean document project + Python API (PM2) on VPS and deploy same as our GitHub project.
# Run on VPS: cd /opt/petrodealhub && bash VPS_CLEAN_AND_DEPLOY.sh

set -e

echo "=========================================="
echo "CLEAN + DEPLOY (match GitHub project)"
echo "=========================================="
echo ""

cd /opt/petrodealhub

# 1. Stop and remove PM2 apps (clean PM2)
echo "1. Stopping and removing PM2 apps..."
pm2 stop python-api 2>/dev/null || true
pm2 stop react-app 2>/dev/null || true
pm2 delete python-api 2>/dev/null || true
pm2 delete react-app 2>/dev/null || true
echo "   ✅ PM2 cleaned"
echo ""

# 2. Backup .env (we will not overwrite)
echo "2. Backing up .env files..."
[ -f document-processor/.env ] && cp document-processor/.env /tmp/document-processor.env.bak || true
[ -f .env ] && cp .env /tmp/petrodealhub.env.bak || true
echo "   ✅ Backed up"
echo ""

# 3. Reset main repo to exactly match origin/main
echo "3. Resetting main project to origin/main..."
git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null || true
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || true
git clean -fd 2>/dev/null || true
git submodule update --init --recursive --force
echo "   ✅ Main repo clean"
echo ""

# 4. Reset document-processor submodule to origin/master
echo "4. Resetting document-processor to origin/master..."
cd /opt/petrodealhub/document-processor
git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
cd /opt/petrodealhub
echo "   ✅ document-processor clean"
echo ""

# 5. Restore .env
echo "5. Restoring .env files..."
[ -f /tmp/document-processor.env.bak ] && cp /tmp/document-processor.env.bak document-processor/.env || true
[ -f /tmp/petrodealhub.env.bak ] && cp /tmp/petrodealhub.env.bak .env || true
echo "   ✅ .env restored"
echo ""

# 6. Python venv and dependencies
echo "6. Setting up Python (venv + dependencies)..."
cd /opt/petrodealhub/document-processor
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q --upgrade 2>/dev/null || true
deactivate
cd /opt/petrodealhub
echo "   ✅ Python ready"
echo ""

# 7. Frontend: install and build with /api
echo "7. Building frontend (VITE_DOCUMENT_API_URL=/api)..."
export VITE_DOCUMENT_API_URL=/api
npm install --no-audit --no-fund 2>/dev/null || true
npm run build 2>&1 | tail -8
echo "   ✅ Frontend built"
echo ""

# 8. Start PM2 (python-api on port 8000, react-app via ecosystem if present)
echo "8. Starting PM2..."
cd /opt/petrodealhub
if [ -f ecosystem.config.cjs ]; then
  pm2 start ecosystem.config.cjs
  echo "   ✅ PM2 started from ecosystem.config.cjs"
else
  cd document-processor
  pm2 start venv/bin/python --name python-api -- main.py
  cd /opt/petrodealhub
  pm2 start npx --name react-app -- serve -s dist -l 3000
  echo "   ✅ PM2 started (python-api + react-app)"
fi
pm2 save
echo ""

# 9. Status
echo "9. Waiting 5s then checking..."
sleep 5
pm2 status
echo ""
echo "API health:"
curl -s http://localhost:8000/health 2>/dev/null || echo "   (wait a few seconds and run: curl http://localhost:8000/health)"
echo ""
echo "=========================================="
echo "CLEAN + DEPLOY DONE"
echo "=========================================="
echo "Ensure Nginx proxies /api and /health to http://localhost:8000"
echo "If react-app failed to start, run your usual PM2 start command for the frontend."
echo ""
