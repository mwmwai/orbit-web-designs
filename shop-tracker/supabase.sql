-- Duka Tracker — optional cloud sync (run in Supabase SQL Editor)
create table if not exists shop_transactions (
  id uuid default gen_random_uuid() primary key,
  shop text not null default 'Aggmart' check (shop in ('Aggmart','Trade Star Shop')),
  type text not null check (type in ('in','out')),
  amount numeric not null check (amount > 0),
  category text not null,
  method text not null default 'Cash',
  date date not null default current_date,
  note text default '',
  mpesa_code text default '',
  created_at timestamptz default now()
);
alter table shop_transactions enable row level security;
-- For a single-shop private dashboard: allow anon read/write ONLY if you
-- protect the page (or better: enable Auth and restrict to authenticated).
-- Simplest private setup: keep RLS enabled and use service_role on server,
-- or add auth later. Dev-open policy below — replace with auth for production:
drop policy if exists "open shop_transactions" on shop_transactions;
create policy "open shop_transactions" on shop_transactions
  for all to anon using (true) with check (true);
