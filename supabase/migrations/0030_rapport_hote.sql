-- ============================================================
-- 0030 — Récap hebdomadaire à chaque propriétaire de clé (hôte)
-- Chaque semaine, l'hôte reçoit l'état de ses clés « en cours »
-- (déposée / prête au retrait / de retour), avec le dernier mouvement
-- (quand + où) et un indicateur « en retard » (échéance dépassée).
-- Une ligne par clé, agrégée par email d'hôte côté cron.
-- ============================================================

create or replace function public.rapport_hote_hebdo_tous()
returns table (
  hote_email         text,
  hote_nom           text,
  logement           text,
  statut             text,
  relais_nom         text,
  relais_ville       text,
  derniere_action    text,
  derniere_action_le timestamptz,
  en_retard          boolean
)
language sql stable
security definer set search_path = public
as $$
  select
    pr.email,
    pr.nom,
    k.logement,
    k.statut::text,
    rp.nom,
    rp.ville,
    dm.type::text,
    dm.created_at,
    (
      k.date_retour_attendue is not null
      and k.date_retour_attendue < now()
      and k.statut <> 'retiree'
    )
  from public.keys k
  join public.profiles pr on pr.id = k.hote_id
  left join public.relay_points rp on rp.id = k.relay_point_id
  left join lateral (
    select m.type, m.created_at
    from public.movements m
    where m.key_id = k.id
    order by m.created_at desc
    limit 1
  ) dm on true
  where k.statut in ('deposee', 'prete_retrait', 'retour')
    and pr.email is not null
  order by pr.email, k.logement;
$$;

grant execute on function public.rapport_hote_hebdo_tous() to service_role;
