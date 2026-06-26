-- ============================================================
-- KUBE — Données de démarrage (seed)
-- ============================================================

-- Utilisateur admin (mot de passe : Admin1234!)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-a000-000000000001',
  'authenticated', 'authenticated',
  'admin@kube.fr',
  '$2a$06$ALKM9URNpL4OaZA9ekiLfeWO6330wnkSfBYxSb1hdfzAEF1UH6PlS',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"nom":"Admin KUBE","role":"admin"}',
  now(), now(), false
) on conflict (id) do nothing;

insert into public.profiles (id, email, nom, role) values (
  '00000000-0000-4000-a000-000000000001',
  'admin@kube.fr', 'Admin KUBE', 'admin'
) on conflict (id) do nothing;

-- Paramètres globaux
insert into public.settings (
  id, hauteur_fixe_cm, cout_fixe, forfait_livraison,
  seuil_livraison_gratuite, dessous_carrelee, texte_accueil
) values (
  1, 45, 50, 80, 500, false,
  'Le mobilier mosaïque sur-mesure.'
) on conflict (id) do nothing;

-- Paliers de prix par m²
insert into public.pricing_tiers (taille_min_cm, taille_max_cm, prix_par_m2, label) values
  (1,  2,  850, '1–2 cm (micro-mosaïque)'),
  (3,  5,  480, '3–5 cm (classique)'),
  (6, 10,  320, '6–10 cm (grand format)')
on conflict do nothing;

-- Surcharges couleurs
insert into public.color_surcharges (nb_couleurs, surcharge_pct) values
  (1, 0),
  (2, 5),
  (3, 10),
  (4, 15)
on conflict (nb_couleurs) do nothing;

-- Palette carreaux zellige (52 couleurs, 9 familles)
insert into public.colors (nom, hex, type, ordre, actif) values
  -- Neutres & crèmes
  ('Blanc craie',       '#F2EFE9', 'tile',  1, true),
  ('Crème',             '#ECE5D8', 'tile',  2, true),
  ('Blanc cassé froid', '#E8EAE6', 'tile',  3, true),
  ('Gris perle',        '#D7D9D6', 'tile',  4, true),
  ('Gris clair',        '#C4C7C5', 'tile',  5, true),
  ('Lin',               '#E2DAC9', 'tile',  6, true),
  -- Verts
  ('Vert amande',       '#C7D8B5', 'tile',  7, true),
  ('Vert pâle',         '#B9CBA0', 'tile',  8, true),
  ('Vert pomme',        '#8FB45E', 'tile',  9, true),
  ('Vert vif',          '#7FA84A', 'tile', 10, true),
  ('Sauge',             '#9BAE8E', 'tile', 11, true),
  ('Vert olive',        '#7C7E4F', 'tile', 12, true),
  ('Vert mousse',       '#5E7A3C', 'tile', 13, true),
  ('Vert sapin',        '#3E5A33', 'tile', 14, true),
  ('Vert foncé',        '#2C4327', 'tile', 15, true),
  ('Vert-de-gris',      '#6E7A6E', 'tile', 16, true),
  -- Bleus
  ('Bleu glacier',      '#C5D6D8', 'tile', 17, true),
  ('Bleu gris',         '#A7BCC2', 'tile', 18, true),
  ('Bleu ciel',         '#8FC0D4', 'tile', 19, true),
  ('Bleu clair',        '#6FA8C7', 'tile', 20, true),
  ('Bleu franc',        '#4E86B0', 'tile', 21, true),
  ('Bleu pétrole',      '#2E6E7E', 'tile', 22, true),
  ('Bleu canard',       '#1F5660', 'tile', 23, true),
  ('Pervenche',         '#8E9FD6', 'tile', 24, true),
  ('Bleu outremer',     '#3F4FA0', 'tile', 25, true),
  ('Bleu nuit',         '#232C66', 'tile', 26, true),
  -- Jaunes & ambres
  ('Jaune paille',      '#E5D08A', 'tile', 27, true),
  ('Jaune doux',        '#E8C75E', 'tile', 28, true),
  ('Jaune d''or',       '#F0B53C', 'tile', 29, true),
  ('Ambre',             '#E8A02E', 'tile', 30, true),
  ('Moutarde',          '#C99A3A', 'tile', 31, true),
  ('Kaki',              '#8A7C3E', 'tile', 32, true),
  -- Oranges & terracotta
  ('Orange',            '#E08A3C', 'tile', 33, true),
  ('Terracotta',        '#C9663E', 'tile', 34, true),
  ('Brique',            '#B5512F', 'tile', 35, true),
  ('Rouille',           '#A8482B', 'tile', 36, true),
  -- Roses & mauves
  ('Rose poudré',       '#E8C9C4', 'tile', 37, true),
  ('Blush',             '#E3B7B2', 'tile', 38, true),
  ('Vieux rose',        '#CFA0A0', 'tile', 39, true),
  ('Rose terre',        '#C97E78', 'tile', 40, true),
  ('Rose corail',       '#D87560', 'tile', 41, true),
  ('Mauve',             '#C3B0C4', 'tile', 42, true),
  -- Rouges & bordeaux
  ('Rouge brique',      '#B23A2E', 'tile', 43, true),
  ('Rouge profond',     '#9E2B25', 'tile', 44, true),
  ('Bordeaux',          '#6E2420', 'tile', 45, true),
  ('Lie de vin',        '#5A2530', 'tile', 46, true),
  -- Violets
  ('Aubergine',         '#4A2A4D', 'tile', 47, true),
  ('Prune sombre',      '#3E2440', 'tile', 48, true),
  -- Sombres
  ('Gris ardoise',      '#5A6066', 'tile', 49, true),
  ('Brun',              '#4E3A2E', 'tile', 50, true),
  ('Anthracite',        '#2C2C2E', 'tile', 51, true),
  ('Noir zellige',      '#1A1A1C', 'tile', 52, true);

-- Palette joints (6 couleurs)
insert into public.colors (nom, hex, type, ordre, actif) values
  ('Joint Ivoire',     '#F3EFE7', 'grout', 1, true),
  ('Joint Blanc',      '#FFFFFF', 'grout', 2, true),
  ('Joint Sable',      '#C8B89A', 'grout', 3, true),
  ('Joint Gris',       '#808080', 'grout', 4, true),
  ('Joint Anthracite', '#333333', 'grout', 5, true),
  ('Joint Noir',       '#111111', 'grout', 6, true);

-- Promotions de démonstration
insert into public.promotions (
  code, type, valeur, seuil_montant, actif, usage_unique, description
) values
  ('PREMIERE', 'pourcentage',     10,   null, true, false, '−10 % sur votre première commande'),
  ('KUBE500',  'livraison_gratuite', 0, 500,  true, false, 'Livraison offerte dès 500 €'),
  ('PACK2',    'pourcentage',      8,   null, true, false, '−8 % à partir de 2 articles dans le panier')
on conflict (code) do nothing;
