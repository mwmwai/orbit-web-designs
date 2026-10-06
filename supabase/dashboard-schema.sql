-- Cloud money dashboard — Supabase schema (Aggmart + Trade Star Shop)
-- Run in Supabase Dashboard → SQL Editor → New query → Run.
-- Requires: Supabase Auth owner user (Dashboard → Authentication → Add user).
-- Writes go ONLY through server API routes using SUPABASE_SERVICE_ROLE_KEY
-- (Vercel env, never exposed). The anon key can do NOTHING on these tables.

-- 0. Owner allowlist -----------------------------------------------------------
-- Simplest approach (per spec): ONE owner user in Supabase Auth; RLS policies
-- below restrict all row access to `authenticated` (anon gets nothing).
-- Optional hardening (multi-user later): track owners here and switch the
-- shop_transactions policies to the strict variants (commented below).
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_owner boolean not null default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "authenticated read own profile" on profiles;
create policy "authenticated read own profile"
  on profiles for select to authenticated
  using (auth.uid() = id);

-- After creating the owner user, make them an owner (replace the UUID):
--   insert into profiles (id, is_owner)
--   values ('PASTE-OWNER-USER-UUID-HERE', true)
--   on conflict (id) do update set is_owner = true;

-- 1. Ledger -------------------------------------------------------------------
create table if not exists shop_transactions (
  id uuid default gen_random_uuid() primary key,
  shop text not null check (shop in ('Aggmart', 'Trade Star Shop')),
  type text not null check (type in ('in', 'out')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'Sales',
  method text not null default 'Till Number'
    check (method in ('Till Number', 'Pochi la Biashara', 'M-Pesa Personal', 'Cash', 'Manual', 'Bank')),
  date timestamptz not null default now(),
  note text,
  mpesa_code text unique,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Nullable UNIQUE: many manual rows can have NULL code; every M-Pesa code once.
create unique index if not exists shop_transactions_mpesa_code_uidx
  on shop_transactions (mpesa_code);
create index if not exists shop_transactions_shop_date_idx
  on shop_transactions (shop, date desc);
create index if not exists shop_transactions_type_idx
  on shop_transactions (type);
create index if not exists shop_transactions_category_idx
  on shop_transactions (category);

alter table shop_transactions enable row level security;

-- Authenticated owner: full access. No anon policy = anon gets NOTHING
-- (no SELECT, no INSERT — ingest writes use service_role server-side,
-- which bypasses RLS entirely).
drop policy if exists "owner full access" on shop_transactions;
create policy "owner full access"
  on shop_transactions for all to authenticated
  using (true)
  with check (true);

-- STRICT variants (enable when profiles.is_owner is maintained, then drop
-- "owner full access" above):
--   using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_owner = true))
--   with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_owner = true))

-- 2. Verify -------------------------------------------------------------------
--   select shop, type, count(*), sum(amount) from shop_transactions group by 1, 2;
