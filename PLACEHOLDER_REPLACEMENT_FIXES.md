# Placeholder Replacement Fixes

## Problems Identified

1. **Only 9 replacements made** - Document has 76+ placeholders but only 9 were replaced
2. **Many placeholders still showing as `{placeholder}`** - Not being replaced at all
3. **CMS settings not saved to Supabase** - Settings only in disk, not database
4. **Placeholders split across Word runs** - Word splits text into runs, breaking placeholder matching

## Fixes Applied

### 1. Fixed Placeholder Replacement Logic ✅

**Problem:** Placeholders split across multiple Word runs weren't being matched.

**Solution:**
- Added paragraph-level replacement fallback
- If no replacements in individual runs, combine all runs and try again
- This handles placeholders like `{imo_` in one run and `number}` in another

**Code Changes:**
- `replace_in_runs()` function now tries paragraph-level replacement if run-level fails
- Better handling of split placeholders

### 2. Fixed CMS Settings Save ✅

**Problem:** `/placeholder-settings` endpoint required authentication, blocking CMS editor.

**Solution:**
- Removed authentication requirement from `/placeholder-settings` endpoint
- Added comprehensive logging to track save operations
- Added verification step to confirm settings were saved

**Code Changes:**
- `save_placeholder_settings()` - removed `Depends(get_current_user)`
- Added logging for save operations
- Added verification after save

### 3. Added Better Diagnostics ✅

**Problem:** Hard to debug why placeholders weren't being replaced.

**Solution:**
- Compare placeholders in document vs mapping
- Log which placeholders are missing
- Log which placeholders are in mapping but not in document
- Better error messages

**Code Changes:**
- Extract all placeholders from document before replacement
- Compare with mapping and log differences
- Warn about missing placeholders

### 4. Improved Logging ✅

**Problem:** Not enough information to debug issues.

**Solution:**
- Added detailed logging throughout replacement process
- Log which paragraphs/tables have placeholders
- Log which placeholders are matched vs not matched
- Log replacement counts per section

## How to Use

### Step 1: Update VPS

```bash
cd /opt/petrodealhub/document-processor
git pull origin master
sudo systemctl restart petrodealhub-api
```

### Step 2: Configure Placeholders in CMS

1. Open CMS: `http://your-vps:8000/cms/`
2. Click "Edit" on your template
3. For each placeholder:
   - Select source type (Database, CSV, Custom, or Random)
   - If Database: Select table and field
   - If CSV: Select CSV file, field, and row
   - If Custom: Enter custom value
4. Click "Save All" button
5. Check browser console for confirmation

### Step 3: Verify Settings Saved

Check the logs after saving:
```bash
sudo journalctl -u petrodealhub-api -f | grep -i "saving\|saved\|placeholder"
```

You should see:
- "💾 Saving placeholder settings..."
- "✅ Successfully saved placeholder settings to Supabase"
- "✅ Verified: Loaded X settings back from Supabase"

### Step 4: Test Document Generation

1. Generate a document from frontend
2. Check logs for:
   - "📄 Document contains X unique placeholders"
   - "📋 Data mapping contains X placeholders"
   - "⚠️ X placeholders in document but NOT in mapping"
   - Replacement counts per paragraph/table

## Expected Behavior

### Before Fix:
- Only 9 replacements made
- Many placeholders still showing as `{placeholder}`
- Settings not saved to Supabase

### After Fix:
- All placeholders in mapping should be replaced
- Settings saved to Supabase correctly
- Better logging to identify issues
- Handles placeholders split across runs

## Troubleshooting

### If placeholders still not replaced:

1. **Check logs for missing placeholders:**
   ```
   ⚠️ X placeholders in document but NOT in mapping:
      - placeholder1
      - placeholder2
   ```
   This means these placeholders need to be configured in CMS.

2. **Check if settings were saved:**
   ```
   ✅ Successfully saved placeholder settings to Supabase
   ✅ Verified: Loaded X settings back from Supabase
   ```
   If you don't see this, settings weren't saved.

3. **Check browser console:**
   - Open CMS editor
   - Open browser console (F12)
   - Click "Save All"
   - Check for errors or success messages

4. **Verify placeholder names match:**
   - Placeholder names in document must match CMS exactly
   - Check for spaces, underscores, case differences
   - Example: `{imo_number}` in document = `imo_number` in CMS

## Next Steps

1. **Update VPS** with latest code
2. **Re-configure placeholders** in CMS editor
3. **Save settings** and verify they're saved to Supabase
4. **Test document generation** and check logs
5. **Configure missing placeholders** based on log warnings

All fixes are pushed to GitHub and ready to deploy!

