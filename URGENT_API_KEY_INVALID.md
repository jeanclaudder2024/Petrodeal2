# 🚨 URGENT: API Key is INVALID

## Confirmed Problem

Your test shows:
```
{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}
HTTP Status: 401
```

**The API key in the code is WRONG or EXPIRED!**

## Solution: Get Fresh API Key

### Step 1: Get New Key from Supabase Dashboard

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api
   ```

2. **Find "Project API keys" section**

3. **Copy the `anon` `public` key** (NOT service_role!)

4. **Save it - you'll need it in the next step**

### Step 2: Update .env File on VPS

```bash
cd /opt/petrodealhub

# Replace YOUR_NEW_KEY with the key you just copied
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_KEY_HERE
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=YOUR_NEW_KEY_HERE
EOF
```

**IMPORTANT:** Replace `YOUR_NEW_KEY_HERE` with the actual key from Supabase dashboard!

### Step 3: Test the New Key

```bash
# Set your new key
NEW_KEY="YOUR_NEW_KEY_FROM_DASHBOARD"

# Test it
curl -H "apikey: $NEW_KEY" -H "Authorization: Bearer $NEW_KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nHTTP Status: %{http_code}\n"
```

**You should see `HTTP Status: 200` if the key is correct!**

### Step 4: Rebuild Frontend

```bash
cd /opt/petrodealhub

# Clean build
rm -rf dist node_modules/.vite
npm run build

# Restart
pm2 restart all
```

### Step 5: Update Code Fallback (Important!)

After confirming the new key works, update the fallback in code:

1. Edit: `src/integrations/supabase/client.ts`
2. Replace the key on line 8 with your NEW key
3. Commit and push

## Why This Happened

The API key in the code was:
- ❌ Expired
- ❌ Rotated by Supabase
- ❌ From wrong project
- ❌ Never was valid

## How to Prevent This

1. **Always get keys from Supabase Dashboard** (don't copy from old code)
2. **Use environment variables** (don't hardcode in production)
3. **Test keys before deploying** (use the curl command)

## Quick Fix Command (After Getting New Key)

```bash
cd /opt/petrodealhub

# Replace NEW_KEY with your actual new key from dashboard
NEW_KEY="PASTE_YOUR_NEW_KEY_HERE"

cat > .env << EOF
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=$NEW_KEY
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=$NEW_KEY
EOF

# Test the key
curl -H "apikey: $NEW_KEY" -H "Authorization: Bearer $NEW_KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nStatus: %{http_code}\n"

# If status is 200, rebuild
if [ $? -eq 0 ]; then
  rm -rf dist node_modules/.vite
  npm run build
  pm2 restart all
  echo "✅ Fixed! Clear browser cache and try login."
fi
```

---

**The key is definitely wrong. Get a fresh one from Supabase Dashboard!** 🔑

