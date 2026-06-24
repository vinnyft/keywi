-- ============================================================
-- KLAV — Migration 0003 : fonctions métier (RPC)
-- Toute la logique critique (attribution de case, dépôt,
-- retrait) vit ici, en transactions atomiques côté Postgres.
-- Les fonctions retournent du jsonb : { ok: bool, erreur?, ... }
-- ============================================================

-- ------------------------------------------------------------
-- Génération d'un code de retrait à 6 caractères, sans
-- caractères ambigus (pas de O/0, I/1/L)
-- ------------------------------------------------------------
create or replace function public.generer_code_retrait()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select string_agg(
      substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), ''
    ) into v_code
    from generate_series(1, 6);
    -- On boucle jusqu'à obtenir un code jamais utilisé
    exit when not exists (select 1 from public.access_codes where code_6 = v_code);
  end loop;
  return v_code;
end;
$$;

-- ------------------------------------------------------------
-- Génération d'un code badge imprimé à 8 caractères (KLV + 5)
-- ------------------------------------------------------------
create or replace function public.generer_code_badge()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select 'KLV' || string_agg(
      substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), ''
    ) into v_code
    from generate_series(1, 5);
    exit when not exists (select 1 from public.keys where code_badge_imprime = v_code);
  end loop;
  return v_code;
end;
$$;

-- ------------------------------------------------------------
-- Point relais du commerçant connecté
-- ------------------------------------------------------------
create or replace function public.mon_point_relais()
returns public.relay_points
language sql stable
security definer set search_path = public
as $$
  select * from public.relay_points where owner_id = auth.uid() limit 1;
$$;

-- ------------------------------------------------------------
-- Attribution atomique d'une case libre.
-- FOR UPDATE SKIP LOCKED : si deux commerçants scannent en même
-- temps, chacun obtient une case différente, sans interblocage.
-- ------------------------------------------------------------
create or replace function public.attribuer_case(p_relay_point_id uuid)
returns public.slots
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_slot public.slots;
begin
  select * into v_slot
  from public.slots
  where relay_point_id = p_relay_point_id
    and statut = 'libre'
  order by numero
  for update skip locked
  limit 1;

  if v_slot.id is null then
    raise exception 'AUCUNE_CASE_LIBRE';
  end if;

  update public.slots set statut = 'occupee' where id = v_slot.id;
  v_slot.statut := 'occupee';
  return v_slot;
end;
$$;

-- ------------------------------------------------------------
-- Recherche d'une clé par badge : UID NFC ou code imprimé
-- ------------------------------------------------------------
create or replace function public.trouver_cle_par_badge(p_badge text)
returns public.keys
language sql stable
security definer set search_path = public
as $$
  select * from public.keys
  where badge_uid = p_badge
     or code_badge_imprime = upper(trim(p_badge))
  limit 1;
$$;

-- ------------------------------------------------------------
-- Validation d'un badge scanné par le commerçant connecté.
-- Vérifie : badge connu, paiement effectué, dépôt attendu dans
-- CE point relais, statut compatible (dépôt ou retour).
-- ------------------------------------------------------------
create or replace function public.valider_badge(p_badge_uid text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_relay public.relay_points;
  v_key   public.keys;
  v_hote  public.profiles;
begin
  v_relay := public.mon_point_relais();
  if v_relay.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'PAS_COMMERCANT',
      'message', 'Aucun point relais associé à votre compte.');
  end if;

  v_key := public.trouver_cle_par_badge(p_badge_uid);
  if v_key.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'BADGE_INCONNU',
      'message', 'Ce badge n''est rattaché à aucune clé KLAV.');
  end if;

  if v_key.paiement_statut not in ('paye', 'offert') then
    return jsonb_build_object('ok', false, 'erreur', 'PAIEMENT_MANQUANT',
      'message', 'Le dépôt n''a pas encore été réglé par l''hôte.');
  end if;

  if v_key.relay_point_id is distinct from v_relay.id then
    return jsonb_build_object('ok', false, 'erreur', 'MAUVAIS_POINT_RELAIS',
      'message', 'Cette clé est attendue dans un autre point relais.');
  end if;

  if v_key.statut not in ('en_attente', 'retiree') then
    return jsonb_build_object('ok', false, 'erreur', 'STATUT_INCOMPATIBLE',
      'message', 'Cette clé est déjà déposée (statut : ' || v_key.statut || ').');
  end if;

  select * into v_hote from public.profiles where id = v_key.hote_id;

  return jsonb_build_object(
    'ok', true,
    'key_id', v_key.id,
    'logement', v_key.logement,
    'hote_nom', v_hote.nom,
    -- 'depot' pour une première remise, 'retour' si la clé revient après un retrait
    'type_operation', case when v_key.statut = 'retiree' then 'retour' else 'depot' end
  );
