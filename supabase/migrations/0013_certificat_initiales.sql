-- ============================================================
-- Keywi — Migration 0013 : certificat, initiales du bénéficiaire
--
-- Le certificat public (migration 0010) affichait le bénéficiaire
-- en clair (« remis à Léa Martin »). Le commentaire de 0010
-- promettait pourtant « ni email, ni identité de l'hôte » — vrai
-- pour l'hôte, faux pour le bénéficiaire, dont le nom identifie
-- une personne sur une page atteignable par simple jeton.
--
-- On garde la preuve d'une remise nominative — l'assureur veut
-- savoir que les clés ont été remises à quelqu'un d'identifié —
-- sans divulguer le nom. Les initiales suffisent : « L. M. ».
-- ============================================================

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
      -- Initiales du bénéficiaire, pas son nom : chaque mot réduit
      -- à sa première lettre suivie d'un point (« Léa Martin » → « L. M. »).
      -- Le champ reste non nul quand une remise nominative a eu lieu,
      -- ce qui préserve la valeur probante sans exposer l'identité.
      nullif(
        trim(regexp_replace(
          upper(coalesce(mv.details ->> 'beneficiaire', '')),
          '(\S)\S*\s*', '\1. ', 'g'
        )),
        ''
      ) as beneficiaire,
      (mv.scanned_by is not null) as verifie_par_scan
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

grant execute on function public.certificat_public(uuid) to anon, authenticated, service_role;
