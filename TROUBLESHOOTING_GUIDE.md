# 🔧 Troubleshooting Guide - Document Generation Issues

## 📋 Common Problems and Solutions

### Problem 1: Placeholder Settings Not Working (Database/CSV showing random data)

#### Symptoms:
- Placeholder settings saved in CMS but not applied during document generation
- Database/CSV sources showing random data instead of real data

#### Diagnosis Steps:

1. **Check API Logs:**
```bash
sudo journalctl -u petrodealhub-api -f
```

Look for:
- `"Saving X placeholder settings for template..."` - confirms settings are being saved
- `"Loaded X placeholder settings from Supabase..."` - confirms settings are being loaded
- `"Processing placeholder: 'X' (CMS key: 'Y', source: 'database')"` - shows which placeholder is being processed
- `"⚠️ Placeholder 'X' not found in template_settings"` - indicates placeholder name mismatch

2. **Check Placeholder Name Matching:**
- Placeholder names in document must match exactly (or be normalized) with names in CMS
- Check for spacing, case sensitivity, special characters
- Example: `{{Vessel Name}}` vs `{{vessel_name}}` vs `{{VesselName}}`

3. **Verify Settings in Supabase:**
```sql
SELECT * FROM template_placeholders 
WHERE template_id = 'YOUR_TEMPLATE_ID' 
ORDER BY placeholder;
```

Check:
- `source` field is correct ('database', 'csv', 'custom', 'random')
- `database_field` is set correctly for database source
- `csv_id`, `csv_field`, `csv_row` are set correctly for CSV source

#### Solutions:

1. **Ensure Placeholder Names Match:**
   - In CMS editor, check exact placeholder names
   - Use exact same format in document (spacing, case, etc.)
   - Or use normalized matching (system handles this automatically)

2. **Verify Database Field Names:**
   - Check available vessel fields in logs: `"Available vessel fields: [...]"`
   - Ensure `databaseField` matches exactly (case-insensitive matching works)

3. **Verify CSV Configuration:**
   - Check CSV file exists: `ls -la document-processor/data/*.csv`
   - Verify CSV field names match exactly
   - Check row index is correct (0-based)

### Problem 2: Document Generation Replacing Everything

#### Symptoms:
- All text in document is replaced, not just placeholders
- Document formatting is lost

#### Diagnosis:

Check logs for:
- `"Replaced X placeholders in paragraph: ..."` - should only show paragraphs with placeholders
- `"Skip paragraphs without placeholders"` - confirms filtering is working

#### Solution:

The fix ensures only paragraphs containing placeholders are modified. If still having issues:
1. Check document structure - ensure placeholders are in separate paragraphs or clearly marked
2. Verify placeholder patterns match document format ({{placeholder}}, {placeholder}, etc.)

### Problem 3: Incorrect Generated Filename

#### Symptoms:
- Filename shows "generated_name of document of document" instead of "template_name_vessel_imo"

#### Diagnosis:

Check logs for:
- `"Generated filename: ... (from template display name: ...)"` - shows what filename is being generated

#### Solution:

The fix uses `template_display_name` from metadata or Supabase `title`. Ensure:
1. Template has `display_name` set in metadata (CMS > Templates > Metadata)
2. Or template has `title` set in Supabase

### Problem 4: Plan System Not Working in Vessel Detail Page

#### Symptoms:
- All documents show as downloadable for everyone
- Description and display_name not showing correctly

#### Diagnosis:

1. **Check API Response:**
```bash
curl -X POST https://petrodealhub.com/api/user-downloadable-templates \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID"}' \
  -H "Cookie: session=YOUR_SESSION"
```

Check response for:
- `can_download` field (should be true/false based on plan)
- `description` field (should be populated)
- `name` or `title` field (should show display name)
- `plan_name` field (should show user's plan)

2. **Check User's Plan:**
```sql
SELECT s.user_id, s.plan_tier, sp.plan_name, sp.name 
FROM subscribers s 
JOIN subscription_plans sp ON s.plan_tier = sp.plan_tier 
WHERE s.user_id = 'YOUR_USER_ID';
```

3. **Check Template Permissions:**
```sql
SELECT ptp.*, sp.plan_name 
FROM plan_template_permissions ptp 
JOIN subscription_plans sp ON ptp.plan_id = sp.id 
WHERE ptp.template_id = 'TEMPLATE_ID';
```

#### Solution:

1. Ensure user has active subscription in `subscribers` table
2. Ensure template permissions are set in `plan_template_permissions` table
3. Ensure template has `description` and `title` in `document_templates` table or metadata

## 🔍 Debugging Commands

### Check Placeholder Settings:
```bash
# View placeholder settings file
cat document-processor/storage/placeholder_settings.json | jq

# Check specific template
cat document-processor/storage/placeholder_settings.json | jq '.["TEMPLATE_NAME.docx"]'
```

### Check Template Metadata:
```bash
# View metadata file
cat document-processor/storage/template_metadata.json | jq

# Check specific template
cat document-processor/storage/template_metadata.json | jq '.["TEMPLATE_NAME.docx"]'
```

### Test Document Generation:
```bash
# Test with curl
curl -X POST http://localhost:8000/generate-document \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "TEMPLATE_NAME",
    "vessel_imo": "IMO1234567",
    "user_id": "USER_ID"
  }' \
  --output test_output.pdf
```

### Check API Logs in Real-time:
```bash
# Follow API logs
sudo journalctl -u petrodealhub-api -f

# Filter for specific template
sudo journalctl -u petrodealhub-api -f | grep "TEMPLATE_NAME"

# Filter for placeholder processing
sudo journalctl -u petrodealhub-api -f | grep "Processing placeholder"
```

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] Placeholder settings are saved correctly (check logs)
- [ ] Placeholder settings are loaded correctly (check logs)
- [ ] Placeholder names match between document and CMS
- [ ] Database fields exist in vessel data
- [ ] CSV files exist and have correct fields
- [ ] Document generation only replaces placeholders
- [ ] Generated filename is correct
- [ ] Plan permissions work correctly
- [ ] Description and display_name show correctly

## 📞 Next Steps

If problems persist:
1. Check API logs for specific error messages
2. Verify database/Supabase data is correct
3. Test with a simple template first
4. Check browser console for frontend errors
5. Verify all services are running correctly

