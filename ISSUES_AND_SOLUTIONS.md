# Issues and Solutions

## Current Status from Logs

### ✅ What's Working:
1. **Auto-matching is working** - Many placeholders are being matched correctly:
   - `deadweight` → `120525` ✅
   - `speed` → `15.0` ✅
   - `owner` → `Saudi Aramco` ✅
   - `vessel_type` → `Oil Tanker` ✅
   - `year_built` → `2020` ✅
   - `price` → `70.65` ✅
   - `buyer_name` → `Equinor` ✅
   - `cargo_capacity` → `107383` ✅
   - And many more...

2. **CSV data is working** - Some placeholders are using CSV data:
   - `beam` → `Union Credit Suisse` (from CSV) ✅
   - `buyer_address` → `Kurutepe, Elbeyli, Kilis, Turkey` (from CSV) ✅

3. **Custom values are working**:
   - `authorized_person_name` → `454545454` (custom value) ✅

### ⚠️ What's Not Working:

1. **Some placeholders using random data** - These fields don't exist in the `vessels` table:
   - `commodity` → `Value-5773` (random) ❌
   - `specification` → `Value-4948` (random) ❌
   - `origin` → `Value-2228` (random) ❌
   - `inspection` → `Value-6278` (random) ❌
   - `insurance` → `Value-5073` (random) ❌
   - `quality` → `774383.0` (incorrectly matched to `quantity` field) ⚠️

2. **Database tables not showing in CMS editor** - This is because:
   - The VPS hasn't been updated with the latest code yet
   - The endpoints now work (we fixed them), but need to be deployed

3. **Template ID is None** - The frontend might not be receiving `template.id` properly

## Solutions

### Step 1: Update VPS (CRITICAL)

Run these commands on your VPS:

```bash
cd /opt/petrodealhub/document-processor
git pull origin master
sudo systemctl restart petrodealhub-api
```

This will fix:
- Database tables dropdown in CMS editor
- CSV files dropdown in CMS editor
- Better error handling and logging

### Step 2: Configure Placeholders in CMS

After updating the VPS, open the CMS editor and configure placeholders:

1. **For fields that exist in vessels table** (but are using random):
   - Open CMS: `http://your-vps:8000/cms/`
   - Click "Edit" on "ICPO TEMPLATE"
   - For each placeholder:
     - Select "Database" as source
     - Choose "Vessels" table
     - Select the correct field
     - Click "Save Placeholder Settings"

2. **For fields that DON'T exist in vessels table**:
   - Use "Custom" source with a fixed value, OR
   - Use "CSV" source if you have CSV data, OR
   - Leave as "Random" if you want realistic random data

### Step 3: Fix Specific Placeholders

Based on the logs, here are the placeholders that need configuration:

#### Fields that should use database (but currently random):
- `draft` → Should map to `draft` or `draught` field in vessels table
- `net_tonnage` → Doesn't exist in vessels table, use Custom or CSV
- `cargo_tanks` → Doesn't exist in vessels table, use Custom or CSV
- `class_society` → Doesn't exist in vessels table, use Custom or CSV
- `registry_port` → Could map to `departure_port` or `currentport`
- `pumping_capacity` → Doesn't exist in vessels table, use Custom or CSV

#### Fields that should use Custom/CSV (don't exist in database):
- `commodity` → Use Custom value or CSV
- `specification` → Use Custom value or CSV
- `origin` → Use Custom value or CSV
- `inspection` → Use Custom value or CSV
- `insurance` → Use Custom value or CSV
- `quality` → Currently matched to `quantity` (wrong), use Custom or CSV
- `payment_terms` → Use Custom value or CSV
- `shipping_terms` → Use Custom value or CSV
- `contract_duration` → Use Custom value or CSV
- `monthly_delivery` → Use Custom value or CSV

### Step 4: Verify Template ID is Being Sent

Check the browser console when generating a document. You should see:
```
Processing document: { templateId: "39736442-5839-49b1-979f-7e9a337e335f", templateName: "ICPO TEMPLATE", vesselImo: "..." }
```

If `templateId` is `undefined` or `null`, the template object might not have the `id` field. Check the `/user-downloadable-templates` response.

## Quick Fix Commands for VPS

```bash
# 1. Update code
cd /opt/petrodealhub/document-processor && git pull origin master

# 2. Restart service
sudo systemctl restart petrodealhub-api

# 3. Check logs
sudo journalctl -u petrodealhub-api -f | grep -i "database\|csv\|placeholder"
```

## Testing After Update

1. **Test CMS Editor:**
   - Open: `http://your-vps:8000/cms/`
   - Click "Edit" on a template
   - Check browser console (F12) - you should see:
     - "Loading database tables from: ..."
     - "Loaded X database tables: ..."
     - "Loaded X CSV files: ..."

2. **Test Placeholder Configuration:**
   - Select a placeholder
   - Change source to "Database"
   - Verify dropdown shows tables (Vessels, Ports, Refineries, etc.)
   - Select a table and verify fields load
   - Save settings

3. **Test Document Generation:**
   - Generate a document from frontend
   - Check logs to see which placeholders were matched
   - Verify placeholders are replaced correctly

## Summary

The system is mostly working! The main issues are:
1. **VPS needs update** - Database/CSV endpoints are fixed but not deployed yet
2. **Placeholders need configuration** - Some fields need to be configured in CMS to use database/CSV instead of random
3. **Some fields don't exist in database** - These need Custom values or CSV data

After updating the VPS and configuring placeholders in CMS, everything should work correctly!

