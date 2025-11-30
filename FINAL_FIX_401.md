# 🚨 FINAL FIX: 401 Error - Complete Solution

## The Real Problem

The 401 error means **the API key is wrong or expired**. Here's how to fix it permanently:

## Step 1: Get FRESH API Key from Supabase

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api

2. **Copy the `anon` `public` key** (NOT service_role)

3. **Save it somewhere safe**

## Step 2: Update ALL Places with New Key

### On Your VPS:

```bash
cd /opt/petrodealhub

# Get your NEW key from Supabase dashboard first, then:
NEW_KEY="YOUR_NEW_KEY_FROM_DASHBOARD"

# Update .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=$NEW_KEY
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=$NEW_KEY
EOF

# Verify it was saved
cat .env
```

### Update Code Fallback (Optional but Recommended):

Edit `src/integrations/supabase/client.ts` and replace the fallback key on line 8 with your new key.

## Step 3: Complete Clean Rebuild

```bash
cd /opt/petrodealhub

# Delete everything
rm -rf dist node_modules/.vite .vite package-lock.json

# Reinstall
npm install

# Rebuild
npm run build

# Verify build worked
ls -la dist/

# Restart
pm2 restart all
```

## Step 4: Test the Key

### Option A: Test in Browser Console

Open your site, press F12, go to Console, and run:

```javascript
fetch('https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'YOUR_NEW_KEY',
    'Authorization': 'Bearer YOUR_NEW_KEY'
  }
})
.then(r => console.log('Status:', r.status, r.status === 200 ? '✅ Valid' : '❌ Invalid'))
```

### Option B: Test with Node.js

```bash
node test-supabase-key.js
```

## Step 5: Clear Everything and Try Again

1. **Clear browser completely:**
   - Close all browser windows
   - Clear all data (Ctrl+Shift+Delete → All time)
   - Restart browser

2. **Try in incognito/private mode**

3. **Try login again**

## Why This Keeps Happening

The API key in the code might be:
- ❌ Expired
- ❌ Rotated by Supabase
- ❌ Wrong project
- ❌ Not the `anon` key (using service_role by mistake)

## Verify Your Key is Correct

The key should:
- ✅ Start with `eyJ` (it's a JWT token)
- ✅ Be the `anon` `public` key (NOT service_role)
- ✅ Be from project: `ozjhdxvwqbzcvcywhwjg`
- ✅ Not be expired

## Still Not Working?

### Check 1: User Account

1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/auth/users
2. Verify your user exists
3. If not, create one or sign up

### Check 2: Authentication Settings

1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/auth/providers
2. Make sure **Email** provider is enabled
3. Check **Confirm email** setting

### Check 3: Project Status

1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg
2. Verify project is **Active** (not paused)
3. Check if project was deleted

## Quick Diagnostic

Run this on VPS to see what's wrong:

```bash
cd /opt/petrodealhub
echo "=== .env check ==="
cat .env 2>/dev/null | grep VITE || echo "❌ No VITE_ variables!"
echo ""
echo "=== Build check ==="
ls -la dist/ 2>/dev/null | head -3 || echo "❌ No dist folder - need to build!"
echo ""
echo "=== Key in build ==="
grep -r "ozjhdxvwqbzcvcywhwjg" dist/ 2>/dev/null | head -1 || echo "❌ Key not in build!"
```

---

**The key is likely expired. Get a fresh one from Supabase Dashboard!** 🔑

