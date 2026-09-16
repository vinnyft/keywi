-- ============================================================
-- 0018 — Langue portée par un code de retrait
-- ============================================================
-- Un bénéficiaire n'a pas forcément de compte Keywi : sa langue
-- n'est donc pas dans `profiles`. On la stocke sur le code de
-- retrait, renseignée depuis la langue choisie par l'hôte au
-- moment du partage. Les emails au bénéficiaire (code de retrait,
-- clés disponibles) résolvent alors la langue via ce champ
-- (voir src/lib/notifications.ts : langueDestinataire).
--
-- Repli : 'fr'.
-- ------------------------------------------------------------

alter table public.access_codes
  add column if not exists langue text not null default 'fr';

alter table public.access_codes
  drop constraint if exists access_codes_langue_check;
alter table public.access_codes
  add constraint access_codes_langue_check check (langue in ('fr', 'en'));
