# KLAV — Vos clés, en lieu sûr, près de chez vous

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

Mot de passe commun : **`klav123456`** (la connexion par lien magique
fonctionne aussi : les emails locaux sont capturés par Mailpit sur
<http://localhost:54324>).

| Rôle        | Email                                  | Espace        |
| ----------- | -------------------------------------- | ------------- |
| Hôte        | `hote1@klav.fr` … `hote5@klav.fr`      | `/espace`     |
| Voyageur    | `voyageur@klav.fr`                     | `/espace`     |
| Commerçant  | `commerce1@klav.fr` … `commerce12@klav.fr` | `/commercant` |
| Admin       | `admin@klav.fr`                        | `/admin`      |

Repères utiles du seed : `commerce3@klav.fr` tient la **Librairie du
Marais**, où la clé « Appartement Bretagne » (badge `KLVQ9R4T`) attend
d'être déposée ; le code de retrait actif `H7KM2P` permet de tester un
retrait au **Café du Canal** (`commerce1@klav.fr`).

## Scan RFID/NFC : trois modes

Le hook [`useRfidScan`](src/hooks/useRfidScan.ts) abstrait la lecture du badge :

| Mode       | Quand                            | Comment                                          |
| ---------- | -------------------------------- | ------------------------------------------------ |
| Web NFC    | Android + Chrome                 | lecture de l'UID via `NDEFReader`                |
| Lecteur USB| iOS / desktop + lecteur HID      | l'UID est « tapé » au clavier puis validé Entrée |
| Manuel     | partout (et en démo sans matériel) | saisie du code à 8 caractères imprimé sur le badge |

En local sans matériel, choisissez l'onglet **« Saisie code »** et entrez le
code badge affiché dans l'espace hôte (ex. `KLVQ9R4T`).

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
