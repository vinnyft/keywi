# Audit RGPD et sécurité — KeyWe

Revue du code au 24 juillet 2026. Périmètre : schéma Postgres,
politiques RLS, actions serveur, routes API, pages publiques.

Le volet sécurité applicative (authentification, paiement, en-têtes,
injections) est traité en fin de document, § « Sécurité applicative ».

KeyWe traite des données à faible volume mais à forte sensibilité
d'usage : savoir qui détient les clés d'un logement, quand, et à qui
elles ont été remises. Le cœur technique est solide — le cloisonnement
est fait au bon endroit, dans la base. Ce qui manquait relevait de la
couche « droits des personnes » : information et effacement.

---

## Ce qui est déjà bien tenu

| Point | Où |
| --- | --- |
| RLS active sur **toutes** les tables, policies par rôle, helpers `security definer` contre la récursion | `supabase/migrations/0002_rls.sql` |
| Anonyme réduit au strict nécessaire : lecture de la carte + dépôt de candidature | `0002_rls.sql:229-231` |
| Aucun traceur, aucune mesure d'audience — seuls les cookies de session existent | vérifié sur tout `src/` |
| Clés d'API stockées en SHA-256 seulement, valeur en clair jamais persistée | `src/lib/api-auth.ts:23` |
| Journal des mouvements inaltérable (trigger `movements_immuables`) | `0001_schema.sql:264` |
| Anti-énumération de comptes sur « mot de passe oublié » | `src/lib/actions/auth.ts:107` |
| Géocodage via la BAN, appelé **côté serveur** : l'IP du visiteur ne fuite pas | `src/lib/geocodage.ts` |
| Certificat public expurgé de l'identité de l'hôte, accès par jeton non devinable | `0010_certificat.sql` |

---

## Écarts corrigés dans cette passe

### 1. Aucun parcours d'effacement (art. 17) — **corrigé**

La politique renvoyait vers `bonjour@keywe.io`. Un droit qui suppose
d'écrire un email et d'attendre n'est pas un droit exerçable.

Deux obstacles rendaient l'effacement techniquement impossible tel quel :

- supprimer `auth.users` cascade jusqu'à `movements`, où le trigger
  d'immuabilité lève une exception et annule tout ;
- les paiements relèvent de l'obligation comptable de 10 ans
  (art. L123-22 du Code de commerce).

La réponse retenue est l'**anonymisation** : détruire tout ce qui
rattache une ligne à une personne, conserver les faits. Une donnée
anonymisée sort du champ du RGPD (considérant 26) — l'effacement est
réel, la preuve survit.

Livré : `supabase/migrations/0011_suppression_compte.sql`,
`src/lib/actions/compte.ts`, `/espace/confidentialite`,
`/espace/supprimer-compte`, `/compte-supprime`.

### 2. Politique de confidentialité squelettique — **corrigée**

Manquaient : responsable du traitement, finalités, bases légales,
durées de conservation, sous-traitants, transferts hors UE, mention
CNIL. Le document se déclarait lui-même « fourni à titre d'exemple ».

Réécrite : `src/app/(marketing)/confidentialite/page.tsx`. Les mentions
entre crochets (forme sociale, adresse, RCS, région d'hébergement de la
base) restent à compléter avant mise en ligne.

### 3. Export CSV non cloisonné — **corrigé**

`/api/export/mouvements` s'en remettait entièrement à la RLS. Or la
policy de `movements` ouvre aussi la lecture au commerçant (tout son
point relais) et à l'admin (**toute la plateforme**). Un admin cliquant
sur « exporter mes données » téléchargeait le journal de tous les
utilisateurs, colonne « Bénéficiaire » comprise.

Vérifié après correctif sur le jeu de démonstration : 16 mouvements en
base, l'admin en exporte 0, `hote1` en exporte 2 — les siens.

---

## Écarts restants, par ordre de priorité

### A. Mentions légales absentes — obligation LCEN

Aucune page `/mentions-legales`, aucun lien dans le pied de page.
L'art. 6-III de la LCEN l'impose à tout éditeur de service en ligne :
identité, adresse, directeur de publication, hébergeur et ses
coordonnées. C'est le manquement le plus simple à combler et le plus
visible en cas de contrôle.

### ~~B. Aucune durée de conservation n'est appliquée~~ — corrigé

