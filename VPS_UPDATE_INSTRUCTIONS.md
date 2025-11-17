# VPS Update Instructions

## Summary of Changes
- Updated CMS system with font settings and plan assignments
- Added template_id support throughout the API
- Fixed database migrations (added database_table column support)
- Enhanced placeholder replacement with multi-table database lookups
- Updated frontend to display template metadata and plan information

## Step 1: Update document-processor submodule

```bash
cd /opt/petrodealhub/document-processor
git pull origin master
```

## Step 2: Update main repository

```bash
cd /opt/petrodealhub
# Or wherever your main project is located
git pull origin main
```

## Step 3: Run Database Migrations

The following migrations need to be run:

1. **Add font fields to document_templates** (if not already applied):
   ```sql
   -- File: supabase/migrations/20250120000000_add_font_fields_to_document_templates.sql
   ALTER TABLE public.document_templates 
   ADD COLUMN IF NOT EXISTS font_family TEXT;
   
   ALTER TABLE public.document_templates 
   ADD COLUMN IF NOT EXISTS font_size INTEGER;
   ```

2. **Add database_table to template_placeholders** (if not already applied):
   ```sql
   -- File: supabase/migrations/20250120000001_add_database_table_to_template_placeholders.sql
   ALTER TABLE public.template_placeholders 
   ADD COLUMN IF NOT EXISTS database_table TEXT;
   ```

3. **Update template_placeholders table** (idempotent - safe to run multiple times):
   ```sql
   -- File: supabase/migrations/20251107175028_add_template_placeholders.sql
   -- This migration now includes the database_table column addition
   ```

**To run migrations via Supabase CLI:**
```bash
# If using Supabase CLI
supabase db push

# Or manually via psql/Supabase dashboard
# Copy the SQL from each migration file and run it
```

## Step 4: Restart the API Service

```bash
sudo systemctl restart petrodealhub-api
```

## Step 5: Verify Service Status

```bash
# Check service status
sudo systemctl status petrodealhub-api

# Check logs for any errors
sudo journalctl -u petrodealhub-api -f --lines=50
```

## Step 6: Test the Updates

1. **Test API endpoints:**
   ```bash
   # Test templates endpoint
   curl http://localhost:8000/templates
   
   # Test database tables endpoint
   curl http://localhost:8000/database-tables
   ```

2. **Test CMS:**
   - Access the CMS at: `http://your-vps-ip:8000/cms/`
   - Try uploading a template with font settings
   - Configure placeholder settings with database tables

3. **Test Document Generation:**
   - Access the frontend
   - Try generating a document
   - Verify template metadata (display_name, description) is shown
   - Verify plan-based access control is working

## Troubleshooting

### If the service fails to start:
```bash
# Check Python syntax
cd /opt/petrodealhub/document-processor
python3 -m py_compile main.py

# Check for missing dependencies
source venv/bin/activate
pip list | grep fastapi
```

### If database migration fails:
- Check if columns already exist:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'document_templates' AND column_name IN ('font_family', 'font_size');
  
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'template_placeholders' AND column_name = 'database_table';
  ```

### If API returns 502 errors:
- Check nginx configuration
- Verify the API service is running: `sudo systemctl status petrodealhub-api`
- Check API logs: `sudo journalctl -u petrodealhub-api -n 100`

## Rollback (if needed)

If you need to rollback:

```bash
# In document-processor submodule
cd /opt/petrodealhub/document-processor
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
sudo systemctl restart petrodealhub-api

# In main repository
cd /opt/petrodealhub
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>
```

## Notes

- The migrations are idempotent (safe to run multiple times)
- The API will automatically use the new features once restarted
- Frontend changes will be deployed separately (if using a separate frontend deployment)

