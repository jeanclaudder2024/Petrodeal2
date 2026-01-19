#!/bin/bash
# Fix Supabase version incompatibility issue

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Fixing Supabase Version Incompatibility"
echo "=========================================="
echo ""

# Activate venv
source venv/bin/activate

echo "1. Checking current Supabase version..."
pip show supabase | grep Version
echo ""

echo "2. Checking httpx version..."
pip show httpx | grep Version
echo ""

echo "3. Updating Supabase and httpx to latest compatible versions..."
pip install --upgrade supabase httpx
echo ""

echo "4. Verifying installations..."
pip show supabase httpx | grep Version
echo ""

echo "5. Testing if Supabase client can be created..."
python -c "
from supabase import create_client
import os
url = os.getenv('SUPABASE_URL', '')
key = os.getenv('SUPABASE_KEY', '')
if url and key:
    try:
        client = create_client(url, key)
        print('✅ Supabase client created successfully')
    except Exception as e:
        print(f'❌ Error: {e}')
else:
    print('⚠️  SUPABASE_URL or SUPABASE_KEY not set (this is OK if not using Supabase)')
" 2>&1
echo ""

echo "6. Restarting API..."
pm2 restart python-api
echo "   ✅ Restart command sent"
echo ""

echo "7. Waiting 5 seconds..."
sleep 5

echo "8. Testing API..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ API is working!"
    curl -s http://localhost:8000/health | head -3
else
    echo "   ❌ API still not responding"
    echo ""
    echo "   Check logs:"
    pm2 logs python-api --err --lines 15 --nostream
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
