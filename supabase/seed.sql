-- Local/dev seed. Intentionally minimal in M0:
--   * auth users are created through the app's signup flow (the trigger in
--     0001 creates the matching profile row);
--   * the lesson registry is populated by the curriculum sync
--     (`pnpm --filter @qa-mastery/curriculum sync -- --apply`, M1), never by
--     hand — seed data here would drift from content frontmatter.
-- BuggyShop seed data (products, seed users) arrives with migration 0002.

select 1;
