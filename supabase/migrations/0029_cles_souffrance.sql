-- ============================================================
-- 0029 — Clés en souffrance
-- Une clé qui occupe une case depuis trop longtemps (déposée ou de
-- retour, non récupérée) immobilise une case. Un cron quotidien
-- repère ces clés (> 30 jours par défaut) et prévient le relais +
-- l'admin. Anti-spam par drapeau, avec relance hebdomadaire tant que
-- la clé n'a pas bougé.
-- ============================================================

alter table public.keys
  add column if not exists souffrance_alertee_le timestamptz;

-- ------------------------------------------------------------
-- Détecte, marque et renvoie les clés en souffrance à signaler.
-- SECURITY DEFINER, réservée au cron (service_role).
-- Physiquement présente = statut dans (deposee, prete_retrait, retour)
-- ET rangée dans une case (slot_id renseigné). « Arrivée » = dernier
-- mouvement depot/retour. Re-signalée si l'alerte date de > 7 jours.
-- ------------------------------------------------------------
create or replace function public.verifier_cles_souffrance(p_jours int default 30)
returns table (
  key_id      uuid,
  logement    text,
  relais_nom  text,
  adresse     text,
  ville       text,
  jours       int,
  owner_email text
)
language plpgsql
security definer set search_path = public
as $$
begin
  return query
  with arrivee as (
    select m.key_id, max(m.created_at) as le
    from public.movements m
    where m.type in ('depot', 'retour')
    group by m.key_id
  ),
  souffrantes as (
    select k.id
    from public.keys k
    join arrivee a on a.key_id = k.id
    where k.statut in ('deposee', 'prete_retrait', 'retour')
      and k.slot_id is not null
      and a.le <= now() - make_interval(days => p_jours)
      and (
        k.souffrance_alertee_le is null
        or k.souffrance_alertee_le < now() - interval '7 days'
      )
  ),
  marquees as (
    update public.keys k
    set souffrance_alertee_le = now()
    where k.id in (select id from souffrantes)
    returning k.id, k.logement, k.relay_point_id
  )
  select
    m.id,
    m.logement,
    rp.nom,
    rp.adresse,
    rp.ville,
    (extract(epoch from (now() - a.le)) / 86400)::int,
    po.email
  from marquees m
  join arrivee a on a.key_id = m.id
  left join public.relay_points rp on rp.id = m.relay_point_id
  left join public.profiles po on po.id = rp.owner_id;
end;
$$;

grant execute on function public.verifier_cles_souffrance(int) to service_role;