`purger_donnees` (migration 0014), appelée par `/api/cron/purge`
chaque nuit : candidatures effacées à 3 ans (durée annoncée), codes
échus marqués `expire`, et surtout **minimisation** — l'identité d'un
bénéficiaire est retirée 30 jours après qu'un code a été consommé,
sans supprimer la ligne (intégrité référentielle). La politique a été
mise à jour en conséquence. Notifications et codes actifs restent liés
au compte, conformément à ce qui est publié.

### C. Le certificat public expose le nom d'un tiers

`certificat_public` renvoie `details ->> 'beneficiaire'`
(`0010_certificat.sql:57`), affiché en clair par
`src/app/certificat/[token]/page.tsx:171` (« remis à Léa Martin »).

Le commentaire de la migration affirme « ni email, ni identité de
l'hôte » — exact pour l'hôte, faux pour le bénéficiaire. Quiconque
reçoit le lien apprend qui est entré dans le logement, et quand. À
arbitrer : initiales (`L. M.`), ou mention réduite à « remis à un
bénéficiaire muni d'un code ».

### D. Information des tiers non-utilisateurs (art. 14)

L'hôte saisit le nom et l'email de personnes qui n'ont pas de compte
(`access_codes`, `acces_recurrents`). Ces dernières reçoivent un email
contenant un code, mais aucune information sur le traitement, ni sur
leurs droits. Le cas des `acces_recurrents` est le plus sensible : une
récurrence hebdomadaire décrit les habitudes d'une personne.

La politique comporte désormais une section « Bénéficiaires d'un
code » ; il reste à ajouter le lien correspondant **dans l'email**
envoyé au bénéficiaire (`src/lib/notifications.ts`).

### ~~E. Routes cron protégées seulement si `CRON_SECRET` existe~~ — corrigé

La vérification était enveloppée dans `if (secret)` : variable oubliée
en production, et n'importe qui déclenchait des envois d'emails en
masse. `src/lib/cron-auth.ts` inverse la logique — le secret est
désormais obligatoire hors développement, et comparé en temps
constant.

### F. Tuiles OpenStreetMap chargées côté navigateur

`src/components/carte/CarteRelais.tsx:74` : l'adresse IP de chaque
visiteur est transmise à `tile.openstreetmap.org` dès l'affichage de la
carte. C'est désormais mentionné dans la politique, ce qui est le
minimum ; un proxy de tuiles côté serveur supprimerait le transfert.

### G. Hors code

Registre des traitements (art. 30), contrats de sous-traitance (art. 28)
avec Supabase, Vercel, Stripe et Resend, procédure de notification de
violation (art. 33) : à constituer côté organisation.

---

## Détail de l'anonymisation

Garde-fous — la suppression est **refusée** tant que :

