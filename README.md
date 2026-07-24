# Keywi — Vos clés, en lieu sûr, près de chez vous

Plateforme française de gestion de clés par points relais (commerces
partenaires). Deux produits reliés par une même base temps réel :

1. **Site public + espace client** : carte des points relais, dépôt d'une clé
   avec paiement, codes de retrait à 6 caractères + QR, tableau de bord hôte
   avec statuts en temps réel.
2. **Application commerçant** (`/commercant`) : validation des badges
   RFID/NFC par scan, attribution automatique d'une case, notifications
   automatiques au déposant et aux bénéficiaires.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4**
- **Supabase** : Postgres, Auth, Realtime (RLS sur toutes les tables,
  logique métier en fonctions RPC transactionnelles)
- **Leaflet + OpenStreetMap** pour la carte des points relais
- **Resend** pour les emails (fallback console en local), **Stripe** en mode
  test (fallback « paiement simulé » sans compte Stripe)

## Lancer le projet en local

### Prérequis

- Node.js ≥ 20
- [CLI Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started) ≥ 2.x
- Docker (Docker Desktop, OrbStack, Colima ou Lima)

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer Supabase (Postgres + Auth + Realtime)

```bash
supabase start
```

Au premier lancement, la CLI télécharge les images, applique les
migrations (`supabase/migrations/`) **et charge le jeu de démonstration**
(`supabase/seed.sql`) : 12 points relais dans les 3ᵉ, 10ᵉ et 11ᵉ
arrondissements de Paris, 5 hôtes, 15 clés aux statuts variés.

Pour réinitialiser la base à l'état de démo à tout moment :

```bash
supabase db reset
```

### 3. Variables d'environnement

```bash
cp .env.example .env.local
```

Les valeurs Supabase par défaut du fichier correspondent à la stack locale
(`supabase status` les affiche). **Aucune clé Stripe ni Resend n'est
nécessaire en local** :

- sans `STRIPE_SECRET_KEY` → paiement **simulé** (validé immédiatement) ;
- sans `RESEND_API_KEY` → emails **journalisés dans la console** du serveur.

### 4. Lancer le site

```bash
npm run dev
```

Ouvrir <http://localhost:3000>.

## Comptes de démonstration

