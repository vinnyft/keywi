import type { Metadata } from "next";
import Link from "next/link";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Privacy policy" : "Politique de confidentialité",
    description:
      loc === "en"
        ? "How Keywi protects and processes your personal data."
        : "Comment Keywi protège et traite vos données personnelles.",
    alternates: alternatesLangues("/confidentialite", loc),
  };
}

function contenu(locale: Locale) {
  if (locale === "en") {
    return {
      courtoisie: "Courtesy translation. The French version is the authoritative text.",
      h1: "Privacy",
      maj: "Last updated",
      labelDonnees: "Data:",
      labelBase: "Legal basis:",
      labelDuree: "Retention:",
      responsableTitre: "Data controller",
      responsableTexteAvant: "Keywi — [legal form, registered office, trade register]. For any question about your data: ",
      responsableTexteApres: ".",
      traiteTitre: "What we process, and why",
      traiteLede: "We only collect what serves the service. No data is ever sold or used for advertising.",
      traitements: [
        { finalite: "Manage your account and dashboard", donnees: "Name, email, phone, password (hashed)", base: "Performance of the contract (art. 6.1.b)", duree: "For the life of the account, then anonymised on deletion" },
        { finalite: "Handle drop-off, custody and handover of keyrings", donnees: "Unit name, tag, drop-off point, pickup codes, recipient identity", base: "Performance of the contract (art. 6.1.b)", duree: "Until account deletion; a recipient's identity is erased 30 days after a code is used, revoked or expired" },
        { finalite: "Prove a keyring's chain of custody", donnees: "Movement log: type, date, place, slot, tag scan", base: "Legitimate interest — being able to establish who held the keys, and when", duree: "Kept without limit, but purged of all identity on account deletion" },
        { finalite: "Notify you (drop-off, pickup, return, overdue)", donnees: "Email, name, unit and drop-off-point reference", base: "Performance of the contract (art. 6.1.b)", duree: "Notifications deleted with the account" },
        { finalite: "Collect payments and keep accounts", donnees: "Amount, date, transaction reference", base: "Legal obligation (art. 6.1.c) — art. L123-22 of the Commercial Code", duree: "10 years, unlinked from any person after account deletion" },
        { finalite: "Process « become a partner » applications", donnees: "Shop and contact name, email, phone, address", base: "Pre-contractual steps (art. 6.1.b)", duree: "3 years from last contact" },
      ],
      beneficiairesTitre: "Recipients of a code",
      beneficiairesAvant: "When a host shares access, they pass us the name and email of the person concerned. This data is used only to send the pickup code and identify the handover at the counter. The recipient can request its erasure at any time at ",
      beneficiairesApres: ", without having an account with us.",
      accesTitre: "Who else has access",
      accesLede: "Our technical providers, strictly for the use below, under a data-processing agreement (art. 28):",
      sousTraitants: [
        { nom: "Supabase", role: "Database and authentication hosting" },
        { nom: "Vercel", role: "Website and server-side processing hosting" },
        { nom: "Stripe", role: "Payment collection (no banking data passes through Keywi)" },
        { nom: "Resend", role: "Delivery of notification emails" },
        { nom: "OpenStreetMap", role: "Drop-off point map tiles — your IP address is sent to the tile server when the map is displayed" },
        { nom: "API Adresse (data.gouv.fr)", role: "Geocoding of drop-off-point addresses, called from our servers" },
      ],
      transferts: "The site's server processing runs in the Paris region. Some of these providers are established outside the European Union; transfers then rely on the European Commission's standard contractual clauses. The hosting region chosen for the database is [to be specified].",
      cookiesTitre: "Cookies",
      cookiesTexte1: "Keywi sets no advertising or analytics cookies.",
      cookiesTexte2: " The only cookies used carry your login session: strictly necessary to the service, they are exempt from consent (art. 82 of the French Data Protection Act). That's why you don't see a banner on this site.",
      securiteTitre: "Security",
      securite: "Access to data is partitioned at the database level itself: every request is filtered by row-level security rules, so a host cannot reach another's keyrings. The movement log is technically tamper-proof, pickup codes expire, and API keys are stored only as a fingerprint.",
      droitsTitre: "Your rights",
      droitsLede: "You have the rights of access, rectification, erasure, restriction, objection and portability. Two of them are exercised directly from your dashboard, without writing to us:",
      portabilite: "Portability",
      portabiliteTexte: " — export your history as CSV.",
      effacement: "Erasure",
      effacementTexte: " — delete your account yourself. Your identity is destroyed; the movement log and accounting entries are kept but made anonymous, which takes them outside the scope of the GDPR (recital 26).",
      gererLien: "Manage my data from my dashboard →",
      autresAvant: "For the other rights, write to ",
      autresMilieu: ". You may also lodge a complaint with the ",
      cnil: "CNIL",
      autresApres: ".",
      note: "The bracketed details remain to be completed by the publisher before going live.",
    };
  }
  return {
    courtoisie: null as string | null,
    h1: "Confidentialité",
    maj: "Dernière mise à jour",
    labelDonnees: "Données :",
    labelBase: "Base légale :",
    labelDuree: "Conservation :",
    responsableTitre: "Responsable du traitement",
    responsableTexteAvant: "Keywi — [forme sociale, adresse du siège, RCS]. Pour toute question relative à vos données : ",
    responsableTexteApres: ".",
    traiteTitre: "Ce que nous traitons, et pourquoi",
    traiteLede: "Nous ne collectons que ce qui sert le service. Aucune donnée n'est revendue, ni utilisée à des fins publicitaires.",
    traitements: [
      { finalite: "Gérer votre compte et votre espace client", donnees: "Nom, email, téléphone, mot de passe (haché)", base: "Exécution du contrat (art. 6.1.b)", duree: "Toute la vie du compte, puis anonymisation à sa suppression" },
      { finalite: "Assurer le dépôt, la garde et la remise des trousseaux", donnees: "Nom du logement, badge, point relais, codes de retrait, identité des bénéficiaires", base: "Exécution du contrat (art. 6.1.b)", duree: "Jusqu'à la suppression du compte ; l'identité d'un bénéficiaire est toutefois effacée 30 jours après qu'un code a été utilisé, révoqué ou expiré" },
      { finalite: "Prouver la chaîne de garde d'un trousseau", donnees: "Journal des mouvements : type, date, lieu, case, scan du badge", base: "Intérêt légitime — pouvoir établir qui détenait les clés, et quand", duree: "Conservé sans limite, mais purgé de toute identité dès la suppression du compte" },
      { finalite: "Vous notifier (dépôt, retrait, retour, retard)", donnees: "Email, nom, référence du logement et du point relais", base: "Exécution du contrat (art. 6.1.b)", duree: "Notifications supprimées avec le compte" },
      { finalite: "Encaisser les dépôts et tenir la comptabilité", donnees: "Montant, date, référence de la transaction", base: "Obligation légale (art. 6.1.c) — art. L123-22 du Code de commerce", duree: "10 ans, sans lien avec une personne après suppression du compte" },
      { finalite: "Instruire les candidatures « devenir point relais »", donnees: "Nom du commerce et du contact, email, téléphone, adresse", base: "Mesures précontractuelles (art. 6.1.b)", duree: "3 ans à compter du dernier contact" },
    ],
    beneficiairesTitre: "Bénéficiaires d'un code",
    beneficiairesAvant: "Lorsqu'un hôte partage un accès, il nous transmet le nom et l'email de la personne concernée. Ces données servent uniquement à envoyer le code de retrait et à identifier la remise au comptoir. Le bénéficiaire peut à tout moment demander leur effacement à ",
    beneficiairesApres: ", sans avoir de compte chez nous.",
    accesTitre: "Qui d'autre y a accès",
    accesLede: "Nos prestataires techniques, strictement pour l'usage ci-dessous, sous contrat de sous-traitance (art. 28) :",
    sousTraitants: [
      { nom: "Supabase", role: "Hébergement de la base de données et de l'authentification" },
      { nom: "Vercel", role: "Hébergement du site et des traitements serveur" },
      { nom: "Stripe", role: "Encaissement des paiements (aucune donnée bancaire ne transite par Keywi)" },
      { nom: "Resend", role: "Acheminement des emails de notification" },
      { nom: "OpenStreetMap", role: "Fonds de carte des points relais — votre adresse IP est transmise au serveur de tuiles lors de l'affichage de la carte" },
      { nom: "API Adresse (data.gouv.fr)", role: "Géocodage des adresses de points relais, appelé depuis nos serveurs" },
    ],
    transferts: "Les traitements serveur du site s'exécutent dans la région de Paris. Certains de ces prestataires sont établis hors de l'Union européenne ; les transferts s'appuient alors sur les clauses contractuelles types de la Commission européenne. La région d'hébergement retenue pour la base de données est [à préciser].",
    cookiesTitre: "Cookies",
    cookiesTexte1: "Keywi ne dépose aucun cookie publicitaire ni de mesure d'audience.",
    cookiesTexte2: " Les seuls cookies utilisés portent votre session de connexion : strictement nécessaires au service, ils sont dispensés de consentement (art. 82 de la loi Informatique et Libertés). C'est pourquoi vous ne voyez pas de bandeau sur ce site.",
    securiteTitre: "Sécurité",
    securite: "L'accès aux données est cloisonné au niveau de la base elle-même : chaque requête est filtrée par des règles de sécurité au niveau des lignes, un hôte ne peut donc pas atteindre les trousseaux d'un autre. Le journal des mouvements est techniquement inaltérable, les codes de retrait expirent, et les clés d'API ne sont stockées que sous forme d'empreinte.",
    droitsTitre: "Vos droits",
    droitsLede: "Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Deux d'entre eux s'exercent directement depuis votre espace, sans nous écrire :",
    portabilite: "Portabilité",
    portabiliteTexte: " — export de votre historique au format CSV.",
    effacement: "Effacement",
    effacementTexte: " — suppression du compte en autonomie. Votre identité est détruite ; le journal des mouvements et les écritures comptables sont conservés mais rendus anonymes, ce qui les fait sortir du champ du RGPD (considérant 26).",
    gererLien: "Gérer mes données depuis mon espace →",
    autresAvant: "Pour les autres droits, écrivez à ",
    autresMilieu: ". Vous pouvez également introduire une réclamation auprès de la ",
    cnil: "CNIL",
    autresApres: ".",
    note: "Les mentions entre crochets restent à compléter par l'éditeur avant mise en ligne.",
  };
}

