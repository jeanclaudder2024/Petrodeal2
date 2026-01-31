#!/bin/bash

echo "=========================================="
echo "  Check OpenAI API Key Configuration"
echo "=========================================="

cd /opt/petrodealhub/document-processor

echo "1. Check environment variable:"
echo "=========================================="
if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY is set in environment"
    echo "   Value: ${OPENAI_API_KEY:0:10}...${OPENAI_API_KEY: -5} (truncated for security)"
else
    echo "❌ OPENAI_API_KEY is NOT set in environment"
fi

echo ""
echo "2. Check .env file:"
echo "=========================================="
if [ -f .env ]; then
    echo "✅ .env file exists"
    if grep -q "OPENAI_API_KEY" .env; then
        echo "✅ OPENAI_API_KEY found in .env file"
        # Show first 10 and last 5 characters only
        KEY=$(grep "OPENAI_API_KEY" .env | cut -d'=' -f2)
        if [ -n "$KEY" ]; then
            echo "   Value: ${KEY:0:10}...${KEY: -5}"
        else
            echo "   ⚠️  Key is empty"
        fi
    else
        echo "❌ OPENAI_API_KEY NOT found in .env file"
    fi
else
    echo "❌ .env file does NOT exist"
fi

echo ""
echo "3. Check Supabase system_settings table:"
echo "=========================================="
echo "Querying Supabase..."
cd /opt/petrodealhub/document-processor
source venv/bin/activate

python3 << 'PYTHON_SCRIPT'
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ozjhdxvwqbzcvcywhwjg.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q")

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = supabase.table('system_settings').select('setting_value').eq('setting_key', 'openai_api_key').limit(1).execute()
    
    if response.data and len(response.data) > 0:
        key_value = response.data[0].get('setting_value', '')
        if key_value and len(key_value) > 15:
            print(f"✅ OpenAI key found in Supabase system_settings")
            print(f"   Value: {key_value[:10]}...{key_value[-5:]}")
        else:
            print(f"❌ OpenAI key in Supabase is empty or invalid")
    else:
        print("❌ OpenAI key NOT found in Supabase system_settings table")
        print("   (setting_key='openai_api_key' row doesn't exist)")
except Exception as e:
    print(f"❌ Error checking Supabase: {e}")
PYTHON_SCRIPT

echo ""
echo "=========================================="
echo "  Summary & Next Steps"
echo "=========================================="
echo ""
echo "If OpenAI key is NOT configured:"
echo "  Option 1: Add to Supabase (recommended)"
echo "    1. Get key from: https://platform.openai.com/api-keys"
echo "    2. Insert into system_settings table:"
echo "       setting_key = 'openai_api_key'"
echo "       setting_value = 'sk-...your-key...'"
echo ""
echo "  Option 2: Add to .env file"
echo "    echo 'OPENAI_API_KEY=sk-...your-key...' >> .env"
echo ""
echo "  Option 3: System will use rule-based mapping"
echo "    Works well but not as smart as AI mapping"
echo ""
echo "Then restart API: pm2 restart python-api"
echo "=========================================="
