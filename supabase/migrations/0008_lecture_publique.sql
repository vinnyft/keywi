-- ============================================================
-- Keywi — Migration 0008 : réparer la lecture publique
--
-- La politique RLS de relay_points s'appuie sur est_admin() :
--   using (statut = 'actif' or owner_id = auth.uid() or est_admin())
-- Or la migration 0003 révoque l'exécution de TOUTES les fonctions
-- du schéma public au rôle « anon ». Un visiteur non connecté
-- déclenchait donc « permission denied for function est_admin »
-- et ne voyait AUCUN point relais : carte publique et page
-- casiers vides.
--
-- On rend ces deux fonctions exécutables par « anon ». Aucune
-- fuite : pour un visiteur anonyme auth.uid() est nul, donc
-- get_my_role() renvoie null et est_admin() renvoie false.
-- ============================================================

grant execute on function public.get_my_role() to anon;
grant execute on function public.est_admin() to anon;
