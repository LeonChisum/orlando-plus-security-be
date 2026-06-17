-- ============================================================
-- MIGRATION 002 — Row Level Security
-- ============================================================
-- Architecture note:
--   The Express backend uses SUPABASE_SERVICE_ROLE_KEY, which
--   bypasses RLS entirely. RLS here protects direct Supabase
--   client calls (e.g. frontend auth, future public pages).
--
-- Phase 1 model:
--   authenticated  → supervisors (Supabase Auth session) — full access
--   anon           → blocked on all tables
--
-- Phase 7 additions (see comments below):
--   anon + valid token → narrow access for guard webform + ack links
-- ============================================================

-- ============================================================
-- GRANTS — table-level access for Postgres roles
-- RLS policies control which rows are visible; these GRANTs
-- control whether the role can touch the table at all.
-- anon gets no grants here — blocked at the table level until
-- Phase 7 adds token-based access.
-- ============================================================

grant select, insert, update, delete on workers             to authenticated;
grant select, insert, update, delete on shows               to authenticated;
grant select, insert, update, delete on halls               to authenticated;
grant select, insert, update, delete on posts               to authenticated;
grant select, insert, update, delete on shifts              to authenticated;
grant select, insert, update, delete on assignments         to authenticated;
grant select, insert, update, delete on availability        to authenticated;
grant select, insert, update, delete on availability_tokens to authenticated;
grant select, insert, update, delete on overtime_flags      to authenticated;


-- Enable RLS on every table
alter table workers             enable row level security;
alter table shows               enable row level security;
alter table halls               enable row level security;
alter table posts               enable row level security;
alter table shifts              enable row level security;
alter table assignments         enable row level security;
alter table availability        enable row level security;
alter table availability_tokens enable row level security;
alter table overtime_flags      enable row level security;


-- ============================================================
-- AUTHENTICATED USERS (supervisors)
-- Full access to all tables — service role already bypasses
-- RLS, but these policies cover direct frontend Supabase calls.
-- ============================================================

create policy "supervisors_all_workers" on workers
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_shows" on shows
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_halls" on halls
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_posts" on posts
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_shifts" on shifts
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_assignments" on assignments
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_availability" on availability
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_availability_tokens" on availability_tokens
  for all to authenticated
  using (true)
  with check (true);

create policy "supervisors_all_overtime_flags" on overtime_flags
  for all to authenticated
  using (true)
  with check (true);


-- ============================================================
-- ANON (public) — Phase 7 token-based access
-- Uncomment and apply these when building the guard webform
-- (/avail) and acknowledgment (/ack/:token) pages.
-- ============================================================

-- Guard reads their own token to validate it
-- create policy "anon_read_own_token" on availability_tokens
--   for select to anon
--   using (token = current_setting('request.jwt.claims', true)::jsonb->>'token');

-- Guard reads their own worker record via a valid token
-- create policy "anon_read_own_worker" on workers
--   for select to anon
--   using (
--     id in (
--       select worker_id from availability_tokens
--       where token = current_setting('request.jwt.claims', true)::jsonb->>'token'
--         and expires_at > now()
--         and used_at is null
--     )
--   );

-- Guard submits/updates their own availability
-- create policy "anon_upsert_own_availability" on availability
--   for all to anon
--   using (
--     worker_id in (
--       select worker_id from availability_tokens
--       where token = current_setting('request.jwt.claims', true)::jsonb->>'token'
--         and expires_at > now()
--         and used_at is null
--     )
--   )
--   with check (
--     worker_id in (
--       select worker_id from availability_tokens
--       where token = current_setting('request.jwt.claims', true)::jsonb->>'token'
--         and expires_at > now()
--         and used_at is null
--     )
--   );

-- Guard acknowledges their own assignment via ack token
-- create policy "anon_ack_own_assignment" on assignments
--   for update to anon
--   using (
--     worker_id in (
--       select worker_id from availability_tokens
--       where token = current_setting('request.jwt.claims', true)::jsonb->>'token'
--         and token_type = 'acknowledgment'
--         and expires_at > now()
--         and used_at is null
--     )
--   )
--   with check (acknowledged_at is not null);
