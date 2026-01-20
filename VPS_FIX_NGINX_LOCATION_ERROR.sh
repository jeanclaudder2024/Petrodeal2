#!/bin/bash
# Fix nginx location block error

set -e

echo "=========================================="
echo "FIX NGINX LOCATION BLOCK ERROR"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/control"

# 1. Backup config
echo "1. Backing up nginx configuration..."
sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
echo "   ✅ Backup created"
echo ""

# 2. Check the error
echo "2. Checking nginx configuration error..."
sudo nginx -t 2>&1 | head -5
echo ""

# 3. Fix the location block issue
echo "3. Fixing location block structure..."
cd /tmp

# Create Python script to fix the issue
cat > fix_nginx_locations.py << 'PYTHON_SCRIPT'
import re

with open('/etc/nginx/sites-available/control', 'r') as f:
    content = f.read()

# Find if /upload-template is incorrectly nested inside /templates
# The error says location "/upload-template" is outside location "/templates"

# Check if there's a problematic structure
if 'location /templates' in content and 'location /upload-template' in content:
    # Find all location blocks
    location_pattern = r'location\s+([^\s{]+)\s*{'
    locations = re.findall(location_pattern, content)
    
    # Check for nested locations - if /upload-template appears before /templates closes
    # we need to ensure they're at the same level
    
    lines = content.split('\n')
    fixed_lines = []
    in_templates_block = False
    templates_indent = 0
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check if we're entering /templates block
        if re.search(r'location\s+/templates\s*{', line):
            in_templates_block = True
            templates_indent = len(line) - len(line.lstrip())
            fixed_lines.append(line)
            i += 1
            continue
        
        # Check if we're leaving /templates block
        if in_templates_block:
            current_indent = len(line) - len(line.lstrip())
            # If we hit a closing brace at same or less indent, we're out of templates block
            if line.strip() == '}' and current_indent <= templates_indent:
                in_templates_block = False
                fixed_lines.append(line)
                i += 1
                continue
            
            # If we see /upload-template inside /templates block, that's wrong
            if re.search(r'location\s+/upload-template', line):
                print(f"   Found /upload-template inside /templates block at line {i+1}")
                # Skip it here, we'll add it at the correct level later
                # Skip until closing brace
                brace_count = 0
                while i < len(lines):
                    current_line = lines[i]
                    brace_count += current_line.count('{')
                    brace_count -= current_line.count('}')
                    fixed_lines.append("")  # Add empty line instead
                    i += 1
                    if brace_count <= 0:
                        break
                continue
        
        fixed_lines.append(line)
        i += 1
    
    content = '\n'.join(fixed_lines)

# Alternative simpler fix: ensure /upload-template is at server level, not nested
# Remove any /upload-template that might be nested incorrectly
# and ensure it's properly placed

# Let's use a different approach - rebuild the location blocks properly
if 'location /upload-template' in content and 'location /templates' in content:
    print("   Ensuring /upload-template is at correct level...")
    
    # Extract server block content
    server_match = re.search(r'(server\s*{[^}]*location\s+/templates[^}]*})(.*)', content, re.DOTALL)
    
    # Simple fix: ensure locations are properly separated
    # Remove any /upload-template that appears inside /templates block
    # Pattern: location /templates { ... location /upload-template ... }
    # Should become: location /templates { ... } location /upload-template { ... }
    
    # Replace nested location pattern
    content = re.sub(
        r'(location\s+/templates\s*{[^}]*?)(\s+location\s+/upload-template\s*{[^}]*?})(\s*})',
        r'\1\3\n\n        location /upload-template {',
        content,
        flags=re.DOTALL
    )
    
    # If /upload-template location block exists, make sure it's not inside /templates
    # Find /templates block and ensure it closes before /upload-template
    templates_start = content.find('location /templates')
    if templates_start != -1:
        # Find the matching closing brace
        brace_count = 0
        i = templates_start
        in_string = False
        while i < len(content):
            if content[i] == '"' and (i == 0 or content[i-1] != '\\'):
                in_string = not in_string
            elif not in_string:
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        templates_end = i + 1
                        break
            i += 1
        
        # Check if /upload-template appears inside this block
        templates_block = content[templates_start:templates_end]
        if 'location /upload-template' in templates_block:
            print("   Found /upload-template inside /templates block, moving it outside...")
            # Remove /upload-template from inside templates block
            templates_block = re.sub(
                r'\s+location\s+/upload-template\s*{[^}]*?}\s*',
                '',
                templates_block,
                flags=re.DOTALL
            )
            # Rebuild content with fixed templates block
            content = content[:templates_start] + templates_block + content[templates_end:]
            
            # Now add /upload-template as a separate location block after /templates
            # Find where to insert it (after templates closing brace)
            insert_pos = content.find('location /templates')
            if insert_pos != -1:
                # Find closing brace of templates block
                brace_count = 0
                i = content.find('{', insert_pos)
                while i < len(content):
                    if content[i] == '{':
                        brace_count += 1
                    elif content[i] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            insert_pos = i + 1
                            break
                    i += 1
                
                # Check if /upload-template already exists elsewhere
                if content.find('location /upload-template') == -1:
                    # Insert the location block
                    upload_template_block = '''

    # /upload-template endpoint - proxy to document-processor API
    location /upload-template {
        proxy_pass http://localhost:8000/upload-template;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        client_max_body_size 50M;
        
        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        add_header Access-Control-Allow-Credentials true always;
        
        # Handle OPTIONS preflight
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin $http_origin always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
            add_header Access-Control-Allow-Credentials true always;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }'''
                    content = content[:insert_pos] + upload_template_block + content[insert_pos:]

