-- ============================================================
-- 0025 — Par défaut, un code de retrait est à usage unique
-- ============================================================
-- Comportement historique (et le plus sûr) : un code est consommé au
-- premier retrait. La 0022 avait introduit `usage_unique` avec un
-- défaut `false` (réutilisable), ce qui changeait ce comportement pour
-- tous les codes créés sans le préciser (API, accès récurrents…).
-- On rétablit le défaut « usage unique » ; le propriétaire choisit
-- explicitement « réutilisable » depuis l'espace client s'il le veut.
-- ------------------------------------------------------------

alter table public.access_codes
  alter column usage_unique set default true;
