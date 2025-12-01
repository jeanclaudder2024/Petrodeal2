# Fix Email System RLS Errors

## Problem
You're seeing this error when trying to save email configurations or create email templates:
```
new row violates row-level security policy for table "email_configurations"
new row violates row-level security policy for table "email_templates"
```

## Solution

The RLS (Row Level Security) policies were checking JWT claims incorrectly. They need to use the `has_role()` function instead.

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/migrations/20250127000001_fix_email_rls_policies.sql`
5. Click **Run**

### Option 2: Run via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will apply the new migration automatically.

## Verify Fix

After running the SQL:

1. Refresh your admin panel page
2. Try saving an email configuration again
3. Try creating an email template again
4. The errors should be gone!

## What Changed

The policies now use:
- **Before**: `auth.jwt() ->> 'role' = 'admin'` (doesn't work with your role system)
- **After**: `public.has_role(auth.uid(), 'admin'::public.app_role)` (checks the `user_roles` table)

This matches the pattern used in all your other admin tables.

