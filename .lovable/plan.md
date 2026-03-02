

# Fix: Free Trial Plan Visibility + Document Access for Trial Users

## What's Happening Now

1. You created a "Free Trial" plan in admin with `plan_tier: 'Trial'` (capital T)
2. But when users register, the `handle_new_user()` trigger sets their `subscription_tier` to `'trial'` (lowercase)
3. The VesselDocumentGenerator looks up plans by `plan_tier` matching the user's `subscription_tier` -- `'trial'` != `'Trial'`, so no plan is found, and documents stay locked
4. There's no "show/hide from frontend" toggle, so the Free Trial plan would appear on the pricing page, subscription page, and registration steps -- which you don't want

## Plan

### 1. Add `show_in_frontend` column to `subscription_plans` table

Add a new boolean column `show_in_frontend` (default `true`) to control whether a plan appears on customer-facing pages (pricing, subscription, registration step 5). Internal-only plans like "Free Trial" will have this set to `false`.

### 2. Fix plan_tier case mismatch

Update your existing "Free Trial" plan's `plan_tier` from `'Trial'` to `'trial'` (lowercase) so it matches the value stored in `subscribers.subscription_tier` by the `handle_new_user()` trigger.

### 3. Add visibility toggle to admin Plan form

In `SubscriptionManagement.tsx`, add a "Show to customers" Switch in the plan create/edit dialog. This controls the `show_in_frontend` value.

### 4. Filter plans on customer-facing pages

Update these files to add `.eq('show_in_frontend', true)` when fetching plans:
- `src/components/MultiStepRegistration.tsx` (registration step 5)
- `src/components/PricingPlans.tsx` (subscription page)
- `src/components/landing/PricingSection.tsx` (landing page pricing)
- `src/components/FloatingAIAssistant.tsx` (AI assistant pricing info)

Admin pages (Doc Publishing Plan Access, admin Subscription Management) will NOT filter by this column -- they show all plans so you can assign documents to the Free Trial plan.

### 5. VesselDocumentGenerator already works correctly

Once the `plan_tier` case is fixed to `'trial'` (lowercase), the existing template permission lookup logic will work:
- User has `subscription_tier = 'trial'`
- System finds plan with `plan_tier = 'trial'`
- System checks `plan_template_permissions` for that plan's ID
- Documents assigned to the Free Trial plan become visible/downloadable

## After Implementation

1. Go to Admin > Subscription > Plans -- you'll see the "Show to customers" toggle
2. Make sure "Free Trial" has it OFF
3. Go to Admin > Doc Publishing > Plan Access -- you'll see the Free Trial plan listed
4. Assign document templates to the Free Trial plan
5. Trial users will see those documents unlocked on vessel pages

## Files Changed

| File | Change |
|---|---|
| Database migration | Add `show_in_frontend` column, fix `plan_tier` case |
| `src/components/admin/SubscriptionManagement.tsx` | Add visibility toggle in plan form + save it |
| `src/components/MultiStepRegistration.tsx` | Filter by `show_in_frontend = true` |
| `src/components/PricingPlans.tsx` | Filter by `show_in_frontend = true` |
| `src/components/landing/PricingSection.tsx` | Filter by `show_in_frontend = true` |
| `src/components/FloatingAIAssistant.tsx` | Filter by `show_in_frontend = true` |

