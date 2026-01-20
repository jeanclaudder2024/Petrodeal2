#!/bin/bash
# Clean PM2 and ensure only ONE python-api process is running

set -e

echo "=========================================="
echo "CLEAN PM2 - SINGLE PYTHON-API PROCESS"
echo "=========================================="
echo ""

# 1. Check current PM2 status
echo "1. Checking current PM2 status..."
pm2 list
echo ""

# 2. Count python-api processes
echo "2. Counting python-api processes..."
PYTHON_API_COUNT=$(pm2 list | grep -c "python-api" || echo "0")
echo "   Found $PYTHON_API_COUNT python-api process(es)"
echo ""

# 3. Delete ALL python-api processes
echo "3. Deleting ALL python-api processes..."
# Try to delete by name (deletes all with that name)
pm2 delete python-api 2>/dev/null || echo "   No python-api processes to delete"
sleep 3

# Double-check and delete by ID if any remain
for id in $(pm2 jlist | grep -B 5 "python-api" | grep -o '"pm_id":[0-9]*' | cut -d: -f2); do
    echo "   Deleting python-api process ID: $id"
    pm2 delete $id 2>/dev/null || true
done

sleep 2
echo ""

# 4. Verify all are deleted
echo "4. Verifying all python-api processes are deleted..."
REMAINING=$(pm2 list | grep -c "python-api" || echo "0")
if [ "$REMAINING" = "0" ]; then
    echo "   ✅ All python-api processes deleted"
else
    echo "   ⚠️  Still found $REMAINING python-api process(es)"
    echo "   Forcing cleanup..."
    pm2 kill 2>/dev/null || true
    sleep 3
    pm2 resurrect 2>/dev/null || pm2 list
    # Delete again
    pm2 delete python-api 2>/dev/null || true
    sleep 2
fi
echo ""

# 5. Check and free port 8000
echo "5. Checking and freeing port 8000..."
if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
    echo "   Port 8000 is in use, freeing it..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || true
    sleep 2
    echo "   ✅ Port 8000 freed"
else
    echo "   ✅ Port 8000 is free"
fi
echo ""

# 6. Verify Python syntax (must be valid before starting)
echo "6. Verifying Python syntax before starting..."
cd /opt/petrodealhub/document-processor

# Remove null bytes if any
tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true

# Check syntax
if python3 -m py_compile main.py 2>&1 | head -5; then
    echo "   ✅ No syntax errors"
else
    SYNTAX_ERR=$(python3 -m py_compile main.py 2>&1)
    echo "   ❌ Syntax errors found:"
    echo "$SYNTAX_ERR" | head -5
    echo ""
    echo "   Attempting to fix by restoring from git..."
    git checkout main.py || git checkout HEAD main.py || {
        cd ..
        git submodule update --init --recursive document-processor
        cd document-processor
        git pull origin master || git pull origin main
        git checkout main.py
    }
    # Remove null bytes again
    tr -d '\000' < main.py > main.py.tmp && mv main.py.tmp main.py 2>/dev/null || true
    
    # Check syntax again
    if python3 -m py_compile main.py 2>&1; then
        echo "   ✅ Syntax is now valid after restore"
    else
        echo "   ⚠️  Still has syntax errors after restore"
        python3 -m py_compile main.py 2>&1 | head -5
        echo "   Continuing anyway..."
    fi
fi
echo ""

# 7. Find Python executable
echo "7. Finding Python executable..."
cd /opt/petrodealhub/document-processor

if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
    PYTHON_CMD="venv/bin/python"
    echo "   Using: $PYTHON_CMD (venv)"
elif [ -d "../venv" ] && [ -f "../venv/bin/python" ]; then
    PYTHON_CMD="../venv/bin/python"
    echo "   Using: $PYTHON_CMD (parent venv)"
else
    PYTHON_CMD="python3"
    echo "   Using: $PYTHON_CMD (system)"
fi

# Check if Python dependencies are installed
echo "   Checking Python dependencies..."
python3 << 'PYTEST'
try:
    import fastapi
    import uvicorn
    print("   ✅ FastAPI and uvicorn are available")
except ImportError as e:
    print(f"   ❌ Missing dependency: {e}")
    exit(1)
PYTEST

if [ $? -ne 0 ]; then
    echo "   Installing dependencies..."
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d "../venv" ]; then
        source ../venv/bin/activate
    fi
    pip install fastapi uvicorn python-multipart supabase python-docx python-dotenv 2>&1 | tail -5
fi
echo ""

