# Email Connection Test Fix

## What Was Fixed

1. **Backend API Endpoints Added** ✅
   - Added `/email/test-smtp` endpoint to test SMTP connections
   - Added `/email/test-imap` endpoint to test IMAP connections
   - Both endpoints are now available in `document-processor/main.py`

2. **Frontend API Calls Fixed** ✅
   - Updated `EmailConfiguration.tsx` to use correct API URL
   - Added proper error handling for connection tests
   - Test buttons now work correctly

3. **RLS Policies Fixed** ✅
   - Updated email system RLS policies to use `has_role()` function
   - Policies now correctly check admin role from `user_roles` table

## What You Need to Do on Your VPS

### 1. Pull Latest Updates

```bash
cd /opt/petrodealhub
git pull origin main
cd document-processor
git pull origin master
cd ..
```

### 2. Restart Backend Service

```bash
# If using PM2
pm2 restart document-processor
# OR
pm2 restart all

# If using systemd
sudo systemctl restart document-processor
```

### 3. Rebuild Frontend (if needed)

```bash
cd /opt/petrodealhub
npm run build
pm2 restart all
```

### 4. Fix RLS Policies in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Admins can manage email configurations" ON email_configurations CASCADE;
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates CASCADE;
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs CASCADE;
DROP POLICY IF EXISTS "System can insert email logs" ON email_logs CASCADE;
DROP POLICY IF EXISTS "Admins can manage incoming emails" ON incoming_emails CASCADE;
DROP POLICY IF EXISTS "System can insert incoming emails" ON incoming_emails CASCADE;
DROP POLICY IF EXISTS "Admins can manage auto-reply rules" ON auto_reply_rules CASCADE;

-- Create new policies using has_role() function
CREATE POLICY "Admins can manage email configurations"
  ON email_configurations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage incoming emails"
  ON incoming_emails FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "System can insert incoming emails"
  ON incoming_emails FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage auto-reply rules"
  ON auto_reply_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
```

### 5. Set Environment Variable (Optional)

If your API is not on `localhost:8000`, add this to your `.env` file:

```bash
VITE_API_URL=http://your-api-url:8000
```

Or if using nginx proxy:

```bash
VITE_API_URL=https://petrodealhub.com/api
```

## Testing

1. Go to Admin Panel → Email Config
2. Fill in your SMTP settings
3. Click "Test Connection" button
4. You should see either:
   - ✅ "Connection Successful" - if credentials are correct
   - ❌ "Connection Failed" with error message - if there's an issue

## Troubleshooting

### If test still fails:

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check backend logs:**
   ```bash
   pm2 logs document-processor
   # OR
   sudo journalctl -u document-processor -f
   ```

3. **Check API URL in browser console:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Click "Test Connection"
   - Check what URL is being called
   - Should be: `http://your-domain/api/email/test-smtp` or `http://localhost:8000/email/test-smtp`

4. **Common SMTP errors:**
   - `535 Authentication failed` - Wrong username/password
   - `Connection timeout` - Wrong host/port or firewall blocking
   - `SSL/TLS error` - Try toggling TLS/SSL setting

## Files Changed

- ✅ `document-processor/main.py` - Added email test endpoints
- ✅ `src/pages/admin/EmailConfiguration.tsx` - Fixed API calls
- ✅ `supabase/migrations/20250127000001_fix_email_rls_policies.sql` - Fixed RLS policies

All changes have been pushed to GitHub! 🚀

