-- ============================================================
-- 0017 — Langue de préférence du profil (pour les emails)
-- ============================================================
-- Les notifications email (src/lib/notifications.ts) sont
-- bilingues : chaque envoi résout la langue du destinataire depuis
-- son profil. On stocke donc une préférence de langue, renseignée
-- à l'inscription depuis la langue du site.
--
-- Repli : 'fr'. Un destinataire sans compte (bénéficiaire d'un
-- code) n'a pas de profil : l'email part alors en français, sauf
-- si l'appelant fournit explicitement une langue.
-- ------------------------------------------------------------

alter table public.profiles
  add column if not exists langue text not null default 'fr';

alter table public.profiles
  drop constraint if exists profiles_langue_check;
alter table public.profiles
  add constraint profiles_langue_check check (langue in ('fr', 'en'));
