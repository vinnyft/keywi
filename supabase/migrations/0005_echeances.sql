-- ============================================================
-- Keywi — Migration 0005 : échéances de retour
-- L'hôte peut fixer une date de retour attendue sur une clé.
-- Passée cette date, la clé est « en retard » : relance email
-- automatique + notification in-app (une seule fois par échéance).
-- ============================================================

alter table public.keys
  add column if not exists date_retour_attendue timestamptz,
  add column if not exists retard_notifie boolean not null default false;

comment on column public.keys.date_retour_attendue is
  'Date à laquelle l''hôte attend le retour de la clé (échéance)';
comment on column public.keys.retard_notifie is
  'Vrai si la relance de retard a déjà été envoyée pour cette échéance';

-- Requête fréquente du job de relance : clés en retard non notifiées
create index if not exists idx_keys_echeance
  on public.keys (date_retour_attendue)
  where date_retour_attendue is not null and retard_notifie = false;

-- ------------------------------------------------------------
-- RPC : relancer_retards()
-- Retourne les clés en retard à notifier (et les marque
-- notifiées + crée la notification in-app de l'hôte).
-- Appelée par le serveur Next (route /api/cron/relances) qui
-- envoie ensuite les emails. Transactionnelle : chaque clé
-- n'est relancée qu'une fois.
-- ------------------------------------------------------------
create or replace function public.relancer_retards()
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_cle record;
  v_resultat jsonb := '[]'::jsonb;
begin
  for v_cle in
    select k.id, k.logement, k.date_retour_attendue,
           p.email as hote_email, p.nom as hote_nom,
           rp.nom as commerce, rp.adresse, rp.code_postal, rp.ville
    from public.keys k
    join public.profiles p on p.id = k.hote_id
    left join public.relay_points rp on rp.id = k.relay_point_id
    where k.date_retour_attendue is not null
      and k.date_retour_attendue < now()
      and k.retard_notifie = false
      -- la clé est toujours dehors ou en dépôt : le retard a un sens
      and k.statut in ('deposee', 'prete_retrait', 'retiree', 'retour')
    for update of k skip locked
  loop
    update public.keys set retard_notifie = true where id = v_cle.id;

    insert into public.notifications (user_id, type, payload)
    select k.hote_id, 'cle_en_retard',
           jsonb_build_object(
             'logement', v_cle.logement,
             'commerce', v_cle.commerce,
             'echeance', v_cle.date_retour_attendue)
    from public.keys k where k.id = v_cle.id;

    v_resultat := v_resultat || jsonb_build_object(
      'key_id', v_cle.id,
      'logement', v_cle.logement,
      'echeance', v_cle.date_retour_attendue,
      'hote_email', v_cle.hote_email,
      'hote_nom', v_cle.hote_nom,
      'commerce', v_cle.commerce,
      'adresse_commerce',
        case when v_cle.commerce is null then null
             else v_cle.adresse || ', ' || v_cle.code_postal || ' ' || v_cle.ville end
    );
  end loop;

  return jsonb_build_object('ok', true, 'relances', v_resultat);
end;
$$;

revoke execute on function public.relancer_retards() from public, anon;
grant execute on function public.relancer_retards() to service_role;
