-- ============================================================
-- Keywi — Migration 0011 : suppression de compte anonymisante
--
-- Le droit à l'effacement (RGPD art. 17) se heurte ici à deux
-- contraintes qui, elles, ne se négocient pas :
--
--   1. le journal des mouvements est immuable (c'est la valeur
--      du certificat de traçabilité, opposable à un assureur) ;
--   2. les paiements relèvent de l'obligation comptable
--      (art. L123-22 du Code de commerce : 10 ans).
--
-- Un `delete` en cascade est de toute façon impossible : effacer
-- auth.users cascaderait jusqu'à movements, où le trigger
-- d'immuabilité lèverait une exception et annulerait tout.
--
-- La réponse correcte est donc l'ANONYMISATION : on détruit tout
-- ce qui rattache les lignes à une personne, on conserve les
-- faits (un dépôt a eu lieu, tel jour, à tel endroit, pour tel
-- montant). Une donnée anonymisée sort du champ du RGPD
-- (considérant 26) — l'effacement est réel, la preuve survit.
-- ============================================================

-- ------------------------------------------------------------
-- Pierre tombale : marque un profil vidé de son identité
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists anonymise_le timestamptz;

comment on column public.profiles.anonymise_le is
  'Horodatage de l''anonymisation du compte (RGPD art. 17). Non null = pierre tombale : la ligne ne subsiste que pour porter les clés étrangères du journal et de la comptabilité.';

-- ------------------------------------------------------------
-- Le journal reste immuable — à une exception près, étroite et
-- traçable : la purge des données personnelles.
--
-- L'exception est doublement verrouillée :
--   · un drapeau de session que seule `supprimer_mon_compte()`
--     (security definer) positionne, le temps d'une transaction ;
--   · aucune policy UPDATE sur `movements` — un client
--     authentifié qui poserait le drapeau lui-même resterait
--     bloqué par la RLS.
-- Seul `details` peut changer : le fait, sa date, son lieu et sa
-- vérification par scan sont intouchables.
-- ------------------------------------------------------------
create or replace function public.refuser_modification()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and coalesce(current_setting('keywi.anonymisation', true), 'off') = 'on'
     and new.id             is not distinct from old.id
     and new.key_id         is not distinct from old.key_id
     and new.relay_point_id is not distinct from old.relay_point_id
     and new.slot_id        is not distinct from old.slot_id
     and new.type           is not distinct from old.type
     and new.scanned_by     is not distinct from old.scanned_by
     and new.created_at     is not distinct from old.created_at
  then
    return new;
  end if;

  raise exception 'Le journal des mouvements est immuable (%).', tg_op;
end;
$$;

-- ------------------------------------------------------------
-- Aperçu avant suppression.
--
-- Le parcours doit être loyal : avant de confirmer, l'utilisateur
-- voit ce que Keywi détient sur lui, ce qui sera effacé, ce qui
-- sera conservé et pourquoi. Cette fonction alimente cet écran —
-- et signale d'avance le seul cas qui bloque : des trousseaux
-- encore physiquement sous garde.
-- ------------------------------------------------------------
create or replace function public.apercu_suppression_compte()
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_profil public.profiles;
  v_email  text;
  v_blocage jsonb := null;
  v_en_garde int;
  v_relais_occupes int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'erreur', 'NON_AUTHENTIFIE');
  end if;

  select * into v_profil from public.profiles where id = v_uid;
  if v_profil.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'PROFIL_INTROUVABLE');
  end if;

  v_email := lower(coalesce(v_profil.email, ''));

  -- Blocage 1 — des trousseaux sont encore chez un partenaire.
  -- Anonymiser maintenant priverait le commerçant de tout moyen
  -- d'identifier le propriétaire de ce qu'il détient.
  select count(*) into v_en_garde
    from public.keys
   where hote_id = v_uid
     and statut in ('deposee', 'prete_retrait', 'retour');

  -- Blocage 2 — le point relais du commerçant héberge des clés
  -- qui ne lui appartiennent pas.
  select count(*) into v_relais_occupes
    from public.keys k
    join public.relay_points rp on rp.id = k.relay_point_id
   where rp.owner_id = v_uid
     and k.statut in ('deposee', 'prete_retrait', 'retour');

  if v_profil.anonymise_le is not null then
    v_blocage := jsonb_build_object(
      'code', 'DEJA_ANONYMISE',
      'message', 'Ce compte a déjà été anonymisé.');
  elsif v_profil.role = 'admin' then
    v_blocage := jsonb_build_object(
      'code', 'COMPTE_ADMIN',
      'message', 'Un compte administrateur ne peut pas être supprimé en autonomie : transférez d''abord le rôle.');
  elsif v_en_garde > 0 then
    v_blocage := jsonb_build_object(
      'code', 'CLES_EN_GARDE',
      'message', case when v_en_garde = 1
        then 'Récupérez d''abord votre trousseau : il est encore déposé chez un partenaire.'
        else 'Récupérez d''abord vos trousseaux : ' || v_en_garde ||
             ' sont encore déposés chez un partenaire.' end,
      'nombre', v_en_garde);
  elsif v_relais_occupes > 0 then
    v_blocage := jsonb_build_object(
      'code', 'POINT_RELAIS_OCCUPE',
      'message', 'Votre point relais détient encore ' || v_relais_occupes ||
                 case when v_relais_occupes = 1
                   then ' trousseau appartenant à un client. Restituez-le'
                   else ' trousseaux appartenant à des clients. Restituez-les' end ||
                 ' avant de fermer votre compte.',
      'nombre', v_relais_occupes);
  end if;

  return jsonb_build_object(
    'ok', true,
    'role',           v_profil.role,
    'membre_depuis',  v_profil.created_at,
    'blocage',        v_blocage,
    'trousseaux',     (select count(*) from public.keys where hote_id = v_uid),
    'codes_actifs',   (select count(*) from public.access_codes ac
                        join public.keys k on k.id = ac.key_id
                       where k.hote_id = v_uid and ac.statut = 'actif'),
    'recurrences',    (select count(*) from public.acces_recurrents ar
                        join public.keys k on k.id = ar.key_id
                       where k.hote_id = v_uid),
    'mouvements',     (select count(*) from public.movements mv
                        join public.keys k on k.id = mv.key_id
                       where k.hote_id = v_uid),
    'notifications',  (select count(*) from public.notifications where user_id = v_uid),
    'cles_api',       (select count(*) from public.api_keys
                       where hote_id = v_uid and revoquee_le is null),
    'paiements',      (select count(*) from public.paiements where hote_id = v_uid),
    -- Codes reçus en tant que bénéficiaire, sur les clés d'autrui
    'codes_recus',    (select count(*) from public.access_codes
                       where v_email <> '' and lower(beneficiaire_email) = v_email)
  );
