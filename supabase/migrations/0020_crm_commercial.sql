-- ============================================================
-- 0020 — CRM commercial (prospection des points relais)
-- ============================================================
-- Environnement des commerciaux : chacun gère SES prospects (points
-- relais à démarcher), fait avancer un pipeline et journalise son
-- activité. L'admin voit tout et suit les chiffres (report hebdo).
--
-- Cloisonnement (RLS) : un commercial ne voit que les lignes dont il
-- est propriétaire (commercial_id = auth.uid()). L'admin voit tout.
-- ------------------------------------------------------------

-- Étape du pipeline de prospection
create type public.statut_prospect as enum
  ('a_contacter', 'contacte', 'rdv', 'signe', 'actif', 'perdu');

-- Nature d'une activité journalisée sur un prospect
create type public.type_activite as enum
  ('note', 'appel', 'visite', 'email', 'relance');

-- ------------------------------------------------------------
-- Aide RLS : l'utilisateur connecté est-il commercial ?
-- ------------------------------------------------------------
create or replace function public.est_commercial()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(public.get_my_role() = 'commercial', false);
$$;

-- ------------------------------------------------------------
-- prospects : fiche d'un point relais à démarcher
-- ------------------------------------------------------------
create table public.prospects (
  id             uuid primary key default gen_random_uuid(),
  nom_commerce   text not null,
  adresse        text,
  code_postal    text,
  ville          text not null default 'Paris',
  arrondissement int check (arrondissement between 1 and 20),
  contact_nom    text,
  contact_email  text,
  contact_tel    text,
  statut         public.statut_prospect not null default 'a_contacter',
  commercial_id  uuid references public.profiles (id) on delete set null,
  relay_point_id uuid references public.relay_points (id) on delete set null, -- rempli à la signature
  source         text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_prospects_commercial on public.prospects (commercial_id, statut);
create index idx_prospects_statut on public.prospects (statut, created_at desc);

create trigger on_prospect_updated
  before update on public.prospects
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- prospect_activites : journal d'activité (appels, visites, notes…)
-- ------------------------------------------------------------
create table public.prospect_activites (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references public.prospects (id) on delete cascade,
  auteur_id    uuid references public.profiles (id) on delete set null,
  type         public.type_activite not null default 'note',
  contenu      text not null,
  created_at   timestamptz not null default now()
);

create index idx_prospect_activites_prospect
  on public.prospect_activites (prospect_id, created_at desc);

-- ------------------------------------------------------------
-- objectifs_commerciaux : cible mensuelle par commercial
-- ------------------------------------------------------------
create table public.objectifs_commerciaux (
  id             uuid primary key default gen_random_uuid(),
  commercial_id  uuid not null references public.profiles (id) on delete cascade,
  mois           date not null,                 -- 1er jour du mois visé
  cible_signes   int not null default 0 check (cible_signes >= 0),
  cible_contacts int not null default 0 check (cible_contacts >= 0),
  created_at     timestamptz not null default now(),
  unique (commercial_id, mois)
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.prospects            enable row level security;
alter table public.prospect_activites   enable row level security;
alter table public.objectifs_commerciaux enable row level security;

-- prospects : le commercial gère les siens, l'admin gère tout
create policy "prospects : lecture (propriétaire ou admin)"
  on public.prospects for select
  using (commercial_id = auth.uid() or public.est_admin());

create policy "prospects : création par un commercial ou l'admin"
  on public.prospects for insert
  with check (
    (public.est_commercial() and commercial_id = auth.uid())
    or public.est_admin()
  );

create policy "prospects : mise à jour (propriétaire ou admin)"
  on public.prospects for update
  using (commercial_id = auth.uid() or public.est_admin())
  with check (commercial_id = auth.uid() or public.est_admin());

create policy "prospects : suppression admin"
  on public.prospects for delete
  using (public.est_admin());

-- prospect_activites : visibles si le prospect parent l'est
create policy "activités : lecture si prospect visible"
  on public.prospect_activites for select
  using (
    public.est_admin()
    or exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.commercial_id = auth.uid()
    )
  );

create policy "activités : ajout si prospect accessible"
  on public.prospect_activites for insert
  with check (
    public.est_admin()
    or exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.commercial_id = auth.uid()
    )
  );

-- objectifs : le commercial voit les siens ; l'admin gère tout
create policy "objectifs : lecture (propriétaire ou admin)"
  on public.objectifs_commerciaux for select
  using (commercial_id = auth.uid() or public.est_admin());

create policy "objectifs : gestion admin"
  on public.objectifs_commerciaux for all
  using (public.est_admin())
  with check (public.est_admin());

-- ------------------------------------------------------------
-- Report hebdomadaire : agrégats des 7 derniers jours par commercial.
-- security definer → contourne RLS, donc on filtre nous-mêmes :
--   admin  → tous les commerciaux
--   sinon  → uniquement l'appelant
-- ------------------------------------------------------------
create or replace function public.rapport_commercial_hebdo()
returns table (
  commercial_id     uuid,
  commercial_nom    text,
  prospects_ajoutes bigint,
  contactes         bigint,
  rdv               bigint,
  signes            bigint,
  actifs_total      bigint
)
language sql stable
security definer set search_path = public
as $$
  with cible as (
    select pr.id, pr.nom
    from public.profiles pr
    where pr.role = 'commercial'
      and (public.est_admin() or pr.id = auth.uid())
  )
  select
    c.id,
    c.nom,
    count(p.*) filter (where p.created_at >= now() - interval '7 days')                    as prospects_ajoutes,
    count(a.*) filter (where a.type in ('appel','visite','email') and a.created_at >= now() - interval '7 days') as contactes,
    count(p.*) filter (where p.statut = 'rdv'  and p.updated_at >= now() - interval '7 days') as rdv,
    count(p.*) filter (where p.statut = 'signe' and p.updated_at >= now() - interval '7 days') as signes,
    count(p.*) filter (where p.statut = 'actif')                                            as actifs_total
  from cible c
  left join public.prospects p on p.commercial_id = c.id
  left join public.prospect_activites a on a.prospect_id = p.id
  group by c.id, c.nom
  order by c.nom;
$$;

-- ------------------------------------------------------------
-- Droits (les nouvelles tables ne sont pas exposées d'office)
-- ------------------------------------------------------------
grant select, insert, update, delete
  on public.prospects, public.prospect_activites, public.objectifs_commerciaux
  to authenticated, service_role;
grant execute on function public.est_commercial() to authenticated, service_role;
grant execute on function public.rapport_commercial_hebdo() to authenticated, service_role;
