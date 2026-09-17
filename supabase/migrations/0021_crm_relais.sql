-- ============================================================
-- 0021 — Mini-CRM du point relais
-- ============================================================
-- Le commerçant tient un carnet de SES clients récurrents (hôtes qui
-- passent souvent, contacts du quartier…), avec notes et dernière
-- visite. C'est distinct du CRM commercial (prospection) : ici c'est
-- le point relais qui gère sa propre relation client.
--
-- Cloisonnement (RLS) : un commerçant ne voit que le carnet rattaché
-- au point relais qu'il possède. L'admin voit tout.
-- ------------------------------------------------------------

create table public.relais_clients (
  id              uuid primary key default gen_random_uuid(),
  relay_point_id  uuid not null references public.relay_points (id) on delete cascade,
  nom             text not null,
  contact         text,           -- téléphone / email, format libre
  notes           text,
  derniere_visite date,
  cree_par        uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_relais_clients_point on public.relais_clients (relay_point_id, nom);

create trigger on_relais_client_updated
  before update on public.relais_clients
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- RLS : réservé au propriétaire du point relais (et à l'admin)
-- ------------------------------------------------------------
alter table public.relais_clients enable row level security;

create policy "relais_clients : lecture (propriétaire du point ou admin)"
  on public.relais_clients for select
  using (public.possede_point_relais(relay_point_id) or public.est_admin());

create policy "relais_clients : création par le propriétaire du point"
  on public.relais_clients for insert
  with check (public.possede_point_relais(relay_point_id) or public.est_admin());

create policy "relais_clients : mise à jour par le propriétaire du point"
  on public.relais_clients for update
  using (public.possede_point_relais(relay_point_id) or public.est_admin())
  with check (public.possede_point_relais(relay_point_id) or public.est_admin());

create policy "relais_clients : suppression par le propriétaire du point"
  on public.relais_clients for delete
  using (public.possede_point_relais(relay_point_id) or public.est_admin());

-- ------------------------------------------------------------
-- Droits (table non exposée d'office)
-- ------------------------------------------------------------
grant select, insert, update, delete on public.relais_clients
  to authenticated, service_role;
