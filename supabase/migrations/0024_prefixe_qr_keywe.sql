-- ============================================================
-- 0024 — Rebrand du préfixe QR : KEYWI: → KEYWE:
-- ============================================================
-- Les nouveaux codes encodent « KEYWE:<code> ». À la lecture, on
-- accepte les DEUX préfixes (rétro-compatibilité des QR déjà émis
-- « KEYWI: », dont ceux du seed). Le reste des fonctions est inchangé.
-- ------------------------------------------------------------

-- Génération : le payload QR porte désormais « KEYWE: »
create or replace function public.creer_code_retrait(
  p_key_id uuid,
  p_beneficiaire_email text default null,
  p_beneficiaire_nom text default null,
  p_expire_at timestamptz default null
)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_key  public.keys;
  v_code text;
  v_ac   public.access_codes;
  v_benef_profile public.profiles;
begin
  select * into v_key from public.keys where id = p_key_id and hote_id = auth.uid();
  if v_key.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_INTROUVABLE');
  end if;
  if v_key.statut = 'perdue' then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_PERDUE');
  end if;

  v_code := public.generer_code_retrait();

  insert into public.access_codes (key_id, code_6, qr_payload, beneficiaire_email, beneficiaire_nom, expire_at)
  values (p_key_id, v_code, 'KEYWE:' || v_code, p_beneficiaire_email, p_beneficiaire_nom, p_expire_at)
  returning * into v_ac;

  if v_key.statut = 'deposee' then
    update public.keys set statut = 'prete_retrait' where id = p_key_id;
  end if;

  if p_beneficiaire_email is not null
     and v_key.statut in ('deposee', 'prete_retrait', 'retour') then
    select * into v_benef_profile from public.profiles where email = p_beneficiaire_email limit 1;
    if v_benef_profile.id is not null then
      insert into public.notifications (user_id, type, payload)
      values (v_benef_profile.id, 'cles_disponibles',
              jsonb_build_object('logement', v_key.logement, 'code_6', v_code));
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code_6', v_code,
    'qr_payload', v_ac.qr_payload,
    'access_code_id', v_ac.id,
    'cle_en_depot', v_key.statut in ('deposee', 'prete_retrait', 'retour')
  );
end;
$$;

-- Lecture comptoir : accepte KEYWI: et KEYWE:
create or replace function public.chercher_retrait(p_code text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_relay public.relay_points;
  v_code_norm text;
  v_ac   public.access_codes;
  v_key  public.keys;
  v_slot public.slots;
begin
  v_relay := public.mon_point_relais();
  if v_relay.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'PAS_COMMERCANT');
  end if;

  -- Normalisation : accepte « KEYWE:ABC123 » (et l'ancien « KEYWI: »), minuscules, espaces
  v_code_norm := replace(replace(upper(trim(p_code)), 'KEYWE:', ''), 'KEYWI:', '');

  select * into v_ac from public.access_codes
  where code_6 = v_code_norm and statut = 'actif';

  if v_ac.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_INCONNU',
      'message', 'Aucun code de retrait actif ne correspond.');
  end if;
  if v_ac.expire_at is not null and v_ac.expire_at < now() then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_EXPIRE',
      'message', 'Ce code de retrait a expiré.');
  end if;
  if not public.retrait_dans_plage(v_ac.heure_debut, v_ac.heure_fin) then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_HORS_PLAGE',
      'message', 'Ce code n''est utilisable qu''à certaines heures.');
  end if;

  select * into v_key from public.keys where id = v_ac.key_id;

  if v_key.relay_point_id is distinct from v_relay.id then
    return jsonb_build_object('ok', false, 'erreur', 'MAUVAIS_POINT_RELAIS',
      'message', 'Ces clés sont déposées dans un autre point relais.');
  end if;
  if v_key.statut not in ('deposee', 'prete_retrait', 'retour') or v_key.slot_id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_NON_DISPONIBLE',
      'message', 'Ces clés ne sont pas en dépôt actuellement (statut : ' || v_key.statut || ').');
  end if;

  select * into v_slot from public.slots where id = v_key.slot_id;

  return jsonb_build_object(
    'ok', true,
    'key_id', v_key.id,
    'access_code_id', v_ac.id,
    'case_numero', v_slot.numero,
    'logement', v_key.logement,
    'beneficiaire_nom', v_ac.beneficiaire_nom,
    'beneficiaire_email', v_ac.beneficiaire_email
  );
end;
$$;

-- Lecture casier : accepte KEYWI: et KEYWE:
create or replace function public.casier_retirer(p_relay_point_id uuid, p_code text)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_relay public.relay_points;
  v_code_norm text;
  v_ac   public.access_codes;
  v_key  public.keys;
  v_slot public.slots;
  v_hote public.profiles;
  v_benef text;
begin
  select * into v_relay from public.relay_points
  where id = p_relay_point_id and type = 'casier';
  if v_relay.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CASIER_INCONNU');
  end if;

  v_code_norm := replace(replace(upper(trim(p_code)), 'KEYWE:', ''), 'KEYWI:', '');

  select * into v_ac from public.access_codes
  where code_6 = v_code_norm and statut = 'actif';
  if v_ac.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_INCONNU',
      'message', 'Code inconnu ou déjà utilisé.');
  end if;
  if v_ac.expire_at is not null and v_ac.expire_at < now() then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_EXPIRE',
      'message', 'Ce code de retrait a expiré.');
  end if;
  if not public.retrait_dans_plage(v_ac.heure_debut, v_ac.heure_fin) then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_HORS_PLAGE',
      'message', 'Ce code n''est utilisable qu''à certaines heures.');
  end if;

  select * into v_key from public.keys where id = v_ac.key_id;
  if v_key.relay_point_id is distinct from v_relay.id then
    return jsonb_build_object('ok', false, 'erreur', 'MAUVAIS_CASIER',
      'message', 'Ces clés sont déposées dans un autre point Keywe.');
  end if;
  if v_key.statut not in ('deposee', 'prete_retrait', 'retour') or v_key.slot_id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_NON_DISPONIBLE');
  end if;

  v_benef := coalesce(v_ac.beneficiaire_nom, v_ac.beneficiaire_email, 'le bénéficiaire');
  select * into v_slot from public.slots where id = v_key.slot_id;
  select * into v_hote from public.profiles where id = v_key.hote_id;

  update public.slots set statut = 'libre' where id = v_slot.id;
  update public.keys set statut = 'retiree', slot_id = null where id = v_key.id;
  if v_ac.usage_unique then
    update public.access_codes set statut = 'utilise' where id = v_ac.id;
  end if;

  insert into public.movements (key_id, relay_point_id, slot_id, type, scanned_by, details)
  values (v_key.id, v_relay.id, v_slot.id, 'retrait', null,
          jsonb_build_object('case_numero', v_slot.numero, 'logement', v_key.logement,
                             'beneficiaire', v_benef, 'borne', true));

  insert into public.notifications (user_id, type, payload)
  values (v_key.hote_id, 'retrait_effectue',
          jsonb_build_object(
            'logement', v_key.logement,
            'commerce', v_relay.nom,
            'beneficiaire', v_benef,
            'case_numero', v_slot.numero));

  return jsonb_build_object(
    'ok', true,
    'case_numero', v_slot.numero,
    'logement', v_key.logement,
    'casier', v_relay.nom,
    'beneficiaire', v_benef,
    'hote_email', v_hote.email,
    'hote_nom', v_hote.nom
  );
end;
$$;
