# Mise en production — Supabase, Stripe, Vercel

Le code est prêt ; ce qui reste demande **vos comptes et vos clés**.
Créer les comptes et saisir les secrets vous revient : ces étapes sont
signalées 🔑 ci-dessous.

---

## 1. Supabase en local

### Le stack tourne mais la CLI dit le contraire

Symptôme : `supabase status` répond « supabase start is not running »
alors que `http://127.0.0.1:54321` répond très bien.

Cause : la CLI ne parle qu'au démon Docker du **contexte actif**. Si le
stack tourne ailleurs — Lima, Colima, OrbStack — elle cherche un
conteneur qu'elle ne voit pas.

Solution en place : passez par l'enveloppe, qui désigne le bon démon.

```bash
npm run supabase -- status
```

```bash
npm run db:up        # applique les migrations en attente
npm run db:reset     # remet la base à l'état du seed
```

### Types TypeScript

`supabase gen types` réclame un jeton de compte
(`supabase login`) 🔑. Tant qu'il n'est pas fourni,
`src/lib/supabase/types.ts` se tient à jour à la main — c'est le cas
aujourd'hui, et `tsc` le vérifie.

```bash
npm run supabase -- gen types typescript --local > src/lib/supabase/types.ts
```

---

## 2. Supabase en production

