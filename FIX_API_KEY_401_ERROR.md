# 🔧 Fix: 401 Unauthorized - API Key Error

## Problem
Getting `401 Unauthorized` when trying to login. This means the Supabase API key is either:
- ❌ Incorrect
- ❌ Expired
- ❌ Not being sent in request headers
- ❌ Project settings changed

## Solution 1: Verify and Update API Key

### Step 1: Get Fresh API Key from Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api**
2. Find the **"Project API keys"** section
3. Copy the **`anon` `public`** key (NOT the `service_role` key)
4. This is your new API key

### Step 2: Update the Key in Your Code

**Option A: Update .env file on VPS**

```bash
cd /opt/petrodealhub
nano .env
```

Update this line with your NEW key:
```env
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_ANON_KEY_HERE
```

**Option B: Update the fallback in code**

Edit `src/integrations/supabase/client.ts` and replace the key on line 8.

### Step 3: Rebuild and Restart

```bash
cd /opt/petrodealhub
npm run build
pm2 restart all
```

## Solution 2: Verify Current Key is Correct

### Test the Key Directly

1. Open browser console (F12)
2. Run this JavaScript:

```javascript
const SUPABASE_URL = 'https://ozjhdxvwqbzcvcywhwjg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q';

fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  }
})
.then(r => console.log('Status:', r.status, r.status === 200 ? '✅ Valid' : '❌ Invalid'))
.catch(e => console.error('Error:', e));
```

If you get `200`, the key is valid. If you get `401`, the key is wrong.

## Solution 3: Check Supabase Project Status

1. Go to: **https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg**
2. Verify:
   - ✅ Project is **Active** (not paused)
   - ✅ Project hasn't been deleted
   - ✅ You have access to the project

## Solution 4: Check Authentication Settings

1. Go to: **https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/auth/providers**
2. Verify:
   - ✅ **Email** provider is enabled
   - ✅ **Confirm email** setting matches your needs
   - ✅ No restrictions blocking authentication

## Solution 5: Verify User Exists

1. Go to: **https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/auth/users**
2. Check if your user account exists
3. If not, create a new user or sign up again

## Quick Diagnostic Commands

### On VPS - Check Current Key

```bash
cd /opt/petrodealhub
echo "Current key in .env:"
grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'=' -f2 | cut -c1-50
echo "..."
```

### On VPS - Test Key with curl

```bash
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q"

curl -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nStatus: %{http_code}\n"
```

- **200** = Key is valid ✅
- **401** = Key is invalid ❌

## Most Common Fix

**90% of cases - Key needs to be refreshed:**

1. Get new key from Supabase Dashboard
2. Update `.env` file
3. Rebuild: `npm run build`
4. Restart: `pm2 restart all`

## Still Not Working?

### Check Browser Network Tab

1. Open DevTools (F12) → Network tab
2. Try to login
3. Click on the failed request: `/auth/v1/token?grant_type=password`
4. Check **Headers** tab:
   - Look for `apikey` header
   - Look for `Authorization` header
   - Verify they contain the API key

### Check Console for Errors

Look for:
- `Invalid API key`
- `JWT expired`
- `Project not found`

## Important Notes

- ✅ Use **`anon` `public`** key (NOT `service_role`)
- ✅ Key must be in `.env` file before building
- ✅ Must rebuild after changing `.env`
- ✅ Key is embedded at build time (not runtime)

---

**After updating the key and rebuilding, the 401 error should be fixed!** 🚀

