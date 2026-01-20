#!/bin/bash
# Fix empty try block after removing email_service import

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIX EMPTY TRY BLOCK"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix_empty_try.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Showing problematic area (lines 6260-6270):"
sed -n '6260,6270p' main.py | cat -n -A
echo ""

# 3. Use Python to fix empty try block
echo "3. Fixing empty try block..."

python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find empty try block around line 6262
for i in range(max(0, 6258), min(len(lines), 6270)):
    # Look for try: statement
    if 'try:' in lines[i] and i < len(lines) - 2:
        # Check if next line is except
        if i + 1 < len(lines) and lines[i + 1].strip().startswith('except'):
            # Empty try block found!
            print(f"   Found empty try block at line {i+1}")
            print(f"   Line {i+1}: {lines[i].rstrip()}")
            print(f"   Line {i+2}: {lines[i+1].rstrip()}")
            
            # Check what comes after except
            except_line = i + 1
            except_indent = len(lines[except_line]) - len(lines[except_line].lstrip())
            
            # Find where the except block ends
            j = except_line + 1
            except_end = None
            
            while j < len(lines) and j < except_line + 10:
                current_line = lines[j].strip()
                current_indent = len(lines[j]) - len(lines[j].lstrip())
                
                # Skip empty lines
                if not current_line:
                    j += 1
                    continue
                
                # End of except block when we hit a statement at same or less indentation
                if current_indent <= except_indent:
                    except_end = j
                    break
                
                j += 1
            
            if except_end is None:
                # Look for next significant statement
                for k in range(except_line + 1, min(len(lines), except_line + 20)):
                    if lines[k].strip() and not lines[k].strip().startswith('#'):
                        if len(lines[k]) - len(lines[k].lstrip()) <= except_indent:
                            except_end = k
                            break
            
            if except_end:
                lines_to_remove = except_end - i
                print(f"   🗑️  Removing {lines_to_remove} lines (lines {i+1} to {except_end})")
                
                # Show what will be removed
                print("   Lines to be removed:")
                for k in range(i, except_end):
                    content = lines[k].rstrip()
                    if len(content) > 100:
                        content = content[:100] + "..."
                    print(f"      {k+1}: {content}")
                
                # Remove the empty try/except block
                del lines[i:except_end]
                
                # Write back
                with open('main.py', 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                
                print(f"   ✅ Removed empty try/except block")
                print(f"   ✅ File now has {len(lines)} lines")
                break
            else:
                # Just remove try and except lines
                print(f"   🗑️  Removing try and except lines (lines {i+1} to {i+2})")
                
                # Check what's in the except block
                if i + 2 < len(lines):
                    except_body = lines[i + 2].strip()
                    if except_body and not except_body.startswith('#'):
                        # There's code in except block - remove try and except, keep the body
                        except_body_indent = len(lines[i + 2]) - len(lines[i + 2].lstrip())
                        # Adjust indentation of except body
                        new_indent = ' ' * max(0, except_body_indent - 4)
                        lines[i + 2] = new_indent + except_body + '\n'
                        # Remove try and except lines
                        del lines[i:i+2]
                    else:
                        # Empty except block - remove all
                        del lines[i:i+2]
                else:
                    # Just remove try and except
                    del lines[i:i+2]
                
                # Write back
                with open('main.py', 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                
                print(f"   ✅ Removed empty try/except block")
                print(f"   ✅ File now has {len(lines)} lines")
                break

# Verify no empty try blocks remain
print("\n   Verifying fix...")
for i, line in enumerate(lines):
    if 'try:' in line and i < len(lines) - 1:
        if lines[i + 1].strip().startswith('except'):
            print(f"   ⚠️  Still found empty try block at line {i+1}")
            print(f"      Line {i+1}: {line.rstrip()}")
            print(f"      Line {i+2}: {lines[i+1].rstrip()}")
PYTHON_FIX

echo ""

# 4. Show fixed area
echo "4. Showing fixed area (lines 6260-6270):"
sed -n '6260,6270p' main.py | cat -n -A
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
    sed -n '6260,6270p' main.py | cat -n -A
    exit 1
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
    pm2 logs python-api --err --lines 20 --nostream | tail -20
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
    echo "✅ Empty try block removed"
    echo "✅ All syntax errors fixed"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
