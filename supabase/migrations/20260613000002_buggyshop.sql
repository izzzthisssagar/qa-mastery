-- 0002 — BuggyShop practice-app tables + sandbox provisioning/reset.
--
-- Conventions (architecture plan + BuggyShop-Spec.md):
--   * EVERY per-learner table carries sandbox_id → public.sandboxes
--     ON DELETE CASCADE (account deletion wipes practice data).
--   * Deny-all RLS: enabled on every table, zero policies. Only the service
--     role touches this schema (grants come from 0001 default privileges).
--   * BuggyShop "auth" is fake by design — bs_users/bs_sessions are
--     curriculum props, not real identity. Passwords here are intentionally
--     fake seed values inside an unreachable schema.
--   * Catalog (bs_products/bs_reviews) is global, seeded here so every
--     environment gets it; per-sandbox rows are seeded by reset_sandbox().

-- ── global catalog ───────────────────────────────────────────────────────

create table buggyshop.bs_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  category text not null,
  stock integer not null default 25,
  image_emoji text not null default '📦', -- placeholder art until real images
  created_at timestamptz not null default now()
);

create table buggyshop.bs_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references buggyshop.bs_products (id) on delete cascade,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now()
);

-- ── per-sandbox tables ───────────────────────────────────────────────────

create table buggyshop.bs_users (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  name text not null,
  email text not null,
  password text not null, -- fake creds for a fake shop; deny-all schema
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (sandbox_id, email)
);