end;
$$;

-- ------------------------------------------------------------
-- DÉPÔT — étape 1 : valider le badge et attribuer une case.
-- La case est immédiatement réservée (occupee) pour que le
-- numéro affiché plein écran reste valable.
-- ------------------------------------------------------------
create or replace function public.preparer_depot(p_badge_uid text)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_validation jsonb;
  v_relay public.relay_points;
  v_key   public.keys;
  v_slot  public.slots;
begin
  v_validation := public.valider_badge(p_badge_uid);
  if not (v_validation ->> 'ok')::boolean then
    return v_validation;
  end if;

  v_relay := public.mon_point_relais();
  v_key := public.trouver_cle_par_badge(p_badge_uid);

  -- Si une case a déjà été réservée pour cette clé (double scan), on la réutilise
  if v_key.slot_id is not null then
    select * into v_slot from public.slots where id = v_key.slot_id;
  else
    begin
      v_slot := public.attribuer_case(v_relay.id);
    exception when others then
      return jsonb_build_object('ok', false, 'erreur', 'AUCUNE_CASE_LIBRE',
        'message', 'Toutes les cases de votre point relais sont occupées.');
    end;
    update public.keys set slot_id = v_slot.id where id = v_key.id;
  end if;

  return v_validation || jsonb_build_object(
    'case_numero', v_slot.numero,
    'slot_id', v_slot.id
  );
end;
$$;

-- ------------------------------------------------------------
-- DÉPÔT — annulation : libère la case réservée si le commerçant
-- abandonne avant confirmation
-- ------------------------------------------------------------
create or replace function public.annuler_depot(p_key_id uuid)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_relay public.relay_points;
  v_key   public.keys;
begin
  v_relay := public.mon_point_relais();
  select * into v_key from public.keys where id = p_key_id;

  -- Seule une réservation non confirmée (clé pas encore déposée) est annulable
  if v_key.id is null or v_key.relay_point_id is distinct from v_relay.id
     or v_key.statut not in ('en_attente', 'retiree') or v_key.slot_id is null then
    return jsonb_build_object('ok', false, 'erreur', 'ANNULATION_IMPOSSIBLE');
  end if;

  update public.slots set statut = 'libre' where id = v_key.slot_id;
  update public.keys set slot_id = null where id = v_key.id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- DÉPÔT — étape 2 : confirmation après rangement du trousseau.
-- Met à jour le statut, journalise le mouvement et crée les
-- notifications in-app. Retourne les destinataires des emails
-- (envoyés ensuite par le serveur Next.js via Resend).
-- ------------------------------------------------------------
create or replace function public.confirmer_depot(p_key_id uuid)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_relay public.relay_points;
  v_key   public.keys;
  v_slot  public.slots;
  v_hote  public.profiles;
  v_type  public.movement_type;
  v_statut public.key_status;
  v_code  record;
  v_benef_profile public.profiles;
  v_beneficiaires jsonb := '[]'::jsonb;
