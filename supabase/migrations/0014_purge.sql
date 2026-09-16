-- ============================================================
-- Keywi — Migration 0014 : purge planifiée (durées de conservation)
--
-- La politique de confidentialité annonce des durées ; encore
-- faut-il les appliquer (RGPD art. 5.1.c et 5.1.e). Cette fonction,
-- appelée par un cron, fait le ménage — sans jamais toucher à ce
-- qui doit survivre : le journal des mouvements (immuable) et les
-- écritures de paiement (obligation comptable de 10 ans).
--
-- Trois gestes :
--   1. les codes de retrait échus mais encore marqués « actif »
--      passent à « expire » (cohérence d'état) ;
--   2. les codes consommés (utilise / revoque / expire) sont
--      dépouillés de l'identité du bénéficiaire au-delà de 30 jours
--      — un tiers n'a pas à voir son email conservé une fois le
--      code sans usage (minimisation, pas suppression : la ligne
--      reste pour l'intégrité référentielle) ;
--   3. les candidatures commerçants sont effacées au-delà de 3 ans,
--      durée annoncée dans la politique.
-- ============================================================

create or replace function public.purger_donnees()
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_expires    int;
  v_minimises  int;
  v_candidatures int;
  v_tentatives int;
begin
  -- 1. Cohérence d'état : un code dont la date est passée n'est
  --    plus « actif », même si aucun retrait ne l'a consommé.
  update public.access_codes
     set statut = 'expire'
   where statut = 'actif'
     and expire_at is not null
     and expire_at < now();
  get diagnostics v_expires = row_count;

  -- 2. Minimisation : au-delà de 30 jours, un code consommé ne
  --    conserve plus l'identité du bénéficiaire. On ne supprime pas
  --    la ligne (des vues et l'historique s'y appuient), on la vide
  --    de sa donnée personnelle de tiers.
  update public.access_codes
     set beneficiaire_email = null,
         beneficiaire_nom   = null,
         qr_payload         = ''
   where statut in ('utilise', 'revoque', 'expire')
     and created_at < now() - interval '30 days'
     and (beneficiaire_email is not null or beneficiaire_nom is not null);
  get diagnostics v_minimises = row_count;

  -- 3. Candidatures « devenir point relais » : 3 ans, comme annoncé.
  delete from public.candidatures_commercants
   where created_at < now() - interval '3 years';
  get diagnostics v_candidatures = row_count;

  -- 4. Compteurs de limitation de débit : la RPC de contrôle les
  --    purge déjà à 24 h, mais une table jamais sollicitée (aucune
  --    tentative récente) ne serait jamais nettoyée. Filet.
  delete from public.tentatives
   where created_at < now() - interval '24 hours';
  get diagnostics v_tentatives = row_count;

  return jsonb_build_object(
    'ok', true,
    'codes_expires',      v_expires,
    'codes_minimises',    v_minimises,
    'candidatures',       v_candidatures,
    'tentatives',         v_tentatives
  );
end;
$$;

revoke execute on function public.purger_donnees() from public, anon, authenticated;
grant  execute on function public.purger_donnees() to service_role;
