#!/bin/bash
# Fix misplaced except: after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "FIXING MISPLACED except: STATEMENT"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Checking problematic area..."
sed -n '2340,2390p' main.py | cat -n -A
echo ""

# 3. Use Python to fix the misplaced except:
echo "3. Fixing misplaced except: statement..."
python3 << 'PYTHON_EOF'
import re

with open('main.py', 'r') as f:
    lines = f.readlines()

# Find raise HTTPException with misplaced except: after it
problem_idx = None
for i in range(2330, min(2400, len(lines))):
    if 'raise HTTPException' in lines[i] and 'Template not found' in lines[i]:
        # Check if there's a misplaced except: after it
        if i + 5 < len(lines):
            # Look for except: at similar indentation after raise
            raise_indent = len(lines[i]) - len(lines[i].lstrip())
            for j in range(i + 1, min(i + 15, len(lines))):
                if 'except Exception' in lines[j] or 'except ' in lines[j]:
                    except_indent = len(lines[j]) - len(lines[j].lstrip())
                    # If except is at similar indentation to raise, it's misplaced
                    if except_indent >= raise_indent - 4 and except_indent <= raise_indent + 4:
                        problem_idx = i
                        print(f"   Found problematic raise HTTPException at line {i + 1}")
                        print(f"   Found misplaced except: at line {j + 1}")
                        break
                if problem_idx is not None:
                    break
        if problem_idx is not None:
            break

if problem_idx is None:
    print("   ✅ No problematic except: found")
    exit(0)

# Find all misplaced code after raise HTTPException
raise_indent = len(lines[problem_idx]) - len(lines[problem_idx].lstrip())
lines_to_remove = []

# Look for except: and any code after it that's misplaced
found_except = False
for i in range(problem_idx + 1, min(problem_idx + 50, len(lines))):
    line = lines[i]
    stripped = line.strip()
    
    if not stripped:
        # Keep first empty line after raise, skip others if we've found misplaced code
        if not found_except:
            continue
        else:
            # After misplaced code, skip empty lines
            continue
    
    line_indent = len(line) - len(line.lstrip())
    
    # Check for misplaced except:
    if 'except Exception' in stripped or 'except ' in stripped:
        # If indentation is similar to raise, it's misplaced
        if line_indent >= raise_indent - 4 and line_indent <= raise_indent + 4:
            found_except = True
            lines_to_remove.append(i)
            print(f"   Marking line {i + 1} for removal (misplaced except:): {stripped[:60]}")
            continue
    
    if found_except:
        # After misplaced except:, remove any code that's part of it
        # Until we find valid resume point (next function/block at less indentation)
        if line_indent < raise_indent - 4:
            # Found valid resume point
            break
        
        # Check for patterns that indicate misplaced code
        misplaced_patterns = [
            r'logger\.(info|warning|error)',
            r'plan_tier',
            r'plan_id_uuid',
            r'saved_perms',
            r'# Fallback',
            r'# Get the',
            r'plan_tiers\s*=',
        ]
        
        is_misplaced = False
        for pattern in misplaced_patterns:
            if re.search(pattern, stripped):
                is_misplaced = True
                break
        
        # If indentation is excessive, it's likely misplaced
        if line_indent > raise_indent + 8:
            is_misplaced = True
        
        # Check if this is part of the except block (at except indentation or more)
        if line_indent > raise_indent - 2:
            is_misplaced = True
        
        if is_misplaced:
            lines_to_remove.append(i)
            print(f"   Marking line {i + 1} for removal: {stripped[:60]}")

# Remove lines in reverse order
removed_count = 0
for i in reversed(sorted(set(lines_to_remove))):
    if i < len(lines):
        print(f"   Removing line {i + 1}: {lines[i].strip()[:60]}")
        del lines[i]
        removed_count += 1

print(f"   ✅ Removed {removed_count} misplaced line(s)")

# Ensure proper structure: raise HTTPException followed by empty line or next block
# Make sure there's an empty line after raise if the next line is code at same/less indentation
if problem_idx + 1 < len(lines):
    next_line = lines[problem_idx + 1]
    if next_line.strip() and not next_line.strip().startswith('@'):
        # If next line is not empty and not a decorator, check indentation
        next_indent = len(next_line) - len(next_line.lstrip())
        if next_indent <= raise_indent:
            # Add empty line after raise
            lines.insert(problem_idx + 1, '\n')

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
sed -n '2340,2380p' main.py | cat -n -A
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
    
    # Try git restore as last resort
    echo "   Attempting final git restore..."
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
else
    echo "   ❌ API is not responding yet"
    echo "   Check: pm2 logs python-api --err --lines 30"
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