begin
  v_relay := public.mon_point_relais();
  select * into v_key from public.keys where id = p_key_id;

  if v_key.id is null or v_key.relay_point_id is distinct from v_relay.id then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_INTROUVABLE');
  end if;
  if v_key.slot_id is null or v_key.statut not in ('en_attente', 'retiree') then
    return jsonb_build_object('ok', false, 'erreur', 'DEPOT_NON_PREPARE',
      'message', 'Scannez d''abord le badge pour obtenir une case.');
  end if;

  select * into v_slot from public.slots where id = v_key.slot_id;
  select * into v_hote from public.profiles where id = v_key.hote_id;

  -- Retour (clé revenant après retrait) ou premier dépôt
  if v_key.statut = 'retiree' then
    v_type := 'retour';
    v_statut := 'retour';
  else
    v_type := 'depot';
    -- S'il existe un code de retrait actif, la clé est directement « prête au retrait »
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

  -- Journal d'audit immuable
  insert into public.movements (key_id, relay_point_id, slot_id, type, scanned_by, details)
  values (v_key.id, v_relay.id, v_slot.id, v_type, auth.uid(),
          jsonb_build_object('case_numero', v_slot.numero, 'logement', v_key.logement));

  -- Notification in-app à l'hôte
  insert into public.notifications (user_id, type, payload)
  values (v_key.hote_id,
          case when v_type = 'retour' then 'retour_effectue' else 'depot_effectue' end,
          jsonb_build_object(
            'logement', v_key.logement,
            'commerce', v_relay.nom,
            'adresse', v_relay.adresse,
            'case_numero', v_slot.numero));

  -- Notifications aux bénéficiaires des codes actifs (les clés sont disponibles)
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

      -- Notification in-app si le bénéficiaire a un compte KLAV
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
    'commerce', v_relay.nom,
    'adresse_commerce', v_relay.adresse || ', ' || v_relay.code_postal || ' ' || v_relay.ville,
    'hote_email', v_hote.email,
    'hote_nom', v_hote.nom,
    'beneficiaires', v_beneficiaires
  );
end;
$$;

-- ------------------------------------------------------------
-- RETRAIT — étape 1 : recherche par code à 6 caractères (ou
-- payload QR « KLAV:XXXXXX »). Affiche la case et le logement.
-- ------------------------------------------------------------
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

  -- Normalisation : accepte « KLAV:ABC123 », minuscules, espaces
  v_code_norm := replace(upper(trim(p_code)), 'KLAV:', '');

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

-- ------------------------------------------------------------
-- RETRAIT — étape 2 : confirmation avec re-scan du badge
-- (vérification croisée anti-erreur de case), libération de la
-- case, journalisation et notification de l'hôte.
-- ------------------------------------------------------------
create or replace function public.confirmer_retrait(p_code text, p_badge_uid text)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_recherche jsonb;
  v_relay public.relay_points;
  v_key   public.keys;
  v_slot  public.slots;
  v_hote  public.profiles;
  v_ac_id uuid;
  v_benef text;
begin
  v_recherche := public.chercher_retrait(p_code);
  if not (v_recherche ->> 'ok')::boolean then
    return v_recherche;
  end if;

  v_relay := public.mon_point_relais();
  select * into v_key from public.keys where id = (v_recherche ->> 'key_id')::uuid;

  -- Vérification croisée : le badge re-scanné doit être celui de la clé attendue
  if v_key.badge_uid is distinct from p_badge_uid
     and v_key.code_badge_imprime <> upper(trim(p_badge_uid)) then
    return jsonb_build_object('ok', false, 'erreur', 'BADGE_DIFFERENT',
      'message', 'Ce badge ne correspond pas au trousseau attendu — vérifiez la case n° '
                 || (v_recherche ->> 'case_numero') || '.');
  end if;

  v_ac_id := (v_recherche ->> 'access_code_id')::uuid;
  v_benef := coalesce(v_recherche ->> 'beneficiaire_nom', v_recherche ->> 'beneficiaire_email', 'le bénéficiaire');
  select * into v_slot from public.slots where id = v_key.slot_id;
  select * into v_hote from public.profiles where id = v_key.hote_id;

  -- Libération de la case et passage au statut « retirée »
  update public.slots set statut = 'libre' where id = v_slot.id;
  update public.keys set statut = 'retiree', slot_id = null where id = v_key.id;
  update public.access_codes set statut = 'utilise' where id = v_ac_id;

  insert into public.movements (key_id, relay_point_id, slot_id, type, scanned_by, details)
  values (v_key.id, v_relay.id, v_slot.id, 'retrait', auth.uid(),
          jsonb_build_object('case_numero', v_slot.numero, 'logement', v_key.logement,
                             'beneficiaire', v_benef));

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
    'commerce', v_relay.nom,
    'beneficiaire', v_benef,
    'hote_email', v_hote.email,
    'hote_nom', v_hote.nom
  );
