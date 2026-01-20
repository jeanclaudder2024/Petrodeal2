#!/bin/bash
# Remove email_service.py file and import statement

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "REMOVE EMAIL_SERVICE.PY AND IMPORT"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_remove_email_service.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Find and remove import statement
echo "2. Finding and removing email_service import..."

# Use Python to find and remove the import
python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find import statements for email_service
imports_found = []
for i, line in enumerate(lines):
    if 'email_service' in line.lower() or 'EmailService' in line:
        imports_found.append((i, line.rstrip()))

if imports_found:
    print(f"   Found {len(imports_found)} line(s) with email_service:")
    for i, line_content in imports_found:
        print(f"      Line {i+1}: {line_content}")
    
    # Remove all lines containing email_service imports
    lines_to_remove = [i for i, _ in imports_found]
    lines_to_remove.sort(reverse=True)  # Remove from end to preserve indices
    
    for i in lines_to_remove:
        print(f"   🗑️  Removing line {i+1}: {lines[i].rstrip()}")
        del lines[i]
    
    # Write back
    with open('main.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"   ✅ Removed {len(imports_found)} import line(s)")
    print(f"   ✅ File now has {len(lines)} lines")
else:
    print("   ✅ No email_service imports found")
PYTHON_FIX

echo ""

# 3. Remove email_service.py file if it exists
echo "3. Removing email_service.py file..."
if [ -f "email_service.py" ]; then
    rm -f email_service.py
    echo "   ✅ Removed email_service.py file"
else
    echo "   ✅ email_service.py file does not exist"
fi
echo ""

# 4. Test Python syntax
echo "4. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error:"
    echo "$SYNTAX_OUTPUT"
    echo ""
    echo "   Showing problematic area:"
    python3 -m py_compile main.py 2>&1 | head -10
    exit 1
fi
echo ""

# 5. Verify no email_service references
echo "5. Verifying no email_service references..."
EMAIL_SERVICE_COUNT=$(grep -i "email_service\|EmailService" main.py | wc -l || echo "0")
if [ "$EMAIL_SERVICE_COUNT" -eq "0" ]; then
    echo "   ✅ No email_service references found"
else
    echo "   ⚠️  Found $EMAIL_SERVICE_COUNT reference(s) to email_service:"
    grep -i "email_service\|EmailService" main.py | head -5
fi
echo ""

# 6. Restart API
echo "6. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 7. Wait and test
echo "7. Waiting 15 seconds for API to start..."
sleep 15
echo ""

# 8. Check status
echo "8. Checking API status..."
pm2 status python-api
echo ""

# 9. Test API
echo "9. Testing API health endpoint..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -5
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Latest error logs:"
    pm2 logs python-api --err --lines 30 --nostream | tail -20
fi
echo ""

# 10. Final summary
echo "=========================================="
echo "FIX COMPLETE - SUMMARY"
echo "=========================================="
echo ""

SYNTAX_OK=false
API_RUNNING=false
API_RESPONDING=false

python3 -m py_compile main.py > /dev/null 2>&1 && SYNTAX_OK=true
pm2 list | grep -q "python-api.*online" && API_RUNNING=true
curl -s http://localhost:8000/health > /dev/null 2>&1 && API_RESPONDING=true

if [ "$SYNTAX_OK" = true ]; then
    echo "✅ Python syntax: OK"
else
    echo "❌ Python syntax: FAILED"
fi

if [ "$API_RUNNING" = true ]; then
    echo "✅ API running: OK"
else
    echo "❌ API running: FAILED"
fi

if [ "$API_RESPONDING" = true ]; then
    echo "✅ API responding: OK"
else
    echo "❌ API responding: FAILED"
fi

echo ""

if [ "$SYNTAX_OK" = true ] && [ "$API_RUNNING" = true ] && [ "$API_RESPONDING" = true ]; then
    echo "🎉 ALL SYSTEMS OPERATIONAL!"
    echo ""
    echo "✅ email_service.py removed"
    echo "✅ Import statements removed"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
