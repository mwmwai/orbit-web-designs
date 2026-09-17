-- Orbit Web Designs — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.
-- Afterwards: Project Settings → API → copy URL + anon key into Vercel env vars:
--   PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY

-- 1. Contact-form leads -------------------------------------------------------
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  details text,
  source text default 'contact-form',
  created_at timestamptz default now()
);

alter table leads enable row level security;

drop policy if exists "anon insert leads" on leads;
create policy "anon insert leads"
  on leads for insert to anon
  with check (true);

-- 2. Newsletter subscribers ---------------------------------------------------
create table if not exists newsletter (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text,
  created_at timestamptz default now()
);

alter table newsletter enable row level security;

drop policy if exists "anon insert newsletter" on newsletter;
create policy "anon insert newsletter"
  on newsletter for insert to anon
  with check (true);

-- NOTE: anon can INSERT ONLY. Reading rows requires the service_role key
-- (keep it secret — never put it in frontend code). View leads in
-- Supabase Dashboard → Table Editor.