export default async function PageConfidentialite({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = contenu(locale);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">{t.h1}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {t.maj} : {new Date().getFullYear()}
      </p>

      {t.courtoisie && (
        <p className="mt-4 rounded-xl border border-gray-200 bg-sable p-3 text-sm text-gray-600">
          {t.courtoisie}
        </p>
      )}

      <div className="mt-8 space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-bold">{t.responsableTitre}</h2>
          <p className="mt-2">
            {t.responsableTexteAvant}
            <a className="underline" href="mailto:bonjour@keywi.fr">bonjour@keywi.fr</a>
            {t.responsableTexteApres}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.traiteTitre}</h2>
          <p className="mt-2">{t.traiteLede}</p>
          <div className="mt-4 space-y-4">
            {t.traitements.map((tr) => (
              <div key={tr.finalite} className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-bold text-encre">{tr.finalite}</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-gray-500">{t.labelDonnees}</dt>
                    <dd>{tr.donnees}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-gray-500">{t.labelBase}</dt>
                    <dd>{tr.base}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-gray-500">{t.labelDuree}</dt>
                    <dd>{tr.duree}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.beneficiairesTitre}</h2>
          <p className="mt-2">
            {t.beneficiairesAvant}
            <a className="underline" href="mailto:bonjour@keywi.fr">bonjour@keywi.fr</a>
            {t.beneficiairesApres}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.accesTitre}</h2>
          <p className="mt-2">{t.accesLede}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {t.sousTraitants.map((s) => (
              <li key={s.nom} className="flex gap-2">
                <span className="font-semibold text-encre">{s.nom}</span>
                <span className="text-gray-600">— {s.role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gray-600">{t.transferts}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.cookiesTitre}</h2>
          <p className="mt-2">
            <strong>{t.cookiesTexte1}</strong>
            {t.cookiesTexte2}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.securiteTitre}</h2>
          <p className="mt-2">{t.securite}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.droitsTitre}</h2>
          <p className="mt-2">{t.droitsLede}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <strong>{t.portabilite}</strong>
              {t.portabiliteTexte}
            </li>
            <li>
              <strong>{t.effacement}</strong>
              {t.effacementTexte}
            </li>
          </ul>
          <p className="mt-3">
            <Link className="font-semibold underline" href={localise("/espace/confidentialite", locale)}>
              {t.gererLien}
            </Link>
          </p>
          <p className="mt-3">
            {t.autresAvant}
            <a className="underline" href="mailto:bonjour@keywi.fr">bonjour@keywi.fr</a>
            {t.autresMilieu}
            <a className="underline" href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
              {t.cnil}
            </a>
            {t.autresApres}
          </p>
        </section>

        <p className="rounded-xl bg-sable p-4 text-sm text-gray-500">{t.note}</p>
      </div>
    </article>
  );
}
