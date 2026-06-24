# TESTS.md — Scénario de test manuel de bout en bout

Ce document décrit comment vérifier **tout le parcours KLAV** en local :
enregistrement d'une clé et paiement → dépôt scanné par le commerçant →
case attribuée → notifications → retrait avec re-scan → case libérée →
suivi temps réel côté hôte.

## Préparation

```bash
supabase start        # base + auth + realtime (migrations + seed automatiques)
npm run dev           # site sur http://localhost:3000
```

Pour repartir d'un état de démo propre : `supabase db reset`.

Gardez sous les yeux :

- la **console du serveur Next.js** : sans `RESEND_API_KEY`, chaque email y
  est journalisé (`📧 [EMAIL SIMULÉ…]`) ;
- **Mailpit** (<http://localhost:54324>) : capture les emails d'auth
  (liens magiques) de la stack locale.

Utilisez **deux navigateurs** (ou un onglet normal + un privé) pour
incarner en même temps l'hôte et le commerçant.

Mot de passe de tous les comptes : `klav123456`.

---

## Scénario complet (~10 minutes)

### Étape 1 — L'hôte enregistre une clé et paie

1. Navigateur A : <http://localhost:3000/connexion> → `hote1@klav.fr`.
2. Tableau de bord → **« + Déposer une clé »**.
3. Choisir un point relais (ex. **Librairie du Marais**, sur la carte ou
   dans la liste) → nom du logement : `Test bout en bout` → **Payer**.
   - Sans clé Stripe : paiement **simulé**, confirmation immédiate.
   - Avec `STRIPE_SECRET_KEY` : page Stripe Checkout, carte
     `4242 4242 4242 4242`, date future, CVC quelconque (webhook :
     `stripe listen --forward-to localhost:3000/api/stripe/webhook`).
4. ✅ **Attendu** : bannière verte « Paiement confirmé », un **code badge**
   à 8 caractères s'affiche (ex. `KLVA1B2C`). Le notez — c'est lui qui
   sera « scanné ». Statut de la clé : **En attente de dépôt**.

### Étape 2 — L'hôte partage un code de retrait (avant dépôt)

1. Sur la fiche de la clé, panneau **« Partager un accès »** : prénom
   `Léa`, email `voyageur@klav.fr`, validité 7 jours → **Générer**.
2. ✅ **Attendu** : un code à 6 caractères + QR code s'affichent ; la
   console serveur journalise l'email « Votre code de retrait » précisant
   que les clés ne sont **pas encore disponibles**.

### Étape 3 — Le commerçant scanne le dépôt

1. Navigateur B : <http://localhost:3000/connexion> → `commerce3@klav.fr`
   (Librairie du Marais — adaptez si vous avez choisi un autre commerce :
   `commerceN@klav.fr` tient le N-ième point relais par ordre du seed).
2. **« Scanner une clé »** → onglet **« Saisie code »** → entrer le code
   badge de l'étape 1 → **Valider le badge**.
3. ✅ **Attendu** : écran plein écran bleu nuit avec un **numéro de case en
   très grand** (ex. « Case n° 2 »), le nom du logement et de l'hôte.
4. Taper **« C'est rangé ✓ »**.
5. ✅ **Attendu** :
   - écran « Dépôt enregistré » ;
   - console serveur : email « Vos clés ont bien été déposées » (hôte) **et**
     email « Vos clés sont disponibles » avec le code (bénéficiaire) ;
   - navigateur A **sans recharger** : le statut passe à
     **Prête au retrait** (Realtime), la case apparaît ;
   - cloche de l'hôte : notification « Vos clés … ont bien été déposées » ;
   - `/commercant/cases` : la case est passée en occupée (encre) avec le
     nom du logement.

### Étape 4 — Contrôles d'erreur du dépôt (optionnel mais recommandé)

- Re-scanner le même badge → ✅ refus « déjà déposée »
  (`STATUT_INCOMPATIBLE`).
- Scanner un badge inconnu (ex. `ZZZZZZZZ`) → ✅ refus « aucun badge KLAV »
  (`BADGE_INCONNU`).
- Scanner `KLVG8H4J` (clé non payée du seed, attendue au Fournil des Arts)
  → ✅ refus « pas encore réglé » (`PAIEMENT_MANQUANT`) — depuis
  `commerce2@klav.fr`.
- Scanner depuis le **mauvais commerce** un badge attendu ailleurs
  → ✅ refus `MAUVAIS_POINT_RELAIS`.

### Étape 5 — Le voyageur consulte son code

1. (Optionnel) Navigateur privé : connexion `voyageur@klav.fr`.
2. ✅ **Attendu** : son espace liste « Test bout en bout » avec le code de
   retrait et le commerce ; la cloche affiche « Les clés … sont
   disponibles ».

### Étape 6 — Le commerçant traite le retrait (re-scan croisé)

1. Navigateur B → **« Remettre une clé »** → saisir le **code à
   6 caractères** de l'étape 2.
2. ✅ **Attendu** : l'app affiche **la case** (gros numéro), le logement et
   le bénéficiaire.
3. Test anti-erreur : re-scanner un **mauvais badge** (ex. `KLV7A2B4`,
   autre clé du seed) → ✅ refus « Ce badge ne correspond pas au trousseau
   attendu » (`BADGE_DIFFERENT`).
4. Re-scanner le **bon badge** (code badge de l'étape 1).
5. ✅ **Attendu** :
   - écran « Retrait confirmé » ;
   - console serveur : email « Clés récupérées par Léa à HH:MM » (hôte) ;
   - navigateur A sans recharger : statut **Retirée**, case disparue,
     l'historique de la clé montre *Dépôt* puis *Retrait par un
     bénéficiaire*, horodatés ;
   - `/commercant/cases` : la case est **libérée** (verte) ;
   - le code à 6 caractères est marqué **Utilisé** (une seconde recherche
     du même code échoue : `CODE_INCONNU`).

### Étape 7 — Retour du trousseau (cycle complet)

1. Navigateur B → **« Scanner une clé »** → re-scanner le badge de la clé
   (statut `retirée`).
2. ✅ **Attendu** : l'app détecte un **retour**, attribue une case ;
   après confirmation le statut devient **De retour** côté hôte, et l'email
   « Vos clés sont de retour » est journalisé.

### Étape 8 — Compteur de rémunération

1. Navigateur B → onglet **« Gains »**.
2. ✅ **Attendu** : le total du mois intègre les mouvements que vous venez
   de créer (0,80 €/mouvement jusqu'à 50, puis 1,00 €, puis 1,20 € —
   paliers paramétrés dans `remuneration_paliers`).

---

## Tests complémentaires

### Concurrence d'attribution de case (anti-collision)

Deux dépôts simultanés ne doivent jamais recevoir la même case
(`FOR UPDATE SKIP LOCKED`). Vérifiable en SQL :

```bash
# Deux clés en attente sur le même point relais, deux scans « en même temps »
docker exec supabase_db_KLAV psql -U postgres -d postgres -c "
insert into keys (badge_uid, code_badge_imprime, logement, hote_id, relay_point_id, statut, paiement_statut)
values ('04:TEST:01','KLVTEST1','Concurrence 1','20000000-0000-4000-a000-000000000001','a0000000-0000-4000-a000-000000000003','en_attente','offert'),
       ('04:TEST:02','KLVTEST2','Concurrence 2','20000000-0000-4000-a000-000000000001','a0000000-0000-4000-a000-000000000003','en_attente','offert');"

for badge in KLVTEST1 KLVTEST2; do
  docker exec supabase_db_KLAV psql -U postgres -d postgres -c "
  begin;
  select set_config('request.jwt.claims','{\"sub\":\"10000000-0000-4000-a000-000000000003\",\"role\":\"authenticated\"}',true);
  set local role authenticated;
  select preparer_depot('$badge') ->> 'case_numero';
  commit;" &
done; wait
```

✅ **Attendu** : deux numéros de case **différents**.

### Cloisonnement RLS

- Connecté `hote2@klav.fr` : le tableau de bord ne montre **que** ses clés
  (jamais celles de `hote1`).
- Connecté `commerce1@klav.fr` : `/commercant/cases` et l'historique ne
  montrent **que** le Café du Canal.
- Connecté en hôte, ouvrir `/admin` → redirection vers `/espace` ;
  ouvrir `/commercant` → redirection également.
- Déconnecté, ouvrir `/espace` → redirection `/connexion?suivant=/espace`.

### Révocation d'un code

1. Hôte : générer un code sur une clé déposée, puis **Révoquer**.
2. Commerçant : rechercher ce code → ✅ `CODE_INCONNU` ; si c'était le
   dernier code actif, le statut de la clé revient à **Déposée**.

### Candidature commerçant + admin

1. Sans être connecté : `/devenir-point-relais` → envoyer le formulaire.
2. `admin@klav.fr` → `/admin` : la candidature apparaît « à traiter » →
   **Valider** → ✅ badge « Validée ».

### Accessibilité (rapide)

- Naviguer au clavier : le lien d'évitement « Aller au contenu principal »
  apparaît au premier Tab ; tous les boutons/onglets sont atteignables,
  focus visible (anneau bleu).
- Les statuts utilisent texte + couleur (jamais la couleur seule).
