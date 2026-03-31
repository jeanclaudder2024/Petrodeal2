
Goal: fix the real promo-creation failure and make the Special Promo UI usable on mobile, without changing the overall promo structure.

What I found
- The edge function is not failing at boot anymore. The logs show it starts correctly and reaches Stripe.
- The real backend error is now:
  `Invalid string ... must be at most 40 characters`
- This happens in `supabase/functions/create-special-promo/index.ts` when creating the Stripe coupon:
  the generated `couponParams.name` is too long.
- Mobile also needs improvement:
  - `src/pages/Subscription.tsx` uses a single-row promo input/button on a 360px screen, so it gets cramped.
  - `src/components/admin/StripeConfiguration.tsx` uses fixed 3-column tabs and wide tables without mobile overflow handling.

Implementation plan

1. Fix the real Stripe error in `create-special-promo`
- Replace the long Stripe coupon `name` with a short safe label under 40 chars, or remove the `name` entirely and keep full details only in metadata.
- Keep the current structure:
  - code
  - discount_percentage
  - free_months
  - plan_tier
  - no free trial behavior
- Add stricter input normalization before Stripe call:
  - uppercase code
  - trim spaces
  - reject empty/invalid values early
- Improve error handling so Stripe validation errors return a clear readable message instead of only “edge function no 2xx”.

2. Improve admin Special Promo UX in `src/components/admin/StripeConfiguration.tsx`
- Keep the existing “Special Promo Codes” tab and form.
- Add clearer validation/help text so admins know the promo code will create:
  “X months at Y% off, no 5-day trial”.
- Improve failure display so the toast shows the backend message when Stripe rejects the request.
- Make the tab layout mobile-friendly:
  - use horizontally scrollable tabs instead of a squeezed 3-column grid
  - wrap the Special Promo table in `overflow-x-auto`
  - ensure dialog content and action button remain comfortable on small screens

3. Fix the mobile Special Promo input on `src/pages/Subscription.tsx`
- Change the promo code input area from one tight horizontal row to:
  - stacked layout on mobile
  - horizontal layout on larger screens
- Make the Apply button full width on small screens.
- Keep the current behavior of passing `special_promo_code` into checkout.
- Preserve the confirmation text: “no 5-day trial”.

4. Hardening pass on checkout flow
- Review `supabase/functions/create-checkout/index.ts` to keep special promo behavior consistent:
  - valid special promo => skip 5-day trial
  - invalid special promo => do not crash checkout
- Align CORS headers with the standard Supabase edge-function header set for consistency.

5. Verification after implementation
- Admin test:
  - create a code like `VIPFREE3`
  - confirm the coupon is created successfully in Stripe
  - confirm a DB row is saved in `special_promo_codes`
- Checkout test:
  - enter the code on subscription page
  - confirm checkout opens
  - confirm the subscription has no 5-day trial and uses the special discount
- Mobile test:
  - verify admin Stripe tab is scrollable and usable on narrow screens
  - verify subscription promo input/button is easy to use at 360px width

Files to update
- `supabase/functions/create-special-promo/index.ts`
- `src/components/admin/StripeConfiguration.tsx`
- `src/pages/Subscription.tsx`
- `supabase/functions/create-checkout/index.ts` (hardening only)

No database migration is needed for this fix, because the table structure already supports the feature.
