-- K-FIT KLIJENTSKA APP — Supabase → SQL Editor → zalijepi cijelo → Run.
-- VAŽNO: pokreni OVO PRIJE nego ijedan klijent napravi račun.
-- Korak 1 upisuje sve trenutne korisnike (tj. tebe) kao trenere.

-- 1) TRENERI ------------------------------------------------------------
create table if not exists public.kfit_coaches (
  user_id uuid primary key references auth.users(id) on delete cascade
);
-- upisuje se samo kod PRVOG pokretanja (dok je tablica prazna), pa ponovno pokretanje
-- skripte nikad ne pretvori klijente u trenere.
insert into public.kfit_coaches(user_id)
  select id from auth.users where not exists (select 1 from public.kfit_coaches)
  on conflict do nothing;

create or replace function public.kfit_is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.kfit_coaches where user_id = auth.uid())
$$;

-- 2) POSTOJEĆA TRENERSKA BAZA (kdocs) — od sada SAMO trener -------------
-- Prije je pravilo bilo "svaki prijavljeni korisnik vidi sve".
-- Kad klijenti dobiju račune, to bi im otkrilo sve klijente i uplate.
drop policy if exists "kfit_auth_all" on public.kdocs;
drop policy if exists "kfit_coach_all" on public.kdocs;
create policy "kfit_coach_all" on public.kdocs
  for all to authenticated using (public.kfit_is_coach()) with check (public.kfit_is_coach());

-- 3) VEZA račun ↔ klijent iz evidencije ---------------------------------
create table if not exists public.kfit_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  client_id text not null unique,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.kfit_my_client() returns text
language sql stable security definer set search_path = public as $$
  select client_id from public.kfit_links where user_id = auth.uid()
$$;

-- 4) PROGRAM (piše trener, čita klijent) --------------------------------
create table if not exists public.kfit_programs (
  client_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 5) DNEVNIK KLIJENTA (treninzi, voda, težina, koraci, check-in) -------
create table if not exists public.kfit_logs (
  client_id text not null,
  id text not null,
  kind text not null,          -- workout | water | weight | steps | checkin
  day date not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (client_id, id)
);
create index if not exists kfit_logs_day on public.kfit_logs(client_id, day desc);

-- 6) ZAŠTITA ------------------------------------------------------------
alter table public.kfit_coaches  enable row level security;
alter table public.kfit_links    enable row level security;
alter table public.kfit_programs enable row level security;
alter table public.kfit_logs     enable row level security;

drop policy if exists "c_self" on public.kfit_coaches;
create policy "c_self" on public.kfit_coaches for select to authenticated using (user_id = auth.uid());

drop policy if exists "l_read" on public.kfit_links;
create policy "l_read" on public.kfit_links for select to authenticated
  using (user_id = auth.uid() or public.kfit_is_coach());
drop policy if exists "l_coach_del" on public.kfit_links;
create policy "l_coach_del" on public.kfit_links for delete to authenticated using (public.kfit_is_coach());

drop policy if exists "p_read" on public.kfit_programs;
create policy "p_read" on public.kfit_programs for select to authenticated
  using (public.kfit_is_coach() or client_id = public.kfit_my_client());
drop policy if exists "p_coach" on public.kfit_programs;
create policy "p_coach" on public.kfit_programs for all to authenticated
  using (public.kfit_is_coach()) with check (public.kfit_is_coach());

drop policy if exists "g_all" on public.kfit_logs;
create policy "g_all" on public.kfit_logs for all to authenticated
  using (public.kfit_is_coach() or client_id = public.kfit_my_client())
  with check (public.kfit_is_coach() or client_id = public.kfit_my_client());

revoke all on public.kfit_coaches, public.kfit_links, public.kfit_programs, public.kfit_logs from anon;
grant select on public.kfit_coaches to authenticated;
grant select, delete on public.kfit_links to authenticated;
grant select, insert, update, delete on public.kfit_programs, public.kfit_logs to authenticated;

