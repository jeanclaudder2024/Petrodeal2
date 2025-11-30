# 🔥 COMPLETE FIX: 401 Error - Step by Step

## The Root Cause

Your frontend build doesn't have the Supabase API key embedded. This happens because:
1. `.env` file is missing `VITE_SUPABASE_PUBLISHABLE_KEY`
2. OR you didn't rebuild after adding it
3. OR the build is using old cached files

## Complete Fix (Do ALL Steps)

### Step 1: SSH into VPS

```bash
ssh your-username@your-vps-ip
cd /opt/petrodealhub
```

### Step 2: Create/Update .env File

**Delete old .env and create fresh one:**

```bash
rm -f .env
cat > .env << 'EOF'
# Frontend Supabase (REQUIRED for login - MUST start with VITE_)
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q

# Backend Supabase (for Python API)
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
```

### Step 3: Verify .env File

```bash
cat .env
```

**You MUST see these 4 lines:**
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_PUBLISHABLE_KEY
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY

### Step 4: Delete Old Build (Important!)

```bash
rm -rf dist
rm -rf node_modules/.vite
```

### Step 5: Rebuild Frontend

```bash
npm run build
```

**Watch for errors!** If you see errors, fix them first.

### Step 6: Verify Build Has Keys

```bash
# Check if the key is in the built files
grep -r "ozjhdxvwqbzcvcywhwjg" dist/ | head -3
```

If you see output, the keys are embedded ✅
If no output, the build failed ❌

### Step 7: Restart Services

```bash
pm2 restart all
pm2 save
```

### Step 8: Check PM2 Logs

```bash
pm2 logs petrodealhub-app --lines 20
```

Look for any errors.

### Step 9: Test on Browser

1. **Clear ALL browser data:**
   - Press `Ctrl + Shift + Delete`
   - Select "All time"
   - Clear everything
   - Close browser completely

2. **Open browser in incognito/private mode**

3. **Go to your site**

4. **Try to login**

5. **Open DevTools (F12) → Console tab**
   - Look for any errors
   - Check if you see the Supabase URL

## If Still Not Working

### Check 1: Verify Key is Actually in Build

```bash
cd /opt/petrodealhub
grep -r "VITE_SUPABASE" dist/ 2>/dev/null | head -5
```

### Check 2: Test API Key Directly

In browser console (F12), run:

```javascript
// Check what key is being used
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 50) + '...');
```

If both show `undefined`, the build didn't include them!

### Check 3: Verify User Exists

1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/auth/users
2. Check if your user exists
3. If not, create one or sign up

### Check 4: Get Fresh API Key

The key might be expired. Get a new one:

1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api
2. Copy the **`anon` `public`** key
3. Update `.env` file with new key
4. Rebuild: `npm run build`
5. Restart: `pm2 restart all`

## One-Line Complete Fix

```bash
cd /opt/petrodealhub && \
rm -f .env && \
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
rm -rf dist node_modules/.vite && \
npm run build && \
pm2 restart all && \
echo "✅ Fix complete! Clear browser cache and try again."
```

## Debugging: Check What's Actually Happening

Run this to see what's in your build:

```bash
cd /opt/petrodealhub
echo "=== .env file ==="
cat .env | grep VITE
echo ""
echo "=== Checking build ==="
find dist -name "*.js" -exec grep -l "ozjhdxvwqbzcvcywhwjg" {} \; | head -3
```

---

**Follow these steps EXACTLY and the 401 error will be fixed!** 🚀

