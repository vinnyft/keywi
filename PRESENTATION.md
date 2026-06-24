# KLAV — Présentation du projet

> Document de prise en main destiné à un nouvel associé / développeur.
> Tu as ici **tout** pour comprendre le projet, le lancer et le déployer.

---

## 1. Le projet en une phrase

**KLAV est une plateforme française de gestion de clés par points relais** :
on dépose ses clés dans un commerce de quartier partenaire (café, librairie,
pressing…), et on gère les accès à distance grâce à des codes de retrait —
une alternative française à KeyNest.

---

## 2. Ce qui est déjà développé (fonctionnel et testé)

Le produit complet tourne de bout en bout. Trois espaces reliés par une même
base de données **temps réel** :

### 🏠 L'application client (web app installable / PWA)
- Écran d'entrée à la Airbnb : **KeyHost** (je gère des clés) ou **Guest**
  (je récupère des clés).
- **CRM KeyHost** : nombre de clés, jours d'occupation par clé, revenus
  générés, cases occupées / libres — le tout en temps réel.
- **Espace Guest** : ma clé, son code de retrait + QR, depuis combien de temps
  elle m'attend, le coût (déjà réglé par l'hôte), l'adresse et un lien
  d'itinéraire.
- Dépôt d'une clé : choix du point relais sur une carte, paiement, génération
  d'un code à 6 caractères + QR, partage par email / WhatsApp.

### 🛍️ L'application commerçant (mobile, derrière le comptoir)
- **Scan du badge RFID/NFC** (3 modes : NFC Android, lecteur USB, ou saisie
  manuelle du code imprimé).
- Dépôt : le badge est validé → **un numéro de case s'affiche en grand** → le
  commerçant range le trousseau et confirme.
- Retrait : le client donne son code → la case s'affiche → **re-scan du badge
  pour vérification** (anti-erreur) → la case se libère.
- Grille des cases en temps réel, historique du jour, compteur de
  rémunération mensuelle.

### 🌐 Le site public + l'admin
- Accueil, 7 pages « cas d'usage » (Airbnb, conciergeries, agences…), carte
  interactive des points relais, page de recrutement des commerçants, tarifs,
  FAQ, pages légales.
- Espace admin : validation des candidatures commerçants, vue du parc.

### 🔔 Le reste
- **Notifications** automatiques (email + dans l'app) à chaque étape, aux
  couleurs de la marque.
- **Synchronisation temps réel** : quand le commerçant scanne, le statut
  change instantanément côté client, sans rafraîchir la page.

---

## 3. La stack technique

| Brique | Choix | Pourquoi |
|--------|-------|----------|
| Framework | **Next.js 16** (App Router) + TypeScript | rendu serveur, une seule base de code pour site + apps |
| Style | **Tailwind CSS 4** | design system maison (couleurs, composants) |
| Base / Auth / Temps réel | **Supabase** (PostgreSQL) | base + authentification + synchronisation live, sécurité par lignes (RLS) |
| Carte | **Leaflet + OpenStreetMap** | gratuit, sans clé API |
| Emails | **Resend** | (optionnel — sinon journalisés) |
| Paiement | **Stripe** (mode test) | (optionnel — sinon paiement simulé) |
| Hébergement cible | **Vercel** + **Supabase Cloud** | gratuit pour démarrer |

**Logique métier sécurisée côté base** : l'attribution des cases, les dépôts
et retraits passent par des fonctions PostgreSQL transactionnelles (impossible
d'attribuer deux fois la même case, journal des mouvements inviolable).

---

## 4. Lancer le projet en local (pas à pas)

### Prérequis à installer
- **Node.js** ≥ 20 — <https://nodejs.org>
- **Docker** (Docker Desktop le plus simple) — <https://www.docker.com>
- **CLI Supabase** — `npm install -g supabase` (ou voir doc Supabase)

### Commandes
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer la base locale (applique migrations + données de démo)
supabase start

# 3. Configurer les variables d'environnement
cp .env.example .env.local      # les valeurs par défaut conviennent en local

# 4. Lancer le site
npm run dev
```
Ouvrir <http://localhost:3000>.

### Comptes de démonstration
Mot de passe commun : **`klav123456`**
| Rôle | Email |
|------|-------|
| Hôte (KeyHost & Guest) | `hote1@klav.fr` |
| Voyageur (Guest) | `voyageur@klav.fr` |
| Commerçant | `commerce3@klav.fr` |
| Admin | `admin@klav.fr` |

👉 Le scénario de test complet est dans **TESTS.md**.

---

## 5. Mettre en ligne

Tout est expliqué dans **DEPLOIEMENT.md** : déploiement gratuit sur
**Vercel** (le site) + **Supabase Cloud** (la base), avec une URL publique
type `klav.vercel.app`.

---

## 6. Structure du code

```
KLAV/
├── README.md            # doc technique de référence
├── DEPLOIEMENT.md       # guide de mise en ligne
├── TESTS.md             # scénario de test de bout en bout
├── PRESENTATION.md      # ce document
├── src/
│   ├── app/
│   │   ├── (marketing)/  # site public (accueil, cas d'usage, tarifs…)
│   │   ├── (auth)/       # connexion / inscription
│   │   ├── (client)/espace/   # app client : KeyHost (CRM) + Guest
│   │   ├── commercant/   # app comptoir (scan, cases, historique)
│   │   ├── admin/        # back-office
│   │   └── api/          # auth, webhook Stripe, aperçu emails
│   ├── components/       # composants par domaine
│   ├── hooks/            # scan RFID, temps réel
│   └── lib/              # accès base, emails, paiement, actions serveur
└── supabase/
    ├── migrations/       # schéma de la base (4 fichiers SQL)
    └── seed.sql          # données de démonstration
```

---

## 7. Modèle économique (intégré au produit)

- **Côté client** : dépôt à l'unité **7,90 €**, ou abonnement hôte
  **5,49 €/mois** par trousseau (positionné sous KeyNest, ~5,95 £).
- **Côté commerçant** : rémunération progressive par mouvement scanné —
  0,80 € jusqu'au 50ᵉ du mois, 1,00 € jusqu'au 150ᵉ, puis 1,20 € (paliers
  paramétrables en base).

---

## 8. Pistes pour la suite

- Déploiement en ligne (guide prêt — voir DEPLOIEMENT.md).
- Brancher Stripe et Resend en réel (clés à ajouter, code déjà prêt).
- Application native (App Store / Play Store) via un emballage Capacitor
  autour de la PWA existante — utile pour le scan NFC sur iPhone.
- Étendre le réseau au-delà des 3ᵉ/10ᵉ/11ᵉ arrondissements de Paris (données
  de démo actuelles).
- Tableau de bord d'analytics, export comptable, API pour conciergeries.

---

*Projet développé avec l'assistant Claude Code. Historique complet des
modifications disponible via `git log`.*
