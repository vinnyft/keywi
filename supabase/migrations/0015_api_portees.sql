-- ============================================================
-- Keywi — Migration 0015 : portées des clés API
--
-- Une clé API donnait jusqu'ici un accès complet : lecture des
-- trousseaux ET création de codes de retrait, sans limite. Une clé
-- fuitée (dépôt Git, capture d'écran, presse-papier) ouvrait donc
-- tout le compte de l'hôte, et permettait de générer autant de
-- codes d'accès qu'on voulait.
--
-- Deux réponses ici :
--   · des PORTÉES — une clé « automatisation Airbnb » n'a besoin
--     que de créer des codes ; une clé de reporting, que de lire.
--     Le moindre privilège limite les dégâts d'une fuite.
--   · le renvoi de l'identifiant de la clé, pour permettre au
--     serveur d'en limiter le débit (voir src/lib/api-auth.ts).
-- ============================================================

-- Portées possibles : 'lire' (GET /cles) et 'creer' (POST /codes).
-- Les clés existantes gardent les deux — on ne casse aucun intégration.
alter table public.api_keys
  add column if not exists portees text[] not null default array['lire', 'creer']::text[];

alter table public.api_keys
  add constraint api_keys_portees_valides
  check (portees <@ array['lire', 'creer']::text[] and array_length(portees, 1) >= 1);

comment on column public.api_keys.portees is
  'Droits accordés à la clé : « lire » (lecture des trousseaux), « creer » (création de codes de retrait). Principe du moindre privilège.';

-- ------------------------------------------------------------
-- Résolution enrichie : renvoie aussi l'identifiant (pour la
-- limitation de débit) et les portées (pour le contrôle d'accès).
-- ------------------------------------------------------------
create or replace function public.api_resoudre_cle(p_hash text)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_cle public.api_keys;
begin
  select * into v_cle from public.api_keys
  where cle_hash = p_hash and revoquee_le is null;

  if v_cle.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_INVALIDE');
  end if;

  update public.api_keys set derniere_utilisation = now() where id = v_cle.id;

  return jsonb_build_object(
    'ok', true,
    'api_key_id', v_cle.id,
    'hote_id', v_cle.hote_id,
    'nom', v_cle.nom,
    'portees', v_cle.portees
  );
end;
$$;

revoke execute on function public.api_resoudre_cle(text) from public, anon, authenticated;
grant execute on function public.api_resoudre_cle(text) to service_role;