1. 🔑 Créer le projet sur [supabase.com](https://supabase.com), **région
   européenne** (l'hébergement est mentionné dans la politique de
   confidentialité : `[à préciser]` y attend cette valeur).
2. 🔑 Relier le dépôt et pousser le schéma :

```bash
npm run supabase -- link --project-ref VOTRE_REF
npm run supabase -- db push
```

   Les 12 migrations passent dans l'ordre. **Ne pas jouer `seed.sql` en
   production** : il crée les comptes de démonstration, mot de passe
   commun compris.

3. 🔑 Relever `Project URL`, `anon key` et `service_role key` dans
   *Settings → API*, et les reporter dans les variables d'environnement
   (§ 4). La clé `service_role` contourne la RLS : elle ne doit jamais
   atteindre le navigateur — aucune variable `NEXT_PUBLIC_*`.

### Réglages à durcir dans le tableau de bord

`supabase/config.toml` ne pilote que le stack local. En production, ces
réglages se font dans *Authentication → Providers / Rate limits* :

Le parcours d'inscription attend déjà une confirmation d'email
(`config.toml`, `enable_confirmations = true`, et l'écran « vérifiez vos
emails ») ; il reste à refléter ce réglage côté projet hébergé, qui a sa
propre configuration.

| Réglage | Valeur | Pourquoi |
| --- | --- | --- |
| Confirm email | **activé** | Sans lui, on s'inscrit avec l'adresse d'autrui, qui reçoit ensuite les notifications (déjà exigé côté code) |
| Minimum password length | **8** | Aligné sur la validation du formulaire (déjà dans `config.toml`) |
| Site URL | `https://keywi.fr` | Sert de liste blanche aux redirections des liens email |
| Redirect URLs | `https://keywi.fr/**` | Idem |
| SMTP | serveur dédié | Le SMTP par défaut de Supabase est bridé et non délivrable |
| Captcha (hCaptcha / Turnstile) 🔑 | à envisager | Complète la limitation applicative sur inscription et connexion |

---

## 3. Stripe

Sans `STRIPE_SECRET_KEY`, l'application valide les paiements d'office —
utile en local, désastreux en ligne. Le garde-fou est en place : en
production, une clé absente fait **refuser** le dépôt
(`modePaiement()` dans `src/lib/stripe.ts`). Il reste à fournir les
clés.

1. 🔑 Créer le compte sur [stripe.com](https://stripe.com) et récupérer
   `sk_test_…` / `pk_test_…` (*Developers → API keys*).
2. 🔑 Déclarer le webhook : *Developers → Webhooks → Add endpoint*
   - URL : `https://keywi.fr/api/stripe/webhook`
   - Événement : `checkout.session.completed`
   - Recopier le `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.

   **Ce secret n'est pas optionnel.** Le webhook est le seul endroit où
   un tiers non authentifié peut faire passer un paiement en « payé » :
   sans signature à vérifier, la route refuse tout.

3. Essai en local :

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

   La CLI affiche un `whsec_…` propre à la session — à recopier dans
   `.env.local`.

4. Passage en production 🔑 : activer le compte, remplacer les clés
   `sk_test_`/`pk_test_` par `sk_live_`/`pk_live_`, et recréer le
   webhook en mode live (son secret diffère).

---

## 4. Variables d'environnement

À déclarer sur l'hébergeur (Vercel : *Settings → Environment
Variables*) 🔑 :

| Variable | Rôle | Absente ? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Base et Realtime | L'application ne démarre pas |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accès client, filtré par RLS | Idem |
| `SUPABASE_SERVICE_ROLE_KEY` | Traitements de confiance côté serveur | Webhook, borne et limitation HS |
| `NEXT_PUBLIC_SITE_URL` | Liens des emails, retours Stripe | Liens cassés vers localhost |
| `STRIPE_SECRET_KEY` | Encaissement | **Dépôt refusé** |
| `STRIPE_WEBHOOK_SECRET` | Vérification de signature | **Webhook refusé** |
| `RESEND_API_KEY` | Emails | Emails journalisés, jamais envoyés |
| `EMAIL_FROM` | Expéditeur | Valeur par défaut |
| `CRON_SECRET` | Protège `/api/cron/*` | **Routes cron refusées (503)** |
| `RATE_LIMIT_PEPPER` | Poivre des empreintes de limitation | Repli sur la clé service role |

Les trois « refusé » sont voulus : mieux vaut une fonction
indisponible qu'une fonction ouverte à tous.

---

## 5. Vérifications après déploiement

```bash
curl -sI https://keywi.fr | grep -i "content-security-policy\|strict-transport"
```

- [ ] En-têtes de sécurité présents, HSTS inclus (absent en local, c'est normal)
- [ ] `curl https://keywi.fr/api/cron/relances` → **401**
- [ ] `curl -X POST https://keywi.fr/api/stripe/webhook -d '{}'` → **400**
- [ ] `/api/dev/apercu-email` → **404** (route de développement)
- [ ] Un vrai paiement de test aboutit et bascule la clé en « payée »
- [ ] Six connexions ratées d'affilée → message de blocage
- [ ] Compléter les mentions `[entre crochets]` de `/confidentialite` et `/mentions-legales`

---

## 6. Tenir sous la charge (pic de trafic ou attaque)

Deux menaces distinctes, deux réponses distinctes.

### Ce que le code prend déjà en charge

Un **pic de trafic légitime** (campagne, article de presse) se traite
en ne faisant travailler personne pour rien :

- **Pages publiques cachées.** Marketing, tarifs, cas d'usage sont
  générés statiquement ; la carte des points relais est en ISR
  (`revalidate = 120`). Sous Vercel, elles sont servies depuis le CDN
  — des milliers de visites simultanées ne réveillent ni le serveur ni
  Supabase.
- **Proxy ciblé.** L'authentification ne tourne plus que sur `/espace`,
  `/commercant`, `/admin`. Le trafic public n'ouvre aucune session, donc
  aucun aller-retour vers Supabase Auth (voir `src/proxy.ts`).
- **Écritures sensibles plafonnées.** Connexion, mot de passe oublié,
  borne et API sont limitées par la table `tentatives` (migrations 0012
  et 0015) : un même compte, une même IP ou une même clé ne peut pas
  marteler ces points.

### Ce qui relève de l'infrastructure 🔑

Une **attaque volumétrique** (DDoS) ne se bloque pas dans le code
applicatif : quand des millions de requêtes arrivent, il faut les
écarter *avant* qu'elles n'atteignent la fonction. À configurer côté
plateforme :

- **Protection DDoS + WAF.** Vercel filtre déjà l'attaque volumétrique
  de base ; activer en plus **Vercel Firewall** (ou placer **Cloudflare**
  devant) pour des règles de rate-limit par IP et par chemin, et le
  challenge automatique sur pic anormal.
- **Captcha** (hCaptcha / Turnstile) sur inscription et connexion :
  transforme le bourrage distribué en coût prohibitif, là où la
  limitation applicative ne fait que ralentir.
- **Pooler Supabase.** Router les traitements serveur via le pooler
  (mode *transaction*, port 6543) évite l'épuisement des connexions
  Postgres sous charge. Relever les *rate limits* Auth du projet selon
  le trafic réel attendu.
- **Budgets et alertes.** Plafonds de fonctions et alertes de trafic
  côté Vercel et Supabase, pour être prévenu — et pour qu'une attaque
  ne se traduise pas seulement par une facture.

En résumé : le code encaisse le trafic normal sans solliciter la base,
et la plateforme absorbe l'anormal. L'un ne remplace pas l'autre.
