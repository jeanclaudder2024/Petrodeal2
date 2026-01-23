# Verify 404 Error Fix and Check Logs

## Step 1: Verify API is Running

```bash
# Check PM2 status
pm2 status python-api

# Test health endpoint
curl http://localhost:8000/health

# Test from external URL (if nginx is configured)
curl https://control.petrodealhub.com/health
```

## Step 2: Check Recent Logs for Improved Error Messages

The improved logging will now show detailed information when a template is not found:

```bash
# Check recent logs (last 50 lines)
pm2 logs python-api --lines 50 --nostream

# Or check error logs specifically
pm2 logs python-api --err --lines 50 --nostream

# Or tail the log file directly
tail -50 /var/log/pm2/python-api-out.log
```

## Step 3: Test the Placeholder Settings Endpoint

When you try to access a template that doesn't exist, you should now see detailed logs:

```bash
# Test with the template ID that was failing
curl -v "https://control.petrodealhub.com/placeholder-settings?template_id=9f482bc4-5601-485a-9f3d-9134242a1397"
```

**Expected behavior:**
- If template exists: Returns 200 with settings
- If template doesn't exist: Returns 404 with detailed error message

**Check logs immediately after the request:**
```bash
pm2 logs python-api --lines 20 --nostream
```

You should see messages like:
- `🔍 Looking up placeholder settings for template_id=...`
- `⚠️ Template not found by ID: ...`
- `❌ Template not found: template_id=..., template_name=...`

## Step 4: Verify Template Exists

Check if the template actually exists in the database:

```bash
# List all templates
curl "https://control.petrodealhub.com/templates" | jq '.templates[] | {id, name, title}'

# Or search for the specific template ID
curl "https://control.petrodealhub.com/templates" | jq '.templates[] | select(.id == "9f482bc4-5601-485a-9f3d-9134242a1397")'
```

## Step 5: Monitor Logs in Real-Time

To see errors as they happen:

```bash
# Watch logs in real-time
pm2 logs python-api

# Or just error logs
pm2 logs python-api --err
```

Press `Ctrl+C` to stop watching.

## What the Improved Logging Shows

The new logging will help diagnose:

1. **Template Lookup Process**: Shows when a lookup starts
2. **Success/Failure**: Shows if template was found by ID or name
3. **Detailed Error Messages**: Includes both template_id and template_name in error messages
4. **UUID Parsing**: Shows if UUID parsing succeeded or failed
5. **Database Queries**: Shows if database queries are working

## Common Issues and Solutions

### Issue: Template Not Found (404)
**Solution**: The template doesn't exist in the database. Check:
- Template was deleted
- Wrong template_id
- Database connection issue

### Issue: Database Connection Error
**Solution**: Check Supabase connection:
```bash
# Check .env file has correct credentials
cd /opt/petrodealhub/document-processor
cat .env | grep SUPABASE
```

### Issue: UUID Format Error
**Solution**: The template_id format is invalid. Should be UUID format like: `9f482bc4-5601-485a-9f3d-9134242a1397`

---

## Quick Test Command

Run this to test everything at once:

```bash
echo "=== Testing API Health ==="
curl -s http://localhost:8000/health | jq .

echo -e "\n=== Testing Placeholder Settings (should show detailed error if not found) ==="
curl -s "https://control.petrodealhub.com/placeholder-settings?template_id=9f482bc4-5601-485a-9f3d-9134242a1397" | jq .

echo -e "\n=== Recent API Logs ==="
pm2 logs python-api --lines 10 --nostream
```
