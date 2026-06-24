-- ============================================================
-- KLAV — Migration 0001 : schéma de base
-- Tables, enums et triggers de la plateforme de gestion de
-- clés par points relais.
-- ============================================================

-- Extension pour le hachage des mots de passe du seed (déjà
-- présente sur Supabase, on s'assure qu'elle est disponible)
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

-- Rôle d'un utilisateur de la plateforme
create type public.user_role as enum ('hote', 'voyageur', 'commercant', 'admin');

-- Statut d'un point relais
create type public.relay_status as enum ('actif', 'inactif', 'en_attente');

-- Statut d'une case de rangement
create type public.slot_status as enum ('libre', 'occupee');

-- Cycle de vie d'une clé :
--   en_attente    : enregistrée, dépôt pas encore effectué
--   deposee       : déposée au point relais, aucun code actif
--   prete_retrait : déposée et au moins un code de retrait actif
--   retiree       : retirée par un bénéficiaire
--   retour        : revenue au point relais après un retrait
--   perdue        : déclarée perdue
create type public.key_status as enum
  ('en_attente', 'deposee', 'prete_retrait', 'retiree', 'retour', 'perdue');

-- Statut d'un code de retrait
create type public.access_code_status as enum ('actif', 'utilise', 'revoque', 'expire');

-- Type de mouvement (journal d'audit)
create type public.movement_type as enum ('depot', 'retrait', 'retour');

-- Statut d'une candidature commerçant
create type public.candidature_status as enum ('en_attente', 'validee', 'refusee');

-- Statut de paiement d'une clé
create type public.paiement_status as enum ('en_attente', 'paye', 'offert', 'echoue');

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

-- Profils utilisateurs (miroir de auth.users, enrichi du rôle)
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.user_role not null default 'hote',
  nom         text,
  email       text,
  telephone   text,
  created_at  timestamptz not null default now()
);

-- Points relais (commerces partenaires)
create table public.relay_points (
  id           uuid primary key default gen_random_uuid(),
  nom          text not null,
  adresse      text not null,
  code_postal  text not null,
  ville        text not null default 'Paris',
  lat          double precision not null,
  lng          double precision not null,
  horaires     jsonb not null default '{}'::jsonb,
  capacite     int  not null default 20 check (capacite between 1 and 500),
  owner_id     uuid references public.profiles (id) on delete set null,
  statut       public.relay_status not null default 'en_attente',
  photo_url    text,
  description  text,
  created_at   timestamptz not null default now()
);

-- Cases de rangement d'un point relais
create table public.slots (
  id              uuid primary key default gen_random_uuid(),
  relay_point_id  uuid not null references public.relay_points (id) on delete cascade,
  numero          int  not null,
  statut          public.slot_status not null default 'libre',
  unique (relay_point_id, numero)
);

