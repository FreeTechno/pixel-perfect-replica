-- Rôles
create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Lire son propre rôle" on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- Le tout premier compte créé devient administrateur ; les suivants n'ont aucun droit.
create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(424242);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
  for each row execute function public.assign_first_admin();

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;
grant execute on function public.admin_exists() to anon, authenticated;

-- Données réelles (aucune donnée de démonstration n'est stockée ici)
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text,
  created_at timestamptz not null default now()
);
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete restrict,
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  kickoff timestamptz not null,
  status text not null default 'à venir' check (status in ('à venir','en cours','terminé','reporté')),
  source text not null default 'Import CSV',
  stats_available boolean not null default false,
  home_score int,
  away_score int,
  created_at timestamptz not null default now(),
  unique (home_team_id, away_team_id, kickoff)
);
create table public.team_match_stats (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  match_date date not null,
  opponent text not null,
  venue text not null check (venue in ('D','E')),
  goals_for int not null,
  goals_against int not null,
  source text not null default 'Import',
  unique (team_id, match_date, opponent)
);
create table public.historical_results (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  home_team text not null,
  away_team text not null,
  home_goals int not null,
  away_goals int not null,
  competition text,
  unique (match_date, home_team, away_team)
);
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  status text not null default 'brouillon' check (status in ('brouillon','à vérifier','validée','rejetée','publiée')),
  selection text not null default '',
  summary text not null default '',
  notes jsonb not null default '[]'::jsonb,
  outcome text check (outcome in ('réussie','échouée')),
  updated_at timestamptz not null default now()
);
create table public.pdf_reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  publication_date date not null,
  cover_color text not null,
  analysis_ids uuid[] not null default '{}',
  file_name text not null,
  status text not null default 'généré' check (status in ('généré','publié')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  level text not null check (level in ('info','erreur')),
  message text not null
);

do $$
declare t text;
begin
  foreach t in array array['competitions','teams','matches','team_match_stats','historical_results','analyses','pdf_reports','sync_logs'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Admin lecture" on public.%I for select to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "Admin ajout" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "Admin modification" on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "Admin suppression" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;