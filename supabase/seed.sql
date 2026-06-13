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
  ('BS-008', '1.0', '1.1', 'product-list', 'price-filter', 'boundary', 'major',
   'Max-boundary item excluded from the price filter',
   'Filter compares price < max instead of price <= max',
   '["Open the Products page", "Set Max price to the exact price of the most expensive item (100)", "Notice that item disappears from the results"]'::jsonb,
   'The item priced exactly at the max price should still appear in the filtered results.',
   15,
   '{A3.3}')
on conflict (bug_id) do nothing;

