#!/bin/bash
# Fix API not listening on port 8000

set -e

echo "=========================================="
echo "FIX API NOT LISTENING ON PORT 8000"
echo "=========================================="
echo ""

# 1. Check PM2 logs for errors
echo "1. Checking PM2 logs for errors..."
echo "   Recent errors from python-api:"
pm2 logs python-api --lines 50 --nostream 2>&1 | grep -i "error\|exception\|traceback\|failed\|cannot" | tail -20 || echo "   No obvious errors in last 50 lines"
echo ""

# 2. Check all python-api processes
echo "2. Checking all python-api processes..."
pm2 list | grep python-api
echo ""

# 3. Delete all python-api processes
echo "3. Removing all duplicate python-api processes..."
pm2 delete python-api 2>/dev/null || echo "   Processes already deleted"
sleep 3
echo ""

# 4. Check if anything is using port 8000
echo "4. Checking port 8000..."
if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   Port 8000 is in use, killing processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || true
    sleep 2
else
    echo "   ✅ Port 8000 is free"
fi
echo ""

# 5. Check Python syntax
echo "5. Checking Python syntax..."
cd /opt/petrodealhub/document-processor
if python3 -m py_compile main.py 2>&1 | head -20; then
    echo "   ✅ No syntax errors"
else
    echo "   ❌ Syntax errors found!"
    SYNTAX_ERROR=$(python3 -m py_compile main.py 2>&1 | head -5)
    echo "$SYNTAX_ERROR"
fi
echo ""

# 6. Test if API can start manually
echo "6. Testing if API can start manually..."
cd /opt/petrodealhub/document-processor

# Find Python executable
if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
    echo "   Using venv Python: $PYTHON_CMD"
elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
    echo "   Using parent venv Python: $PYTHON_CMD"
else
    PYTHON_CMD="python3"
    echo "   Using system Python: $PYTHON_CMD"
fi

# Test if Python can import required modules
echo "   Testing Python imports..."
python3 << 'PYTEST'
try:
    import fastapi
    import uvicorn
    print("✅ FastAPI and uvicorn imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
PYTEST

if [ $? -ne 0 ]; then
    echo "   ❌ Python dependencies missing!"
    echo "   Installing requirements..."
    pip install fastapi uvicorn python-multipart supabase python-docx python-dotenv 2>&1 | tail -10
fi
echo ""

# 7. Start API with PM2 (single instance)
echo "7. Starting API with PM2 (single clean instance)..."
cd /opt/petrodealhub/document-processor

# Delete any existing python-api
pm2 delete python-api 2>/dev/null || true
sleep 2

# Start with correct working directory and Python
pm2 start "$PYTHON_CMD" main.py \
    --name python-api \
    --interpreter python3 \
    --cwd /opt/petrodealhub/document-processor \
    --watch false \
    --max-restarts 5 \
    --min-uptime 5000 \
    || {
    echo "   ⚠️  Failed to start with $PYTHON_CMD, trying system python3..."
    pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
}

echo "   Waiting for API to start..."
sleep 5
echo ""

# 8. Check PM2 status
echo "8. Checking PM2 status..."
pm2 status python-api
echo ""

# 9. Check if port 8000 is now in use
echo "9. Checking if port 8000 is now listening..."
for i in {1..10}; do
    if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
        echo "   ✅ Port 8000 is now in use!"
        echo "   Process using port 8000:"
        lsof -i:8000 2>/dev/null | head -3 || netstat -tulpn 2>/dev/null | grep ":8000" | head -2
        break
    else
        echo "   Waiting for port 8000... (attempt $i/10)"
        if [ $i -eq 5 ]; then
            echo "   Checking logs for errors..."
            pm2 logs python-api --lines 30 --nostream | tail -20
        fi
        sleep 2
    fi
done
echo ""

# 10. Test API endpoint
echo "10. Testing API endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking detailed logs..."
    pm2 logs python-api --lines 50 --nostream | tail -30
    echo ""
    echo "   Checking if process is actually running..."
    pgrep -af "python.*main.py" || echo "   No Python main.py process found"
fi
echo ""

# 11. Check for runtime errors
echo "11. Checking for runtime errors..."
ERRORS=$(pm2 logs python-api --lines 100 --nostream 2>&1 | grep -i "error\|exception\|traceback\|failed" | tail -10 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS" | while read line; do
        echo "   $line"
    done
    echo ""
    echo "   Full error context:"
    pm2 logs python-api --lines 100 --nostream | grep -B 5 -A 5 -i "error\|exception" | tail -20
else
    echo "   ✅ No obvious errors in logs"
fi
echo ""

# 12. Save PM2 configuration
echo "12. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save PM2 configuration"
echo ""

# 13. Final test
echo "13. Final verification..."
sleep 2
FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$FINAL_CODE" = "200" ]; then
    echo "   ✅ API is working on localhost:8000"
    echo "   Testing /cms/ endpoint via nginx..."
    CMS_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/cms/ 2>/dev/null || echo "000")
    if [ "$CMS_CODE" = "200" ]; then
        echo "   ✅ /cms/ endpoint is working (HTTP $CMS_CODE)"
    else
        echo "   ⚠️  /cms/ endpoint returns HTTP $CMS_CODE (but API is working)"
    fi
else
    echo "   ❌ API is still not responding"
    echo "   This indicates a deeper issue - check logs above"
fi
echo ""

# 14. Summary
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Status:"
echo "  Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo 'in use ✅' || echo 'not in use ❌')"
echo "  API health: HTTP $FINAL_CODE"
echo "  /cms/ endpoint: $(curl -s -k -o /dev/null -w '%{http_code}' https://control.petrodealhub.com/cms/ 2>/dev/null || echo 'ERROR')"
echo ""
echo "If API is still not working:"
echo "  1. Check logs: pm2 logs python-api"
echo "  2. Check if Python dependencies are installed"
echo "  3. Try running manually: cd /opt/petrodealhub/document-processor && python3 main.py"
echo ""
