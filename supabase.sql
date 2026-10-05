-- K-FIT: tablica + zaštita. Zalijepi cijelo u Supabase → SQL Editor → Run.
create table if not exists public.kdocs (
  col text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);
alter table public.kdocs enable row level security;
alter table public.kdocs replica identity full;

drop policy if exists "kfit_auth_all" on public.kdocs;
create policy "kfit_auth_all" on public.kdocs
  for all to authenticated using (true) with check (true);

-- bez prijave (anon) nema pristupa
revoke all on public.kdocs from anon;
grant select, insert, update, delete on public.kdocs to authenticated;

-- uživo osvježavanje između uređaja
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='kdocs') then
    alter publication supabase_realtime add table public.kdocs;
  end if;
end $$;
