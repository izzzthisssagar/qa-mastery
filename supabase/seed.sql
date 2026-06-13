-- Local/dev seed. Intentionally minimal in M0:
--   * auth users are created through the app's signup flow (the trigger in
--     0001 creates the matching profile row);
--   * the lesson registry is populated by the curriculum sync
--     (`pnpm --filter @qa-mastery/curriculum sync -- --apply`, M1), never by
--     hand — seed data here would drift from content frontmatter.
-- BuggyShop seed data (products, seed users) arrives with migration 0002.

-- Seeded-bug manifest. The platform's grading service reads this server-side
-- (never shipped to a client) to score bug-report lab submissions. BS-008 is
-- the price-filter off-by-one taught in A3.3 — active in v1.0, fixed in v1.1.
insert into buggyshop.bs_bug_manifest
  (bug_id, release, fixed_in, page, feature, category, severity,
   title_internal, trigger_internal, repro_steps, expected, points, teaches)
values
  ('BS-001', '1.0', null, 'signup', 'email-validation', 'validation', 'major',
   'Signup accepts invalid email addresses',
   'Email regex is too lax — accepts double @ and consecutive dots',
   '["Open the Sign up page", "Enter an invalid address such as user@@domain..com", "Submit and see it accepted"]'::jsonb,
   'An invalid email such as user@@domain..com should be rejected.',
   10,
   '{A3.2}'),
  ('BS-008', '1.0', '1.1', 'product-list', 'price-filter', 'boundary', 'major',
   'Max-boundary item excluded from the price filter',
   'Filter compares price < max instead of price <= max',
   '["Open the Products page", "Set Max price to the exact price of the most expensive item (100)", "Notice that item disappears from the results"]'::jsonb,
   'The item priced exactly at the max price should still appear in the filtered results.',
   15,
   '{A3.3}'),
  ('BS-009', '1.0', null, 'product-list', 'sort', 'functional', 'major',
   'Sort by price orders prices as text',
   'Sort compares String(price) instead of the number, so 100 sorts before 5',
   '["Open the Products page", "Sort by Price: low to high", "See the $100 item appear before cheaper items"]'::jsonb,
   'Sorting by price ascending should list the cheapest item first.',
   10,
   '{A1.4}'),
  ('BS-010', '1.0', null, 'product-list', 'search', 'functional', 'minor',
   'Search does not trim whitespace',
   'Query is matched without trimming, so a leading/trailing space yields no results',
   '["Open the Products page", "Search for \"mug \" with a trailing space", "See zero results even though Mug exists"]'::jsonb,
   'A search with stray surrounding spaces should still find matching products.',
   5,
   '{A3.6}'),
  ('BS-007', '1.0', '1.1', 'product-detail', 'quantity', 'boundary', 'major',
   'Quantity field accepts 0',
   'Quantity check uses >= 0 instead of >= 1, so a 0-quantity $0 line is added',
   '["Open a product detail page", "Set Quantity to 0", "Add to cart and see a $0.00 line accepted"]'::jsonb,
   'A quantity of 0 should be rejected; the minimum is 1.',
   10,
   '{A3.2}'),
  ('BS-006', '1.0', null, 'login', 'password-rules', 'security', 'minor',
   'Login error message leaks account existence',
   'Submit the login form with a registered email but an incorrect password',
   '["Go to /login","Enter shopper@buggyshop.test with a wrong password","Click Log in","Read the error message"]'::jsonb,
   'A generic "Incorrect email or password" is shown so neither field is confirmed',
   5,
   '{A2.3}'),
  ('BS-012', '1.0', null, 'cart', 'shipping', 'boundary', 'minor',
   'Free shipping applies at exactly $999',
   'View the cart with the single $999 Annual Membership line at quantity 1 (subtotal exactly $999)',
   '["Go to /cart with quantity 1 so the subtotal is exactly $999","Read the Shipping value next to the $999 subtotal"]'::jsonb,
   'Shipping should NOT be free at exactly $999; free shipping requires a subtotal strictly greater than $999',
   5,
   '{A3.3}'),
  ('BS-016', '1.0', null, 'checkout', 'address-form', 'validation', 'minor',
   'Shipping ZIP accepts letters',
   'Enter an alphanumeric ZIP like "AB12C" on the checkout address form and submit',
   '["Go to /checkout","Type AB12C in the ZIP field and click Continue"]'::jsonb,
   'ZIP should be rejected (digits-only, 4-6 chars required)',
   5,
   '{A3.2}')
on conflict (bug_id) do nothing;

