# 🚨 URGENT FIX: 401 Unauthorized Error

## The Problem

Your `.env` file has `SUPABASE_KEY` but is **MISSING** `VITE_SUPABASE_PUBLISHABLE_KEY` which the frontend needs!

## Immediate Fix

### On Your VPS, Run This:

```bash
cd /opt/petrodealhub

# Add the missing VITE_ variables to .env
cat >> .env << 'EOF'

# Frontend Supabase Keys (REQUIRED!)
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF

# Rebuild (CRITICAL - embeds the keys)
npm run build

# Restart
pm2 restart all
```

## Your .env File Should Have:

```env
# Backend (you already have this)
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Frontend (YOU'RE MISSING THESE!)
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Why This Happens

- `SUPABASE_KEY` = For backend (Python API)
- `VITE_SUPABASE_PUBLISHABLE_KEY` = For frontend (React app) ⚠️ **YOU NEED THIS!**

Vite only reads variables that start with `VITE_`!

## After Running the Fix

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+F5)
3. **Try login again**

## Verify It Worked

Check your .env file has all 4 lines:

```bash
cat .env
```

You should see:
- ✅ SUPABASE_URL
- ✅ SUPABASE_KEY  
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_PUBLISHABLE_KEY

---

**This will fix your 401 error!** 🚀

