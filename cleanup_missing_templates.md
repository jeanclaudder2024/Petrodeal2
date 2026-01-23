# Cleanup Missing Templates Guide

## Problem
The Python API is trying to access template files that don't exist, causing 500 errors.

## Solution Options

### Option 1: Let the Fix Handle It (Recommended)
The code has been updated to skip missing files automatically. The API will now:
- Check if files exist before processing
- Skip missing files gracefully
- Return available templates without crashing

**No action needed** - just restart the Python API and it should work.

### Option 2: Remove Problematic Template Entry
If you want to clean up the metadata/database:

1. **Check which templates are missing:**
   ```bash
   cd document-processor
   python ../fix_missing_templates.py
   ```

2. **Remove from metadata file:**
   - Edit `document-processor/storage/template_metadata.json`
   - Remove entries for templates that don't have files

3. **Mark as deleted in database (if using Supabase):**
   - Go to Supabase dashboard
   - Find the template in `document_templates` table
   - Set `is_active = false` or delete the record

### Option 3: Delete the Specific Problematic File Reference
The error mentioned: `SGS   ANALYSIS NEWW.docx`

To remove this specific template:

1. **Check if file exists:**
   ```bash
   cd document-processor/templates
   dir "SGS*"
   ```

2. **If file doesn't exist, mark it as deleted:**
   ```bash
   # Add to deleted_templates.json
   # Or remove from template_metadata.json
   ```

## Quick Fix Commands

### Check Templates
```bash
cd document-processor
python ../fix_missing_templates.py
```

### Restart Python API
```bash
cd document-processor
python main.py
```

### Check Python API Logs
Look for warnings about missing files - they should now be skipped instead of causing errors.

## What Changed

The Python API now:
- ✅ Checks if files exist before processing
- ✅ Skips missing files with a warning
- ✅ Returns available templates successfully
- ✅ Handles errors gracefully

The React CMS now:
- ✅ Handles 500 errors gracefully
- ✅ Shows empty list instead of crashing
- ✅ Doesn't show error toasts for temporary issues

## Testing

After restarting the Python API:
1. Check browser console - should see warnings instead of errors
2. Templates should load (even if some are missing)
3. No more 500 errors

## Recommendation

**You don't need to delete all templates.** The fix handles missing files automatically. Just:
1. Restart the Python API
2. The problematic template will be skipped
3. Other templates will work normally

If you want to clean up, use the `fix_missing_templates.py` script to identify which ones are missing, then decide what to do with them.
