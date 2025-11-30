# 🔧 Fix: 401 Unauthorized Login Error

## Problem
Getting `401 (Unauthorized)` when trying to login, even after setting environment variables.

## Solutions (Try in Order)

### Solution 1: Pull Latest Code and Rebuild

The latest code has fallback credentials. Make sure you have the latest version:

```bash
# On VPS
cd /opt/petrodealhub

# Pull latest changes
git pull origin main

# Rebuild frontend (IMPORTANT!)
npm run build

# Restart services
pm2 restart all
```

### Solution 2: Verify Supabase Key is Correct

The Supabase anon key might have changed. Check your Supabase dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project: `ozjhdxvwqbzcvcywhwjg`
3. Go to Settings → API
4. Copy the `anon` `public` key
5. Update your `.env` file:

```bash
cd /opt/petrodealhub
nano .env
```

Update the key:
```env
VITE_SUPABASE_URL=https://ozjhdxvwqbzcvcywhwjg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_NEW_KEY_HERE
```

Then rebuild:
```bash
npm run build
pm2 restart all
```

### Solution 3: Check if User Exists in Supabase

The 401 error might mean the user doesn't exist or password is wrong:

1. Go to Supabase Dashboard → Authentication → Users
2. Verify the user exists
3. Try resetting the password if needed

### Solution 4: Verify Build Includes Environment Variables

Check if the build actually includes the variables:

```bash
# After building, check the dist files
cd /opt/petrodealhub
grep -r "ozjhdxvwqbzcvcywhwjg" dist/ | head -5
```

If nothing shows up, the build didn't include the variables.

### Solution 5: Clear Browser Cache and Try Again

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Try login again

### Solution 6: Check Browser Console for Actual Error

Open browser DevTools (F12) → Console tab and look for:
- The actual error message
- Any warnings about missing environment variables
- Network tab to see the exact request/response

### Solution 7: Test Supabase Connection Directly

Create a test file to verify connection:

```bash
cd /opt/petrodealhub
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ozjhdxvwqbzcvcywhwjg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96amhdeHZ3cWJ6Y3ZjeXdod2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAyNzUsImV4cCI6MjA3MTQ3NjI3NX0.KLAo1KIRR9ofapXPHenoi-ega0PJtkNhGnDHGtniA-Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful!');
    }
  });
EOF

node test-supabase.js
```

### Solution 8: Check PM2 Environment Variables

If using PM2, make sure environment variables are set:

```bash
# Check PM2 environment
pm2 env 0

# Or restart with environment
pm2 restart all --update-env
```

### Solution 9: Verify Nginx Configuration

Make sure Nginx is properly proxying requests:

```bash
# Check Nginx config
sudo nginx -t

# Check if frontend is accessible
curl http://localhost:3000

# Check backend
curl http://localhost:8000/health
```

## Most Common Fix

**90% of the time, it's this:**

```bash
cd /opt/petrodealhub
git pull origin main
npm run build
pm2 restart all
```

Then clear browser cache and try again.

## Still Not Working?

1. **Check Supabase Dashboard**:
   - Verify project is active
   - Check API keys haven't been rotated
   - Verify authentication is enabled

2. **Check Logs**:
   ```bash
   pm2 logs petrodealhub-app --lines 50
   ```

3. **Verify Build Output**:
   ```bash
   ls -la dist/
   # Should see index.html and assets folder
   ```

4. **Test Direct Access**:
   - Try accessing the site directly: `http://your-vps-ip:3000`
   - Check if it loads without errors

## Quick Diagnostic Command

Run this to check everything:

```bash
cd /opt/petrodealhub && \
echo "=== Git Status ===" && \
git status --short && \
echo -e "\n=== Environment Variables ===" && \
cat .env 2>/dev/null || echo "No .env file" && \
echo -e "\n=== Build Check ===" && \
ls -la dist/ 2>/dev/null | head -5 || echo "No dist folder" && \
echo -e "\n=== PM2 Status ===" && \
pm2 status
```

---

**Need More Help?** Share the output of the diagnostic command above.

