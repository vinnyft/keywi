-- ============================================================
-- 0019 — Nouveau rôle « commercial »
-- ============================================================
-- Keywi ouvre un environnement dédié aux commerciaux (indépendants,
-- Junior-Entreprises, sales) qui démarchent des points relais à Paris.
-- Ils se connectent avec leur propre identifiant et atterrissent dans
-- l'espace /commercial (voir la redirection par rôle côté app).
--
-- On se contente ICI d'étendre l'enum : l'ajout d'une valeur d'enum
-- doit être validé (committé) avant d'être RÉFÉRENCÉ. Les fonctions,
-- tables et politiques qui utilisent 'commercial' vivent donc dans la
-- migration suivante (0020), appliquée dans une transaction distincte.
-- ------------------------------------------------------------

alter type public.user_role add value if not exists 'commercial';
