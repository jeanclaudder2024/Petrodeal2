# VPS: Fix Build Not Including New Component

## Problem
The grep commands show no output, meaning the new version (v3.0-FORCE-RELOAD) is NOT in the build.

## Solution

### Step 1: Pull Latest Code from GitHub

```bash
cd /opt/petrodealhub

# Make sure you're on the main branch
git branch

# Pull latest code
git pull origin main

# Verify the component file was updated
grep "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx

# Should show: data-component-version="v3.0-FORCE-RELOAD"
# If no output, the file wasn't updated
```

### Step 2: Verify Component File Has New Code

```bash
# Check the component file directly
cat src/components/VesselDocumentGenerator.tsx | grep -A 5 "v3.0-FORCE-RELOAD"

# Should show the red banner code
# If no output, file needs to be updated
```

### Step 3: Clean Build Again

```bash
cd /opt/petrodealhub

# Remove old build completely
rm -rf dist
rm -rf node_modules/.vite
rm -rf .cache

# Rebuild
npm run build

# Verify new version is in build
grep "v3.0-FORCE-RELOAD" dist/assets/*.js
grep "NEW VERSION v3.0 LOADED" dist/assets/*.js

# Should show output now ✅
```

### Step 4: If Still Not Working - Check Git Status

```bash
cd /opt/petrodealhub

# Check git status
git status

# Check if file is modified
git diff src/components/VesselDocumentGenerator.tsx

# If file shows as modified, commit and pull again
# Or reset to match remote
git fetch origin
git reset --hard origin/main

# Then rebuild
rm -rf dist
npm run build
```

### Step 5: Manual Check of Component File

```bash
# Check the actual component file content
head -60 src/components/VesselDocumentGenerator.tsx | tail -20

# Should show the useEffect with v3.0 console.log
# OR check around line 326-330
sed -n '325,335p' src/components/VesselDocumentGenerator.tsx

# Should show the red banner div with v3.0-FORCE-RELOAD
```

### Step 6: Force Rebuild with No Cache

```bash
cd /opt/petrodealhub

# Complete clean
rm -rf dist node_modules/.vite .cache .vite

# Clear npm cache
npm cache clean --force

# Rebuild
npm run build -- --force

# Check again
grep "v3.0-FORCE-RELOAD" dist/assets/*.js
```

## Quick Diagnostic Commands

```bash
# 1. Check if component file exists and has new code
ls -la src/components/VesselDocumentGenerator.tsx
grep -c "v3.0-FORCE-RELOAD" src/components/VesselDocumentGenerator.tsx
# Should output: 1 (or more if multiple occurrences)

# 2. Check git log to see last commit
git log --oneline -5

# 3. Check if dist folder exists and when it was built
ls -la dist/assets/*.js

# 4. Check build output for errors
npm run build 2>&1 | grep -i error
```

## Expected Result

After pulling and rebuilding, you should see:

```bash
$ grep "v3.0-FORCE-RELOAD" dist/assets/*.js
dist/assets/index-XXXXX.js: ...v3.0-FORCE-RELOAD...
```

If you still get no output, the component file on VPS doesn't have the new code.

