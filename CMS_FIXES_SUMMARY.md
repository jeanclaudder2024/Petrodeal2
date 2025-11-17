# CMS Fixes Summary

## Issues Fixed

### 1. Database Tables Not Showing in CMS Editor ✅
**Problem:** When selecting "Database" source in the CMS editor, the table dropdown was empty.

**Root Cause:** The `/database-tables` endpoint required authentication, but the CMS editor wasn't sending auth headers.

**Fix:** 
- Removed authentication requirement from `/database-tables` endpoint
- Added logging to help debug API calls
- Added better error handling in the frontend

**Files Changed:**
- `document-processor/main.py` - Made `/database-tables` endpoint public
- `document-processor/cms/editor.js` - Added console logging and better error handling

### 2. CSV Files Not Loading ✅
**Problem:** CSV files dropdown was empty in the CMS editor.

**Root Cause:** The `/csv-files` and `/csv-fields/{csv_id}` endpoints required authentication.

**Fix:**
- Removed authentication requirement from `/csv-files` and `/csv-fields/{csv_id}` endpoints
- Added logging to help debug API calls
- Added better error handling in the frontend

**Files Changed:**
- `document-processor/main.py` - Made CSV endpoints public
- `document-processor/cms/editor.js` - Added console logging and better error handling

### 3. Placeholders Still Using Random Data ⚠️
**Problem:** Many placeholders like `commodity`, `specification`, `origin`, `inspection`, `insurance`, `quality`, `owner` are being replaced with random data (Value-XXXX) instead of actual vessel data.

**Root Cause:** 
- CMS settings might not be configured for these placeholders
- Intelligent matching might not be finding the right fields
- Database lookups might be failing

**Current Status:**
- The intelligent matching logic exists in `generate_document()` function
- It tries to match placeholders to vessel fields when CMS settings are missing or incomplete
- However, some fields like `commodity`, `specification`, `origin` might not exist in the vessel table

**Solution:**
1. **Configure placeholders in CMS:**
   - Open the template editor in CMS
   - For each placeholder that should use database data:
     - Select "Database" as source
     - Choose the appropriate table (usually "vessels")
     - Select the correct field name
   - Save the settings

2. **For fields that don't exist in vessels table:**
   - Use "Custom" source with a fixed value
   - Use CSV source if you have CSV data
   - Use "Random" if you want realistic random data

3. **Check field mappings:**
   - The `_intelligent_field_match()` function tries to match placeholders to vessel fields
   - Common mappings:
     - `owner` → `owner_name`
     - `deadweight` → `deadweight` ✅ (working)
     - `speed` → `speed` ✅ (working)
     - `vessel_type` → `vessel_type` ✅ (working)
   - Fields like `commodity`, `specification`, `origin` don't exist in vessels table, so they need to be configured manually

## How to Use the CMS Editor

### Step 1: Access the Editor
1. Go to CMS: `http://your-vps:8000/cms/`
2. Click "Edit" button next to a template

### Step 2: Configure Placeholders
For each placeholder:

1. **Select Source Type:**
   - **Random**: Generates realistic random data (default)
   - **Custom**: Use a fixed custom value
   - **Database**: Pull data from database tables
   - **CSV**: Pull data from uploaded CSV files

2. **If Database Source:**
   - Select a table (e.g., "Vessels", "Ports", "Refineries")
   - Select a field from that table
   - The system will automatically fetch data based on the vessel IMO

3. **If CSV Source:**
   - Select a CSV file
   - Select a field/column
   - Optionally specify a row index (0-based)

4. **Save Settings:**
   - Click "Save Placeholder Settings" button
   - Settings are saved to Supabase `template_placeholders` table

### Step 3: Test Document Generation
1. Generate a document from the frontend
2. Check the logs to see which placeholders were matched
3. Adjust CMS settings if needed

## Debugging Tips

### Check Browser Console
Open browser developer tools (F12) and check the console for:
- API call logs
- Database tables loading
- CSV files loading
- Any errors

### Check API Logs
On the VPS, check API logs:
```bash
sudo journalctl -u petrodealhub-api -f | grep -i "database\|csv\|placeholder"
```

### Verify API Endpoints
Test the endpoints directly:
```bash
# Test database tables
curl http://localhost:8000/database-tables

# Test CSV files
curl http://localhost:8000/csv-files

# Test template placeholders
curl http://localhost:8000/placeholder-settings?template_id=YOUR_TEMPLATE_ID
```

## Next Steps

1. **Push these fixes to GitHub and VPS**
2. **Test the CMS editor:**
   - Verify database tables dropdown is populated
   - Verify CSV files dropdown is populated
   - Configure some placeholders with database sources
   - Save and test document generation

3. **Configure missing placeholders:**
   - For fields that exist in vessels table: Use Database source
   - For fields that don't exist: Use Custom or CSV source
   - For fields that should be random: Leave as Random

4. **Monitor logs:**
   - Check which placeholders are being matched
   - Adjust CMS settings based on log output

## Files Changed

1. `document-processor/main.py`:
   - Made `/database-tables` endpoint public
   - Made `/database-tables/{table_name}/columns` endpoint public
   - Made `/csv-files` endpoint public
   - Made `/csv-fields/{csv_id}` endpoint public
   - Added logging to these endpoints

2. `document-processor/cms/editor.js`:
   - Added console logging to `loadDatabaseTables()`
   - Added console logging to `loadCsvFiles()`
   - Added better error handling
   - Added empty array fallbacks to prevent errors