-- Clés (trousseaux munis d'un badge RFID/NFC)
create table public.keys (
  id                  uuid primary key default gen_random_uuid(),
  badge_uid           text unique,                -- UID NFC lu par scan
  code_badge_imprime  text unique not null,       -- code 8 caractères imprimé sur le badge
  logement            text not null,              -- nom du logement associé
  photo_url           text,
  hote_id             uuid not null references public.profiles (id) on delete cascade,
  relay_point_id      uuid references public.relay_points (id) on delete set null,  -- point relais choisi
  slot_id             uuid references public.slots (id) on delete set null,         -- case actuelle si déposée
  statut              public.key_status not null default 'en_attente',
  paiement_statut     public.paiement_status not null default 'en_attente',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Codes de retrait à 6 caractères (partagés aux bénéficiaires)
create table public.access_codes (
  id                 uuid primary key default gen_random_uuid(),
  key_id             uuid not null references public.keys (id) on delete cascade,
  code_6             text not null unique check (char_length(code_6) = 6),
  qr_payload         text not null,
  beneficiaire_email text,
  beneficiaire_nom   text,
  expire_at          timestamptz,
  statut             public.access_code_status not null default 'actif',
  created_at         timestamptz not null default now()
);

-- Journal d'audit immuable des mouvements de clés
create table public.movements (
  id              uuid primary key default gen_random_uuid(),
  key_id          uuid not null references public.keys (id) on delete cascade,
  relay_point_id  uuid not null references public.relay_points (id) on delete cascade,
  slot_id         uuid references public.slots (id) on delete set null,
  type            public.movement_type not null,
  scanned_by      uuid references public.profiles (id) on delete set null,
  details         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- Centre de notifications in-app (le canal email est envoyé côté serveur)
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null,
  canal       text not null default 'in_app',   -- in_app | email | push | sms (extensible)
  payload     jsonb not null default '{}'::jsonb,
  lu          boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Paliers de rémunération des commerçants (paramétrables)
create table public.remuneration_paliers (
  id                serial primary key,
  seuil_min         int not null,            -- rang du mouvement dans le mois (inclus)
  seuil_max         int,                     -- null = illimité
  montant_centimes  int not null
);

-- Candidatures « Devenir point relais »
create table public.candidatures_commercants (
  id           uuid primary key default gen_random_uuid(),
  nom_commerce text not null,
  nom_contact  text not null,
  email        text not null,
  telephone    text,
  adresse      text not null,
  code_postal  text not null,
  ville        text not null default 'Paris',
  message      text,
  statut       public.candidature_status not null default 'en_attente',
  created_at   timestamptz not null default now()
);

-- Paiements Stripe (mode test)
create table public.paiements (
  id                 uuid primary key default gen_random_uuid(),
  hote_id            uuid not null references public.profiles (id) on delete cascade,
  key_id             uuid references public.keys (id) on delete set null,
  stripe_session_id  text unique,
  type               text not null default 'depot_unitaire',  -- depot_unitaire | abonnement
  montant_centimes   int not null default 0,
  statut             public.paiement_status not null default 'en_attente',
  created_at         timestamptz not null default now()
);

-- Index utiles aux requêtes fréquentes
create index idx_slots_relay on public.slots (relay_point_id, statut);
create index idx_keys_hote on public.keys (hote_id);
create index idx_keys_relay on public.keys (relay_point_id);
create index idx_access_codes_key on public.access_codes (key_id);
create index idx_movements_key on public.movements (key_id, created_at desc);
create index idx_movements_relay on public.movements (relay_point_id, created_at desc);
create index idx_notifications_user on public.notifications (user_id, created_at desc);

-- ------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------

-- Création automatique du profil à l'inscription (Supabase Auth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nom', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'hote')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Génération automatique des cases à la création d'un point relais
-- (et ajout de cases si la capacité augmente)
create or replace function public.generer_cases()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.slots (relay_point_id, numero)
  select new.id, n
  from generate_series(1, new.capacite) as n
  where not exists (
    select 1 from public.slots s
    where s.relay_point_id = new.id and s.numero = n
  );
  return new;
end;
$$;

create trigger on_relay_point_created
  after insert on public.relay_points
  for each row execute function public.generer_cases();

create trigger on_relay_point_capacite
  after update of capacite on public.relay_points
  for each row
  when (new.capacite > old.capacite)
  execute function public.generer_cases();

-- Horodatage de mise à jour des clés
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger on_key_updated
  before update on public.keys
  for each row execute function public.touch_updated_at();

-- Le journal des mouvements est immuable : ni update, ni delete
create or replace function public.refuser_modification()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Le journal des mouvements est immuable (%).', tg_op;
end;
$$;

create trigger movements_immuables
  before update or delete on public.movements
  for each row execute function public.refuser_modification();

-- ------------------------------------------------------------
-- Publication Realtime : le site et l'app commerçant écoutent
-- ces tables pour la synchronisation instantanée
-- ------------------------------------------------------------
alter publication supabase_realtime add table
  public.keys, public.slots, public.movements, public.notifications;
