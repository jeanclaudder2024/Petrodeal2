# 🔑 GET NEW API KEY - Step by Step

## ✅ Confirmed: Your Current Key is INVALID

Your test shows:
- ✅ .env file exists
- ✅ Key exists (208 characters - correct length)
- ❌ **Key returns 401 - IT'S WRONG/EXPIRED**

## Solution: Get Fresh Key from Supabase

### Step 1: Open Supabase Dashboard

Go to this URL in your browser:
```
https://supabase.com/dashboard/project/ozjhdxvwqbzcvcywhwjg/settings/api
```

### Step 2: Find the API Keys Section

Look for **"Project API keys"** section on the page.

### Step 3: Copy the `anon` `public` Key

- Find the key labeled **`anon` `public`**
- Click the **eye icon** or **copy button** to reveal it
- **Copy the ENTIRE key** (it's a long JWT token starting with `eyJ...`)

### Step 4: Update .env File on VPS

```bash
cd /opt/petrodealhub

# Replace YOUR_NEW_KEY with the key you just copied from dashboard
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_KEY_HERE
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=YOUR_NEW_KEY_HERE
EOF
```

**IMPORTANT:** Replace `YOUR_NEW_KEY_HERE` with the actual key from Supabase!

### Step 5: Test the New Key

```bash
# Test the new key
KEY=$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'=' -f2)
curl -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nHTTP Status: %{http_code}\n"
```

**You MUST see `HTTP Status: 200` for it to work!**

### Step 6: Rebuild

```bash
# Only rebuild if key test shows 200!
rm -rf dist node_modules/.vite
npm run build
pm2 restart all
```

## Quick One-Line Update (After Getting New Key)

```bash
cd /opt/petrodealhub && \
NEW_KEY="PASTE_YOUR_NEW_KEY_FROM_DASHBOARD_HERE" && \
cat > .env << EOF
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=$NEW_KEY
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=$NEW_KEY
EOF
curl -H "apikey: $NEW_KEY" -H "Authorization: Bearer $NEW_KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nStatus: %{http_code}\n" && \
npm run build && pm2 restart all
```

## Why Your Key is Wrong

The key in the code (`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`) is:
- ❌ Expired
- ❌ Rotated by Supabase
- ❌ From a different project
- ❌ Never was valid

**You MUST get a fresh key from the Supabase Dashboard!**

## After Getting New Key

1. Update `.env` file
2. Test it shows `200` status
3. Rebuild frontend
4. Restart services
5. Clear browser cache
6. Try login

---

**The key is definitely wrong. Get a fresh one from Supabase Dashboard!** 🔑

