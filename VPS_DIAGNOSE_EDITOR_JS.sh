#!/bin/bash
# Diagnose editor.js API endpoint issue

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "DIAGNOSE EDITOR.JS API ENDPOINT"
echo "=========================================="
echo ""

# 1. Check current state
echo "1. Checking current state of editor.js..."
echo ""

echo "   a) Checking for old pattern (control.petrodealhub.com || petrodealhub.com):"
if grep -q "hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com'" cms/editor.js; then
    echo "      ❌ FOUND - Old pattern still exists"
    echo "      Showing lines:"
    grep -n "hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com'" cms/editor.js | head -2
else
    echo "      ✅ NOT FOUND - Old pattern has been removed"
fi
echo ""

echo "   b) Checking for correct API URL (https://control.petrodealhub.com):"
if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "      ✅ FOUND - Correct API URL exists"
    echo "      Showing lines:"
    grep -n "apiBase = 'https://control.petrodealhub.com';" cms/editor.js | head -2
else
    echo "      ❌ NOT FOUND - Correct API URL missing"
fi
echo ""

echo "   c) Checking for old API URL (https://petrodealhub.com/api):"
if grep -q "apiBase = 'https://petrodealhub.com/api';" cms/editor.js; then
    echo "      ❌ FOUND - Old API URL still exists"
    echo "      Showing lines:"
    grep -n "apiBase = 'https://petrodealhub.com/api';" cms/editor.js | head -2
else
    echo "      ✅ NOT FOUND - Old API URL has been removed"
fi
echo ""

# 2. Show relevant code section
echo "2. Showing relevant code section (lines 17-23):"
sed -n '17,23p' cms/editor.js | cat -n
echo ""

# 3. Check file modification time
echo "3. File information:"
echo "   Modified: $(stat -c %y cms/editor.js 2>/dev/null || stat -f %Sm cms/editor.js 2>/dev/null || echo 'unknown')"
echo "   Size: $(wc -c < cms/editor.js) bytes"
echo ""

# 4. Check if API is serving the file
echo "4. Checking if API is serving editor.js..."
API_EDITOR_JS=$(curl -s -k "https://control.petrodealhub.com/cms/editor.js" 2>/dev/null | head -30 || echo "")
if [ -n "$API_EDITOR_JS" ]; then
    echo "   ✅ API is serving editor.js"
    echo "   Checking served version for API URL..."
    if echo "$API_EDITOR_JS" | grep -q "apiBase = 'https://control.petrodealhub.com';"; then
        echo "      ✅ Served version has correct API URL"
    elif echo "$API_EDITOR_JS" | grep -q "petrodealhub.com/api"; then
        echo "      ❌ Served version still has old API URL"
        echo "      API might be serving cached version"
    else
        echo "      ⚠️  Cannot determine API URL in served version"
    fi
else
    echo "   ⚠️  Could not fetch editor.js from API"
fi
echo ""

# 5. Check API status
echo "5. Checking API status..."
if pm2 status python-api 2>/dev/null | grep -q "online"; then
    echo "   ✅ API is running"
    pm2 status python-api | grep -E "python-api|status|online|errored"
else
    echo "   ❌ API is not running"
fi
echo ""

# 6. Check nginx configuration
echo "6. Checking nginx configuration for /cms/..."
if grep -q "location /cms" /etc/nginx/sites-available/control 2>/dev/null || grep -q "location /cms" /etc/nginx/sites-enabled/control 2>/dev/null; then
    echo "   ✅ Found /cms/ location block"
    grep -A 5 "location /cms" /etc/nginx/sites-available/control 2>/dev/null || grep -A 5 "location /cms" /etc/nginx/sites-enabled/control 2>/dev/null | head -6
else
    echo "   ⚠️  Could not find /cms/ location block"
fi
echo ""

# 7. Summary and recommendations
echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="
echo ""

if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "✅ editor.js file on VPS has correct API URL"
    echo ""
    echo "If browser still shows errors:"
    echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
    echo "2. Or use incognito/private window"
    echo "3. Check browser console for 'CMS Editor initialized with API base URL: ...'"
    echo "   It should show: https://control.petrodealhub.com"
    echo ""
    echo "If the served version still has old URL:"
    echo "- Restart API: pm2 restart python-api"
    echo "- Clear nginx cache if applicable"
else
    echo "❌ editor.js file on VPS needs to be fixed"
    echo ""
    echo "Run this to fix it:"
    echo "  cd /opt/petrodealhub && curl -O https://raw.githubusercontent.com/jeanclaudder2024/Petrodeal2/main/VPS_FIX_EDITOR_JS_AND_VERIFY.sh && chmod +x VPS_FIX_EDITOR_JS_AND_VERIFY.sh && sudo ./VPS_FIX_EDITOR_JS_AND_VERIFY.sh"
fi
echo ""
