#!/bin/bash
# Aggressively remove ALL unreachable code after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "REMOVE ALL UNREACHABLE CODE - AGGRESSIVE FIX"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_aggressive_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Use Python to find and fix the structure precisely
echo "2. Finding and fixing unreachable code structure..."

python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the specific raise HTTPException around line 2349
# It should be: raise HTTPException(...) followed immediately by except Exception as e:
target_raise_line = None

# Look for the pattern: raise HTTPException with Template not found around line 2349
for i in range(max(0, 2345), min(len(lines), 2355)):
    line = lines[i].strip()
    
    # Find the raise statement with Template not found
    if 'raise HTTPException(status_code=404' in line and ('Template not found' in line or 'template_id' in line):
        target_raise_line = i
        indent_raise = len(lines[i]) - len(lines[i].lstrip())
        
        print(f"   Found target raise at line {i+1}: {line[:80]}")
        print(f"   Indentation: {indent_raise} spaces")
        
        # The correct structure should be:
        # raise HTTPException(...)
        # except Exception as e:
        #     logger.error(...)
        #     raise HTTPException(...)
        
        # Find the except block that should immediately follow
        j = i + 1
        found_except = False
        
        # Look for except block - it should be at same or less indentation as the try block
        # Since raise is inside a try, except should be at same indentation as try
        # Try block should be at indent_raise - 4 (standard Python)
        try_indent = indent_raise - 4 if indent_raise >= 4 else 0
        
        while j < len(lines) and j < i + 100:  # Check up to 100 lines ahead
            current_line = lines[j].strip()
            current_indent = len(lines[j]) - len(lines[j].lstrip())
            
            # Check if this is the except block we need (same indentation as try, or less)
            if current_line.startswith('except'):
                if current_indent <= try_indent or current_indent <= indent_raise:
                    print(f"   Found except block at line {j+1}: {current_line[:80]}")
                    print(f"   Except indentation: {current_indent} spaces")
                    
                    # Remove ALL code between raise and except
                    if j > i + 1:
                        lines_to_remove = j - i - 1
                        print(f"   🗑️  Removing {lines_to_remove} lines of unreachable code (lines {i+2} to {j+1})")
                        
                        # Show what will be removed
                        print("   Lines to be removed:")
                        for k in range(i + 1, j):
                            content = lines[k].rstrip()
                            if len(content) > 100:
                                content = content[:100] + "..."
                            print(f"      {k+1}: {content}")
                        
                        # Remove the lines
                        del lines[i + 1:j]
                        
                        # Write back
                        with open('main.py', 'w', encoding='utf-8') as f:
                            f.writelines(lines)
                        
                        print(f"   ✅ Removed unreachable code")
                        print(f"   ✅ File now has {len(lines)} lines")
                        found_except = True
                    else:
                        print(f"   ✅ No unreachable code (except immediately follows raise)")
                        found_except = True
                    break
            
            # If we hit another function or significant structure, stop searching
            if (current_line.startswith('@app.') or 
                (current_line.startswith('def ') and current_indent == 0)):
                print(f"   ⚠️  Hit next function/structure at line {j+1} without finding except")
                print(f"   This means the except block is missing!")
                print(f"   Attempting to insert correct except block...")
                
                # Insert correct except block after raise
                except_block = ['    except Exception as e:\n',
                               '        logger.error(f"Error getting placeholder settings: {e}")\n',
                               '        raise HTTPException(status_code=500, detail=str(e))\n']
                
                lines[i+1:i+1] = except_block
                
                # Write back
                with open('main.py', 'w', encoding='utf-8') as f:
                    f.writelines(lines)
                
                print(f"   ✅ Inserted correct except block after raise")
                found_except = True
                break
            
            j += 1
        
        if not found_except:
            print(f"   ❌ Could not find except block after raise")
            print(f"   Showing structure around raise:")
            for k in range(max(0, i-5), min(len(lines), i+20)):
                marker = " >>> " if k == i else "     "
                print(f"{marker}Line {k+1}: {lines[k].rstrip()}")
        
        break

if target_raise_line is None:
    print("   ❌ Could not find the target raise HTTPException statement")
    print("   Searching for any raise HTTPException...")
    for i in range(2340, min(2360, len(lines))):
        if 'raise HTTPException' in lines[i]:
            print(f"   Found at line {i+1}: {lines[i].strip()[:80]}")
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
if grep -A 3 "raise HTTPException(status_code=404.*Template not found" main.py | grep -q "except Exception"; then
    echo "   ✅ Correct structure: raise HTTPException followed by except block"
else
    echo "   ⚠️  Checking structure manually..."
    grep -A 5 "raise HTTPException(status_code=404.*Template not found" main.py | head -10
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
    echo "✅ Unreachable code removed"
    echo "✅ 502 Bad Gateway should be fixed"
    echo "✅ CMS accessible at: https://control.petrodealhub.com/"
else
    echo "⚠️  Some issues remain"
    echo ""
    echo "Check logs: pm2 logs python-api --err --lines 50"
fi
echo ""
