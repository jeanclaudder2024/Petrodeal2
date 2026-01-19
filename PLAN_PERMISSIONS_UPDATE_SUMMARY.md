# Plan Permissions Update Summary

## Overview
Updated Python code to support the new `max_downloads_per_template` column and properly handle `plan_tier` to `plan_id` conversions.

## SQL Migration Changes
Your friend added:
- `max_downloads_per_template` column to `plan_template_permissions` table
- Updated `can_user_download_template()` function to use per-template limits
- Updated `get_user_downloadable_templates()` function to use per-template limits

## Python Code Updates

### 1. Added `max_downloads_per_template` Support
**Location:** Multiple endpoints that create/update `plan_template_permissions`

**Changes:**
- `/templates/{template_id}/metadata` (line ~1776)
- `/upload-template` (line ~1987)
- `/update-plan` (lines ~2540, ~2509)

**Update:**
```python
permission_rows.append({
    'plan_id': str(plan_id),
    'template_id': str(template_id),
    'can_download': True,
    'max_downloads_per_template': None  # NULL = unlimited (use plan default)
})
```

### 2. Added `plan_tier` to `plan_id` Conversion
**Location:** `/templates/{template_id}/metadata` endpoint (line ~1717)

**Issue:** CMS sends `plan_tier` values ("basic", "professional", etc.) but database needs UUID `plan_id` values.

**Solution:** Added conversion logic:
```python
# Convert plan_tiers to plan_ids (UUIDs) if needed
resolved_plan_ids = []
for plan_identifier in plan_ids:
    try:
        # Try to parse as UUID first
        plan_uuid = uuid.UUID(str(plan_identifier))
        resolved_plan_ids.append(str(plan_uuid))
    except (ValueError, TypeError):
        # Not a UUID, treat as plan_tier and look up plan_id
        plan_res = supabase.table('subscription_plans').select('id').eq('plan_tier', str(plan_identifier)).eq('is_active', True).limit(1).execute()
        if plan_res.data:
            resolved_plan_ids.append(str(plan_res.data[0]['id']))
```

### 3. Updated Query to Include `max_downloads_per_template`
**Location:** `/templates/{template_identifier}/plan-info` endpoint (line ~2699)

**Change:**
```python
# Before:
permissions_res = supabase.table('plan_template_permissions').select(
    'plan_id, can_download'
)

# After:
permissions_res = supabase.table('plan_template_permissions').select(
    'plan_id, can_download, max_downloads_per_template'
)
```

## How Plan IDs Work Now

### CMS → Python Flow:
1. **CMS sends:** `plan_ids: ["basic", "professional"]` (plan_tier values)
2. **Python converts:** Looks up UUID for each `plan_tier` in `subscription_plans` table
3. **Python saves:** Inserts into `plan_template_permissions` with UUID `plan_id`

### Database Structure:
- `subscription_plans` table: Has both `id` (UUID) and `plan_tier` (text like "basic")
- `plan_template_permissions` table: Uses `plan_id` (UUID reference)
- CMS JavaScript: Works with `plan_tier` for user-friendly display

## CMS JavaScript Files

### `cms.js`:
- ✅ Correctly sends `plan_ids` as `plan_tier` values
- ✅ Reads `plan_tier` from response

### `editor.js`:
- ✅ Sends `plan_ids` as array of `plan_tier` values (line 663)
- ✅ Reads `plan_tier` from response to populate checkboxes (line 368)

## Testing Checklist

- [ ] Save plan assignments in CMS metadata modal
- [ ] Save plan assignments in edit template page
- [ ] Verify `max_downloads_per_template` defaults to NULL (unlimited)
- [ ] Verify per-template download limits work via SQL functions
- [ ] Verify plan_tier to plan_id conversion works correctly

## Next Steps

If you want to add per-template limit support in the UI:
1. Add input field in CMS for `max_downloads_per_template`
2. Update Python endpoints to accept and save this value
3. Update frontend to display per-template limits

Currently, the code sets `max_downloads_per_template` to `NULL`, which means "unlimited - use plan default".
