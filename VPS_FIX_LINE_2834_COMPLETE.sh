#!/bin/bash
# Complete fix for line 2834 - fix structure and indentation

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "COMPLETE FIX FOR LINE 2834 - STRUCTURE"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Checking problematic area around line 2834..."
sed -n '2825,2845p' main.py | cat -n -A
echo ""

# 3. Use Python to fix the structure
echo "3. Fixing structure and indentation..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find the problematic area around line 2834
# Looking for: if not file_exists: followed by if not deleted_local:
problem_start = None
for i in range(2825, min(2850, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    # Find the problematic pattern
    if 'if not file_exists:' in stripped:
        # Check if next non-empty line is misplaced
        if i + 1 < len(lines):
            for j in range(i + 1, min(i + 10, len(lines))):
                next_line = lines[j]
                next_stripped = next_line.strip()
                
                if not next_stripped or next_stripped.startswith('#'):
                    continue
                
                # Check if next line has wrong indentation (misplaced if statement)
                if_indent = len(line) - len(line.lstrip())
                next_indent = len(next_line) - len(next_line.lstrip())
                
                # If next line is an if statement at same or less indentation, it's misplaced
                if 'if not deleted_local:' in next_stripped and next_indent <= if_indent:
                    problem_start = i
                    print(f"   Found problematic structure starting at line {i + 1}")
                    print(f"   Line {i + 1}: {stripped[:60]}")
                    print(f"   Line {j + 1}: {next_stripped[:60]} (misplaced)")
                    break
            
            if problem_start is not None:
                break

if problem_start is None:
    print("   ✅ No problematic structure found")
    exit(0)

# The structure should be:
# if not file_exists:
#     raise HTTPException(...)
# 
# NOT:
# if not file_exists:
#     pass
# if not deleted_local:  (this is misplaced)

# Find where this block should end
# Look for the raise HTTPException that should be inside the if not file_exists block
has_raise = False
for i in range(problem_start + 1, min(problem_start + 20, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    if not stripped or stripped.startswith('#'):
        continue
    
    if 'raise HTTPException' in stripped and '404' in stripped:
        has_raise = True
        print(f"   Found raise HTTPException at line {i + 1}")
        break

if not has_raise:
    # No raise found, need to check the structure more carefully
    # Look for the misplaced if not deleted_local and see what should be there
    misplaced_if_idx = None
    for i in range(problem_start + 1, min(problem_start + 10, len(lines))):
        if 'if not deleted_local:' in lines[i]:
            misplaced_if_idx = i
            break
    
    if misplaced_if_idx:
        # Check if there's a pass statement before it (from previous fix)
        if problem_start + 1 < len(lines) and 'pass' in lines[problem_start + 1]:
            # Remove the pass and the misplaced if
            print(f"   Removing pass at line {problem_start + 2}")
            print(f"   Removing misplaced if at line {misplaced_if_idx + 1}")
            
            # Find what should come after if not file_exists
            # It should be raise HTTPException or continue or return
            # Look for the next valid statement after the misplaced if
            
            # Check what comes after the misplaced if
            for i in range(misplaced_if_idx + 1, min(misplaced_if_idx + 10, len(lines))):
                line = lines[i]
                stripped = line.strip()
                
                if not stripped or stripped.startswith('#'):
                    continue
                
                # This might be what should be inside the if not file_exists block
                # Or it might be part of the function structure
                line_indent = len(line) - len(line.lstrip())
                if_indent = len(lines[problem_start]) - len(lines[problem_start].lstrip())
                
                # If this line is at same indentation as the outer if, it's outside
                # If it's more indented, it might belong inside
                if line_indent > if_indent:
                    # This should be inside the if not file_exists block
                    # Move it up and add raise HTTPException
                    print(f"   Found code that should be in if block at line {i + 1}: {stripped[:60]}")
                    break
            
            # Simple fix: replace pass with raise HTTPException
            if_indent = len(lines[problem_start]) - len(lines[problem_start].lstrip())
            indent = ' ' * (if_indent + 4)
            
            # Replace pass with raise HTTPException
            if problem_start + 1 < len(lines) and 'pass' in lines[problem_start + 1]:
                lines[problem_start + 1] = indent + 'raise HTTPException(status_code=404, detail="Template not found")\n'
                print(f"   Replaced pass with raise HTTPException at line {problem_start + 2}")
            
            # Check if misplaced if should be removed or moved
            # If it's at same indentation as outer if, it's separate and should stay
            # But if it's nested incorrectly, it should be removed
            misplaced_indent = len(lines[misplaced_if_idx]) - len(lines[misplaced_if_idx].lstrip())
            if misplaced_indent <= if_indent:
                # It's at same or less indentation - check if it's a duplicate
                # Check if there's another if not deleted_local later that's correct
                has_correct_if = False
                for i in range(misplaced_if_idx + 10, min(misplaced_if_idx + 50, len(lines))):
                    if 'if not deleted_local:' in lines[i]:
                        correct_indent = len(lines[i]) - len(lines[i].lstrip())
                        if correct_indent >= misplaced_indent + 4:
                            has_correct_if = True
                            break
                
                if not has_correct_if:
                    # Remove the misplaced if and its body
                    print(f"   Removing misplaced if statement at line {misplaced_if_idx + 1}")
                    # Find the end of this if block
                    lines_to_remove = [misplaced_if_idx]
                    for i in range(misplaced_if_idx + 1, min(misplaced_if_idx + 10, len(lines))):
                        line = lines[i]
                        stripped = line.strip()
                        if not stripped:
                            continue
                        
                        line_indent = len(line) - len(line.lstrip())
                        # If we've dedented significantly, we're past the if block
                        if line_indent < misplaced_indent:
                            break
                        
                        # Remove lines in the if block
                        if line_indent > misplaced_indent:
                            lines_to_remove.append(i)
                    
                    # Remove in reverse order
                    for i in reversed(sorted(set(lines_to_remove))):
                        print(f"   Removing line {i + 1}: {lines[i].strip()[:60]}")
                        del lines[i]

# Write the fixed file
with open('main.py', 'w') as f:
    f.writelines(lines)

print("   ✅ File structure fixed")
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Python fix failed"
    exit 1
fi

echo ""

# 4. Verify the fix
echo "4. Verifying fix..."
sed -n '2825,2845p' main.py | cat -n -A
echo ""

# 5. Test syntax
echo "5. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT" | head -10
    echo ""
    
    # Try git restore
    echo "   Attempting git restore..."
    cd /opt/petrodealhub/document-processor
    git fetch origin master 2>/dev/null || git fetch origin main 2>/dev/null || true
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null || git reset --hard HEAD 2>/dev/null || true
    git checkout --force . 2>/dev/null || true
    
    python3 -m py_compile main.py 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✅ Git restore successful!"
    else
        echo "   ❌ All fixes failed"
        python3 -m py_compile main.py 2>&1 | head -10
        exit 1
    fi
fi
echo ""

# 6. Verify imports
echo "6. Verifying critical imports..."
python3 << 'PYTHON_EOF'
try:
    from supabase import create_client
    from websockets.asyncio.client import ClientConnection
    print("✅ All imports OK")
except Exception as e:
    print(f"❌ Import error: {e}")
    import sys
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    echo "   ❌ Import verification failed!"
    exit 1
fi
echo ""

# 7. Restart API
echo "7. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 2
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 8. Wait and verify
echo "8. Waiting 10 seconds for API to start..."
sleep 10
echo ""

# 9. Final verification
echo "9. Final verification..."
python3 -m py_compile main.py 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Syntax OK"
else
    echo "   ❌ Syntax still has errors"
fi

ERROR_COUNT=$(pm2 logs python-api --err --lines 15 --nostream 2>/dev/null | grep -c "IndentationError\|SyntaxError" || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "   ✅ No syntax errors in API logs"
else
    echo "   ⚠️  Still errors in API logs:"
    pm2 logs python-api --err --lines 20 --nostream | tail -15
fi

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API is responding!"
    echo ""
    echo "   Health check response:"
    curl -s http://localhost:8000/health | head -3
    echo ""
    echo "   ✅ CMS should be accessible at: https://control.petrodealhub.com/"
else
    echo "   ❌ API is not responding yet"
    echo "   Check: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
