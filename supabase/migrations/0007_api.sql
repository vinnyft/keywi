-- ============================================================
-- Keywi — Migration 0007 : API publique
-- Des clés API permettent aux partenaires (conciergeries, PMS,
-- automatisations type Airbnb) de piloter leurs clés Keywi.
--
-- Sécurité : seul le HACHAGE de la clé est stocké (SHA-256).
-- La valeur en clair n'est affichée qu'une fois, à la création.
-- ============================================================

create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  hote_id      uuid not null references public.profiles (id) on delete cascade,
  nom          text not null,                 -- libellé choisi par l'hôte
  prefixe      text not null,                 -- 8 premiers caractères, pour reconnaître la clé
  cle_hash     text not null unique,          -- sha256 de la clé complète
  derniere_utilisation timestamptz,
  revoquee_le  timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_api_keys_hote on public.api_keys (hote_id);

alter table public.api_keys enable row level security;

-- L'hôte gère ses propres clés ; le hash n'est jamais réversible
create policy "api_keys : lecture de ses clés"
  on public.api_keys for select
  using (hote_id = auth.uid() or public.est_admin());

create policy "api_keys : création de ses clés"
  on public.api_keys for insert
  with check (hote_id = auth.uid());

create policy "api_keys : révocation de ses clés"
  on public.api_keys for update
  using (hote_id = auth.uid())
  with check (hote_id = auth.uid());

-- Les grants de la migration 0002 ne couvrent que les tables qui
-- existaient alors : on accorde explicitement pour cette table.
-- (La RLS ci-dessus reste le filtre par ligne.)
grant select, insert, update on public.api_keys to authenticated;
grant select, insert, update, delete on public.api_keys to service_role;

-- ------------------------------------------------------------
-- Résolution d'une clé API → hôte propriétaire.
-- Appelée par le serveur (service role) à chaque requête API :
-- vérifie que la clé existe, n'est pas révoquée, et journalise
-- la dernière utilisation.
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

  return jsonb_build_object('ok', true, 'hote_id', v_cle.hote_id, 'nom', v_cle.nom);
end;
$$;

revoke execute on function public.api_resoudre_cle(text) from public, anon, authenticated;
grant execute on function public.api_resoudre_cle(text) to service_role;

-- ------------------------------------------------------------
-- Création d'un code de retrait via l'API.
-- Variante de creer_code_retrait() : l'appelant est le serveur
-- (service role), donc auth.uid() est nul — l'hôte propriétaire
-- est passé explicitement, après validation de la clé API.
-- ------------------------------------------------------------
create or replace function public.api_creer_code_retrait(
  p_key_id uuid,
  p_hote_id uuid,
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
  -- L'isolation entre comptes tient à ce filtre
  select * into v_key from public.keys
  where id = p_key_id and hote_id = p_hote_id;
  if v_key.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_INTROUVABLE');
  end if;
  if v_key.statut = 'perdue' then
    return jsonb_build_object('ok', false, 'erreur', 'CLE_PERDUE');
  end if;

  v_code := public.generer_code_retrait();

  insert into public.access_codes (key_id, code_6, qr_payload, beneficiaire_email, beneficiaire_nom, expire_at)
  values (p_key_id, v_code, 'KEYWI:' || v_code, p_beneficiaire_email, p_beneficiaire_nom, p_expire_at)
  returning * into v_ac;

  if v_key.statut = 'deposee' then
    update public.keys set statut = 'prete_retrait' where id = p_key_id;
  end if;

  if p_beneficiaire_email is not null
     and v_key.statut in ('deposee', 'prete_retrait', 'retour') then
    select * into v_benef_profile from public.profiles
    where email = p_beneficiaire_email limit 1;
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

revoke execute on function public.api_creer_code_retrait(uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.api_creer_code_retrait(uuid, uuid, text, text, timestamptz)
  to service_role;