-- 7) POVEZIVANJE: klijent se registrira emailom koji si upisao u evidenciju
create or replace function public.kfit_claim() returns json
language plpgsql security definer set search_path = public as $$
declare em text; conf timestamptz; cid text;
begin
  if auth.uid() is null then return json_build_object('role','anon'); end if;
  if public.kfit_is_coach() then return json_build_object('role','coach'); end if;
  select client_id into cid from public.kfit_links where user_id = auth.uid();
  if cid is null then
    select lower(trim(email)), email_confirmed_at into em, conf from auth.users where id = auth.uid();
    if conf is null then return json_build_object('role','unconfirmed'); end if;
    select k.id into cid from public.kdocs k
      where k.col = 'clients' and lower(trim(k.data->>'em')) = em
        and coalesce((k.data->>'ar')::text,'') not in ('true','1')
        and not exists (select 1 from public.kfit_links l where l.client_id = k.id)
      order by k.updated_at desc limit 1;
    if cid is null then return json_build_object('role','none','email',em); end if;
    insert into public.kfit_links(user_id, client_id, email) values (auth.uid(), cid, em);
  end if;
  return json_build_object('role','client','client_id',cid);
end $$;

-- 8) PODACI IZ EVIDENCIJE KOJE KLIJENT SMIJE VIDJETI (bez uplata i bilješki)
create or replace function public.kfit_me() returns json
language plpgsql stable security definer set search_path = public as $$
declare cid text := public.kfit_my_client();
begin
  if cid is null then return null; end if;
  return json_build_object(
    'client', (select jsonb_build_object('f',data->>'f','l',data->>'l','goal',data->>'goal','sd',data->>'sd')
               from public.kdocs where col='clients' and id=cid),
    'packs', (select coalesce(jsonb_agg(jsonb_build_object(
                 'n',k.data->>'n','t',k.data->'t','s',k.data->>'s','e',k.data->>'e',
                 'used',(select count(*) from public.kdocs t where t.col='trainings'
                         and t.data->>'k'=k.id and t.data->>'s'='Odrađeno'))
               order by k.data->>'s' desc),'[]'::jsonb)
              from public.kdocs k where k.col='packs' and k.data->>'c'=cid),
    'trainings', (select coalesce(jsonb_agg(jsonb_build_object('d',data->>'d','tm',data->>'tm','du',data->'du','s',data->>'s')
                    order by data->>'d', data->>'tm'),'[]'::jsonb)
                  from public.kdocs where col='trainings' and data->>'c'=cid
                    and data->>'d' >= to_char(current_date - 60,'YYYY-MM-DD'))
  );
end $$;

revoke all on function public.kfit_claim(), public.kfit_me() from anon, public;
grant execute on function public.kfit_claim(), public.kfit_me(), public.kfit_is_coach(), public.kfit_my_client() to authenticated;

-- 9) uživo osvježavanje (trener vidi unose klijenta odmah)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='kfit_logs') then
    alter publication supabase_realtime add table public.kfit_logs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='kfit_programs') then
    alter publication supabase_realtime add table public.kfit_programs;
  end if;
end $$;

