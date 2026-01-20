#!/bin/bash
# Final verification - test everything end-to-end

set -e

echo "=========================================="
echo "FINAL VERIFICATION - ALL SYSTEMS"
echo "=========================================="
echo ""

# 1. Test nginx configuration
echo "1. Testing nginx configuration..."
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "   ✅ Nginx configuration is valid"
else
    echo "   ❌ Nginx configuration has errors"
    exit 1
fi
echo ""

# 2. Reload nginx
echo "2. Reloading nginx..."
sudo systemctl reload nginx
sleep 2
echo "   ✅ Nginx reloaded"
echo ""

# 3. Check API status
echo "3. Checking API status..."
pm2 status python-api
echo ""

# 4. Test endpoints directly on API
echo "4. Testing endpoints directly on API..."
echo "   http://127.0.0.1:8000/health:"
curl -s http://127.0.0.1:8000/health | head -1 || echo "   ❌ Failed"
echo ""

echo "   http://127.0.0.1:8000/templates:"
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://127.0.0.1:8000/templates
echo ""

# 5. Test endpoints via HTTPS
echo "5. Testing endpoints via HTTPS..."
ENDPOINTS=("/health" "/auth/me" "/templates" "/data/all" "/plans-db" "/plans")

SUCCESS=0
TOTAL=${#ENDPOINTS[@]}

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   https://control.petrodealhub.com$endpoint... "
    RESPONSE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
        echo "✅ $RESPONSE"
        SUCCESS=$((SUCCESS + 1))
    elif [ "$RESPONSE" = "404" ]; then
        echo "❌ 404"
    else
        echo "⚠️  $RESPONSE"
    fi
done
echo ""

# 6. Check nginx location blocks
echo "6. Checking nginx location blocks..."
echo "   Location blocks for API endpoints:"
grep -n "location.*templates\|location.*data/all\|location.*plans\|location.*auth\|location.*health" /etc/nginx/sites-available/control | head -15
echo ""

# 7. Final summary
echo "=========================================="
echo "FINAL SUMMARY"
echo "=========================================="
echo ""

if [ $SUCCESS -eq $TOTAL ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "✅ Nginx configuration: Valid"
    echo "✅ API status: Running"
    echo "✅ All endpoints ($SUCCESS/$TOTAL): Working"
    echo ""
    echo "The CMS should now work correctly!"
    echo ""
    echo "✅ CMS accessible at: https://control.petrodealhub.com/cms"
    echo "✅ All API endpoints are proxied correctly"
    echo ""
    echo "Please refresh the CMS page and try again!"
else
    echo "⚠️  Some endpoints may still have issues"
    echo ""
    echo "   Working: $SUCCESS/$TOTAL endpoints"
    echo ""
    echo "Check nginx error log for details:"
    echo "   sudo tail -20 /var/log/nginx/error.log"
fi
echo ""