- des trousseaux sont encore physiquement déposés chez un partenaire
  (sinon le commerçant ne peut plus identifier ce qu'il détient) ;
- le point relais de l'utilisateur héberge des clés de clients ;
- le compte est administrateur (transfert de rôle préalable).

| Donnée | Traitement |
| --- | --- |
| Nom, email, téléphone | Effacés ; profil transformé en pierre tombale |
| Nom des logements, badges, photos | Effacés, badge remplacé par un identifiant neutre |
| Jeton de certificat | Régénéré → tous les liens partagés sont révoqués |
| Codes de retrait (émis et reçus) | Identité du bénéficiaire effacée, codes actifs révoqués |
| Accès récurrents | Supprimés |
| Notifications | Supprimées |
| Clés d'API | Supprimées |
| Candidature commerçant | Anonymisée |
| Point relais possédé | Détaché, passé en `inactif` |
| Journal des mouvements | `beneficiaire` et `logement` retirés ; type, date, lieu, case et vérification par scan conservés |
| Paiements | Conservés (obligation comptable), rattachés à un profil anonyme |
| `auth.users` | Email réécrit en `…@comptes-supprimes.keywi.invalid` (TLD réservé RFC 2606), métadonnées vidées clé par clé, compte banni 100 ans |
| `auth.identities` | `identity_data` réduit à `sub` + email neutralisé, sessions coupées |

### Sur l'exception d'immuabilité

Purger le journal impose de le modifier — ce que le trigger interdit.
L'exception est verrouillée deux fois :

1. un drapeau de session (`keywi.anonymisation`) que seule la fonction
   `supprimer_mon_compte()` positionne, le temps d'une transaction ;
2. aucune policy `UPDATE` sur `movements` — un client authentifié qui
   poserait le drapeau lui-même resterait bloqué par la RLS.

Et seul `details` peut changer : identifiants, type, horodatage,
`scanned_by` sont comparés champ à champ avant d'autoriser l'écriture.
Vérifié : un `UPDATE` en service role hors de ce contexte lève toujours
« Le journal des mouvements est immuable (UPDATE) ».

---

## Sécurité applicative

Seconde passe, centrée sur ce qu'un attaquant extérieur peut atteindre.

### Corrigé

| Faille | Où | Ce qui était possible |
| --- | --- | --- |
| **Webhook Stripe forgeable** | `api/stripe/webhook` | Sans `STRIPE_WEBHOOK_SECRET`, le corps était passé à `JSON.parse` sans vérification : un simple POST suffisait à marquer n'importe quelle clé « payée ». La signature est désormais exigée, sinon la route refuse tout. |
| **Paiement simulé en production** | `lib/stripe.ts` | Une clé Stripe absente validait les dépôts d'office. `modePaiement()` renvoie maintenant `null` en production : le dépôt est refusé avant toute écriture. |
| **Borne de casier ouverte** | `api/borne/[id]` | Route publique, sans authentification ni limite : 31⁶ codes se balaient à la vitesse du réseau, et chaque réussite ouvre une case contenant des clés de logement. Limitée à 15 essais / 10 min **par casier** — le seul angle qui résiste à une attaque distribuée. Un retrait réussi remet le compteur à zéro. |
| **Bourrage de mot de passe** | `actions/auth.ts` | La limitation par IP de GoTrue ne voyait que l'IP du serveur Next : inopérante. Compteur applicatif en base (migration 0012), 5 essais / 15 min par compte, 3 demandes de réinitialisation / heure. |
| **Redirection ouverte** | `actions/auth.ts` | `suivant.startsWith("/")` acceptait `//evil.com` : un lien de hameçonnage partant d'un vrai domaine KeyWe. |
| **Injection HTML dans les emails** | `lib/notifications.ts` | Nom de logement et de bénéficiaire réinjectés bruts dans le HTML envoyé à des tiers. Un logement nommé `<a href="…">Confirmez votre compte</a>` transformait une notification KeyWe en support de hameçonnage, signée de notre domaine. Échappement systématique ; le sujet, qui est du texte, reste brut. |
| **Aucun en-tête de sécurité** | `next.config.ts` | Ni CSP, ni HSTS, ni `frame-ancestors`. Ajoutés, avec une CSP qui n'autorise que `self`, Supabase et les tuiles OSM. |
| **Fuite d'erreurs Postgres** | `api/borne/[id]` | Le message brut de la base repartait vers l'écran public. Journalisé côté serveur, message générique côté borne. |

### Sur la CSP

Choix assumé : en-têtes plutôt que nonce. La variante à nonce
documentée par Next impose un rendu dynamique sur **toutes** les pages
— la carte, les tarifs et les cas d'usage y perdraient leur génération
statique, pour un gain mince : aucune page n'utilise
`dangerouslySetInnerHTML`, React échappe tout ce qu'il affiche.
`unsafe-inline` reste nécessaire aux scripts d'hydratation, mais aucune
origine tierce ne peut plus être ni chargée ni contactée — vérifié :
une image et un WebSocket vers un domaine non listé sont bloqués,
Supabase et OpenStreetMap passent.

### Corrigé (seconde vague)

- **API publique v1** : les clés ont désormais des **portées** (`lire`,
  `creer`, choisies à la création) et une **limite de 120 req/min par
  clé**. Une clé fuitée est bornée au moindre privilège au lieu de
  donner un accès complet et illimité. Migration 0015, `src/lib/api-auth.ts`.
- **`@stripe/stripe-js`** retiré des dépendances (importé nulle part ;
  le paiement passe par Stripe Checkout hébergé, atteint par simple
  redirection — aucune clé publiable côté client n'est nécessaire).

- **Confirmation d'email** exigée à l'inscription
  (`enable_confirmations = true`) : plus moyen de créer un compte avec
  l'adresse d'un tiers. Le parcours affiche un écran « vérifiez vos
  emails », et la connexion distingue « email non confirmé » d'un mot de
  passe erroné. Le réglage équivalent reste à cocher côté projet hébergé
  (voir [DEPLOIEMENT.md](DEPLOIEMENT.md)).

### Restant

- **Captcha** sur inscription et connexion : la limitation applicative
  ralentit une attaque, un captcha la rend coûteuse. Supabase gère
  hCaptcha et Turnstile ; il faut un compte chez l'un des deux.
