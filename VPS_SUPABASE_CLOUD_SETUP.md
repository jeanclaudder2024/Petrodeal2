# 🔧 VPS Setup: Connect to Cloud Supabase Database

## Understanding the Setup

- **Supabase**: Cloud database service (NOT on your VPS)
- **Your VPS**: Runs the frontend/backend that CONNECTS to Supabase
- **Connection**: Done via API keys in `.env` file

## Step-by-Step Setup

### Step 1: Create .env File on VPS

On your VPS, create the `.env` file in the project root:

```bash
cd /opt/petrodealhub
nano .env
```

### Step 2: Add Supabase Connection Details

Copy and paste these lines (1-5) into your `.env` file:

```env
# Supabase Cloud Database Connection
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q

# Backend Supabase (for Python API)
SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q
```

**Save the file**: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Verify .env File

Check that the file was created correctly:

```bash
cat .env
```

You should see the 5 lines above.

### Step 4: Rebuild Frontend (CRITICAL!)

**This is the most important step!** The `.env` file is read during build time:

```bash
# Make sure you're in project root
cd /opt/petrodealhub

# Rebuild frontend (this reads .env and embeds the keys)
npm run build
```

### Step 5: Restart Services

```bash
pm2 restart all
```

### Step 6: Clear Browser Cache

1. Open your browser
2. Press `Ctrl + Shift + Delete`
3. Clear "Cached images and files"
4. Press `Ctrl + F5` to hard refresh
5. Try logging in again

## Quick One-Line Setup

Run this entire command on your VPS:

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

## How It Works

1. **Supabase Cloud**: Your database is in the cloud at `ozjhdxvwqbzcvcywhwjg.supabase.co`
2. **VPS Frontend**: Your React app runs on VPS
3. **Connection**: Frontend uses keys from `.env` to connect to cloud Supabase
4. **Build Time**: Vite reads `.env` during `npm run build` and embeds the keys

## Verification

After setup, verify it's working:

```bash
# Check .env exists
ls -la .env

# Check build was successful
ls -la dist/

# Check PM2 is running
pm2 status

# Check if site loads
curl http://localhost:3000 | head -20
```

## Troubleshooting

### If login still fails:

1. **Verify .env file exists**:
   ```bash
   cat .env
   ```

2. **Check if build included variables**:
   ```bash
   grep -r "ozjhdxvwqbzcvcywhwjg" dist/ | head -3
   ```
   If nothing shows, rebuild didn't work.

3. **Check PM2 logs**:
   ```bash
   pm2 logs petrodealhub-app --lines 20
   ```

4. **Verify Supabase project is active**:
   - Go to: https://supabase.com/dashboard
   - Check project `ozjhdxvwqbzcvcywhwjg` is active

## Important Notes

- ✅ Supabase is in the cloud (not on VPS)
- ✅ `.env` file tells your VPS how to connect to cloud Supabase
- ✅ Must rebuild after creating/updating `.env`
- ✅ Keys are embedded at build time (not runtime)
- ✅ Clear browser cache after rebuild

---

**After following these steps, your VPS will connect to the cloud Supabase database!** 🚀

