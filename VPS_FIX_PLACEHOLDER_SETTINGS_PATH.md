# Fix Placeholder Settings Path and Update Logging

## Problems Found
1. **Wrong path in logs**: `/cmsplaceholder-settings` instead of `/placeholder-settings`
2. **Missing improved logging**: The new diagnostic messages aren't showing up
3. **Need to update document-processor submodule** to get the improved error handling

## Solution

### Step 1: Update document-processor Submodule

```bash
cd /opt/petrodealhub
git pull origin main

# Update the submodule
cd document-processor
git pull origin master

# Verify the improved logging code is there
grep -n "Looking up placeholder settings" main.py
# Should show line numbers with the new logging code
```

### Step 2: Check Nginx Configuration

The nginx config might have a rewrite rule adding "cms" prefix. Check:

```bash
# Check nginx config
sudo cat /etc/nginx/sites-available/default | grep -A 10 -B 10 placeholder

# Or check all nginx configs
sudo grep -r "cmsplaceholder" /etc/nginx/

# Check if there's a rewrite rule
sudo grep -r "rewrite.*cms" /etc/nginx/
```

### Step 3: Fix Nginx Configuration (if needed)

If nginx is rewriting the path, you need to either:
- Remove the rewrite rule, OR
- Update the API endpoint to handle `/cmsplaceholder-settings`

Most likely, the nginx config should proxy `/placeholder-settings` directly to the API without rewriting.

### Step 4: Restart API with Updated Code

```bash
# Restart PM2 to load the updated code
pm2 restart python-api

# Wait a moment
sleep 3

# Check logs
pm2 logs python-api --lines 10 --nostream
```

### Step 5: Test Again

```bash
# Test the endpoint
curl -v "https://control.petrodealhub.com/placeholder-settings?template_id=9f482bc4-5601-485a-9f3d-9134242a1397"

# Check logs for improved error messages
pm2 logs python-api --lines 20 --nostream
```

You should now see:
- `🔍 Looking up placeholder settings for template_id=...`
- `⚠️ Template not found by ID: ...`
- `❌ Template not found: template_id=..., template_name=...`

## Quick Fix Command

Run this all at once:

```bash
# Update submodule
cd /opt/petrodealhub
git pull origin main
cd document-processor
git pull origin master

# Verify improved logging is present
grep "Looking up placeholder settings" main.py && echo "✅ Improved logging code found" || echo "❌ Code not found"

# Restart API
cd /opt/petrodealhub
pm2 restart python-api

# Wait and test
sleep 3
curl -s "https://control.petrodealhub.com/placeholder-settings?template_id=9f482bc4-5601-485a-9f3d-9134242a1397"
pm2 logs python-api --lines 15 --nostream | grep -E "(Looking up|Template not found|template_id)"
```

## About the /cmsplaceholder-settings Path

If nginx is rewriting `/placeholder-settings` to `/cmsplaceholder-settings`, you have two options:

### Option 1: Fix Nginx (Recommended)
Remove the rewrite rule so requests go directly to `/placeholder-settings`

### Option 2: Add Endpoint to API
Add a route in `main.py` that handles `/cmsplaceholder-settings` and redirects to `/placeholder-settings`

But first, let's see what the actual nginx config looks like on your server.
