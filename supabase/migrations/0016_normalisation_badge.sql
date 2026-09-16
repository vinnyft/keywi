-- ============================================================
-- 0016 — Normalisation des identifiants de badge
-- ============================================================
-- Un même badge physique peut être lu sous des formes différentes
-- selon le lecteur : Web NFC renvoie l'UID en hexa avec séparateurs
-- (« 04:A2:B3 »), un lecteur USB peut le sortir sans séparateur
-- (« 04A2B3 ») ou en casse différente. Sans normalisation, ces
-- variantes ne s'apparient pas entre elles.
--
-- On canonise l'UID (MAJUSCULES + retrait de tout caractère non
-- alphanumérique) des DEUX côtés de la comparaison, en base comme
-- dans l'app (voir src/lib/badge.ts : normaliserBadge, appliqué à la
-- source dans le hook de scan).
--
-- Ne réconcilie PAS un encodage différent (décimal vs hexadécimal) :
-- les lecteurs USB doivent être réglés en sortie hexa.
-- ------------------------------------------------------------

create or replace function public.normaliser_badge(p_valeur text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_valeur, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Recherche d'une clé par badge : appariement sur l'UID normalisé
-- (indépendant des séparateurs et de la casse) OU sur le code
-- imprimé. Un badge_uid null se normalise en '' et ne peut donc
-- pas matcher accidentellement un scan réel.
create or replace function public.trouver_cle_par_badge(p_badge text)
returns public.keys
language sql
stable
security definer set search_path = public
as $$
  select * from public.keys
  where (
          public.normaliser_badge(badge_uid) <> ''
          and public.normaliser_badge(badge_uid) = public.normaliser_badge(p_badge)
        )
     or code_badge_imprime = upper(trim(p_badge))
  limit 1;
$$;

grant execute on function public.normaliser_badge(text) to anon, authenticated, service_role;
