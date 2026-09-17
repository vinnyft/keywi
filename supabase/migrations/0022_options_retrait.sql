-- ============================================================
-- 0022 — Options de retrait + lien public bénéficiaire
-- ============================================================
-- Le propriétaire choisit, par code de retrait :
--   • réutilisable ou à usage unique (usage_unique) ;
--   • une plage horaire d'utilisation (heure_debut / heure_fin).
-- Et chaque code porte un jeton opaque pour un lien public
-- « /retrait/<jeton> » : le bénéficiaire n'a pas de compte, il ouvre
-- ce lien qui affiche le code + le lieu de retrait.
-- ------------------------------------------------------------

alter table public.access_codes
  add column if not exists usage_unique boolean not null default false,
  add column if not exists heure_debut  time,
  add column if not exists heure_fin    time,
  add column if not exists jeton        text;

-- Jeton opaque (32 hexa ≈ 122 bits aléatoires) pour l'URL publique.
update public.access_codes
  set jeton = replace(gen_random_uuid()::text, '-', '')
  where jeton is null;

alter table public.access_codes
  alter column jeton set default replace(gen_random_uuid()::text, '-', '');
alter table public.access_codes
  alter column jeton set not null;

create unique index if not exists idx_access_codes_jeton
  on public.access_codes (jeton);

-- ------------------------------------------------------------
-- Aide : le code est-il utilisable maintenant (plage horaire) ?
-- Heure locale de Paris ; plage nulle = toujours utilisable ;
-- gère une plage à cheval sur minuit (ex. 22:00–06:00).
-- ------------------------------------------------------------
create or replace function public.retrait_dans_plage(p_debut time, p_fin time)
returns boolean
language sql
stable
as $$
  select case
    when p_debut is null or p_fin is null then true
    when p_debut <= p_fin then
      (now() at time zone 'Europe/Paris')::time between p_debut and p_fin
    else
      (now() at time zone 'Europe/Paris')::time >= p_debut
      or (now() at time zone 'Europe/Paris')::time <= p_fin
  end;
$$;

-- ------------------------------------------------------------
-- RETRAIT étape 1 (comptoir) — ajoute le contrôle de plage horaire
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

  -- Normalisation : accepte « KEYWI:ABC123 », minuscules, espaces
  v_code_norm := replace(upper(trim(p_code)), 'KEYWI:', '');

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

-- ------------------------------------------------------------
-- RETRAIT étape 2 (comptoir) — un code réutilisable reste « actif »,
-- un code à usage unique passe à « utilise »
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
  v_usage boolean;
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
  select usage_unique into v_usage from public.access_codes where id = v_ac_id;
  v_benef := coalesce(v_recherche ->> 'beneficiaire_nom', v_recherche ->> 'beneficiaire_email', 'le bénéficiaire');
  select * into v_slot from public.slots where id = v_key.slot_id;
  select * into v_hote from public.profiles where id = v_key.hote_id;

  -- Libération de la case et passage au statut « retirée »
  update public.slots set statut = 'libre' where id = v_slot.id;
  update public.keys set statut = 'retiree', slot_id = null where id = v_key.id;
  -- Un code à usage unique est consommé ; un code réutilisable reste actif
  if v_usage then
    update public.access_codes set statut = 'utilise' where id = v_ac_id;
  end if;

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
-- RETRAIT casier — plage horaire + usage unique conditionnel
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
  if not public.retrait_dans_plage(v_ac.heure_debut, v_ac.heure_fin) then
    return jsonb_build_object('ok', false, 'erreur', 'CODE_HORS_PLAGE',
      'message', 'Ce code n''est utilisable qu''à certaines heures.');
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

-- ------------------------------------------------------------
-- Lien public bénéficiaire : révèle le code + le lieu de retrait à
-- partir du jeton (capacité = le jeton lui-même, non devinable).
-- Ne divulgue AUCUNE donnée personnelle du bénéficiaire.
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

grant execute on function public.retrait_dans_plage(time, time) to authenticated, service_role;
grant execute on function public.retrait_public(text) to anon, authenticated, service_role;
