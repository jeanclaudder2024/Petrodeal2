# 🔧 Fix: Invalid API Key Error on VPS

## Problem
Getting `AuthApiError: Invalid API key` errors because Supabase environment variables are not set on VPS.

## Solution: Set Environment Variables

### Step 1: Create .env File on VPS

SSH into your VPS and create the `.env` file:

```bash
cd /opt/petrodealhub
nano .env
```

### Step 2: Add These Variables

Copy and paste this into the `.env` file:

```env
# Supabase Configuration (REQUIRED for frontend)
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q

# Backend Supabase (for document-processor)
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q

# OpenAI (optional, for AI features)
OPENAI_API_KEY=your_openai_api_key_here
```

Save and exit (Ctrl+X, then Y, then Enter).

### Step 3: Rebuild Frontend

Environment variables are embedded at build time, so you need to rebuild:

```bash
# Make sure you're in the project root
cd /opt/petrodealhub

# Rebuild with environment variables
npm run build
```

### Step 4: Restart Services

```bash
# Restart PM2 processes
pm2 restart all

# OR if using systemd
sudo systemctl restart petrodealhub-frontend
sudo systemctl restart document-processor
```

### Step 5: Verify

1. Clear browser cache
2. Try logging in again
3. Check browser console - should no longer see "Invalid API key" errors

## Alternative: Set Variables in PM2 Ecosystem

If you're using PM2, you can also set environment variables in `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'petrodealhub-app',
      // ... other config
      env: {
        VITE_SUPABASE_URL: 'https://ozjhdxvwqbzcvcywhwjg.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }
    }
  ]
};
```

Then restart: `pm2 restart all --update-env`

## Important Notes

1. **Vite Environment Variables**: Variables prefixed with `VITE_` are embedded at build time
2. **Must Rebuild**: After changing `.env`, you MUST run `npm run build` again
3. **Security**: The `.env` file should NOT be committed to git (it's in .gitignore)

## Quick Fix Command

```bash
cd /opt/petrodealhub && \
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
EOF
npm run build && pm2 restart all
```

This will create the `.env` file and rebuild immediately.

