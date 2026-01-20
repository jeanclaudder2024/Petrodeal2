#!/bin/bash
# Update editor.js to use same origin API

set -e

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "UPDATE EDITOR.JS API ENDPOINT"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="cms/editor.js.before_update.$(date +%Y%m%d_%H%M%S)"
cp cms/editor.js "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Update API endpoint
echo "2. Updating editor.js API endpoint..."

# Use sed to fix the API endpoint - handle control.petrodealhub.com separately
sed -i "s|else if (hostname === 'control.petrodealhub.com' || hostname === 'petrodealhub.com' || hostname === 'www.petrodealhub.com') {|else if (hostname === 'control.petrodealhub.com') {|g" cms/editor.js

# Add the new line for control.petrodealhub.com
if ! grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    # Use Python to do a precise replacement
    python3 << 'PYTHON_FIX'
with open('cms/editor.js', 'r') as f:
    content = f.read()

# Replace the problematic section
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
    with open('cms/editor.js', 'w') as f:
        f.write(content)
    print("   ✅ Updated using Python")
else:
    # Try simpler replacement
    import re
    pattern = r"else if \(hostname === 'control\.petrodealhub\.com' \|\| hostname === 'petrodealhub\.com' \|\| hostname === 'www\.petrodealhub\.com'\) \{"
    replacement = "else if (hostname === 'control.petrodealhub.com') {"
    content = re.sub(pattern, replacement, content)
    
    # Now fix the apiBase line
    content = re.sub(
        r"(else if \(hostname === 'control\.petrodealhub\.com'\) \{[^}]+)apiBase = 'https://petrodealhub\.com/api';",
        r"\1apiBase = 'https://control.petrodealhub.com';",
        content,
        flags=re.DOTALL
    )
    
    with open('cms/editor.js', 'w') as f:
        f.write(content)
    print("   ✅ Updated using regex")
PYTHON_FIX
fi

echo "   ✅ Updated API endpoint"
echo ""

# 3. Verify the change
echo "3. Verifying the change..."
if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/editor.js; then
    echo "   ✅ editor.js now uses same origin API"
else
    echo "   ⚠️  Update might not have worked"
    echo "   Showing relevant lines:"
    grep -A 2 -B 2 "control.petrodealhub.com\|petrodealhub.com/api" cms/editor.js | head -10
fi
echo ""

# 4. Restart API to serve updated editor.js
echo "4. Restarting API to serve updated editor.js..."
pm2 restart python-api
echo "   ✅ API restarted"
echo ""

# 5. Wait and verify
echo "5. Waiting 5 seconds..."
sleep 5
echo ""

echo "=========================================="
echo "UPDATE COMPLETE"
echo "=========================================="
echo ""
echo "✅ editor.js now uses same origin API (https://control.petrodealhub.com)"
echo "✅ This should fix CORS errors in the template editor"
echo ""
echo "The template editor should now be able to access:"
echo "   - https://control.petrodealhub.com/csv-files"
echo "   - https://control.petrodealhub.com/database-tables"
echo "   - https://control.petrodealhub.com/plans-db"
echo "   - https://control.petrodealhub.com/templates/..."
echo ""
echo "Please refresh the template editor page and try again!"
echo ""
