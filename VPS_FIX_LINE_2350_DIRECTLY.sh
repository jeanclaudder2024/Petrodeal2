#!/bin/bash
# Directly fix line 2350 syntax error on VPS

set -e

cd /opt/petrodealhub/document-processor
source venv/bin/activate

echo "=========================================="
echo "DIRECTLY FIX LINE 2350 SYNTAX ERROR"
echo "=========================================="
echo ""

# 1. Backup
BACKUP_FILE="main.py.before_direct_fix.$(date +%Y%m%d_%H%M%S)"
cp main.py "$BACKUP_FILE"
echo "1. ✅ Backed up to: $BACKUP_FILE"
echo ""

# 2. Show the problematic area
echo "2. Showing problematic area (lines 2345-2355):"
sed -n '2345,2355p' main.py | cat -n -A
echo ""

# 3. Check for common issues
echo "3. Checking for common issues..."

# Check if there's a misplaced continue statement
if grep -n "^[[:space:]]*continue" main.py | grep "^2350:" > /dev/null 2>&1; then
    echo "   ⚠️  Found misplaced 'continue' at line 2350 - removing it"
    sed -i '2350d' main.py
    echo "   ✅ Removed misplaced continue"
fi

# Check if there's incorrect indentation
LINE_2350=$(sed -n '2350p' main.py)
echo "   Line 2350 content: '$LINE_2350'"
echo "   Line 2350 length: ${#LINE_2350}"
echo ""

# 4. Check if line 2350 is empty or has wrong indentation
if [[ -z "$LINE_2350" || "$LINE_2350" =~ ^[[:space:]]+$ ]]; then
    echo "   ⚠️  Line 2350 is empty/whitespace"
    # Get the correct indentation from line 2349
    LINE_2349=$(sed -n '2349p' main.py)
    INDENT=$(echo "$LINE_2349" | sed 's/[^ ].*//')
    echo "   Expected indentation from line 2349: '$INDENT'"
    
    # Replace line 2350 with correctly indented logger.error
    sed -i '2350c\        logger.error(f"Error getting placeholder settings: {e}")' main.py
    echo "   ✅ Fixed line 2350"
fi

# 5. Check for misplaced code after raise HTTPException
if grep -n "raise HTTPException" main.py | grep "^2348:" > /dev/null 2>&1; then
    echo "   ⚠️  Found raise HTTPException at line 2348"
    
    # Check if there's code after it that should be in except block
    LINE_2349=$(sed -n '2349p' main.py)
    if [[ ! "$LINE_2349" =~ ^[[:space:]]*except ]]; then
        echo "   ⚠️  Missing except block after raise - fixing structure..."
        
        # The correct structure should be:
        # raise HTTPException(...)
        # except Exception as e:
        #     logger.error(...)
        
        # Insert except block if missing
        sed -i '2349 i\    except Exception as e:' main.py
        sed -i '2350 i\        logger.error(f"Error getting placeholder settings: {e}")' main.py
        sed -i '2351 i\        raise HTTPException(status_code=500, detail=str(e))' main.py
        echo "   ✅ Fixed structure"
    fi
fi

echo ""

# 6. Test Python syntax
echo "4. Testing Python syntax..."
SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
SYNTAX_EXIT=$?

if [ $SYNTAX_EXIT -eq 0 ]; then
    echo "   ✅ Python syntax is 100% correct!"
else
    echo "   ❌ Syntax error still present:"
    echo "$SYNTAX_OUTPUT"
    echo ""
    echo "   Showing problematic area again:"
    sed -n '2345,2360p' main.py | cat -n -A
    echo ""
    
    # Try more aggressive fix - restore from git
    echo "   Attempting to restore correct structure from git..."
    git checkout HEAD -- main.py 2>/dev/null || true
    
    # If git restore doesn't work, manually fix the structure
    echo "   Manually fixing structure..."
    
    # Create a Python script to fix the file
    python3 << 'PYTHON_FIX'
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find line 2348 (0-indexed is 2347)
if 2347 < len(lines):
    # Check if line 2348 has raise HTTPException
    if 'raise HTTPException' in lines[2347]:
        # Check if next line is except
        if 2348 < len(lines) and 'except' not in lines[2348]:
            # Insert except block
            lines.insert(2348, '    except Exception as e:\n')
            lines.insert(2349, '        logger.error(f"Error getting placeholder settings: {e}")\n')
            lines.insert(2350, '        raise HTTPException(status_code=500, detail=str(e))\n')
            
            with open('main.py', 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print("Fixed structure")
        elif 2348 < len(lines) and lines[2348].strip() == '':
            # Empty line after raise - replace with except
            lines[2348] = '    except Exception as e:\n'
            if 2349 >= len(lines) or 'logger.error' not in lines[2349]:
                lines.insert(2349, '        logger.error(f"Error getting placeholder settings: {e}")\n')
                lines.insert(2350, '        raise HTTPException(status_code=500, detail=str(e))\n')
            
            with open('main.py', 'w', encoding='utf-8') as f:
                f.writelines(lines)
            print("Fixed empty line")
PYTHON_FIX
    
    # Test again
    SYNTAX_OUTPUT=$(python3 -m py_compile main.py 2>&1)
    SYNTAX_EXIT=$?
    
    if [ $SYNTAX_EXIT -eq 0 ]; then
        echo "   ✅ Syntax fixed!"
    else
        echo "   ❌ Still has errors:"
        echo "$SYNTAX_OUTPUT"
        exit 1
    fi
fi
echo ""

# 7. Restart API
echo "5. Restarting API..."
pm2 delete python-api 2>/dev/null || true
sleep 3
cd /opt/petrodealhub/document-processor
pm2 start venv/bin/python --name python-api -- main.py
echo "   ✅ API restarted"
echo ""

# 8. Wait and test
echo "6. Waiting 15 seconds for API to start..."
sleep 15
echo ""

# 9. Check status
echo "7. Checking API status..."
pm2 status python-api
echo ""

# 10. Test API
echo "8. Testing API health endpoint..."
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
