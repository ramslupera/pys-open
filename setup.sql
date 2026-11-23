-- ============================================================
--  PYS OPEN — Supabase setup
--  Run this once in Supabase: SQL Editor → New query → paste → Run.
--  BEFORE running: replace the email on the line marked  <<< EDIT
--  with the email(s) of your Match Control account(s).
-- ============================================================

create table if not exists public.pys_kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pys_kv enable row level security;

-- Everyone (spectators) can READ scores.
drop policy if exists "public read" on public.pys_kv;
create policy "public read" on public.pys_kv
  for select using (true);

-- Only listed Match Control emails can WRITE.
create or replace function public.pys_is_official() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'matchcontrol@example.com'          -- <<< EDIT: your Match Control email(s), comma-separated
  );
$$;

drop policy if exists "officials insert" on public.pys_kv;
drop policy if exists "officials update" on public.pys_kv;
drop policy if exists "officials delete" on public.pys_kv;
create policy "officials insert" on public.pys_kv for insert with check (public.pys_is_official());
create policy "officials update" on public.pys_kv for update using (public.pys_is_official()) with check (public.pys_is_official());
create policy "officials delete" on public.pys_kv for delete using (public.pys_is_official());

-- Turn on realtime so every phone/TV updates instantly.
do $$ begin
  alter publication supabase_realtime add table public.pys_kv;
exception when duplicate_object then null; end $$;

-- Optional: an audit log of every score change (handy for disputes).
create table if not exists public.pys_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  who text,
  key text,
  old_value jsonb,
  new_value jsonb
);
alter table public.pys_log enable row level security;
drop policy if exists "officials read log" on public.pys_log;
create policy "officials read log" on public.pys_log for select using (public.pys_is_official());

create or replace function public.pys_log_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.pys_log(who, key, old_value, new_value)
  values (auth.jwt() ->> 'email', coalesce(new.key, old.key),
          case when tg_op <> 'INSERT' then old.value end,
          case when tg_op <> 'DELETE' then new.value end);
  return coalesce(new, old);
end $$;

drop trigger if exists pys_kv_log on public.pys_kv;
create trigger pys_kv_log after insert or update or delete on public.pys_kv
  for each row execute function public.pys_log_change();
