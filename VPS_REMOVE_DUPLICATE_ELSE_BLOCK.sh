#!/bin/bash
# Remove duplicate else block after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "REMOVE DUPLICATE ELSE BLOCK"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_remove_duplicate_else.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Showing problematic area (lines 2345-2355):"
sed -n '2345,2355p' main.py | cat -n -A
echo ""

# 3. Use Python to remove duplicate else block
echo "3. Removing duplicate else block..."

python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find duplicate else blocks around line 2348-2350
# Should only have ONE else: followed by ONE raise HTTPException
# If there are two consecutive else blocks, remove the second one

duplicate_found = False

for i in range(max(0, 2345), min(len(lines), 2360)):
    # Check for first else block
    if i < len(lines) - 3 and lines[i].strip().startswith('else:'):
        else_indent = len(lines[i]) - len(lines[i].lstrip())
        
        # Check if next line has raise HTTPException
        if i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if 'raise HTTPException(status_code=404' in next_line and 'Template not found' in next_line:
                # Check if there's another else block after this
                if i + 2 < len(lines):
                    third_line = lines[i + 2].strip()
                    if third_line.startswith('else:'):
                        # Found duplicate else block!
                        duplicate_found = True
                        print(f"   Found first else block at line {i+1}")
                        print(f"   Found duplicate else block at line {i+3}")
                        
                        # Check if duplicate also has raise HTTPException
                        if i + 3 < len(lines):
                            fourth_line = lines[i + 3].strip()
                            if 'raise HTTPException(status_code=404' in fourth_line and 'Template not found' in fourth_line:
                                print(f"   Duplicate else block also has raise HTTPException at line {i+4}")
                                
                                # Find where the duplicate else block ends
                                j = i + 4  # After duplicate raise
                                duplicate_end = None
                                
                                # Look for next statement at same or less indentation
                                while j < len(lines) and j < i + 20:
                                    current_line = lines[j].strip()
                                    current_indent = len(lines[j]) - len(lines[j].lstrip())
                                    
                                    # Skip empty lines
                                    if not current_line:
                                        j += 1
                                        continue
                                    
                                    # End of duplicate else block
                                    if current_indent <= else_indent:
                                        duplicate_end = j
                                        break
                                    
                                    j += 1
                                
                                if duplicate_end is None:
                                    # Look for next significant statement
                                    for k in range(i + 4, min(len(lines), i + 30)):
                                        if lines[k].strip().startswith('#') or lines[k].strip().startswith('if '):
                                            if k > i + 4:
                                                duplicate_end = k
                                                break
                                
                                if duplicate_end:
                                    lines_to_remove = duplicate_end - (i + 2)  # From duplicate else to end
                                    print(f"   🗑️  Removing {lines_to_remove} lines of duplicate else block (lines {i+3} to {duplicate_end+1})")
                                    
                                    # Show what will be removed
                                    print("   Lines to be removed:")
                                    for k in range(i + 2, duplicate_end):
                                        content = lines[k].rstrip()
                                        if len(content) > 100:
                                            content = content[:100] + "..."
                                        print(f"      {k+1}: {content}")
                                    
                                    # Remove the duplicate
                                    del lines[i + 2:duplicate_end]
                                    
                                    # Write back
                                    with open('main.py', 'w', encoding='utf-8') as f:
                                        f.writelines(lines)
                                    
                                    print(f"   ✅ Removed duplicate else block")
                                    print(f"   ✅ File now has {len(lines)} lines")
                                else:
                                    # Just remove the duplicate else and raise (lines i+2 to i+4)
                                    print(f"   🗑️  Removing duplicate else block and raise (lines {i+3} to {i+4})")
                                    
                                    del lines[i + 2:i + 4]  # Remove duplicate else and raise
                                    
                                    with open('main.py', 'w', encoding='utf-8') as f:
                                        f.writelines(lines)
                                    
                                    print(f"   ✅ Removed duplicate else block")
                                    print(f"   ✅ File now has {len(lines)} lines")
                                break

if not duplicate_found:
    print("   ⚠️  Could not find duplicate else block")
    print("   Showing structure around line 2348...")
    for i in range(max(0, 2345), min(len(lines), 2355)):
        marker = " >>> " if i >= 2347 and i <= 2350 else "     "
        print(f"{marker}Line {i+1}: {lines[i].rstrip()}")
PYTHON_FIX

echo ""

# 4. Show fixed area
echo "4. Showing fixed area (lines 2345-2355):"
sed -n '2345,2355p' main.py | cat -n -A
echo ""

# 5. Test Python syntax
echo "5. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT"
    echo ""
    echo "   Showing problematic area:"
    python3 -m py_compile main.py 2>&1 | head -10
    sed -n '2345,2360p' main.py | cat -n -A
    exit 1
fi
echo ""

# 6. Verify structure
echo "6. Verifying code structure..."
ELSE_COUNT=$(sed -n '2345,2355p' main.py | grep -c "^[[:space:]]*else:" || echo "0")
RAISE_COUNT=$(sed -n '2345,2355p' main.py | grep -c "raise HTTPException.*Template not found" || echo "0")

if [ "$ELSE_COUNT" -eq "1" ] && [ "$RAISE_COUNT" -eq "1" ]; then
    echo "   ✅ Correct structure: ONE else block with ONE raise HTTPException"
else
    echo "   ⚠️  Structure might still be incorrect:"
    echo "      Found $ELSE_COUNT else blocks and $RAISE_COUNT raise statements"
    sed -n '2345,2355p' main.py | cat -n -A
fi
echo ""

# 7. Restart API
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 8. Wait and test
echo "8. Waiting 15 seconds for API to start..."
sleep 15
echo ""

# 9. Check status
echo "9. Checking API status..."
pm2 status python-api
echo ""

# 10. Test API
echo "10. Testing API health endpoint..."
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

# 11. Final summary
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
    echo "✅ Duplicate else block removed"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
