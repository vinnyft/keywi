-- ============================================================
-- KLAV — Migration 0002 : Row Level Security
-- Un commerçant ne voit que son point relais, un hôte ne voit
-- que ses clés. Le journal des mouvements est en lecture seule.
-- ============================================================

-- ------------------------------------------------------------
-- Fonctions d'aide (security definer pour éviter la récursion
-- des politiques RLS)
-- ------------------------------------------------------------

-- Rôle de l'utilisateur connecté
create or replace function public.get_my_role()
returns public.user_role
language sql stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- L'utilisateur connecté est-il administrateur ?
create or replace function public.est_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select coalesce(public.get_my_role() = 'admin', false);
$$;

-- L'utilisateur connecté possède-t-il ce point relais ?
create or replace function public.possede_point_relais(p_relay_point_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.relay_points
    where id = p_relay_point_id and owner_id = auth.uid()
  );
$$;

-- L'utilisateur connecté est-il l'hôte de cette clé ?
create or replace function public.possede_cle(p_key_id uuid)
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.keys
    where id = p_key_id and hote_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- Activation de RLS sur toutes les tables
-- ------------------------------------------------------------
alter table public.profiles                 enable row level security;
alter table public.relay_points             enable row level security;
alter table public.slots                    enable row level security;
alter table public.keys                     enable row level security;
alter table public.access_codes             enable row level security;
alter table public.movements                enable row level security;
alter table public.notifications            enable row level security;
alter table public.remuneration_paliers     enable row level security;
alter table public.candidatures_commercants enable row level security;
alter table public.paiements                enable row level security;

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create policy "profiles : lecture de son propre profil"
  on public.profiles for select
  using (id = auth.uid() or public.est_admin());

create policy "profiles : mise à jour de son propre profil"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------
-- relay_points : les points actifs sont publics (carte du site),
-- le commerçant gère le sien, l'admin voit tout
-- ------------------------------------------------------------
create policy "relay_points : points actifs visibles par tous"
  on public.relay_points for select
  using (statut = 'actif' or owner_id = auth.uid() or public.est_admin());

create policy "relay_points : le commerçant met à jour son point"
  on public.relay_points for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "relay_points : gestion admin"
  on public.relay_points for all
  using (public.est_admin())
  with check (public.est_admin());

-- ------------------------------------------------------------
-- slots : lecture publique (permet d'afficher la disponibilité
-- sur la carte sans exposer de donnée sensible). Écriture via
-- les fonctions RPC (security definer) ou l'admin uniquement.
-- ------------------------------------------------------------
create policy "slots : lecture publique de la disponibilité"
  on public.slots for select
  using (true);

create policy "slots : gestion admin"
  on public.slots for all
  using (public.est_admin())
  with check (public.est_admin());

-- ------------------------------------------------------------
-- keys : l'hôte gère ses clés, le commerçant voit celles
-- rattachées à son point relais
-- ------------------------------------------------------------
create policy "keys : l'hôte voit ses clés"
  on public.keys for select
  using (
    hote_id = auth.uid()
    or public.possede_point_relais(relay_point_id)
    or public.est_admin()
  );

create policy "keys : l'hôte enregistre ses clés"
  on public.keys for insert
  with check (hote_id = auth.uid());

create policy "keys : l'hôte met à jour ses clés"
  on public.keys for update
  using (hote_id = auth.uid())
  with check (hote_id = auth.uid());

-- ------------------------------------------------------------
-- access_codes : l'hôte gère les codes de ses clés, le
-- commerçant peut les consulter pour le retrait
-- ------------------------------------------------------------
create policy "access_codes : lecture hôte, commerçant ou admin"
  on public.access_codes for select
  using (
    public.possede_cle(key_id)
    or exists (
      select 1 from public.keys k
      where k.id = key_id and public.possede_point_relais(k.relay_point_id)
    )
    or public.est_admin()
  );

create policy "access_codes : l'hôte crée des codes pour ses clés"
  on public.access_codes for insert
  with check (public.possede_cle(key_id));

create policy "access_codes : l'hôte révoque ses codes"
  on public.access_codes for update
  using (public.possede_cle(key_id))
  with check (public.possede_cle(key_id));

-- ------------------------------------------------------------
-- movements : journal en lecture seule (hôte = ses clés,
-- commerçant = son point relais). Les insertions passent par
-- les fonctions RPC security definer.
-- ------------------------------------------------------------
create policy "movements : lecture hôte, commerçant ou admin"
  on public.movements for select
  using (
    public.possede_cle(key_id)
    or public.possede_point_relais(relay_point_id)
    or public.est_admin()
  );

-- ------------------------------------------------------------
-- notifications : chacun ne voit que les siennes
-- ------------------------------------------------------------
create policy "notifications : lecture de ses notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications : marquer comme lue"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- remuneration_paliers : lecture pour tous les connectés
-- ------------------------------------------------------------
create policy "paliers : lecture publique"
  on public.remuneration_paliers for select
  using (true);

create policy "paliers : gestion admin"
  on public.remuneration_paliers for all
  using (public.est_admin())
  with check (public.est_admin());

-- ------------------------------------------------------------
-- candidatures_commercants : dépôt public (formulaire du site),
-- consultation et validation réservées à l'admin
-- ------------------------------------------------------------
create policy "candidatures : dépôt public"
  on public.candidatures_commercants for insert
  with check (true);

create policy "candidatures : lecture admin"
  on public.candidatures_commercants for select
  using (public.est_admin());

create policy "candidatures : validation admin"
  on public.candidatures_commercants for update
  using (public.est_admin())
  with check (public.est_admin());

-- ------------------------------------------------------------
-- paiements : l'hôte voit ses paiements ; création et mise à
-- jour réservées au serveur (service role, hors RLS)
-- ------------------------------------------------------------
create policy "paiements : lecture de ses paiements"
  on public.paiements for select
  using (hote_id = auth.uid() or public.est_admin());

-- ------------------------------------------------------------
-- Droits d'accès (les nouvelles tables ne sont plus exposées
-- automatiquement : on accorde explicitement, RLS filtre les lignes)
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- Authentifiés : accès complet, filtré par RLS
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Anonymes : lecture de la carte et dépôt de candidature uniquement
grant select on public.relay_points, public.slots, public.remuneration_paliers to anon;
grant insert on public.candidatures_commercants to anon;