-- 10) UPITNIK PRI PRVOJ PRIJAVI ---------------------------------------
-- Prijava sad vraća i je li klijent ispunio upitnik. Klijent kojeg nema u
-- evidenciji dobiva ulogu 'new' i nakon upitnika se sam kreira kao novi klijent.
create or replace function public.kfit_claim() returns json
language plpgsql security definer set search_path = public as $$
declare em text; conf timestamptz; cid text; d jsonb;
begin
  if auth.uid() is null then return json_build_object('role','anon'); end if;
  if public.kfit_is_coach() then return json_build_object('role','coach'); end if;
  select lower(trim(email)), email_confirmed_at into em, conf from auth.users where id = auth.uid();
  select client_id into cid from public.kfit_links where user_id = auth.uid();
  if cid is null then
    if conf is null then return json_build_object('role','unconfirmed'); end if;
    select k.id into cid from public.kdocs k
      where k.col = 'clients' and lower(trim(k.data->>'em')) = em
        and coalesce((k.data->>'ar')::text,'') not in ('true','1')
        and not exists (select 1 from public.kfit_links l where l.client_id = k.id)
      order by k.updated_at desc limit 1;
    if cid is null then return json_build_object('role','new','email',em); end if;
    insert into public.kfit_links(user_id, client_id, email) values (auth.uid(), cid, em);
  end if;
  select data into d from public.kdocs where col = 'clients' and id = cid;
  return json_build_object('role','client','client_id',cid,'email',em,
    'onboarded', coalesce(d ? 'upitnik', false),
    'pre', jsonb_build_object('f',d->>'f','l',d->>'l','tel',d->>'tel','bd',d->>'bd','goal',d->>'goal','loc',d->>'adr'));
end $$;

