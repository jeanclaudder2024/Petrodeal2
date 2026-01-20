#!/bin/bash
# Clean pull and update script - handles conflicts and submodule issues

set -e

echo "=========================================="
echo "CLEAN PULL AND UPDATE"
echo "=========================================="
echo ""

# 1. Handle local changes in main repo
echo "1. Handling local changes in main repository..."
cd /opt/petrodealhub

# Stash or remove conflicting files
if [ -f "VPS_FINAL_VERIFICATION.sh" ]; then
    echo "   Stashing local changes to VPS_FINAL_VERIFICATION.sh..."
    git stash push -m "Stash before pull" VPS_FINAL_VERIFICATION.sh || true
fi

# Remove untracked VPS scripts (they should come from git)
echo "   Removing local untracked VPS scripts (will pull from git)..."
rm -f VPS_ADD_ENDPOINTS_MANUAL.sh
rm -f VPS_ADD_MISSING_API_ENDPOINTS.sh
rm -f VPS_ADD_MISSING_CMS_ENDPOINTS.sh
rm -f VPS_ADD_UPLOAD_TEMPLATE_LOCATION.sh
rm -f VPS_CLEAN_NGINX_CONFIG.sh
rm -f VPS_COMPLETE_CMS_ENDPOINTS_FIX.sh
rm -f VPS_COMPLETE_UPLOAD_AND_PLAN_FIX.sh
rm -f VPS_DEBUG_NGINX_404.sh
rm -f VPS_DIAGNOSE_UPLOAD_AND_PLAN_ERRORS.sh
rm -f VPS_FINISH_CMS_ENDPOINTS_FIX.sh
rm -f VPS_FIX_CORS_HEADERS.sh
rm -f VPS_FIX_EDITOR_JS_AND_VERIFY.sh
rm -f VPS_FIX_IF_DIRECTLY.sh
rm -f VPS_FIX_NGINX_AUTH_PROXY.sh
rm -f VPS_FIX_NGINX_CONTROL_SUBDOMAIN.sh
rm -f VPS_FIX_NGINX_DUPLICATE_SERVER_BLOCKS.sh
rm -f VPS_FIX_NGINX_IF_CONDITION.sh
rm -f VPS_FIX_NGINX_MULTIPLE_CONFIGS.sh
rm -f VPS_FIX_NGINX_SYNTAX_ERROR.sh
rm -f VPS_FIX_PROXY_SET_HEADER.sh
rm -f VPS_FIX_UPLOAD_SIZE_LIMIT.sh
rm -f VPS_UPDATE_CMS_API_ENDPOINT.sh
rm -f VPS_UPDATE_EDITOR_JS.sh
rm -f VPS_VERIFY_AND_COMPLETE_FIX.sh
rm -f VPS_VERIFY_HTTPS_ENDPOINTS.sh
rm -f VPS_VERIFY_UPLOAD_ENDPOINT.sh

echo "   ✅ Cleaned up local files"
echo ""

# 2. Pull latest changes
echo "2. Pulling latest changes from git..."
git pull origin main || {
    echo "   ⚠️  Pull failed, trying to reset..."
    git fetch origin main
    git reset --hard origin/main || echo "   ⚠️  Reset failed, continuing anyway"
}
echo ""

# 3. Fix submodule issue
echo "3. Fixing submodule issue..."
cd /opt/petrodealhub

# Update submodule reference
git submodule sync document-processor || echo "   ⚠️  Submodule sync had issues"

# Force update submodule to latest
cd document-processor
git fetch origin master || echo "   ⚠️  Fetch had issues"
git checkout master || echo "   ⚠️  Checkout had issues"
git pull origin master || {
    echo "   ⚠️  Submodule pull failed, trying to reset..."
    git fetch origin master
    git reset --hard origin/master || echo "   ⚠️  Submodule reset failed"
}

# Go back to main repo and update submodule reference
cd /opt/petrodealhub
git submodule update --init --recursive document-processor || echo "   ⚠️  Submodule update had issues"
echo ""

# 4. Verify submodule is updated
echo "4. Verifying submodule status..."
cd /opt/petrodealhub/document-processor
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "   Current commit: $CURRENT_COMMIT"
echo "   Branch: $(git branch --show-current)"
echo ""

# 5. Check for the fixes
echo "5. Verifying fixes are present..."
cd /opt/petrodealhub/document-processor

# Check if DEBUG_LOG_PATH constant exists
if grep -q "DEBUG_LOG_PATH = os.path.join(BASE_DIR" main.py; then
    echo "   ✅ Debug log path fix found"
else
    echo "   ⚠️  Debug log path fix not found"
fi

# Check if cms.js API URL is fixed
if grep -q "apiBase = 'https://control.petrodealhub.com'" cms/cms.js; then
    echo "   ✅ cms.js API URL fix found"
else
    echo "   ⚠️  cms.js API URL fix not found"
fi

# Check if merge conflict is resolved
if grep -q "<<<<<<< HEAD" main.py || grep -q ">>>>>>>" main.py; then
    echo "   ❌ Merge conflict markers still present!"
else
    echo "   ✅ No merge conflict markers found"
fi
echo ""

# 6. Restart API
echo "6. Restarting document-processor API..."
cd /opt/petrodealhub/document-processor
pm2 restart python-api || pm2 start python main.py --name python-api --interpreter python3
sleep 3
echo ""

# 7. Check API status
echo "7. Checking API status..."
pm2 status python-api
echo ""

# 8. Test API
echo "8. Testing API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 20 --nostream | tail -10
fi
echo ""

# 9. Summary
echo "=========================================="
echo "UPDATE COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test uploading a template in the CMS"
echo "2. Test editing plan assignments"
echo "3. Check for any errors in browser console"
echo "4. Check API logs if issues: pm2 logs python-api"
echo ""
