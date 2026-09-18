-- ============================================================
-- 0028 — Alerte de capacité des points relais
-- Quand un relais dépasse 80 % de cases occupées, on prévient
-- l'admin + le commercial signataire (+ le relais) pour planifier la
-- pose d'une nouvelle boîte à clés et de badges. Détection par un
-- cron quotidien, avec un drapeau anti-spam (on n'alerte qu'une fois
-- par franchissement ; réarmement quand l'occupation retombe < 70 %).
-- ============================================================

-- Drapeau : date de la dernière alerte de capacité (null = pas alerté)
alter table public.relay_points
  add column if not exists capacite_alertee_le timestamptz;

-- ------------------------------------------------------------
-- Détecte, marque et renvoie les relais à alerter. SECURITY
-- DEFINER, réservée au cron (service_role). Idempotente : un relais
-- déjà alerté n'est pas renvoyé tant qu'il n'est pas repassé < 70 %.
-- ------------------------------------------------------------
create or replace function public.verifier_capacite_relais()
returns table (
  relay_point_id   uuid,
  relais_nom       text,
  adresse          text,
  ville            text,
  capacite         int,
  occupees         bigint,
  pourcent         int,
  owner_email      text,
  commercial_email text,
  commercial_nom   text
)
language plpgsql
security definer set search_path = public
as $$
begin
  -- Réarmement : un relais redescendu sous 70 % pourra ré-alerter
  update public.relay_points rp
  set capacite_alertee_le = null
  where rp.statut = 'actif'
    and rp.capacite_alertee_le is not null
    and (
      select count(*) from public.slots s
      where s.relay_point_id = rp.id and s.statut = 'occupee'
    ) < 0.70 * rp.capacite;

  -- Détection (≥ 80 % et pas encore alerté), marquage, puis renvoi
  return query
  with a_alerter as (
    select rp.id
    from public.relay_points rp
    where rp.statut = 'actif'
      and rp.capacite_alertee_le is null
      and (
        select count(*) from public.slots s
        where s.relay_point_id = rp.id and s.statut = 'occupee'
      ) >= 0.80 * rp.capacite
  ),
  marquees as (
    update public.relay_points rp
    set capacite_alertee_le = now()
    where rp.id in (select id from a_alerter)
    returning rp.id, rp.nom, rp.adresse, rp.ville, rp.capacite,
              rp.owner_id, rp.commercial_id
  ),
  compte as (
    select m.*,
      (select count(*) from public.slots s
        where s.relay_point_id = m.id and s.statut = 'occupee') as occ
    from marquees m
  )
  select
    c.id, c.nom, c.adresse, c.ville, c.capacite,
    c.occ,
    round(100.0 * c.occ / nullif(c.capacite, 0))::int,
    po.email, pc.email, pc.nom
  from compte c
  left join public.profiles po on po.id = c.owner_id
  left join public.profiles pc on pc.id = c.commercial_id;
end;
$$;

grant execute on function public.verifier_capacite_relais() to service_role;