end;
$$;

-- ------------------------------------------------------------
-- Création d'un code de retrait par l'hôte (RPC)
-- ------------------------------------------------------------
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
  values (p_key_id, v_code, 'KLAV:' || v_code, p_beneficiaire_email, p_beneficiaire_nom, p_expire_at)
  returning * into v_ac;

  -- Une clé déposée devient « prête au retrait » dès qu'un code actif existe
  if v_key.statut = 'deposee' then
    update public.keys set statut = 'prete_retrait' where id = p_key_id;
  end if;

  -- Notification in-app au bénéficiaire s'il a un compte et que la clé est déjà en dépôt
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

-- ------------------------------------------------------------
-- Révocation d'un code de retrait par l'hôte
-- ------------------------------------------------------------
create or replace function public.revoquer_code(p_access_code_id uuid)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_ac  public.access_codes;
  v_key public.keys;
begin
  select ac.* into v_ac
  from public.access_codes ac
  join public.keys k on k.id = ac.key_id
  where ac.id = p_access_code_id and k.hote_id = auth.uid();

  if v_ac.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_INTROUVABLE');
  end if;

  update public.access_codes set statut = 'revoque' where id = v_ac.id;

  -- Plus aucun code actif sur une clé « prête au retrait » → retour à « déposée »
  select * into v_key from public.keys where id = v_ac.key_id;
  if v_key.statut = 'prete_retrait' and not exists (
    select 1 from public.access_codes
    where key_id = v_key.id and statut = 'actif'
      and (expire_at is null or expire_at > now())
  ) then
    update public.keys set statut = 'deposee' where id = v_key.id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------
-- Rémunération du commerçant pour un mois donné, calculée selon
-- les paliers paramétrés en base (rang du mouvement dans le mois)
-- ------------------------------------------------------------
create or replace function public.remuneration_mois(
  p_relay_point_id uuid,
  p_mois date default date_trunc('month', now())::date
)
returns jsonb
language sql stable
security definer set search_path = public
as $$
  with mouvements as (
    select row_number() over (order by created_at) as rang
    from public.movements
    where relay_point_id = p_relay_point_id
      and created_at >= date_trunc('month', p_mois)
      and created_at < date_trunc('month', p_mois) + interval '1 month'
  ),
  remunere as (
    select m.rang, p.montant_centimes
    from mouvements m
    join public.remuneration_paliers p
      on m.rang >= p.seuil_min and (p.seuil_max is null or m.rang <= p.seuil_max)
  )
  select jsonb_build_object(
    'nb_mouvements', coalesce((select count(*) from mouvements), 0),
    'montant_centimes', coalesce((select sum(montant_centimes) from remunere), 0)
  );
$$;

-- ------------------------------------------------------------
-- Statistiques publiques pour le site marketing
-- ------------------------------------------------------------
create or replace function public.stats_publiques()
returns jsonb
language sql stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'nb_points_relais', (select count(*) from public.relay_points where statut = 'actif'),
    'nb_mouvements',    (select count(*) from public.movements),
    'nb_cles_gerees',   (select count(*) from public.keys)
  );
$$;

-- ------------------------------------------------------------
-- Droits d'exécution
-- ------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
grant execute on function public.stats_publiques() to anon;
