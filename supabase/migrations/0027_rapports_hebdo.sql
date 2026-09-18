-- ============================================================
-- 0027 — Rapports hebdomadaires (envoyés par le cron du lundi)
-- Trois fonctions d'agrégation appelées côté serveur avec la clé
-- service_role (le cron n'a pas d'utilisateur connecté). Elles sont
-- SECURITY DEFINER et réservées à service_role : elles voient toute
-- la base et NE sont PAS exposées aux utilisateurs authentifiés.
-- ============================================================

-- ------------------------------------------------------------
-- Rapport ADMIN : indicateurs globaux des 7 derniers jours
-- ------------------------------------------------------------
create or replace function public.rapport_admin_hebdo()
returns jsonb
language sql stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'nouveaux_relais',
      (select count(*) from public.relay_points
        where statut = 'actif' and created_at >= now() - interval '7 days'),
    'total_relais_actifs',
      (select count(*) from public.relay_points where statut = 'actif'),
    'relais_inactifs',
      (select count(*) from public.relay_points where statut = 'inactif'),
    'candidatures_semaine',
      (select count(*) from public.candidatures_commercants
        where created_at >= now() - interval '7 days'),
    'candidatures_en_attente',
      (select count(*) from public.candidatures_commercants where statut = 'en_attente'),
    'depots_semaine',
      (select count(*) from public.movements
        where type = 'depot' and created_at >= now() - interval '7 days'),
    'retraits_semaine',
      (select count(*) from public.movements
        where type = 'retrait' and created_at >= now() - interval '7 days'),
    'cles_en_depot',
      (select count(*) from public.keys where statut in ('deposee','prete_retrait')),
    'nouveaux_hotes',
      (select count(*) from public.profiles
        where role = 'hote' and created_at >= now() - interval '7 days'),
    'ca_centimes_semaine',
      coalesce((select sum(montant_centimes) from public.paiements
        where statut = 'paye' and created_at >= now() - interval '7 days'), 0)
  );
$$;

-- ------------------------------------------------------------
-- Rapport COMMERCIAL : une ligne par commercial (pipeline 7 jours
-- + objectif du mois). Variante « tous » de rapport_commercial_hebdo,
-- sans filtre auth.uid() puisque appelée par le cron (service_role).
-- ------------------------------------------------------------
create or replace function public.rapport_commercial_hebdo_tous()
returns table (
  commercial_id     uuid,
  commercial_nom    text,
  commercial_email  text,
  prospects_ajoutes bigint,
  contactes         bigint,
  rdv               bigint,
  signes            bigint,
  actifs_total      bigint,
  cible_signes      int
)
language sql stable
security definer set search_path = public
as $$
  with cible as (
    select pr.id, pr.nom, pr.email
    from public.profiles pr
    where pr.role = 'commercial'
  )
  select
    c.id,
    c.nom,
    c.email,
    count(p.*) filter (where p.created_at >= now() - interval '7 days'),
    count(a.*) filter (where a.type in ('appel','visite','email') and a.created_at >= now() - interval '7 days'),
    count(p.*) filter (where p.statut = 'rdv'   and p.updated_at >= now() - interval '7 days'),
    count(p.*) filter (where p.statut = 'signe' and p.updated_at >= now() - interval '7 days'),
    count(p.*) filter (where p.statut = 'actif'),
    coalesce((
      select o.cible_signes from public.objectifs_commerciaux o
      where o.commercial_id = c.id and o.mois = date_trunc('month', now())::date
    ), 0)
  from cible c
  left join public.prospects p on p.commercial_id = c.id
  left join public.prospect_activites a on a.prospect_id = p.id
  group by c.id, c.nom, c.email
  order by c.nom;
$$;

-- ------------------------------------------------------------
-- Rapport RELAIS : une ligne par point relais actif (mouvements de
-- la semaine, clés en gestion, rémunération du mois en cours).
-- Réutilise remuneration_mois() pour le calcul par paliers.
-- ------------------------------------------------------------
create or replace function public.rapport_relais_hebdo_tous()
returns table (
  relay_point_id     uuid,
  relais_nom         text,
  owner_email        text,
  mouvements_semaine bigint,
  cles_en_gestion    bigint,
  ca_mois_centimes   bigint,
  nb_mouvements_mois bigint
)
language sql stable
security definer set search_path = public
as $$
  select
    rp.id,
    rp.nom,
    pr.email,
    (select count(*) from public.movements m
      where m.relay_point_id = rp.id and m.created_at >= now() - interval '7 days'),
    (select count(*) from public.keys k
      where k.relay_point_id = rp.id and k.statut in ('deposee','prete_retrait')),
    coalesce((rm.r ->> 'montant_centimes')::bigint, 0),
    coalesce((rm.r ->> 'nb_mouvements')::bigint, 0)
  from public.relay_points rp
  left join public.profiles pr on pr.id = rp.owner_id
  left join lateral (select public.remuneration_mois(rp.id) as r) rm on true
  where rp.statut = 'actif'
  order by rp.nom;
$$;

-- ------------------------------------------------------------
-- Droits : réservés au cron (service_role). Volontairement PAS
-- accordés à « authenticated » (ces fonctions voient toute la base).
-- ------------------------------------------------------------
grant execute on function public.rapport_admin_hebdo()            to service_role;
grant execute on function public.rapport_commercial_hebdo_tous()  to service_role;
grant execute on function public.rapport_relais_hebdo_tous()      to service_role;
