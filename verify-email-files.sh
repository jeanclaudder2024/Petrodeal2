#!/bin/bash
# Verify email files are in git

echo "=== Checking Email Files in Git ==="
echo ""

echo "1. Files in local directory:"
ls -la src/pages/admin/Email*.tsx 2>/dev/null || echo "   ❌ Files not found locally"

echo ""
echo "2. Files tracked in git:"
git ls-files | grep -i "Email" || echo "   ❌ No email files tracked"

echo ""
echo "3. Files in last commit:"
git log -1 --name-only --pretty=format: | grep -i "Email" || echo "   ❌ No email files in last commit"

echo ""
echo "4. Files in remote (origin/main):"
git ls-tree -r origin/main --name-only | grep -i "Email" || echo "   ❌ No email files in remote"

echo ""
echo "=== If files are missing, run: ==="
echo "git add src/pages/admin/EmailConfiguration.tsx"
echo "git add src/pages/admin/EmailTemplates.tsx"
echo "git add src/pages/admin/AutoReplySystem.tsx"
echo "git commit -m 'Add email system pages'"
echo "git push origin main"

