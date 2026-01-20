#!/bin/bash
# Fix editor.js API endpoint and verify it works

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "FIX EDITOR.JS API ENDPOINT AND VERIFY"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="cms/editor.js.before_fix.$(date +%Y%m%d_%H%M%S)"
cp cms/editor.js "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show current state
echo "2. Current state of editor.js..."
echo "   Checking for old API URL..."
if grep -q "hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com'" cms/editor.js; then
    echo "   ⚠️  Found old pattern - needs update"
    grep -A 1 "hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com'" cms/editor.js | head -2
else
    echo "   ✅ Old pattern not found"
fi

if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "   ✅ Already has correct API URL"
else
    echo "   ⚠️  Missing correct API URL - will fix"
fi
echo ""

# 3. Fix using Python (most reliable)
echo "3. Fixing editor.js API endpoint..."
python3 << 'PYTHON_FIX'
import re

with open('cms/editor.js', 'r') as f:
    content = f.read()

# Pattern 1: Replace the combined condition with separate conditions
old_pattern = """        // Production domains
        else if (hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com' || hostname === 'www.petrodealhub.com') {
            apiBase = 'https://petrodealhub.com/api';
        }"""

new_pattern = """        // Production domains
        else if (hostname === 'control.petrodealhub.com') {
            // Use same origin (document-processor API) instead of main API
            apiBase = 'https://control.petrodealhub.com';
        } else if (hostname === 'petrodealhub.com' || hostname === 'www.petrodealhub.com') {
            apiBase = 'https://petrodealhub.com/api';
        }"""

if old_pattern in content:
    content = content.replace(old_pattern, new_pattern)
    print("   ✅ Replaced using exact pattern match")
elif "hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com'" in content:
    # Try regex replacement as fallback
    pattern = r"(// Production domains\s+else if \(hostname === 'control\.petrodealhub\.com' \|\| hostname === 'petrodealhub\.com' \|\| hostname === 'www\.petrodealhub\.com'\) \{\s+apiBase = ')https://petrodealhub\.com/api(';\s+\})"
    replacement = r"""\1https://control.petrodealhub.com\2
        } else if (hostname === 'petrodealhub.com' || hostname === 'www.petrodealhub.com') {
            apiBase = 'https://petrodealhub.com/api';"""
    
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    if new_content != content:
        content = new_content
        print("   ✅ Replaced using regex")
    else:
        # Manual line-by-line replacement
        lines = content.split('\n')
        new_lines = []
        i = 0
        fixed = False
        while i < len(lines):
            if "else if (hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com' || hostname === 'www.petrodealhub.com')" in lines[i]:
                new_lines.append("        else if (hostname === 'control.petrodealhub.com') {")
                new_lines.append("            // Use same origin (document-processor API) instead of main API")
                new_lines.append("            apiBase = 'https://control.petrodealhub.com';")
                new_lines.append("        } else if (hostname === 'petrodealhub.com' || hostname === 'www.petrodealhub.com') {")
                # Skip next line (apiBase = ...) and add new one
                i += 2  # Skip the condition line and apiBase line
                fixed = True
            else:
                new_lines.append(lines[i])
                i += 1
        if fixed:
            content = '\n'.join(new_lines)
            print("   ✅ Replaced using line-by-line method")
        else:
            print("   ⚠️  Pattern not found - file might already be fixed")
else:
    print("   ℹ️  Pattern not found - file might already be fixed or has different format")

with open('cms/editor.js', 'w') as f:
    f.write(content)
PYTHON_FIX

echo "   ✅ Update completed"
echo ""

# 4. Verify the fix
echo "4. Verifying the fix..."
if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "   ✅ Correct API URL found"
    echo "   Showing relevant lines:"
    grep -A 2 -B 2 "apiBase = 'https://control.petrodealhub.com';" cms/editor.js | head -5
else
    echo "   ❌ Fix might not have worked"
    echo "   Showing relevant lines:"
    grep -A 3 -B 3 "control.petrodealhub.com\|petrodealhub.com/api" cms/editor.js | head -10
fi
echo ""

# 5. Check for old patterns
echo "5. Checking for any remaining old patterns..."
if grep -q "petrodealhub\.com/api" cms/editor.js; then
    echo "   ⚠️  Found old API URL patterns:"
    grep -n "petrodealhub\.com/api" cms/editor.js | head -5
else
    echo "   ✅ No old API URL patterns found (except for main domain)"
fi
echo ""

# 6. Restart API
echo "6. Restarting API to serve updated editor.js..."
pm2 restart python-api
echo "   ✅ API restarted"
echo "   Waiting 5 seconds for API to start..."
sleep 5
echo ""

# 7. Verify API is running
echo "7. Verifying API is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding"
else
    echo "   ⚠️  API might not be responding - checking PM2 status..."
    pm2 status python-api | grep -E "python-api|status|online|errored"
fi
echo ""

# 8. Test endpoints
echo "8. Testing endpoints via nginx..."
ENDPOINTS=("/health" "/database-tables" "/csv-files" "/plans-db" "/templates")

SUCCESS=0
TOTAL=${#ENDPOINTS[@]}

for endpoint in "${ENDPOINTS[@]}"; do
    echo -n "   Testing $endpoint... "
    HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" "https://control.petrodealhub.com$endpoint" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "404" ]; then
        echo "✅ $HTTP_CODE"
        if [ "$HTTP_CODE" != "404" ]; then
            SUCCESS=$((SUCCESS + 1))
        fi
    else
        echo "⚠️  $HTTP_CODE"
    fi
done
echo ""

# 9. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "✅ editor.js has been updated to use same origin API"
    echo "✅ API has been restarted"
    echo ""
    echo "Next steps:"
    echo "1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
    echo "2. Or open the template editor in an incognito/private window"
    echo "3. Refresh the template editor page"
    echo ""
    echo "The editor should now use: https://control.petrodealhub.com"
    echo "instead of: https://petrodealhub.com/api"
else
    echo "⚠️  Fix might not have been applied correctly"
    echo "Please check the output above for details"
fi
echo ""
