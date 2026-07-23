-- ============================================================
-- Keywi — Migration 0006 : casiers connectés
-- Un point relais peut être un « casier » : armoire automatique
-- accessible 24 h/24, sans commerçant. Le dépôt est fait par
-- l'hôte lui-même (self-service) ; le retrait se fait à la borne
-- avec le code à 6 caractères.
-- ============================================================

create type public.relay_type as enum ('commerce', 'casier');

alter table public.relay_points
  add column if not exists type public.relay_type not null default 'commerce';

comment on column public.relay_points.type is
  'commerce : comptoir tenu par un partenaire — casier : armoire automatique 24/7';

-- ------------------------------------------------------------
-- DÉPÔT SELF-SERVICE : l'hôte, devant le casier, obtient une
-- case et y range son trousseau. Équivalent de
-- preparer_depot + confirmer_depot en une seule transaction
-- (pas de comptoir, pas d'étape de scan).
-- ------------------------------------------------------------
create or replace function public.casier_deposer(p_key_id uuid)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_key   public.keys;
  v_relay public.relay_points;
  v_slot  public.slots;
  v_type  public.movement_type;
  v_statut public.key_status;
  v_code  record;
  v_benef_profile public.profiles;
  v_beneficiaires jsonb := '[]'::jsonb;
begin
  select * into v_key from public.keys
  where id = p_key_id and hote_id = auth.uid();
  if v_key.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_INTROUVABLE');
  end if;

  select * into v_relay from public.relay_points where id = v_key.relay_point_id;
  if v_relay.id is null or v_relay.type <> 'casier' then
    return jsonb_build_object('ok', false, 'erreur', 'PAS_UN_CASIER',
      'message', 'Cette clé n''est pas rattachée à un casier Keywi.');
  end if;

  if v_key.paiement_statut not in ('paye', 'offert') then
    return jsonb_build_object('ok', false, 'erreur', 'PAIEMENT_MANQUANT');
  end if;
  if v_key.statut not in ('en_attente', 'retiree') then
    return jsonb_build_object('ok', false, 'erreur', 'STATUT_INCOMPATIBLE',
      'message', 'Cette clé est déjà en dépôt (statut : ' || v_key.statut || ').');
  end if;

  -- Case : réutilise une éventuelle réservation, sinon attribution atomique
  if v_key.slot_id is not null then
    select * into v_slot from public.slots where id = v_key.slot_id;
  else
    begin
      v_slot := public.attribuer_case(v_relay.id);
    exception when others then
      return jsonb_build_object('ok', false, 'erreur', 'AUCUNE_CASE_LIBRE',
        'message', 'Toutes les cases de ce casier sont occupées.');
    end;
    update public.keys set slot_id = v_slot.id where id = v_key.id;
  end if;

  -- Retour (clé revenant après retrait) ou premier dépôt
  if v_key.statut = 'retiree' then
    v_type := 'retour';
    v_statut := 'retour';
  else
    v_type := 'depot';
    if exists (
      select 1 from public.access_codes
      where key_id = v_key.id and statut = 'actif'
        and (expire_at is null or expire_at > now())
    ) then
      v_statut := 'prete_retrait';
    else
      v_statut := 'deposee';
    end if;
  end if;

  update public.keys set statut = v_statut where id = v_key.id;

  insert into public.movements (key_id, relay_point_id, slot_id, type, scanned_by, details)
  values (v_key.id, v_relay.id, v_slot.id, v_type, auth.uid(),
          jsonb_build_object('case_numero', v_slot.numero, 'logement', v_key.logement,
                             'self_service', true));

  -- Bénéficiaires des codes actifs : notification in-app + liste pour emails
  if v_type = 'depot' then
    for v_code in
      select * from public.access_codes
      where key_id = v_key.id and statut = 'actif'
        and (expire_at is null or expire_at > now())
    loop
      v_beneficiaires := v_beneficiaires || jsonb_build_object(
        'email', v_code.beneficiaire_email,
        'nom', v_code.beneficiaire_nom,
        'code_6', v_code.code_6);

      select * into v_benef_profile from public.profiles
      where email = v_code.beneficiaire_email limit 1;
      if v_benef_profile.id is not null then
        insert into public.notifications (user_id, type, payload)
        values (v_benef_profile.id, 'cles_disponibles',
                jsonb_build_object(
                  'logement', v_key.logement,
                  'commerce', v_relay.nom,
                  'adresse', v_relay.adresse,
                  'code_6', v_code.code_6));
      end if;
    end loop;
  end if;

  return jsonb_build_object(
    'ok', true,
    'type_operation', v_type,
    'statut', v_statut,
    'case_numero', v_slot.numero,
    'logement', v_key.logement,
    'casier', v_relay.nom,
    'adresse_casier', v_relay.adresse || ', ' || v_relay.code_postal || ' ' || v_relay.ville,
    'beneficiaires', v_beneficiaires
  );
end;
$$;

-- ------------------------------------------------------------
-- RETRAIT À LA BORNE : le bénéficiaire tape son code sur
-- l'écran du casier. Pas de re-scan badge (la porte qui s'ouvre
-- est la vérification). Appelée via service role uniquement
-- (la borne est une interface serveur, jamais le navigateur).
-- ------------------------------------------------------------
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

  v_code_norm := replace(upper(trim(p_code)), 'KEYWI:', '');

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

  select * into v_key from public.keys where id = v_ac.key_id;
  if v_key.relay_point_id is distinct from v_relay.id then
    return jsonb_build_object('ok', false, 'erreur', 'MAUVAIS_CASIER',
      'message', 'Ces clés sont déposées dans un autre point Keywi.');
  end if;
  if v_key.statut not in ('deposee', 'prete_retrait', 'retour') or v_key.slot_id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_NON_DISPONIBLE');
  end if;

  v_benef := coalesce(v_ac.beneficiaire_nom, v_ac.beneficiaire_email, 'le bénéficiaire');
  select * into v_slot from public.slots where id = v_key.slot_id;
  select * into v_hote from public.profiles where id = v_key.hote_id;

  update public.slots set statut = 'libre' where id = v_slot.id;
  update public.keys set statut = 'retiree', slot_id = null where id = v_key.id;
  update public.access_codes set statut = 'utilise' where id = v_ac.id;

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

-- Droits : dépôt par un hôte connecté, retrait via la borne (serveur)
revoke execute on function public.casier_deposer(uuid) from public, anon;
grant execute on function public.casier_deposer(uuid) to authenticated, service_role;
revoke execute on function public.casier_retirer(uuid, text) from public, anon, authenticated;
grant execute on function public.casier_retirer(uuid, text) to service_role;
