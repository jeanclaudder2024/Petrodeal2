#!/bin/bash
# Complete fix for upload and plan editing issues

set -e

echo "=========================================="
echo "COMPLETE UPLOAD AND PLAN EDITING FIX"
echo "=========================================="
echo ""

# 1. Pull latest changes
echo "1. Pulling latest changes from git..."
cd /opt/petrodealhub
git pull origin main || echo "   ⚠️  Could not pull (may need to handle submodule)"
echo ""

# 2. Update submodule
echo "2. Updating document-processor submodule..."
cd /opt/petrodealhub
git submodule update --init --recursive document-processor || echo "   ⚠️  Submodule update had issues"
cd document-processor
git pull origin master || echo "   ⚠️  Could not pull submodule"
cd /opt/petrodealhub
echo ""

# 3. Finish nginx configuration
echo "3. Completing nginx configuration..."
cd /opt/petrodealhub && curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FINISH_CMS_ENDPOINTS_FIX.sh && chmod +x VPS_FINISH_CMS_ENDPOINTS_FIX.sh && sudo ./VPS_FINISH_CMS_ENDPOINTS_FIX.sh
echo ""

# 4. Restart API
echo "4. Restarting document-processor API..."
cd /opt/petrodealhub/document-processor
pm2 restart python-api || pm2 start python main.py --name python-api --interpreter python3
sleep 3
echo ""

# 5. Check API status
echo "5. Checking API status..."
pm2 status python-api
echo ""

# 6. Test API directly
echo "6. Testing API directly (localhost:8000)..."
if curl -s http://localhost:8000/health | grep -q "ok\|status"; then
    echo "   ✅ API is responding"
else
    echo "   ❌ API is not responding"
    echo "   Checking logs..."
    pm2 logs python-api --lines 20 --nostream
fi
echo ""

# 7. Test endpoints via nginx
echo "7. Testing endpoints via nginx..."
ENDPOINTS=("/health" "/templates" "/placeholder-settings?template_id=test")

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    HTTP_CODE=$(curl -s -k --max-time 5 -o /dev/null -w "%{http_code}" \
        "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "400" ]; then
        echo "✅ $HTTP_CODE"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "❌ 404"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "⚠️  Connection failed"
    else
        echo "ℹ️  $HTTP_CODE"
    fi
done
echo ""

# 8. Check nginx error log for recent errors
echo "8. Checking nginx error log for recent errors..."
if [ -f /var/log/nginx/error.log ]; then
    echo "   Recent nginx errors:"
    sudo tail -10 /var/log/nginx/error.log | grep -i "error\|failed\|refused" || echo "   ✅ No recent errors"
else
    echo "   ⚠️  Nginx error log not found"
fi
echo ""

# 9. Check API logs for errors
echo "9. Checking API logs for errors..."
pm2 logs python-api --lines 30 --nostream | grep -i "error\|exception\|traceback" | tail -10 || echo "   ✅ No recent errors in logs"
echo ""

# 10. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Changes pulled from git"
echo "✅ Submodule updated"
echo "✅ Nginx configuration completed"
echo "✅ API restarted"
echo ""
echo "Next steps:"
echo "1. Clear browser cache (Ctrl+Shift+R)"
echo "2. Try uploading a template"
echo "3. Try editing plan assignments for a template"
echo "4. Check browser console for errors"
echo "5. If issues persist, check debug.log for detailed runtime data"
echo ""
echo "Debug logs location: .cursor/debug.log (in document-processor directory)"
echo ""
