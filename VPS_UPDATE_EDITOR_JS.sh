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

# Use sed to fix the API endpoint
sed -i "s|apiBase = 'https://petrodealhub.com/api';|apiBase = 'https://control.petrodealhub.com';|g" cms/editor.js

# Also fix if it's in a different format
sed -i "s|'https://petrodealhub.com/api'|'https://control.petrodealhub.com'|g" cms/editor.js

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