end;
$$;

revoke execute on function public.apercu_suppression_compte() from public, anon;
grant  execute on function public.apercu_suppression_compte() to authenticated;

-- ------------------------------------------------------------
-- Suppression effective : anonymisation en une transaction.
--
-- Effacé : nom, email, téléphone, nom des logements, badges,
-- identité des bénéficiaires (y compris dans le journal), codes
-- de retrait, récurrences, notifications, clés d'API.
--
-- Conservé, sans lien avec une personne : la matérialité des
-- mouvements (type, date, lieu, case, vérification par scan) et
-- les écritures de paiement.
--
-- L'appelant reste responsable du volet `auth.users` (email
-- neutralisé et compte banni côté service role) : cette fonction
-- ne touche pas au schéma d'authentification.
-- ------------------------------------------------------------
create or replace function public.supprimer_mon_compte()
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_apercu  jsonb;
  v_profil  public.profiles;
  v_email   text;
  v_marque  constant text := 'Compte supprimé';
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'erreur', 'NON_AUTHENTIFIE',
      'message', 'Session expirée. Reconnectez-vous.');
  end if;

  -- Mêmes garde-fous que l'écran d'aperçu : la vérification est
  -- refaite ici, la RPC étant appelable directement.
  v_apercu := public.apercu_suppression_compte();
  if not (v_apercu ->> 'ok')::boolean then
    return v_apercu;
  end if;
  if v_apercu -> 'blocage' <> 'null'::jsonb then
    return jsonb_build_object(
      'ok', false,
      'erreur',  v_apercu -> 'blocage' ->> 'code',
      'message', v_apercu -> 'blocage' ->> 'message');
  end if;

  select * into v_profil from public.profiles where id = v_uid;
  v_email := lower(coalesce(v_profil.email, ''));

  -- 1. Trousseaux : le logement, le badge et la photo identifient
  --    un bien et son propriétaire. Le jeton de certificat est
  --    régénéré, ce qui révoque tous les liens déjà partagés.
  update public.keys set
    logement             = 'Trousseau supprimé',
    badge_uid            = null,
    photo_url            = null,
    code_badge_imprime   = 'SUPPR' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 11),
    certificat_token     = gen_random_uuid(),
    date_retour_attendue = null,
    retard_notifie       = false
  where hote_id = v_uid;

  -- 2. Codes de retrait émis sur ces trousseaux : l'identité du
  --    bénéficiaire est une donnée personnelle de tiers.
  update public.access_codes ac set
    beneficiaire_email = null,
    beneficiaire_nom   = null,
    qr_payload         = '',
    statut = case when ac.statut = 'actif'
                  then 'revoque'::public.access_code_status
                  else ac.statut end
  from public.keys k
  where k.id = ac.key_id and k.hote_id = v_uid;

  -- 3. Codes reçus sur les clés d'autrui : l'email du partant y
  --    figure aussi. On le retire et on révoque l'accès — un code
  --    actif adressé à un compte disparu n'a plus de titulaire.
  update public.access_codes set
    beneficiaire_email = null,
    beneficiaire_nom   = null,
    statut = case when statut = 'actif'
                  then 'revoque'::public.access_code_status
                  else statut end
  where v_email <> '' and lower(beneficiaire_email) = v_email;

  -- 4. Accès récurrents : un horaire hebdomadaire décrit les
  --    habitudes d'une personne. Aucun motif de conservation.
  delete from public.acces_recurrents ar
   using public.keys k
   where k.id = ar.key_id and k.hote_id = v_uid;

  delete from public.acces_recurrents
   where v_email <> '' and lower(beneficiaire_email) = v_email;

  -- 5. Journal : on retire l'identité, on garde le fait.
  --    Le drapeau n'est levé que le temps de cet UPDATE.
  perform set_config('keywi.anonymisation', 'on', true);

  update public.movements mv
     set details = mv.details - 'beneficiaire' - 'logement'
    from public.keys k
   where k.id = mv.key_id
     and k.hote_id = v_uid
     and (mv.details ? 'beneficiaire' or mv.details ? 'logement');

  perform set_config('keywi.anonymisation', 'off', true);

  -- 6. Notifications : leur charge utile recopie logements,
  --    bénéficiaires et codes. Rien à conserver.
  delete from public.notifications where user_id = v_uid;

  -- 7. Clés d'API : un secret rattaché à un compte fermé.
  delete from public.api_keys where hote_id = v_uid;

  -- 8. Candidature « devenir point relais » déposée avec cet email.
  update public.candidatures_commercants set
    nom_contact = v_marque,
    email       = '',
    telephone   = null,
    message     = null
  where v_email <> '' and lower(email) = v_email;

  -- 9. Point relais éventuel : détaché de son ancien propriétaire
  --    et retiré de la carte publique.
  update public.relay_points
     set owner_id = null,
         statut   = 'inactif'
   where owner_id = v_uid;

  -- 10. Les paiements restent tels quels : montants et dates sont
  --     des écritures comptables. Ils pointent désormais vers un
  --     profil anonyme, ce qui suffit à les délier d'une personne.

  -- 11. Le profil devient une pierre tombale.
  update public.profiles set
    nom          = v_marque,
    email        = null,
    telephone    = null,
    anonymise_le = now()
  where id = v_uid;

  return jsonb_build_object(
    'ok', true,
    'anonymise_le', now(),
    'trousseaux',   v_apercu -> 'trousseaux',
    'mouvements',   v_apercu -> 'mouvements'
  );
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant  execute on function public.supprimer_mon_compte() to authenticated;