create or replace function public.kfit_onboard(q jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare
  em text; conf timestamptz; cid text; d jsonb; v text; k text; isnew boolean := false;
  clean jsonb := '{}'::jsonb;
  ts text := to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"');
  dt text := to_char(now() at time zone 'Europe/Zagreb','YYYY-MM-DD');
  mon text := to_char(now() at time zone 'Europe/Zagreb','YYYY-MM');
begin
  if auth.uid() is null then raise exception 'Nisi prijavljen.'; end if;
  if public.kfit_is_coach() then raise exception 'Trener ne ispunjava upitnik.'; end if;
  select lower(trim(email)), email_confirmed_at into em, conf from auth.users where id = auth.uid();
  if conf is null then raise exception 'Email još nije potvrđen.'; end if;
  if q is null or jsonb_typeof(q) <> 'object' then raise exception 'Neispravan upitnik.'; end if;
  -- prihvaćaju se samo poznata polja, najviše 1000 znakova po polju
  foreach k in array array['f','l','tel','bd','loc','age','h','kg','goal','inj','meals','kcal','sup','alc','sleep','stress','steps','tpw','waist','belly','hips','thigh','arm','ok'] loop
    v := left(trim(coalesce(q->>k,'')),1000);
    if v <> '' then clean := clean || jsonb_build_object(k, v); end if;
  end loop;
  if coalesce(clean->>'f','') = '' then raise exception 'Upiši ime.'; end if;
  if coalesce(clean->>'ok','') <> 'da' then raise exception 'Potrebna je privola za obradu podataka.'; end if;
  clean := clean || jsonb_build_object('em', em, 'ts', ts);

  select client_id into cid from public.kfit_links where user_id = auth.uid();
  if cid is null then
    select k2.id into cid from public.kdocs k2
      where k2.col = 'clients' and lower(trim(k2.data->>'em')) = em
        and coalesce((k2.data->>'ar')::text,'') not in ('true','1')
        and not exists (select 1 from public.kfit_links l where l.client_id = k2.id)
      order by k2.updated_at desc limit 1;
  end if;
  if cid is not null then select data into d from public.kdocs where col = 'clients' and id = cid; end if;

  if d is null then
    isnew := true;
    if cid is null then cid := 'a' || substr(md5(random()::text || clock_timestamp()::text), 1, 8); end if;
    d := jsonb_build_object('id',cid,'f',clean->>'f','l',coalesce(clean->>'l',''),'tel',coalesce(clean->>'tel',''),
      'em',em,'adr',coalesce(clean->>'loc',''),'bd',coalesce(clean->>'bd',''),'sd',dt,'sv','Online coaching','goal',coalesce(clean->>'goal',''),
      'st','Aktivan','photo','','notes','[]'::jsonb);
  else
    -- postojeći klijent: popuni samo prazna polja, trenerove podatke ne diraj
    d := d || jsonb_strip_nulls(jsonb_build_object(
      'tel',  case when coalesce(d->>'tel','')  = '' then clean->>'tel'  end,
      'bd',   case when coalesce(d->>'bd','')   = '' then clean->>'bd'   end,
      'goal', case when coalesce(d->>'goal','') = '' then clean->>'goal' end,
      'adr',  case when coalesce(d->>'adr','')  = '' then clean->>'loc'  end));
  end if;
  d := d || jsonb_build_object('upitnik', clean, 'notes',
    coalesce(d->'notes','[]'::jsonb) || jsonb_build_array(jsonb_build_object('ts', ts,
      'txt', left(coalesce(nullif(trim(q->>'txt'),''), 'Upitnik ispunjen u aplikaciji'), 4000))));

  insert into public.kdocs(col,id,data,updated_at) values ('clients',cid,d,now())
    on conflict (col,id) do update set data = excluded.data, updated_at = now();
  insert into public.kfit_links(user_id,client_id,email) values (auth.uid(),cid,em)
    on conflict (user_id) do nothing;

  -- zapis u povijest promjena K-FIT evidencije
  insert into public.kdocs(col,id,data,updated_at)
    values ('log', mon, jsonb_build_object('id',mon,'e',jsonb_build_array(jsonb_build_object('ts',ts,'c',cid,
      'x', case when isnew then 'Klijent dodan (upitnik iz aplikacije)' else 'Upitnik ispunjen u aplikaciji' end))), now())
    on conflict (col,id) do update
      set data = jsonb_set(kdocs.data, '{e}', coalesce(kdocs.data->'e','[]'::jsonb) || (excluded.data->'e')), updated_at = now();

  -- početna težina u dnevnik
  if replace(coalesce(clean->>'kg',''),',','.') ~ '^\d{2,3}(\.\d+)?$' then
    insert into public.kfit_logs(client_id,id,kind,day,data)
      values (cid, 'weight-'||dt, 'weight', dt::date, jsonb_build_object('kg', replace(clean->>'kg',',','.')::numeric))
      on conflict (client_id,id) do update set data = excluded.data, updated_at = now();
  end if;
  -- početne mjere u dnevnik
  if clean ?| array['waist','belly','hips','thigh','arm'] then
    insert into public.kfit_logs(client_id,id,kind,day,data)
      values (cid, 'measure-'||dt, 'measure', dt::date, jsonb_strip_nulls(jsonb_build_object(
        'waist',clean->>'waist','belly',clean->>'belly','hips',clean->>'hips','thigh',clean->>'thigh','arm',clean->>'arm')))
      on conflict (client_id,id) do update set data = excluded.data, updated_at = now();
  end if;
  return json_build_object('role','client','client_id',cid,'new',isnew);
end $$;

revoke all on function public.kfit_claim(), public.kfit_onboard(jsonb) from anon, public;
grant execute on function public.kfit_claim(), public.kfit_onboard(jsonb) to authenticated;

-- 11) FOTOGRAFIJE (privatni spremnik) ---------------------------------
-- Putanja: <client_id>/<naziv>.jpg. Klijent vidi i šalje samo u svoju mapu,
-- trener vidi sve. Spremnik nije javan: slike se otvaraju privremenim linkom.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('kfit-photos', 'kfit-photos', false, 6291456, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kfit_ph_coach" on storage.objects;
create policy "kfit_ph_coach" on storage.objects for all to authenticated
  using (bucket_id = 'kfit-photos' and public.kfit_is_coach())
  with check (bucket_id = 'kfit-photos' and public.kfit_is_coach());
drop policy if exists "kfit_ph_client_read" on storage.objects;
create policy "kfit_ph_client_read" on storage.objects for select to authenticated
  using (bucket_id = 'kfit-photos' and (storage.foldername(name))[1] = public.kfit_my_client());
drop policy if exists "kfit_ph_client_add" on storage.objects;
create policy "kfit_ph_client_add" on storage.objects for insert to authenticated
  with check (bucket_id = 'kfit-photos' and (storage.foldername(name))[1] = public.kfit_my_client());

-- 12) PRISTUP KORISNIČKIM IMENOM ---------------------------------------
-- Trener klijentu otvara račun (korisničko ime + lozinka), daje novu lozinku
-- kad je klijent zaboravi i može ukinuti pristup. Korisničko ime se interno
-- sprema kao <ime>@k-fit.local (na tu adresu se nikad ništa ne šalje).
create extension if not exists pgcrypto with schema extensions;

