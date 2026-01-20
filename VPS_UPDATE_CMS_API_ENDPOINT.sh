#!/bin/bash
# Update CMS to use same origin API instead of main API

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "UPDATE CMS API ENDPOINT"
echo "=========================================="
echo ""

# 1. Backup CMS file
BACKUP_FILE="cms/cms.js.before_update.$(date +%Y%m%d_%H%M%S)"
cp cms/cms.js "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Update API endpoint
echo "2. Updating CMS API endpoint..."

# Use Python to update the file
python3 << 'PYTHON_FIX'
import re

with open('cms/cms.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the API endpoint for control.petrodealhub.com
# Change from: apiBase = 'https://petrodealhub.com/api';
# To: apiBase = 'https://control.petrodealhub.com';

old_line = "apiBase = 'https://petrodealhub.com/api';"
new_line = "apiBase = 'https://control.petrodealhub.com';"

if old_line in content:
    content = content.replace(old_line, new_line)
    print(f"   ✅ Updated API endpoint")
    print(f"   Changed from: {old_line}")
    print(f"   Changed to:   {new_line}")
    
    with open('cms/cms.js', 'w', encoding='utf-8') as f:
        f.write(content)
else:
    print(f"   ⚠️  Could not find the line to replace")
    print(f"   Checking if already updated...")
    if new_line in content:
        print(f"   ✅ Already updated!")
    else:
        print(f"   ❌ Line not found - manual update may be needed")
        # Show the relevant lines
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'control.petrodealhub.com' in line or 'apiBase' in line:
                print(f"   Line {i+1}: {line.strip()}")
PYTHON_FIX

echo ""

# 3. Verify the change
echo "3. Verifying the change..."
if grep -q "apiBase = 'https://control.petrodealhub.com';" cms/cms.js; then
    echo "   ✅ CMS now uses same origin API"
else
    echo "   ⚠️  Update might not have worked"
    grep -A 2 "control.petrodealhub.com" cms/cms.js | head -5
fi
echo ""

# 4. Restart API to serve updated CMS
echo "4. Restarting API to serve updated CMS..."
pm2 restart python-api
echo "   ✅ API restarted"
echo ""

# 5. Wait and verify
echo "5. Waiting 5 seconds..."
sleep 5
echo ""

# 6. Test CMS endpoint
echo "6. Testing CMS endpoint..."
if curl -s https://control.petrodealhub.com/cms > /dev/null 2>&1; then
    echo "   ✅ CMS endpoint is accessible"
else
    echo "   ⚠️  CMS endpoint might not be accessible (check nginx config)"
fi
echo ""

# 7. Test API endpoint
echo "7. Testing API health endpoint from same origin..."
if curl -s https://control.petrodealhub.com/health > /dev/null 2>&1; then
    echo "   ✅ API health endpoint is accessible"
    curl -s https://control.petrodealhub.com/health
else
    echo "   ⚠️  API health endpoint might not be accessible"
fi
echo ""

echo "=========================================="
echo "UPDATE COMPLETE"
echo "=========================================="
echo ""

echo "✅ CMS now uses same origin API (https://control.petrodealhub.com)"
echo "✅ This should fix CORS errors"
echo ""
echo "The CMS will now call:"
echo "  - https://control.petrodealhub.com/auth/login"
echo "  - https://control.petrodealhub.com/auth/me"
echo "  - https://control.petrodealhub.com/health"
echo ""
echo "Instead of:"
echo "  - https://petrodealhub.com/api/auth/login"
echo "  - https://petrodealhub.com/api/auth/me"
echo "  - https://petrodealhub.com/api/health"
echo ""
echo "This should resolve CORS errors since same-origin requests don't need CORS!"
echo ""
