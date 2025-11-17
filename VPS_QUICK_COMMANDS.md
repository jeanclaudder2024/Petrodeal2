# Quick VPS Update Commands

## Copy and paste these commands one by one:

### 1. Update document-processor submodule
```bash
cd /opt/petrodealhub/document-processor && git pull origin master
```

### 2. Update main repository (if applicable)
```bash
cd /opt/petrodealhub && git pull origin main
```

### 3. Restart API service
```bash
sudo systemctl restart petrodealhub-api
```

### 4. Check service status
```bash
sudo systemctl status petrodealhub-api
```

### 5. View recent logs (optional)
```bash
sudo journalctl -u petrodealhub-api -f --lines=50
```

---

## All-in-One Command (copy entire block):

```bash
cd /opt/petrodealhub/document-processor && git pull origin master && cd /opt/petrodealhub && git pull origin main && sudo systemctl restart petrodealhub-api && sleep 2 && sudo systemctl status petrodealhub-api --no-pager -l
```

---

## Database Migrations

**Important:** Run these migrations via Supabase Dashboard or CLI:

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file SQL content

### Option 2: Via Supabase CLI (if installed)
```bash
cd /opt/petrodealhub
supabase db push
```

### Option 3: Manual SQL (if needed)
The migrations are idempotent (safe to run multiple times). You can run them directly in Supabase SQL Editor:

**Migration 1:** Add font fields
```sql
ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS font_family TEXT;

ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS font_size INTEGER;
```

**Migration 2:** Add database_table column
```sql
ALTER TABLE public.template_placeholders 
ADD COLUMN IF NOT EXISTS database_table TEXT;
```

**Migration 3:** Update template_placeholders (already includes database_table)
- This migration is in: `supabase/migrations/20251107175028_add_template_placeholders.sql`
- It's idempotent and safe to run multiple times

---

## Troubleshooting

### If service fails to start:
```bash
# Check Python syntax
cd /opt/petrodealhub/document-processor
python3 -m py_compile main.py

# Check logs
sudo journalctl -u petrodealhub-api -n 100
```

### If you see 502 errors:
```bash
# Verify service is running
sudo systemctl status petrodealhub-api

# Check nginx (if applicable)
sudo systemctl status nginx
```

### To view live logs:
```bash
sudo journalctl -u petrodealhub-api -f
```

