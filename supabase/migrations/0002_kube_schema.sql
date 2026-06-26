-- ============================================================
-- KUBE — Migration 0002 : schéma de la plateforme mosaïque
-- Remplace le schéma Keywi précédent.
-- ============================================================

-- Nettoyage du schéma Keywi (si présent)
drop table if exists public.access_codes cascade;
drop table if exists public.movements cascade;
drop table if exists public.keys cascade;
drop table if exists public.slots cascade;
drop table if exists public.relay_points cascade;
drop table if exists public.candidatures_commercants cascade;
drop table if exists public.notifications cascade;
drop table if exists public.payments cascade;
drop table if exists public.profiles cascade;
drop type if exists public.user_role cascade;
drop type if exists public.relay_status cascade;
drop type if exists public.slot_status cascade;
drop type if exists public.key_status cascade;
drop type if exists public.access_code_status cascade;
drop type if exists public.movement_type cascade;
drop type if exists public.candidature_status cascade;
drop type if exists public.paiement_status cascade;

-- ============================================================
-- Enums KUBE
-- ============================================================

create type public.user_role as enum ('client', 'admin');

create type public.order_status as enum (
  'en_attente_paiement',
  'payee',
  'en_production',
  'expediee',
  'livree',
  'annulee'
);

create type public.promo_type as enum (
  'pourcentage',
  'montant_fixe',
  'livraison_gratuite'
);

create type public.color_type as enum ('tile', 'grout');

-- ============================================================
-- Tables
-- ============================================================

-- Profils utilisateurs
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       public.user_role not null default 'client',
  nom        text,
  email      text,
  telephone  text,
  created_at timestamptz not null default now()
);

-- Paramètres globaux (une seule ligne, id = 1)
create table public.settings (
  id                         int primary key default 1 check (id = 1),
  hauteur_fixe_cm            numeric not null default 45,
  cout_fixe                  numeric not null default 50,
  forfait_livraison          numeric not null default 80,
  seuil_livraison_gratuite   numeric,
  dessous_carrelee           boolean not null default false,
  texte_accueil              text not null default 'Le mobilier mosaïque sur-mesure.',
  updated_at                 timestamptz not null default now()
);

-- Paliers de prix par m² selon taille du carreau
create table public.pricing_tiers (
  id             uuid primary key default gen_random_uuid(),
  taille_min_cm  numeric not null,
  taille_max_cm  numeric not null,
  prix_par_m2    numeric not null,
  label          text not null
);

-- Surcharge pour mélange multi-couleurs
create table public.color_surcharges (
  nb_couleurs int primary key check (nb_couleurs between 1 and 4),
  surcharge_pct numeric not null default 0
);

-- Palette de couleurs (carreaux + joint)
create table public.colors (
  id     uuid primary key default gen_random_uuid(),
  nom    text not null,
  hex    text not null,
  type   public.color_type not null,
  ordre  int not null default 0,
  actif  boolean not null default true
);

-- Promotions
create table public.promotions (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  type             public.promo_type not null,
  valeur           numeric not null,
  seuil_montant    numeric,
  seuil_quantite   int,
  date_debut       timestamptz,
  date_fin         timestamptz,
  actif            boolean not null default true,
  usage_unique     boolean not null default false,
  nb_utilisations  int not null default 0,
  description      text,
  created_at       timestamptz not null default now()
);

-- Commandes
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete set null,
  statut             public.order_status not null default 'en_attente_paiement',
  montant_ht         numeric not null,
  montant_ttc        numeric not null,
  promo_id           uuid references public.promotions(id),
  promo_remise       numeric not null default 0,
  stripe_session_id  text unique,
  adresse_livraison  jsonb,
  frais_livraison    numeric not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Lignes de commande (chaque configuration commandée)
create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  config_json      jsonb not null,
  longueur_cm      numeric not null,
  largeur_cm       numeric not null,
  hauteur_cm       numeric not null,
  surface_m2       numeric not null,
  nb_carreaux_total int not null,
  prix_unitaire    numeric not null,
  quantite         int not null default 1
);

-- ============================================================
-- Trigger updated_at sur orders
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- Trigger : créer un profil à l'inscription
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, nom, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom', ''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.color_surcharges enable row level security;
alter table public.colors enable row level security;
alter table public.promotions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Helper : est admin ?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
create policy "Lecture profil propre" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "Mise à jour profil propre" on public.profiles
  for update using (auth.uid() = id);
create policy "Admin : tout" on public.profiles
  for all using (public.is_admin());

-- settings, pricing_tiers, color_surcharges : lecture publique
create policy "Lecture publique settings" on public.settings
  for select using (true);
create policy "Admin settings" on public.settings
  for all using (public.is_admin());

create policy "Lecture publique pricing" on public.pricing_tiers
  for select using (true);
create policy "Admin pricing" on public.pricing_tiers
  for all using (public.is_admin());

create policy "Lecture publique surcharges" on public.color_surcharges
  for select using (true);
create policy "Admin surcharges" on public.color_surcharges
  for all using (public.is_admin());

-- colors : lecture publique pour actifs
create policy "Lecture couleurs actives" on public.colors
  for select using (actif = true or public.is_admin());
create policy "Admin couleurs" on public.colors
  for all using (public.is_admin());

-- promotions : lecture par code (validation client), écriture admin
create policy "Lecture promotions actives" on public.promotions
  for select using (actif = true or public.is_admin());
create policy "Admin promotions" on public.promotions
  for all using (public.is_admin());

-- orders : client voit ses commandes
create policy "Client : ses commandes" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Client : insérer commande" on public.orders
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "Admin orders" on public.orders
  for all using (public.is_admin());

-- order_items
create policy "Client : ses items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where id = order_id and (auth.uid() = user_id or public.is_admin())
    )
  );
create policy "Insérer items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where id = order_id and (auth.uid() = user_id or user_id is null)
    )
  );
create policy "Admin items" on public.order_items
  for all using (public.is_admin());
