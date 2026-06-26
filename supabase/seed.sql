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

-- Palette carreaux (6 couleurs — glaçure zellige)
insert into public.colors (nom, hex, type, ordre, actif) values
  ('Bleu Klein',      '#002FA7', 'tile', 1, true),
  ('Jaune Moutarde',  '#D9A411', 'tile', 2, true),
  ('Vert Émeraude',   '#0A6B4F', 'tile', 3, true),
  ('Rouge Écarlate',  '#C8102E', 'tile', 4, true),
  ('Blanc Crème',     '#F2EBDD', 'tile', 5, true),
  ('Noir',            '#15110D', 'tile', 6, true);

-- Palette joints (6 couleurs)
insert into public.colors (nom, hex, type, ordre, actif) values
  ('Joint Blanc',     '#FFFFFF', 'grout', 1, true),
  ('Joint Gris Clair','#CCCCCC', 'grout', 2, true),
  ('Joint Gris',      '#888888', 'grout', 3, true),
  ('Joint Anthracite','#333333', 'grout', 4, true),
  ('Joint Noir',      '#111111', 'grout', 5, true),
  ('Joint Sable',     '#C8B89A', 'grout', 6, true);

-- Promotions de démonstration
insert into public.promotions (
  code, type, valeur, seuil_montant, actif, usage_unique, description
) values
  ('PREMIERE', 'pourcentage',     10,   null, true, false, '−10 % sur votre première commande'),
  ('KUBE500',  'livraison_gratuite', 0, 500,  true, false, 'Livraison offerte dès 500 €'),
  ('PACK2',    'pourcentage',      8,   null, true, false, '−8 % à partir de 2 articles dans le panier')
on conflict (code) do nothing;
