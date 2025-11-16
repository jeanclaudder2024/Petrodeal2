# 🔧 Comprehensive Fix Plan - Document Generation Issues

## 📋 Problems Identified

### Problem 1: Placeholder Data Replacement Not Working
**Issue**: When editing placeholder settings in CMS, database/CSV sources don't work - shows random data instead
**Root Cause**: 
- `fetch_template_placeholders` may not be saving correctly to Supabase
- Placeholder settings may not be loading correctly from Supabase/disk
- Settings format mismatch between CMS and backend

### Problem 2: Document Generation Replacing Everything
**Issue**: When generating document, it replaces everything, not just placeholders
**Root Cause**: 
- `paragraph.text = updated_text` replaces entire paragraph text
- Should preserve formatting and only replace placeholder parts
- Need to use `python-docx` runs for inline replacement

### Problem 3: Incorrect Generated Filename
**Issue**: Filename shows "generated_name of document of document" instead of "template_name_vessel_imo"
**Root Cause**: 
- Line 3441: `filename = f"generated_{template_name.replace('.docx', '')}_{vessel_imo}.pdf"`
- Should be: `filename = f"{template_display_name}_{vessel_imo}.pdf"` (without "generated_")
- Need to get actual template display name, not raw template_name

### Problem 4: Plan System Not Working in Vessel Detail Page
**Issue**: Documents show can_download for everyone, don't show description and display_name correctly
**Root Cause**: 
- `/user-downloadable-templates` endpoint may not be checking permissions correctly
- Frontend may not be handling plan restrictions properly
- Description and display_name not being passed correctly

## ✅ Fix Plan - Step by Step

### Step 1: Fix Placeholder Data Loading and Saving
1. Ensure `fetch_template_placeholders` correctly loads from Supabase with proper field mapping
2. Verify `upsert_template_placeholders` saves correctly to Supabase
3. Add better logging to track placeholder settings loading
4. Fix field name mapping (databaseField vs database_field, etc.)

### Step 2: Fix Document Generation - Replace Only Placeholders
1. Refactor `replace_placeholders_in_docx` to use `python-docx` runs for inline replacement
2. Preserve paragraph formatting and other text
3. Only replace placeholder patterns, not entire text
4. Test with complex documents with formatting

### Step 3: Fix Generated Filename
1. Get template display_name from metadata/Supabase
2. Use display_name for filename instead of raw template_name
3. Remove "generated_" prefix
4. Format: `{display_name}_{vessel_imo}.pdf`

### Step 4: Fix Plan System in Vessel Detail Page
1. Verify `/user-downloadable-templates` checks permissions correctly
2. Ensure description and display_name are returned correctly
3. Fix frontend to show lock icons and restrictions
4. Test with different user plans

## 🎯 Implementation Order
1. Step 3 (Filename) - Quick fix
2. Step 1 (Placeholder Loading) - Core functionality
3. Step 4 (Plan System) - User experience
4. Step 2 (Document Replacement) - Complex fix, do last

