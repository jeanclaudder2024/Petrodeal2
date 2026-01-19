#!/bin/bash
# Fix unreachable code in else block after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIX ELSE BLOCK UNREACHABLE CODE"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix_else_block.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Use Python to fix the else block structure
echo "2. Finding and fixing unreachable code in else block..."

python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the else block at line 2348 and the raise at line 2349
# Structure should be:
# else:
#     raise HTTPException(...)
# [NO CODE AFTER THIS]
# Next statement should be at same or less indentation as else

target_raise_line = None
target_else_line = None

# Find the else block and raise statement
for i in range(max(0, 2345), min(len(lines), 2355)):
    # Check for else: block
    if i == 2347 and lines[i].strip().startswith('else:'):  # Line 2348 in 1-indexed
        target_else_line = i
        else_indent = len(lines[i]) - len(lines[i].lstrip())
        print(f"   Found else block at line {i+1}: indentation {else_indent} spaces")
        
        # Check next line for raise
        if i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            if 'raise HTTPException(status_code=404' in next_line and 'Template not found' in next_line:
                target_raise_line = i + 1
                raise_indent = len(lines[i + 1]) - len(lines[i + 1].lstrip())
                print(f"   Found raise HTTPException at line {i+2}: indentation {raise_indent} spaces")
                
                # Find where this else block ends (next statement at same or less indentation)
                j = i + 2  # Start after raise statement
                else_block_end = None
                
                while j < len(lines) and j < i + 200:  # Check up to 200 lines
                    current_line = lines[j].strip()
                    current_indent = len(lines[j]) - len(lines[j].lstrip())
                    
                    # Skip empty lines
                    if not current_line:
                        j += 1
                        continue
                    
                    # Check if we've reached the end of the else block
                    # End of else block is when we hit a statement at same or less indentation as else
                    if current_indent <= else_indent:
                        # This could be:
                        # - Next function definition
                        # - Next decorator
                        # - Next top-level statement
                        if (current_line.startswith('@') or
                            current_line.startswith('def ') or
                            current_line.startswith('class ') or
                            current_line.startswith('if ') or
                            current_line.startswith('elif ') or
                            current_line.startswith('else:') or
                            current_line.startswith('except') or
                            current_line.startswith('finally')):
                            else_block_end = j
                            print(f"   Found end of else block at line {j+1}: {current_line[:80]}")
                            break
                    
                    j += 1
                
                if else_block_end is None:
                    # Try to find next function or decorator
                    for k in range(i + 2, min(len(lines), i + 500)):
                        if lines[k].strip().startswith('@app.'):
                            else_block_end = k
                            print(f"   Found end of else block at line {k+1} (next endpoint)")
                            break
                
                # Remove all code between raise and end of else block
                if else_block_end and else_block_end > target_raise_line + 1:
                    lines_to_remove = else_block_end - target_raise_line - 1
                    print(f"   🗑️  Removing {lines_to_remove} lines of unreachable code (lines {target_raise_line+2} to {else_block_end+1})")
                    
                    # Show what will be removed
                    print("   Lines to be removed:")
                    for k in range(target_raise_line + 1, else_block_end):
                        content = lines[k].rstrip()
                        if len(content) > 100:
                            content = content[:100] + "..."
                        print(f"      {k+1}: {content}")
                    
                    # Remove the lines
                    del lines[target_raise_line + 1:else_block_end]
                    
                    # Write back
                    with open('main.py', 'w', encoding='utf-8') as f:
                        f.writelines(lines)
                    
                    print(f"   ✅ Removed unreachable code from else block")
                    print(f"   ✅ File now has {len(lines)} lines")
                elif else_block_end and else_block_end == target_raise_line + 1:
                    print(f"   ✅ No unreachable code (else block ends immediately after raise)")
                else:
                    print(f"   ⚠️  Could not determine end of else block")
                    print(f"   Attempting to find next function...")
                    
                    # Look for next @app decorator or function definition
                    for k in range(target_raise_line + 1, min(len(lines), target_raise_line + 100)):
                        if lines[k].strip().startswith('@app.'):
                            print(f"   Found next endpoint at line {k+1}, removing code from {target_raise_line+2} to {k+1}")
                            
                            # Remove all code between raise and next endpoint
                            lines_to_remove = k - target_raise_line - 1
                            if lines_to_remove > 0:
                                del lines[target_raise_line + 1:k]
                                
                                with open('main.py', 'w', encoding='utf-8') as f:
                                    f.writelines(lines)
                                
                                print(f"   ✅ Removed {lines_to_remove} lines of unreachable code")
                                print(f"   ✅ File now has {len(lines)} lines")
                            break
                break

if target_raise_line is None:
    print("   ❌ Could not find the target raise HTTPException in else block")
    print("   Showing structure around line 2348...")
    for i in range(max(0, 2343), min(len(lines), 2355)):
        marker = " >>> " if i == 2347 else "     "
        print(f"{marker}Line {i+1}: {lines[i].rstrip()}")
PYTHON_FIX

echo ""

# 3. Show fixed area
echo "3. Showing fixed area (lines 2340-2360):"
sed -n '2340,2360p' main.py | cat -n -A
echo ""

# 4. Test Python syntax
echo "4. Testing Python syntax..."
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

# 5. Verify structure
echo "5. Verifying code structure..."
STRUCTURE_CHECK=$(sed -n '2348,2352p' main.py | head -5)
if echo "$STRUCTURE_CHECK" | grep -q "raise HTTPException" && \
   ! echo "$STRUCTURE_CHECK" | tail -n +3 | grep -q "^[[:space:]]*[^[:space:]]"; then
    echo "   ✅ Correct structure: raise HTTPException with no code after it in else block"
else
    echo "   ⚠️  Checking structure manually..."
    sed -n '2348,2355p' main.py | cat -n -A
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
    echo "✅ Unreachable code removed from else block"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