create or replace function public.kfit_acc_create(cid text, uname text, pw text) returns json
language plpgsql security definer set search_path = public, extensions, auth as $$
declare u text := lower(trim(uname)); em text; uid uuid := gen_random_uuid();
begin
  if not public.kfit_is_coach() then raise exception 'Samo trener može otvarati pristup.'; end if;
  if u !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then raise exception 'Korisničko ime: 3–30 znakova, mala slova, brojke, točka, crtica.'; end if;
  if length(coalesce(pw,'')) < 8 then raise exception 'Lozinka mora imati barem 8 znakova.'; end if;
  if not exists (select 1 from public.kdocs where col='clients' and id=cid) then raise exception 'Klijent ne postoji u evidenciji.'; end if;
  if exists (select 1 from public.kfit_links where client_id=cid) then raise exception 'Klijent već ima pristup — koristi „Nova lozinka”.'; end if;
  em := u || '@k-fit.local';
  if exists (select 1 from auth.users where lower(email)=em) then raise exception 'Korisničko ime je zauzeto.'; end if;
  insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
      raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
    values ('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',em,crypt(pw,gen_salt('bf')),now(),
      '{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('username',u),now(),now(),'','','','');
  insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
    values (gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',em,'email_verified',true),'email',now(),now(),now());
  insert into public.kfit_links(user_id,client_id,email) values (uid,cid,em);
  return json_build_object('username',u,'email',em);
end $$;

create or replace function public.kfit_acc_reset(cid text, pw text) returns json
language plpgsql security definer set search_path = public, extensions, auth as $$
declare uid uuid; em text;
begin
  if not public.kfit_is_coach() then raise exception 'Samo trener može mijenjati lozinke.'; end if;
  if length(coalesce(pw,'')) < 8 then raise exception 'Lozinka mora imati barem 8 znakova.'; end if;
  select user_id, email into uid, em from public.kfit_links where client_id=cid;
  if uid is null then raise exception 'Klijent još nema pristup.'; end if;
  update auth.users set encrypted_password=crypt(pw,gen_salt('bf')), email_confirmed_at=coalesce(email_confirmed_at,now()), updated_at=now() where id=uid;
  begin delete from auth.sessions where user_id=uid; exception when others then null; end;  -- odjavi stare prijave
  return json_build_object('email',em);
end $$;

create or replace function public.kfit_acc_remove(cid text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.kfit_is_coach() then raise exception 'Samo trener može ukinuti pristup.'; end if;
  select user_id into uid from public.kfit_links where client_id=cid;
  if uid is null then return json_build_object('ok',true); end if;
  if exists (select 1 from public.kfit_coaches where user_id=uid) then raise exception 'To je trenerski račun.'; end if;
  delete from auth.users where id=uid;   -- veza se briše sama; program i dnevnik klijenta ostaju
  return json_build_object('ok',true);
end $$;

revoke all on function public.kfit_acc_create(text,text,text), public.kfit_acc_reset(text,text), public.kfit_acc_remove(text) from anon, public;
grant execute on function public.kfit_acc_create(text,text,text), public.kfit_acc_reset(text,text), public.kfit_acc_remove(text) to authenticated;