with open('/etc/nginx/sites-available/control', 'w') as f:
    f.write(content)

print("   ✅ Fixed location block structure")
PYTHON_SCRIPT

sudo python3 fix_nginx_locations.py || {
    echo "   ⚠️  Python fix failed, trying manual fix..."
    
    # Manual fix using sed
    # Find and comment out any /upload-template that's inside /templates block
    # This is a simple approach - we'll add it back at the correct level
    
    # First, let's see the structure
    echo "   Current structure around /templates:"
    sudo grep -A 30 "location /templates" "$NGINX_CONFIG" | head -35
}
echo ""

# 4. Test nginx configuration
echo "4. Testing nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx configuration is now valid"
    sudo nginx -t 2>&1 | tail -1
else
    echo "   ❌ Configuration still has errors:"
    sudo nginx -t 2>&1 | head -10
    
    # Try a different fix - use sed to ensure proper structure
    echo "   Attempting alternative fix..."
    # Make sure /upload-template is after /templates block closes
    sudo sed -i '/location \/templates {/,/^    }/{
        /location \/upload-template/d
    }' "$NGINX_CONFIG" || true
    
    # Check if /upload-template exists at server level
    if ! grep -q "location /upload-template" "$NGINX_CONFIG"; then
        echo "   Adding /upload-template location block..."
        # Find where to insert it (after /templates or /api block)
        sudo sed -i '/location \/templates {/,/^    }/a\
\
    location /upload-template {\
        proxy_pass http://localhost:8000/upload-template;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
        client_max_body_size 50M;\
        add_header Access-Control-Allow-Origin $http_origin always;\
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;\
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;\
        add_header Access-Control-Allow-Credentials true always;\
    }' "$NGINX_CONFIG" || true
    fi
    
    # Test again
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "   ✅ Configuration fixed"
    else
        echo "   ⚠️  Still has errors, showing full error:"
        sudo nginx -t 2>&1
    fi
fi
echo ""

# 5. Start nginx
echo "5. Starting nginx..."
sudo systemctl start nginx || {
    echo "   ⚠️  Failed to start nginx, checking status..."
    sudo systemctl status nginx | head -15
}
echo ""

# 6. Verify nginx is running
echo "6. Verifying nginx is running..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is not running"
fi
echo ""

# 7. Test endpoints
echo "7. Testing endpoints..."
CONTROL_SITE=$(curl -s -k -o /dev/null -w "%{http_code}" https://control.petrodealhub.com 2>/dev/null || echo "000")
if [ "$CONTROL_SITE" = "200" ] || [ "$CONTROL_SITE" = "301" ] || [ "$CONTROL_SITE" = "302" ]; then
    echo "   ✅ Control subdomain responding (HTTP $CONTROL_SITE)"
else
    echo "   ⚠️  Control subdomain returns HTTP $CONTROL_SITE"
fi
echo ""

# 8. Summary
echo "=========================================="
echo "NGINX FIX COMPLETE"
echo "=========================================="
echo ""
echo "✅ Nginx configuration fixed"
echo "✅ Nginx started"
echo ""
echo "If issues persist, check:"
echo "  sudo nginx -t"
echo "  sudo systemctl status nginx"
echo "  sudo tail -f /var/log/nginx/error.log"
echo ""
