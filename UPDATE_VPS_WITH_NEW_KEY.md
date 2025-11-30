# 🔧 Update VPS with New API Key

## Your New API Key

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
```

## Step 1: Test the Key First

On your VPS, test if this key works:

```bash
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q"

curl -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nHTTP Status: %{http_code}\n"
```

**If you see `HTTP Status: 200` → Key is valid! ✅**
**If you see `HTTP Status: 401` → Key is still wrong ❌**

## Step 2: Update .env File

```bash
cd /opt/petrodealhub

cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
```

## Step 3: Verify .env File

```bash
cat .env
```

You should see all 4 lines with the complete keys.

## Step 4: Rebuild Frontend

```bash
rm -rf dist node_modules/.vite
npm run build
```

## Step 5: Restart Services

```bash
pm2 restart all
```

## Step 6: Test Again

```bash
# Test the key from .env
KEY=$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d'=' -f2)
curl -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  https://ozjhdxvwqbzcvcywhwjg.supabase.co/rest/v1/ \
  -w "\nHTTP Status: %{http_code}\n"
```

## Step 7: Clear Browser & Test Login

1. Clear browser cache completely
2. Hard refresh (Ctrl+F5)
3. Try login

## One-Line Complete Update

```bash
cd /opt/petrodealhub && \
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhkeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
rm -rf dist node_modules/.vite && \
npm run build && \
pm2 restart all && \
echo "✅ Done! Clear browser cache and try login."
```

---

**Important:** Test the key first (Step 1) to make sure it returns 200 before rebuilding!

