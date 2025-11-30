# 🔧 Fix: Email Files Missing on VPS

## Problem
The email system pages exist locally but aren't showing up on VPS after `git pull`.

## Solution: Verify and Push Files

### Step 1: Verify Files Exist Locally

On your **local machine** (Windows), run:

```powershell
# Check if files exist
Test-Path src/pages/admin/EmailConfiguration.tsx
Test-Path src/pages/admin/EmailTemplates.tsx
Test-Path src/pages/admin/AutoReplySystem.tsx

# List all email files
Get-ChildItem src/pages/admin/Email*.tsx
```

### Step 2: Check if Files are Tracked in Git

```powershell
# Check if files are in git
git ls-files | Select-String "Email"

# Check what's in the last commit
git log -1 --name-only
```

### Step 3: Add and Push Files

If files are NOT tracked, run:

```powershell
# Add all email files
git add src/pages/admin/EmailConfiguration.tsx
git add src/pages/admin/EmailTemplates.tsx
git add src/pages/admin/AutoReplySystem.tsx
git add src/utils/emailService.ts
git add document-processor/email_service.py

# Check status
git status

# Commit
git commit -m "Add email system pages to admin panel"

# Push
git push origin main
```

### Step 4: Verify on VPS

On your **VPS**, run:

```bash
cd /opt/petrodealhub

# Pull latest
git pull origin main

# Verify files exist
ls -la src/pages/admin/Email*.tsx

# You should see:
# - EmailConfiguration.tsx
# - EmailTemplates.tsx
# - AutoReplySystem.tsx
```

### Step 5: Rebuild on VPS

```bash
# Rebuild
npm run build

# Restart
pm2 restart all
```

## Quick Fix Script (Run on Local Machine)

```powershell
# Add all email-related files
git add src/pages/admin/Email*.tsx
git add src/utils/emailService.ts
git add document-processor/email_service.py
git add src/components/admin/AdminPanel.tsx

# Commit and push
git commit -m "Add email system pages: EmailConfiguration, EmailTemplates, AutoReplySystem"
git push origin main

# Verify
git ls-files | Select-String "Email"
```

## Expected Output

After `git push`, you should see:
- `src/pages/admin/EmailConfiguration.tsx`
- `src/pages/admin/EmailTemplates.tsx`
- `src/pages/admin/AutoReplySystem.tsx`

in the output of `git ls-files | Select-String "Email"`

---

**Run the Quick Fix Script above on your local machine, then pull on VPS!**

