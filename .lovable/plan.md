

# Implementation Plan: 3 Fixes

---

## Fix 1: Registration Step 2 -- Expand Phone Country Codes

**File:** `src/components/MultiStepRegistration.tsx` (lines 157-183)

The `countryCodes` array only has 24 countries. Will expand it to include all major countries (~100+) covering:
- All of Europe (Portugal, Ireland, Iceland, Luxembourg, etc.)
- All of Middle East (Iraq, Iran, Jordan, Lebanon, Bahrain, Kuwait, Oman, Qatar, Yemen, etc.)
- All of Africa (Ghana, Ethiopia, Tanzania, Cameroon, etc.)
- Caribbean and Central America (Jamaica, Trinidad, Costa Rica, Panama, etc.)
- South/Central Asia (Pakistan, Bangladesh, Sri Lanka, Nepal, etc.)
- Southeast Asia (Vietnam, Cambodia, Myanmar, Laos, etc.)
- Pacific (Fiji, Papua New Guinea, etc.)

Also update the `codeToCountry` validation map (lines 185-191) to match.

---

## Fix 2: Contact Sales Button -- Fix 404 Route

**File:** `src/components/PricingPlans.tsx` (line 465)

The "Contact Sales" button routes to `/contact-us` but the actual route in `App.tsx` is `/contact` (line 165). 

Change: `/contact-us` to `/contact`

Also check `src/components/landing/PricingSection.tsx` for the same issue.

---

## Fix 3: Support Phone Number -- Update Database Record

The code default in `Support.tsx` line 52 is already correct (`+1 (202) 773-6521`). However, the `support_contact_info` database table has the old number `+1 (555) 123-4567`. Since the code loads from the database and overrides the default, the old number appears.

**Fix:** Run a SQL migration to update the database record:

```sql
UPDATE support_contact_info 
SET phone_support = '+1 (202) 773-6521', 
    updated_at = now();
```

---

## Technical Summary

| # | Location | Change |
|---|----------|--------|
| 1 | `MultiStepRegistration.tsx` lines 157-191 | Expand countryCodes from 24 to 100+ countries + update codeToCountry map |
| 2 | `PricingPlans.tsx` line 465, `PricingSection.tsx` | Change `/contact-us` to `/contact` |
| 3 | SQL migration | Update `support_contact_info.phone_support` to `+1 (202) 773-6521` |

