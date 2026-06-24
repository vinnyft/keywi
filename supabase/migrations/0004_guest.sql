-- ============================================================
-- KLAV — Migration 0004 : vue Guest
-- Un bénéficiaire (Guest) ne possède ni les clés ni les codes :
-- cette fonction security definer lui expose uniquement ce qui
-- lui a été partagé (codes actifs rattachés à son email), avec
-- la durée de garde et le coût du dépôt.
-- ============================================================

create or replace function public.guest_mes_cles()
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'code_6',       ac.code_6,
        'qr_payload',   ac.qr_payload,
        'expire_at',    ac.expire_at,
        'logement',     k.logement,
        'cle_statut',   k.statut,
        'commerce',     rp.nom,
        'adresse',      rp.adresse || ', ' || rp.code_postal || ' ' || rp.ville,
        'horaires',     rp.horaires,
        'lat',          rp.lat,
        'lng',          rp.lng,
        -- Dernière arrivée du trousseau au point relais (dépôt ou retour)
        'depose_le', (
          select max(m.created_at) from public.movements m
          where m.key_id = k.id and m.type in ('depot', 'retour')
        ),
        -- Coût du dépôt réglé par l'hôte
        'cout_centimes', (
          select coalesce(sum(p.montant_centimes), 0) from public.paiements p
          where p.key_id = k.id and p.statut = 'paye'
        )
      )
      order by ac.created_at desc
    ),
    '[]'::jsonb
  )
  from public.access_codes ac
  join public.keys k on k.id = ac.key_id
  left join public.relay_points rp on rp.id = k.relay_point_id
  where lower(ac.beneficiaire_email) = lower(auth.jwt() ->> 'email')
    and ac.statut = 'actif'
    and (ac.expire_at is null or ac.expire_at > now());
$$;

revoke execute on function public.guest_mes_cles() from public, anon;
grant execute on function public.guest_mes_cles() to authenticated;