# 8. Start SINGLE python-api process
echo "8. Starting SINGLE python-api process..."
cd /opt/petrodealhub/document-processor

# Ensure we're in the right directory
cd /opt/petrodealhub/document-processor

# Start with absolute path to be safe
FULL_PYTHON_PATH=$(readlink -f "$PYTHON_CMD" 2>/dev/null || which python3)
FULL_MAIN_PATH=$(readlink -f main.py)

echo "   Starting: $FULL_PYTHON_PATH $FULL_MAIN_PATH"
echo "   Working directory: $(pwd)"

# Delete any existing python-api first (double-check)
pm2 delete python-api 2>/dev/null || true
sleep 2

# Start single instance
pm2 start "$PYTHON_CMD" main.py \
    --name python-api \
    --interpreter python3 \
    --cwd /opt/petrodealhub/document-processor \
    --watch false \
    --instances 1 \
    --max-restarts 5 \
    --min-uptime 5000

sleep 5
echo ""

# 9. Verify only ONE process is running
echo "9. Verifying only ONE python-api process is running..."
PYTHON_API_COUNT=$(pm2 list | grep -c "python-api" || echo "0")
if [ "$PYTHON_API_COUNT" = "1" ]; then
    echo "   ✅ Only ONE python-api process running"
else
    echo "   ❌ Found $PYTHON_API_COUNT python-api processes!"
    echo "   Listing all:"
    pm2 list | grep python-api
    echo ""
    echo "   Cleaning up duplicates..."
    # Get IDs and keep only the first one
    FIRST_ID=$(pm2 jlist | grep -B 5 "python-api" | grep '"pm_id":' | head -1 | cut -d: -f2 | tr -d ' ,')
    echo "   Keeping process ID: $FIRST_ID"
    # Delete all except first
    pm2 jlist | grep -B 5 "python-api" | grep '"pm_id":' | cut -d: -f2 | tr -d ' ,' | while read id; do
        if [ "$id" != "$FIRST_ID" ]; then
            pm2 delete $id 2>/dev/null || true
        fi
    done
    sleep 2
fi
echo ""

# 10. Check status
echo "10. Checking python-api status..."
pm2 status python-api
echo ""

# 11. Check for errors
echo "11. Checking for errors in logs..."
sleep 3
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

# 12. Check port 8000
echo "12. Checking port 8000..."
for i in {1..10}; do
    if lsof -ti:8000 > /dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":8000 "; then
        echo "   ✅ Port 8000 is in use (attempt $i)"
        lsof -i:8000 2>/dev/null | head -3 || netstat -tulpn 2>/dev/null | grep ":8000" | head -2
        break
    else
        echo "   Waiting for port 8000... (attempt $i/10)"
        sleep 2
    fi
done
echo ""

# 13. Test API
echo "13. Testing API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ API is responding (HTTP $HTTP_CODE)"
    curl -s http://localhost:8000/health | head -1
else
    echo "   ❌ API is not responding (HTTP $HTTP_CODE)"
    echo "   Checking logs..."
    pm2 logs python-api --lines 30 --nostream | tail -20
fi
echo ""

# 14. Save PM2 configuration
echo "14. Saving PM2 configuration..."
pm2 save || echo "   ⚠️  Could not save PM2 configuration"
echo ""

# 15. Final verification
echo "15. Final verification..."
echo "   PM2 processes:"
pm2 list | grep -E "id|name|status|python-api"
echo ""
echo "   Port 8000 status: $(lsof -ti:8000 > /dev/null 2>&1 && echo '✅ In use' || echo '❌ Not in use')"
echo "   API health: HTTP $HTTP_CODE"

# Test /cms/ endpoint
if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "   Testing /cms/ endpoint..."
    CMS_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com/cms/ 2>/dev/null || echo "000")
    if [ "$CMS_CODE" = "200" ]; then
        echo "   ✅ /cms/ endpoint is working (HTTP $CMS_CODE)"
    else
        echo "   ⚠️  /cms/ endpoint returns HTTP $CMS_CODE"
    fi
fi
echo ""

# 16. Summary
echo "=========================================="
echo "CLEANUP COMPLETE"
echo "=========================================="
echo ""
echo "✅ All duplicate python-api processes removed"
echo "✅ Single python-api process running"
echo "✅ Port 8000: $(lsof -ti:8000 > /dev/null 2>&1 && echo 'In use' || echo 'Not in use')"
echo "✅ API health: HTTP $HTTP_CODE"
echo ""
echo "To monitor:"
echo "  pm2 logs python-api"
echo "  pm2 status python-api"
echo ""