create table buggyshop.bs_sessions (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  bs_user_id uuid not null references buggyshop.bs_users (id) on delete cascade,
  token text not null unique,
  remember_me boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table buggyshop.bs_carts (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  bs_user_id uuid not null references buggyshop.bs_users (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buggyshop.bs_cart_items (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  cart_id uuid not null references buggyshop.bs_carts (id) on delete cascade,
  product_id uuid not null references buggyshop.bs_products (id),
  qty integer not null check (qty >= 0), -- 0 allowed on purpose: BS-007 substrate
  unit_price_cents integer not null,
  unique (cart_id, product_id)
);

create table buggyshop.bs_orders (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  bs_user_id uuid not null references buggyshop.bs_users (id) on delete cascade,
  status text not null default 'Placed'
    check (status in ('Placed', 'Paid', 'Shipped', 'Delivered', 'Cancelled')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Paid', 'Refunded')),
  payment_method text not null
    check (payment_method in ('cod', 'card', 'upi')),
  address jsonb not null default '{}'::jsonb,
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  is_seed boolean not null default false,
  placed_at timestamptz not null default now()
);

create table buggyshop.bs_order_items (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  order_id uuid not null references buggyshop.bs_orders (id) on delete cascade,
  product_id uuid not null references buggyshop.bs_products (id),
  name_snapshot text not null,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null
);

-- deterministic counters (e.g. BS-018's 1-in-3 cart bug) + per-sandbox flags
create table buggyshop.bs_sandbox_state (
  sandbox_id uuid primary key references public.sandboxes (id) on delete cascade,
  counters jsonb not null default '{}'::jsonb,
  release_overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- seeded-bug manifest (synced from apps/buggyshop/manifest/*.json — M1).
-- NEVER readable by clients; the platform grades against it server-side.
create table buggyshop.bs_bug_manifest (
  bug_id text primary key,
  release text not null,
  fixed_in text,
  page text not null,
  feature text not null,
  category text not null,
  severity text not null
    check (severity in ('trivial', 'minor', 'major', 'critical', 'blocker')),
  title_internal text not null,
  trigger_internal text,
  repro_steps jsonb not null default '[]'::jsonb,
  expected text,
  detection jsonb not null default '{}'::jsonb,
  points integer not null default 10,
  teaches text[] not null default '{}'
);

-- ── deny-all RLS on everything ───────────────────────────────────────────

alter table buggyshop.bs_products enable row level security;
alter table buggyshop.bs_reviews enable row level security;
alter table buggyshop.bs_users enable row level security;
alter table buggyshop.bs_sessions enable row level security;
alter table buggyshop.bs_carts enable row level security;
alter table buggyshop.bs_cart_items enable row level security;
alter table buggyshop.bs_orders enable row level security;
alter table buggyshop.bs_order_items enable row level security;
alter table buggyshop.bs_sandbox_state enable row level security;
alter table buggyshop.bs_bug_manifest enable row level security;

-- ── indexes ──────────────────────────────────────────────────────────────

create index bs_users_sandbox on buggyshop.bs_users (sandbox_id);
create index bs_sessions_sandbox on buggyshop.bs_sessions (sandbox_id);
create index bs_carts_sandbox on buggyshop.bs_carts (sandbox_id);
create index bs_cart_items_sandbox on buggyshop.bs_cart_items (sandbox_id);
create index bs_orders_sandbox on buggyshop.bs_orders (sandbox_id);
create index bs_order_items_sandbox on buggyshop.bs_order_items (sandbox_id);
create index bs_reviews_product on buggyshop.bs_reviews (product_id);

-- ── catalog seed (M1 scope: 8 products; full ~30 arrive in M2) ───────────

insert into buggyshop.bs_products (sku, name, description, price_cents, category, stock, image_emoji) values
  ('MUG-001',  'Tester Mug',               'Holds coffee and edge cases.',                          1250,  'merch', 40, '☕'),
  ('DUCK-001', 'Rubber Duck Debugger',     'Explains your bugs back to you. Squeaks in YAML.',      999,   'merch', 60, '🦆'),
  ('KEYB-001', 'Mechanical Keyboard',      'Cherry switches. Priced exactly at a filter boundary.', 50000, 'gear',  12, '⌨️'),
  ('MON-001',  '4K Monitor 27"',           'See four bugs at once in native resolution.',           34900, 'gear',  8,  '🖥️'),
  ('BOOK-001', 'How to Break Software',    'Classic exploratory testing field guide.',              4500,  'books', 25, '📕'),
  ('HOOD-001', 'Bug Bounty Hoodie',        'For hunting in cold offices.',                          5900,  'merch', 30, '🧥'),
  ('USB-001',  'USB Logic Analyzer',       '8 channels of "why is this flaky".',                    12999, 'gear',  15, '🔬'),
  ('BOOK-002', 'ISTQB Foundation Prep',    'Syllabus-aligned practice questions.',                  8000,  'books', 50, '📗')
on conflict (sku) do nothing;

insert into buggyshop.bs_reviews (product_id, author, rating, body)
select p.id, r.author, r.rating, r.body
from buggyshop.bs_products p
join (values
  ('MUG-001',  'Manish',  5, 'Survived three regression cycles. No defects found.'),
  ('DUCK-001', 'Sana',    4, 'Found two null pointer bugs just by listening.'),
  ('KEYB-001', 'Priya',   5, 'The keys at the boundaries work flawlessly. Ironic.'),
  ('BOOK-001', 'Manish',  5, 'Chapter on boundary testing paid for itself.')
) as r(sku, author, rating, body) on r.sku = p.sku
where not exists (select 1 from buggyshop.bs_reviews limit 1);

-- ── sandbox provisioning / reset ─────────────────────────────────────────
-- One transactional function; advisory-locked per sandbox so a double-click
-- on "Reset" can't interleave. SECURITY DEFINER + empty search_path: callable
-- only via service-role RPC (no EXECUTE grant ever goes to anon/authenticated).

create or replace function buggyshop.reset_sandbox(p_sandbox_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seed_user_id buggyshop.bs_users.id%type;
  v_order_id buggyshop.bs_orders.id%type;
begin
  if not exists (select 1 from public.sandboxes s where s.id = p_sandbox_id) then
    raise exception 'sandbox % does not exist', p_sandbox_id;
  end if;

  -- serialize concurrent resets of the same sandbox
  perform pg_advisory_xact_lock(hashtextextended(p_sandbox_id::text, 0));

  update public.sandboxes set status = 'resetting' where id = p_sandbox_id;

  -- wipe everything sandbox-scoped (children first via FKs anyway; explicit
  -- deletes keep the intent readable)
  delete from buggyshop.bs_order_items where sandbox_id = p_sandbox_id;
  delete from buggyshop.bs_orders      where sandbox_id = p_sandbox_id;
  delete from buggyshop.bs_cart_items  where sandbox_id = p_sandbox_id;
  delete from buggyshop.bs_carts       where sandbox_id = p_sandbox_id;
  delete from buggyshop.bs_sessions    where sandbox_id = p_sandbox_id;
  delete from buggyshop.bs_users       where sandbox_id = p_sandbox_id;
  delete from buggyshop.bs_sandbox_state where sandbox_id = p_sandbox_id;

  -- seed login-able account (lesson scripts reference these exact creds)
  insert into buggyshop.bs_users (sandbox_id, name, email, password, is_seed)
  values (p_sandbox_id, 'Asha Tester', 'asha@test.io', 'TestPass123!', true);

  -- seed "other user" — their orders exist so BS-020 (profile shows another
  -- user's order history) has something real to leak
  insert into buggyshop.bs_users (sandbox_id, name, email, password, is_seed)
  values (p_sandbox_id, 'Priya Seeduser', 'priya@seed.example', 'NotYourLogin1!', true)
  returning id into v_seed_user_id;

  insert into buggyshop.bs_orders
    (sandbox_id, bs_user_id, status, payment_status, payment_method,
     address, subtotal_cents, shipping_cents, total_cents, is_seed)
  values
    (p_sandbox_id, v_seed_user_id, 'Delivered', 'Paid', 'card',
     '{"name":"Priya Seeduser","line1":"42 Seed Street","city":"Pune","zip":"411001"}'::jsonb,
     4500, 99, 4599, true)
  returning id into v_order_id;

  insert into buggyshop.bs_order_items
    (sandbox_id, order_id, product_id, name_snapshot, qty, unit_price_cents)
  select p_sandbox_id, v_order_id, p.id, p.name, 1, p.price_cents
  from buggyshop.bs_products p where p.sku = 'BOOK-001';

  -- second seed order: Delivered while payment still Pending → BS-015 substrate
  insert into buggyshop.bs_orders
    (sandbox_id, bs_user_id, status, payment_status, payment_method,
     address, subtotal_cents, shipping_cents, total_cents, is_seed)
  values
    (p_sandbox_id, v_seed_user_id, 'Delivered', 'Pending', 'cod',
     '{"name":"Priya Seeduser","line1":"42 Seed Street","city":"Pune","zip":"411001"}'::jsonb,
     1250, 99, 1349, true)
  returning id into v_order_id;

  insert into buggyshop.bs_order_items
    (sandbox_id, order_id, product_id, name_snapshot, qty, unit_price_cents)
  select p_sandbox_id, v_order_id, p.id, p.name, 1, p.price_cents
  from buggyshop.bs_products p where p.sku = 'MUG-001';

  insert into buggyshop.bs_sandbox_state (sandbox_id, counters)
  values (p_sandbox_id, '{}'::jsonb);

  update public.sandboxes
  set status = 'active', last_reset_at = now()
  where id = p_sandbox_id;
end;
$$;

-- provision = first-time reset; kept as a named entry point so call sites
-- read correctly and the two paths can diverge later (e.g. analytics)
create or replace function buggyshop.provision_sandbox(p_sandbox_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform buggyshop.reset_sandbox(p_sandbox_id);
end;
$$;

-- belt-and-braces: SECURITY DEFINER functions default to PUBLIC execute —
-- revoke it; only service_role (via 0001 default privileges) may call these
revoke execute on function buggyshop.reset_sandbox(uuid) from public, anon, authenticated;
revoke execute on function buggyshop.provision_sandbox(uuid) from public, anon, authenticated;