Mot de passe commun : **`keywi123456`** (la connexion par lien magique
fonctionne aussi : les emails locaux sont capturés par Mailpit sur
<http://localhost:54324>).

| Rôle        | Email                                  | Espace        |
| ----------- | -------------------------------------- | ------------- |
| Hôte        | `hote1@keywi.fr` … `hote5@keywi.fr`      | `/espace`     |
| Voyageur    | `voyageur@keywi.fr`                     | `/espace`     |
| Commerçant  | `commerce1@keywi.fr` … `commerce12@keywi.fr` | `/commercant` |
| Admin       | `admin@keywi.fr`                        | `/admin`      |

Repères utiles du seed : `commerce3@keywi.fr` tient la **Librairie du
Marais**, où la clé « Appartement Bretagne » (badge `KWIQ9R4T`) attend
d'être déposée ; le code de retrait actif `H7KM2P` permet de tester un
retrait au **Café du Canal** (`commerce1@keywi.fr`).

## Scan RFID/NFC : trois modes

Le hook [`useRfidScan`](src/hooks/useRfidScan.ts) abstrait la lecture du badge :

| Mode       | Quand                            | Comment                                          |
| ---------- | -------------------------------- | ------------------------------------------------ |
| Web NFC    | Android + Chrome                 | lecture de l'UID via `NDEFReader`                |
| Lecteur USB| iOS / desktop + lecteur HID      | l'UID est « tapé » au clavier puis validé Entrée |
| Manuel     | partout (et en démo sans matériel) | saisie du code à 8 caractères imprimé sur le badge |

En local sans matériel, choisissez l'onglet **« Saisie code »** et entrez le
code badge affiché dans l'espace hôte (ex. `KWIQ9R4T`).

## Architecture

```
src/
├── app/
│   ├── (marketing)/      # site public : accueil, cas d'usage, carte, tarifs…
│   ├── (auth)/           # connexion / inscription
│   ├── (client)/espace/  # tableau de bord hôte, dépôt, détail clé, notifications
│   ├── commercant/       # app comptoir mobile-first (scan, cases, historique, gains)
│   ├── admin/            # back-office minimal
│   └── api/              # callback auth, webhook Stripe
├── components/           # UI par domaine (carte, client, commercant, marketing, ui)
├── hooks/                # useRfidScan (3 modes), useRealtime (postgres_changes)
├── lib/
│   ├── actions/          # server actions (auth, client, commercant, admin)
│   ├── supabase/         # clients navigateur / serveur / service-role + types générés
│   ├── notifications.ts  # matrice d'emails Resend (fallback console)
│   └── stripe.ts         # tarifs + client Stripe (fallback simulé)
└── proxy.ts              # rafraîchit la session, protège /espace /commercant /admin

supabase/
├── migrations/
│   ├── 0001_schema.sql   # tables, enums, triggers (cases auto, profils auto)
│   ├── 0002_rls.sql      # politiques RLS par rôle + grants
│   └── 0003_functions.sql# RPC : attribuer_case, preparer/confirmer_depot,
│                         #       chercher/confirmer_retrait, codes, rémunération
└── seed.sql              # 12 points relais, 19 comptes, 15 clés, historique
```

### Choix techniques notables

- **Attribution de case atomique** : `attribuer_case()` utilise
  `FOR UPDATE SKIP LOCKED` — deux commerçants qui scannent en même temps
  obtiennent forcément deux cases différentes.
- **Flux en deux temps** : `preparer_depot` réserve la case (le numéro
  affiché plein écran reste valable), `confirmer_depot` journalise et
  notifie ; `annuler_depot` libère en cas d'abandon.
- **Vérification croisée au retrait** : le badge est re-scanné et comparé à
  la clé attendue (`BADGE_DIFFERENT` sinon) — anti-erreur de case.
- **Journal immuable** : un trigger interdit `UPDATE`/`DELETE` sur
  `movements`.
- **Temps réel** : les tables `keys`, `slots`, `movements`, `notifications`
  sont publiées sur Supabase Realtime ; les dashboards se mettent à jour
  sans rechargement.

## Tester le parcours complet

Voir [TESTS.md](TESTS.md) : scénario manuel de bout en bout (dépôt scanné →
case attribuée → notifications → retrait → case libérée).

## Mettre en production

### 1. Base de données

Créer un projet sur [supabase.com](https://supabase.com), puis pousser le
schéma et le jeu de démonstration :

```bash
supabase link --project-ref <ref-du-projet>
supabase db push          # applique migrations/0001 → 0010
```

Dans **Authentication → URL Configuration**, renseigner :

- *Site URL* : `https://keywi.fr`
- *Redirect URLs* : `https://keywi.fr/**`

Sans cela, Supabase **rejette silencieusement** les `redirectTo` : liens
magiques et réinitialisations de mot de passe renvoient vers l'accueil.

### 2. Application

Déployer sur [Vercel](https://vercel.com) (`vercel.json` est déjà configuré :
région Paris et tâches planifiées). Variables d'environnement à définir —
voir `.env.example` :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Accès public à la base |
| `SUPABASE_SERVICE_ROLE_KEY` | Traitements serveur (webhook, borne, API) |
| `NEXT_PUBLIC_SITE_URL` | `https://keywi.fr` — liens dans les emails |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Paiement réel |
| `RESEND_API_KEY` / `EMAIL_FROM` | Envoi réel des emails |
| `CRON_SECRET` | **Indispensable** — protège `/api/cron/*` |

> `CRON_SECRET` : Vercel l'envoie automatiquement en `Authorization: Bearer`
> aux tâches planifiées. Sans lui, n'importe qui peut déclencher les relances
> et la génération de codes. Générer avec `openssl rand -base64 32`.

### 3. Services externes

- **Stripe** : ajouter un webhook vers `https://keywi.fr/api/stripe/webhook`
  sur l'événement `checkout.session.completed`, et reporter le secret de
  signature. Sans clé Stripe, le paiement reste **simulé**.
- **Resend** : vérifier le domaine `keywi.fr` pour pouvoir expédier depuis
  `notifications@keywi.fr`. Sans clé, les emails sont **journalisés en
  console** au lieu d'être envoyés.

### Tâches planifiées

Configurées dans `vercel.json`, elles ne tournent qu'une fois déployées :

| Tâche | Fréquence | Rôle |
|---|---|---|
| `/api/cron/relances` | chaque jour à 9 h | relance les clés en retard |
| `/api/cron/acces-recurrents` | toutes les heures | génère les codes des interventions à venir |
