-- ============================================================
-- 0023 — retrait_public : indiquer si le code est périmé
-- ============================================================
-- On calcule l'expiration côté serveur (statut non actif OU date
-- d'expiration passée) et on la renvoie en booléen `perime`, pour
-- que la page publique n'ait pas à évaluer l'heure courante au rendu.
-- La plage horaire reste, elle, purement informative sur la page.
-- ------------------------------------------------------------

create or replace function public.retrait_public(p_jeton text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_ac    public.access_codes;
  v_key   public.keys;
  v_relay public.relay_points;
begin
  select * into v_ac from public.access_codes where jeton = p_jeton;
  if v_ac.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'INCONNU');
  end if;

  select * into v_key from public.keys where id = v_ac.key_id;
  select * into v_relay from public.relay_points where id = v_key.relay_point_id;

  return jsonb_build_object(
    'ok', true,
    'code_6', v_ac.code_6,
    'statut', v_ac.statut,
    'perime', (v_ac.statut <> 'actif'
               or (v_ac.expire_at is not null and v_ac.expire_at < now())),
    'expire_at', v_ac.expire_at,
    'usage_unique', v_ac.usage_unique,
    'heure_debut', v_ac.heure_debut,
    'heure_fin', v_ac.heure_fin,
    'logement', v_key.logement,
    'commerce', v_relay.nom,
    'adresse', v_relay.adresse,
    'code_postal', v_relay.code_postal,
    'ville', v_relay.ville,
    'horaires', v_relay.horaires
  );
end;
$$;
