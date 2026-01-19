#!/bin/bash
# Remove unreachable code after raise HTTPException

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "REMOVE UNREACHABLE CODE AFTER RAISE HTTPEXCEPTION"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_remove_unreachable.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show problematic area
echo "2. Showing problematic area (lines 2340-2360):"
sed -n '2340,2360p' main.py | cat -n -A
echo ""

# 3. Find the raise HTTPException and remove unreachable code
echo "3. Finding raise HTTPException and removing unreachable code..."

# Use Python to fix this precisely
python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line with "raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")"
# and check if there's unreachable code after it
found_raise = False
raise_line = None
except_line = None

for i, line in enumerate(lines):
    # Look for the specific raise statement around line 2349
    if 'raise HTTPException(status_code=404, detail=f"Template not found' in line or \
       ('raise HTTPException(status_code=404' in line and 'Template not found' in line):
        raise_line = i
        found_raise = True
        print(f"   Found raise HTTPException at line {i+1}: {line.strip()}")
        
        # Check next few lines for unreachable code
        j = i + 1
        unreachable_start = None
        unreachable_end = None
        
        while j < len(lines) and j < i + 30:  # Check up to 30 lines ahead
            # Look for except block (should be next)
            if lines[j].strip().startswith('except'):
                except_line = j
                print(f"   Found except block at line {j+1}: {lines[j].strip()}")
                
                # If there's code between raise and except, it's unreachable
                if j > i + 1:
                    unreachable_start = i + 1
                    unreachable_end = j
                    print(f"   ⚠️  Found unreachable code between lines {i+2} and {j+1}")
                break
            
            # Look for misplaced code patterns
            if 'logger.warning' in lines[j] and 'permission-convert' in lines[j]:
                print(f"   ⚠️  Found misplaced logger.warning at line {j+1}")
                if unreachable_start is None:
                    unreachable_start = j
            
            if 'continue' in lines[j] and j < 2400:  # continue outside loop is suspicious
                print(f"   ⚠️  Found misplaced continue at line {j+1}")
                if unreachable_end is None or j > unreachable_end:
                    unreachable_end = j
            
            # Check if we hit the next function definition
            if lines[j].strip().startswith('@app.') or \
               (lines[j].strip().startswith('def ') and 'async def' not in lines[j-1] if j > 0 else False):
                except_line = j - 1
                if unreachable_end is None:
                    unreachable_end = j - 1
                print(f"   Found next function at line {j+1}, unreachable code ends at {j}")
                break
            
            j += 1
        
        # Remove unreachable code if found
        if unreachable_start is not None and unreachable_end is not None:
            print(f"   🗑️  Removing unreachable code from line {unreachable_start+1} to {unreachable_end+1}")
            
            # Show what will be removed
            print("   Lines to be removed:")
            for k in range(unreachable_start, min(unreachable_end + 1, len(lines))):
                print(f"      {k+1}: {lines[k].rstrip()}")
            
            # Remove the unreachable lines
            del lines[unreachable_start:unreachable_end + 1]
            
            # Write back
            with open('main.py', 'w', encoding='utf-8') as f:
                f.writelines(lines)
            
            print(f"   ✅ Removed {unreachable_end - unreachable_start + 1} lines of unreachable code")
            print(f"   ✅ File now has {len(lines)} lines")
            break

if not found_raise:
    print("   ⚠️  Could not find the specific raise HTTPException statement")
    print("   Checking structure around line 2348...")
    
    # Check lines 2345-2355
    for i in range(2344, min(2355, len(lines))):
        print(f"   Line {i+1}: {lines[i].rstrip()}")
PYTHON_FIX

echo ""

# 4. Show fixed area
echo "4. Showing fixed area (lines 2340-2360):"
sed -n '2340,2360p' main.py | cat -n -A
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
    sed -n '2345,2360p' main.py | cat -n -A
    exit 1
fi
echo ""

# 6. Verify structure
echo "6. Verifying code structure..."
if grep -A 5 "raise HTTPException(status_code=404.*Template not found" main.py | grep -q "except Exception"; then
    echo "   ✅ Correct structure: raise HTTPException followed by except block"
else
    echo "   ⚠️  Structure might still be incorrect"
    grep -A 10 "raise HTTPException(status_code=404.*Template not found" main.py | head -15
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
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API is not responding"
    echo ""
    echo "   Latest error logs:"
    pm2 logs python-api --err --lines 20 --nostream | tail -20
fi
echo ""

echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
