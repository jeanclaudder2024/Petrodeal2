#!/bin/bash
# Fix syntax error and install dependencies

set -e

echo "=========================================="
echo "FIX SYNTAX ERROR AND INSTALL DEPENDENCIES"
echo "=========================================="
echo ""

cd /opt/petrodealhub/document-processor

# 1. Fix syntax error at line 2350
echo "1. Fixing syntax error at line 2350..."
# Backup first
cp main.py main.py.backup.syntax_fix_$(date +%Y%m%d_%H%M%S)

# Check what's at line 2350
echo "   Checking line 2350..."
LINE_2350=$(sed -n '2350p' main.py 2>/dev/null || echo "")
echo "   Line 2350: '$LINE_2350'"

# If it's the EMPTY/NULL warning line that's misplaced
if echo "$LINE_2350" | grep -q "EMPTY/NULL, skipping"; then
    echo "   Found misplaced EMPTY/NULL line, removing it..."
    # Remove line 2350
    sed -i '2350d' main.py
    echo "   ✅ Removed duplicate line"
fi

# Check syntax again
echo "   Re-checking syntax..."
if python3 -m py_compile main.py 2>&1; then
    echo "   ✅ Syntax is now valid"
else
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1 | head -3)
    echo "   ⚠️  Still has syntax errors:"
    echo "$SYNTAX_ERR"
    echo ""
    echo "   Restoring from git..."
    git checkout main.py || git checkout HEAD main.py || {
        cd ..
        git submodule update --init --recursive document-processor
        cd document-processor
        git pull origin master || git pull origin main
        git checkout main.py
    }
    # Remove null bytes
    tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true
    
    # Check syntax again
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax is now valid after restore"
    else
        echo "   ❌ Still has syntax errors after restore"
        python3 -m py_compile main.py 2>&1 | head -5
    fi
fi
echo ""

# 2. Install dependencies in the correct venv
echo "2. Installing Python dependencies..."
cd /opt/petrodealhub/document-processor

# Activate the parent venv (since that's what PM2 is using)
if [ -d "../venv" ]; then
    source ../venv/bin/activate
    echo "   Using parent venv: ../venv"
    PYTHON_CMD="../venv/bin/python"
elif [ -d "venv" ]; then
    source venv/bin/activate
    echo "   Using local venv: venv"
    PYTHON_CMD="venv/bin/python"
else
    echo "   No venv found, using system Python"
    PYTHON_CMD="python3"
fi

echo "   Upgrading pip..."
pip install --upgrade pip 2>&1 | tail -3 || echo "   ⚠️  Could not upgrade pip"

echo "   Installing FastAPI and dependencies..."
pip install fastapi uvicorn python-multipart supabase python-docx python-dotenv 2>&1 | tail -10 || echo "   ⚠️  Some packages failed"

# Verify installation
echo "   Verifying installation..."
python3 << 'PYTEST'
try:
    import fastapi
    import uvicorn
    print("   ✅ FastAPI and uvicorn are installed")
except ImportError as e:
    print(f"   ❌ Still missing: {e}")
    exit(1)
PYTEST

if [ $? -eq 0 ]; then
    echo "   ✅ Dependencies installed successfully"
else
    echo "   ⚠️  Dependencies may not be fully installed"
fi
echo ""

# 3. Start API with PM2 (single instance)
echo "3. Starting python-api with PM2..."
cd /opt/petrodealhub/document-processor

# Ensure no existing python-api
pm2 delete python-api 2>/dev/null || true
sleep 2

# Start single instance with correct Python
echo "   Starting with: $PYTHON_CMD"
pm2 start "$PYTHON_CMD" main.py \
    --name python-api \
    --interpreter python3 \
    --cwd /opt/petrodealhub/document-processor \
    --watch false \
    --instances 1 || {
    echo "   ⚠️  Failed with $PYTHON_CMD, trying system python3..."
    pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
}

sleep 6
echo ""

# 4. Check status
echo "4. Checking python-api status..."
pm2 status python-api
echo ""

# 5. Check for errors
echo "5. Checking for errors..."
ERRORS=$(pm2 logs python-api --lines 20 --nostream 2>&1 | grep -i "error\|exception\|traceback" | tail -5 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS" | while read line; do
        echo "   $line"
    done
else
    echo "   ✅ No errors in recent logs"
fi
echo ""

# 6. Check port 8000
echo "6. Checking port 8000..."
for i in {1..10}; do
    if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
        echo "   ✅ Port 8000 is in use!"
        lsof -i:8000 2>/dev/null | head -3 || netstat -tulpn 2>/dev/null | grep ":8000" | head -2
        break
    else
        echo "   Waiting for port 8000... (attempt $i/10)"
        if [ $i -eq 5 ]; then
            echo "   Checking logs..."
            pm2 logs python-api --lines 20 --nostream | tail -15
        fi
        sleep 2
    fi
done
echo ""

# 7. Test API
echo "7. Testing API..."
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

# 8. Save PM2
echo "8. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save"
echo ""

# 9. Final summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Syntax errors: $(python3 -m py_compile main.py 2>&1 | grep -q 'SyntaxError\|IndentationError' && echo 'Fixed ✅' || echo 'Remain ❌')"
echo "  Dependencies: $(python3 -c 'import fastapi' 2>&1 && echo 'Installed ✅' || echo 'Missing ❌')"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo 'In use ✅' || echo 'Not in use ❌')"
echo "  API health: HTTP $HTTP_CODE"
echo "  PM2 processes: $(pm2 list | grep -c 'python-api' || echo '0')"
echo ""
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is working! Test /cms/ endpoint in browser."
else
    echo "⚠️  API is still not responding. Check logs: pm2 logs python-api"
fi
echo ""
