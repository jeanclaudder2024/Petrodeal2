# 🔧 FIX: Your API Keys Are TRUNCATED (Cut Off)!

## Problem Found

Your `.env` file has **INCOMPLETE** API keys! They're cut off:

```
VITE_SUPABASE_PUBLISHABLE_KEY=...LCJpYXQiOjE3NTU5MDAyNzUs>  ❌ INCOMPLETE!
SUPABASE_KEY=...LCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3N>  ❌ INCOMPLETE!
```

JWT tokens must be **COMPLETE** - they're missing the signature part at the end!

## Complete Fix

### On Your VPS, Run This:

```bash
cd /opt/petrodealhub

# Delete the broken .env file
rm -f .env

# Create NEW .env with COMPLETE keys
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF

# Verify the keys are complete
echo "=== Checking key lengths ==="
echo "VITE key length: $(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'=' -f2 | wc -c)"
echo "SUPABASE key length: $(grep '^SUPABASE_KEY=' .env | cut -d'=' -f2 | wc -c)"
echo ""
echo "Both should be around 200+ characters. If less, keys are still truncated!"

# Rebuild
rm -rf dist node_modules/.vite
npm run build

# Restart
pm2 restart all
```

## Verify Keys Are Complete

After creating .env, check:

```bash
# Check key lengths (should be ~200+ characters each)
grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'=' -f2 | wc -c
grep '^SUPABASE_KEY=' .env | cut -d'=' -f2 | wc -c
```

**Both should show ~200+ characters.** If less, the keys are still truncated!

## Complete Key Format

A complete JWT token looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
```

It has **3 parts** separated by dots (`.`):
1. Header: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
2. Payload: `eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0`
3. Signature: `KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q` ⚠️ **YOU'RE MISSING THIS PART!**

## Why This Happened

When you copied the keys, they got cut off. This can happen if:
- Terminal window was too narrow
- Copy/paste truncated the text
- Text editor wrapped the line

## After Fixing

1. **Test the key:**
   ```bash
   KEY=$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'=' -f2)
   curl -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
     https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
     -w "\nStatus: %{http_code}\n"
   ```
   Should show `Status: 200` ✅

2. **Clear browser cache** and try login again

---

**Your keys are CUT OFF! Use the complete keys above!** 🔑

