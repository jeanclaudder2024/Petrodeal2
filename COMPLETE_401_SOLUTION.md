# 🔧 COMPLETE 401 Error Solution

## Run Diagnostic First

On your VPS, run:

```bash
cd /opt/petrodealhub
chmod +x diagnose-401.sh
./diagnose-401.sh
```

This will tell you exactly what's wrong.

## Most Common Issues & Fixes

### Issue 1: API Key is Wrong/Expired

**Symptom:** Diagnostic shows `Status: 401`

**Fix:**
1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api
2. Copy the **`anon` `public`** key
3. Update `.env`:
   ```bash
   cd /opt/petrodealhub
   nano .env
   # Replace VITE_SUPABASE_PUBLISHABLE_KEY with new key
   # Replace SUPABASE_KEY with new key
   ```
4. Rebuild: `npm run build && pm2 restart all`

### Issue 2: Keys Not in Build

**Symptom:** Diagnostic shows "Supabase URL NOT found in build"

**Fix:**
```bash
cd /opt/petrodealhub
rm -rf dist node_modules/.vite
npm run build
pm2 restart all
```

### Issue 3: User Doesn't Exist

**Symptom:** API key works (200) but login fails

**Fix:**
1. Go to: https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/auth/users
2. Check if your user exists
3. If not, create one or sign up

### Issue 4: Browser Cache

**Symptom:** Everything looks correct but still fails

**Fix:**
1. Close browser completely
2. Clear ALL data (Ctrl+Shift+Delete → All time)
3. Open in incognito/private mode
4. Try login

## Step-by-Step Complete Fix

### Step 1: Run Diagnostic

```bash
cd /opt/petrodealhub
./diagnose-401.sh
```

### Step 2: Based on Diagnostic Results

**If API key is invalid (401):**
```bash
# Get new key from Supabase Dashboard first!
NEW_KEY="YOUR_NEW_KEY_FROM_DASHBOARD"

cat > .env << EOF
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=$NEW_KEY
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=$NEW_KEY
EOF

# Test the new key
curl -H "apikey: $NEW_KEY" -H "Authorization: Bearer $NEW_KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nStatus: %{http_code}\n"

# If status is 200, rebuild
npm run build
pm2 restart all
```

**If build is missing:**
```bash
rm -rf dist node_modules/.vite
npm run build
pm2 restart all
```

**If user doesn't exist:**
- Go to Supabase Dashboard → Auth → Users
- Create user or sign up again

### Step 3: Clear Browser & Test

1. Clear browser cache completely
2. Try in incognito mode
3. Check browser console (F12) for errors

## Still Not Working?

Share the output of:
```bash
cd /opt/petrodealhub
./diagnose-401.sh
```

This will show exactly what's wrong!

---

**Run the diagnostic script first - it will tell you exactly what to fix!** 🔍

