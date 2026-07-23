-- ============================================================
-- Keywi — Migration 0010 : certificat de traçabilité
--
-- Le journal des mouvements est déjà inaltérable (trigger
-- movements_immuables) et chaque remise est vérifiée par le badge
-- physique. Cette valeur est invisible pour l'utilisateur : le
-- certificat la matérialise en une page partageable, opposable
-- à un assureur, une agence ou une copropriété.
--
-- Accès : par jeton propre à la clé, non devinable et distinct
-- de son identifiant interne. Le lien se partage sans donner
-- accès à l'espace de l'hôte, et peut être régénéré (révocation).
-- ============================================================

alter table public.keys
  add column if not exists certificat_token uuid not null default gen_random_uuid();

create unique index if not exists idx_keys_certificat_token
  on public.keys (certificat_token);

comment on column public.keys.certificat_token is
  'Jeton public du certificat de traçabilité. Régénérable pour révoquer les liens déjà partagés.';

-- ------------------------------------------------------------
-- Certificat public : chaîne de garde complète d'un trousseau.
--
-- Volontairement expurgé : ni email, ni identité de l'hôte, ni
-- adresse du logement. On expose ce qui prouve la garde — les
-- lieux de dépôt, l'horodatage, la case, le bénéficiaire — et
-- rien de plus.
-- ------------------------------------------------------------
create or replace function public.certificat_public(p_token uuid)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_key        public.keys;
  v_mouvements jsonb;
begin
  select * into v_key from public.keys where certificat_token = p_token;
  if v_key.id is null then
    return jsonb_build_object('ok', false, 'erreur', 'CERTIFICAT_INCONNU');
  end if;

  select coalesce(jsonb_agg(m order by m.created_at), '[]'::jsonb)
  into v_mouvements
  from (
    select
      mv.type,
      mv.created_at,
      rp.nom          as lieu,
      rp.type::text   as lieu_type,
      rp.ville,
      mv.details ->> 'case_numero'  as case_numero,
      mv.details ->> 'beneficiaire' as beneficiaire,
      -- Un mouvement scanné par un commerçant atteste d'une
      -- vérification du badge au comptoir
      (mv.scanned_by is not null)   as verifie_par_scan
    from public.movements mv
    left join public.relay_points rp on rp.id = mv.relay_point_id
    where mv.key_id = v_key.id
  ) m;

  return jsonb_build_object(
    'ok', true,
    'logement',    v_key.logement,
    'badge',       v_key.code_badge_imprime,
    'statut',      v_key.statut,
    'creee_le',    v_key.created_at,
    'mouvements',  v_mouvements,
    'emis_le',     now()
  );
end;
$$;

-- Lecture publique assumée : le jeton EST le secret
grant execute on function public.certificat_public(uuid) to anon, authenticated, service_role;
