#!/bin/bash
# Fix corrupted main.py with null bytes and syntax errors

set -e

echo "=========================================="
echo "FIX CORRUPTED MAIN.PY"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Backup main.py
echo "1. Backing up main.py..."
cp main.py main.py.backup.$(date +%Y%m%d_%H%M%S)
echo "   ✅ Backup created"
echo ""

# 2. Check for null bytes
echo "2. Checking for null bytes in main.py..."
NULL_BYTES=$(grep -c $'\x00' main.py 2>/dev/null || echo "0")
if [ "$NULL_BYTES" != "0" ]; then
    echo "   ❌ Found null bytes in main.py"
    echo "   Removing null bytes..."
    
    # Remove null bytes
    tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py
    echo "   ✅ Null bytes removed"
else
    echo "   ✅ No null bytes found"
fi
echo ""

# 3. Check file integrity
echo "3. Checking file integrity..."
FILE_SIZE=$(wc -c < main.py)
if [ "$FILE_SIZE" -lt 1000 ]; then
    echo "   ❌ File is too small ($FILE_SIZE bytes), may be corrupted"
    echo "   Restoring from git..."
    git checkout main.py || git checkout master main.py || {
        echo "   ⚠️  Could not restore from git, trying to pull fresh copy..."
        cd ..
        git submodule update --init --recursive document-processor
        cd document-processor
        git checkout main.py
    }
    echo "   ✅ Restored from git"
else
    echo "   ✅ File size is normal ($FILE_SIZE bytes)"
fi
echo ""

# 4. Check Python syntax
echo "4. Checking Python syntax..."
SYNTAX_ERROR=$(python3 -m py_compile main.py 2>&1 || echo "ERROR")
if echo "$SYNTAX_ERROR" | grep -q "SyntaxError\|IndentationError"; then
    echo "   ❌ Syntax errors found:"
    echo "$SYNTAX_ERROR" | head -5
    
    # Try to fix line 2350 indentation issue
    if echo "$SYNTAX_ERROR" | grep -q "line 2350"; then
        echo ""
        echo "   Attempting to fix line 2350 indentation..."
        
        # Check what's at line 2350
        LINE_2350=$(sed -n '2350p' main.py 2>/dev/null || echo "")
        echo "   Line 2350 content: $LINE_2350"
        
        # Check context around line 2350
        echo "   Context around line 2350:"
        sed -n '2345,2355p' main.py | cat -A | head -11
        
        # Try to fix common indentation issues
        # If line 2350 has unexpected indent, check the previous lines
        PREV_LINE=$(sed -n '2349p' main.py)
        PREV_INDENT=$(echo "$PREV_LINE" | sed 's/[^ ].*//' | wc -c)
        CURRENT_INDENT=$(echo "$LINE_2350" | sed 's/[^ ].*//' | wc -c)
        
        if [ "$CURRENT_INDENT" -gt "$PREV_INDENT" ] && [ "$PREV_INDENT" -gt 0 ]; then
            echo "   Fixing indentation at line 2350..."
            # This is a simplified fix - may need manual review
        fi
        
        # Alternative: restore from git
        echo "   Restoring main.py from git to get clean version..."
        git checkout main.py || git checkout HEAD main.py || {
            echo "   ⚠️  Could not restore from git, will need manual fix"
        }
    fi
    
    # Check syntax again
    echo ""
    echo "   Re-checking syntax after fix attempt..."
    python3 -m py_compile main.py 2>&1 && echo "   ✅ Syntax is now valid" || {
        echo "   ⚠️  Syntax errors remain:"
        python3 -m py_compile main.py 2>&1 | head -5
        echo ""
        echo "   Will try to restore from git submodule..."
        cd ..
        git submodule update --init --recursive document-processor
        cd document-processor
        git pull origin master || git pull origin main
        git checkout main.py
    }
else
    echo "   ✅ No syntax errors found"
fi
echo ""

# 5. Remove null bytes again (in case restore added them)
echo "5. Final cleanup - removing any remaining null bytes..."
tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py
echo "   ✅ Cleanup complete"
echo ""

# 6. Install Python dependencies
echo "6. Installing Python dependencies..."
cd /opt/petrodealhub/document-processor

# Activate venv if exists
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "   Using venv: venv/bin/python"
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
    echo "   Using venv: ../venv/bin/python"
else
    echo "   Using system Python (no venv found)"
fi

# Install dependencies
echo "   Installing FastAPI and dependencies..."
pip install --upgrade pip 2>&1 | tail -3 || echo "   ⚠️  Could not upgrade pip"
pip install fastapi uvicorn python-multipart supabase python-docx python-dotenv 2>&1 | tail -10 || echo "   ⚠️  Some packages failed to install"

# Check if fastapi is now available
python3 << 'PYTEST'
try:
    import fastapi
    import uvicorn
    print("✅ FastAPI and uvicorn are available")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
PYTEST

if [ $? -eq 0 ]; then
    echo "   ✅ Dependencies installed successfully"
else
    echo "   ⚠️  Dependencies may not be fully installed"
fi
echo ""

# 7. Start API with PM2
echo "7. Starting API with PM2..."
cd /opt/petrodealhub/document-processor

# Find Python executable
if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
else
    PYTHON_CMD="python3"
fi

# Delete any existing python-api
pm2 delete python-api 2>/dev/null || true
sleep 2

# Start API
echo "   Starting with: $PYTHON_CMD"
pm2 start "$PYTHON_CMD" main.py \
    --name python-api \
    --interpreter python3 \
    --cwd /opt/petrodealhub/document-processor \
    --watch false \
    || {
    echo "   ⚠️  Failed to start with $PYTHON_CMD, trying system python3..."
    pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
}

echo "   Waiting for API to start..."
sleep 8
echo ""

# 8. Check status
echo "8. Checking API status..."
pm2 status python-api
echo ""

# 9. Check for errors in logs
echo "9. Checking for errors in logs..."
ERRORS=$(pm2 logs python-api --lines 20 --nostream 2>&1 | grep -i "error\|exception\|traceback\|null bytes" | tail -5 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS" | while read line; do
        echo "   $line"
    done
else
    echo "   ✅ No errors in recent logs"
fi
echo ""

# 10. Test API
echo "10. Testing API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking detailed logs..."
    pm2 logs python-api --lines 30 --nostream | tail -20
fi
echo ""

# 11. Check port 8000
echo "11. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   ✅ Port 8000 is in use"
    lsof -i:8000 2>/dev/null | head -3 || netstat -tulpn 2>/dev/null | grep ":8000" | head -2
else
    echo "   ❌ Port 8000 is NOT in use"
fi
echo ""

# 12. Save PM2
echo "12. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save PM2 configuration"
echo ""

# 13. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  File corruption: Fixed (null bytes removed)"
echo "  Syntax errors: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo 'Remain ❌' || echo 'Fixed ✅')"
echo "  Dependencies: $(python3 -c 'import fastapi' 2>&1 && echo 'Installed ✅' || echo 'Missing ❌')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo 'In use ✅' || echo 'Not in use ❌')"
echo "  API health: HTTP $HTTP_CODE"
echo ""
echo "If API is still not working, check:"
echo "  pm2 logs python-api"
echo "  python3 -m py_compile main.py"
echo ""
