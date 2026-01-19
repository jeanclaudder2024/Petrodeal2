#!/bin/bash
# Update email_service.py with error handling fix

cd /opt/petrodealhub/document-processor

echo "=========================================="
echo "Updating email_service.py with Fix"
echo "=========================================="
echo ""

# Backup current file
cp email_service.py email_service.py.backup.$(date +%Y%m%d_%H%M%S)

# Update from git
echo "1. Pulling latest changes from git..."
git pull origin master || git pull origin main
echo "   ✅ Updated"
echo ""

# Or manually apply the fix if git pull doesn't work
echo "2. Verifying fix is applied..."
if grep -q "try:" email_service.py && grep -A5 "try:" email_service.py | grep -q "create_client"; then
    echo "   ✅ Fix is already applied"
else
    echo "   ⚠️  Fix not found, applying manually..."
    
    # Create fixed version
    cat > /tmp/email_service_fix.py << 'EOF'
# Initialize Supabase (with error handling to prevent app crash)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = None

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Email service: Successfully connected to Supabase")
    else:
        logger.warning("Email service: SUPABASE_URL or SUPABASE_KEY not set, Supabase disabled")
except Exception as e:
    logger.error(f"Email service: Failed to connect to Supabase: {e}")
    logger.warning("Email service: Continuing without Supabase (some features may be disabled)")
    supabase = None
EOF

    # Replace the problematic lines
    python3 << 'PYTHON_EOF'
import re

with open('email_service.py', 'r') as f:
    content = f.read()

# Find and replace the Supabase initialization
old_pattern = r'# Initialize Supabase\s+SUPABASE_URL = os\.getenv\("SUPABASE_URL"\)\s+SUPABASE_KEY = os\.getenv\("SUPABASE_KEY"\)\s+supabase: Client = create_client\(SUPABASE_URL, SUPABASE_KEY\) if SUPABASE_URL and SUPABASE_KEY else None'
new_code = '''# Initialize Supabase (with error handling to prevent app crash)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = None

try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Email service: Successfully connected to Supabase")
    else:
        logger.warning("Email service: SUPABASE_URL or SUPABASE_KEY not set, Supabase disabled")
except Exception as e:
    logger.error(f"Email service: Failed to connect to Supabase: {e}")
    logger.warning("Email service: Continuing without Supabase (some features may be disabled)")
    supabase = None'''

if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_code, content)
    with open('email_service.py', 'w') as f:
        f.write(content)
    print("✅ Fix applied successfully")
else:
    print("⚠️  Pattern not found, trying simpler replacement...")
    # Try simpler replacement
    lines = content.split('\n')
    new_lines = []
    skip_next = 0
    for i, line in enumerate(lines):
        if skip_next > 0:
            skip_next -= 1
            continue
        if '# Initialize Supabase' in line and i+3 < len(lines):
            # Replace with fixed version
            new_lines.append('# Initialize Supabase (with error handling to prevent app crash)')
            new_lines.append('SUPABASE_URL = os.getenv("SUPABASE_URL")')
            new_lines.append('SUPABASE_KEY = os.getenv("SUPABASE_KEY")')
            new_lines.append('supabase: Client = None')
            new_lines.append('')
            new_lines.append('try:')
            new_lines.append('    if SUPABASE_URL and SUPABASE_KEY:')
            new_lines.append('        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)')
            new_lines.append('        logger.info("Email service: Successfully connected to Supabase")')
            new_lines.append('    else:')
            new_lines.append('        logger.warning("Email service: SUPABASE_URL or SUPABASE_KEY not set, Supabase disabled")')
            new_lines.append('except Exception as e:')
            new_lines.append('    logger.error(f"Email service: Failed to connect to Supabase: {e}")')
            new_lines.append('    logger.warning("Email service: Continuing without Supabase (some features may be disabled)")')
            new_lines.append('    supabase = None')
            skip_next = 3  # Skip the next 3 lines (SUPABASE_URL, SUPABASE_KEY, create_client line)
            continue
        new_lines.append(line)
    
    with open('email_service.py', 'w') as f:
        f.write('\n'.join(new_lines))
    print("✅ Fix applied successfully")
PYTHON_EOF
fi

echo ""
echo "3. Verifying Python syntax..."
source venv/bin/activate
python3 -m py_compile email_service.py
if [ $? -eq 0 ]; then
    echo "   ✅ Syntax check passed"
else
    echo "   ❌ Syntax check failed!"
    exit 1
fi

echo ""
echo "4. Restarting API..."
pm2 restart python-api
echo "   ✅ Restart command sent"
echo ""

echo "5. Waiting 5 seconds..."
sleep 5

echo "6. Testing API..."
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
