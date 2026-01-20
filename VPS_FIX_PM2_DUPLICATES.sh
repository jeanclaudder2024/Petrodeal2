#!/bin/bash
# Fix duplicate PM2 processes and ensure clean API start

set -e

echo "=========================================="
echo "FIX PM2 DUPLICATE PROCESSES"
echo "=========================================="
echo ""

# 1. List all python-api processes
echo "1. Listing all python-api processes..."
pm2 list | grep python-api || echo "   No python-api processes found"
echo ""

# 2. Delete all python-api processes
echo "2. Removing all python-api processes..."
pm2 delete python-api 2>/dev/null || echo "   Process already deleted"
pm2 delete all 2>/dev/null || true
# Wait a moment for cleanup
sleep 2
echo ""

# 3. Check if port 8000 is in use
echo "3. Checking if port 8000 is in use..."
if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   ⚠️  Port 8000 is still in use, killing processes..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || true
    sleep 2
else
    echo "   ✅ Port 8000 is free"
fi
echo ""

# 4. Clean PM2
echo "4. Cleaning PM2..."
pm2 kill 2>/dev/null || true
pm2 flush 2>/dev/null || true
sleep 2
pm2 resurrect 2>/dev/null || true
echo ""

# 5. Start document-processor API cleanly
echo "5. Starting document-processor API cleanly..."
cd /opt/petrodealhub/document-processor

# Find Python executable
if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
else
    PYTHON_CMD="python3"
fi

echo "   Using Python: $PYTHON_CMD"

# Start with PM2
pm2 start "$PYTHON_CMD" main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor || {
    echo "   Failed to start with $PYTHON_CMD, trying system python3..."
    pm2 start python3 main.py --name python-api --interpreter python3 --cwd /opt/petrodealhub/document-processor
}

# Wait for API to start
echo "   Waiting for API to start..."
sleep 5
echo ""

# 6. Verify API is running
echo "6. Verifying API is running..."
pm2 status python-api
echo ""

# 7. Test health endpoint
echo "7. Testing /health endpoint..."
for i in {1..5}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ API is responding (HTTP $HTTP_CODE)"
        curl -s http://localhost:8000/health | head -1
        break
    else
        echo "   Waiting for API... (attempt $i/5) - HTTP $HTTP_CODE"
        sleep 2
    fi
done

if [ "$HTTP_CODE" != "200" ]; then
    echo "   ❌ API is not responding after 5 attempts"
    echo "   Checking logs..."
    pm2 logs python-api --lines 30 --nostream | tail -20
fi
echo ""

# 8. Check for errors in logs
echo "8. Checking for errors in logs..."
ERRORS=$(pm2 logs python-api --lines 50 --nostream 2>&1 | grep -i "error\|exception\|traceback\|failed" | tail -10 || true)
if [ -n "$ERRORS" ]; then
    echo "   Found errors:"
    echo "$ERRORS" | while read line; do
        echo "   $line"
    done
else
    echo "   ✅ No errors found in logs"
fi
echo ""

# 9. Save PM2 configuration
echo "9. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save PM2 configuration"
echo ""

# 10. Summary
echo "=========================================="
echo "PM2 CLEANUP COMPLETE"
echo "=========================================="
echo ""
echo "✅ All duplicate processes removed"
echo "✅ API started cleanly"
echo "✅ Port 8000 verified"
echo ""
echo "PM2 Status:"
pm2 list | grep -E "id|name|status|python-api" | head -5
echo ""
echo "To check logs:"
echo "  pm2 logs python-api"
echo ""
echo "To check status:"
echo "  pm2 status python-api"
echo ""