-- ------------------------------------------------------------
-- Finalisation côté authentification.
--
-- L'API d'administration réécrit l'email et bannit le compte,
-- mais elle ne donne pas prise sur `auth.identities` : le nom
-- fourni à l'inscription y survit, recopié dans `identity_data`.
-- Un effacement qui laisse le nom en base n'est pas un
-- effacement — d'où cette passe finale, réservée au service role
-- et appelée après la réécriture de l'email.
--
-- On conserve `sub` et l'email (désormais neutralisé) : GoTrue
-- s'attend à les trouver.
-- ------------------------------------------------------------
create or replace function public.finaliser_suppression_auth(p_user_id uuid)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then
    return jsonb_build_object('ok', false, 'erreur', 'UTILISATEUR_INCONNU');
  end if;

  update auth.identities
     set identity_data = jsonb_build_object(
           'sub',   p_user_id::text,
           'email', v_email)
   where user_id = p_user_id;

  -- Ceinture et bretelles : le bannissement bloque déjà le
  -- rafraîchissement de jeton, mais autant couper les sessions
  -- ouvertes ailleurs.
  if to_regclass('auth.sessions') is not null then
    delete from auth.sessions where user_id = p_user_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function public.finaliser_suppression_auth(uuid)
  from public, anon, authenticated;
grant  execute on function public.finaliser_suppression_auth(uuid) to service_role;

-- ------------------------------------------------------------
-- Un compte anonymisé n'est plus un compte : on lui ferme la
-- lecture de son propre profil, au cas où une session aurait
-- survécu à la bascule.
-- ------------------------------------------------------------
drop policy if exists "profiles : lecture de son propre profil" on public.profiles;
create policy "profiles : lecture de son propre profil"
  on public.profiles for select
  using ((id = auth.uid() and anonymise_le is null) or public.est_admin());

drop policy if exists "profiles : mise à jour de son propre profil" on public.profiles;
create policy "profiles : mise à jour de son propre profil"
  on public.profiles for update
  using (id = auth.uid() and anonymise_le is null)
  with check (id = auth.uid() and anonymise_le is null);
