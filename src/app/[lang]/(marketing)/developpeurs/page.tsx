import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, KeyRound, Zap, ArrowRight } from "lucide-react";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Developer API" : "API développeurs",
    description:
      loc === "en"
        ? "The KeyWe API: list your keys and create pickup codes programmatically. Automate your Airbnb or PMS check-ins."
        : "L'API KeyWe : listez vos clés et créez des codes de retrait par programmation. Automatisez vos check-in Airbnb ou PMS.",
    alternates: alternatesLangues("/developpeurs", loc),
  };
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-encre p-4 text-sm text-white">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

export default async function PageDeveloppeurs({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);

  const endpoints = [
    {
      methode: "GET",
      chemin: "/api/v1/cles",
      description: en
        ? "Lists your keyrings: status, location, slot, return deadline."
        : "Liste vos trousseaux : statut, lieu, case, échéance de retour.",
    },
    {
      methode: "POST",
      chemin: "/api/v1/codes",
      description: en
        ? "Creates a pickup code for a key and emails it to the recipient."
        : "Crée un code de retrait pour une clé et l'envoie au bénéficiaire par email.",
    },
  ];

  const erreurs: [string, string][] = en
    ? [
        ["200 / 201", "Success"],
        ["400", "Incomplete or invalid request"],
        ["401", "API key missing, invalid or revoked"],
        ["403", "The key lacks the right required for this operation"],
        ["404", "Resource not found or outside your account"],
        ["429", "Too many requests — wait (Retry-After header)"],
      ]
    : [
        ["200 / 201", "Succès"],
        ["400", "Requête incomplète ou invalide"],
        ["401", "Clé API manquante, invalide ou révoquée"],
        ["403", "La clé n'a pas le droit requis pour cette opération"],
        ["404", "Ressource introuvable ou hors de votre compte"],
        ["429", "Trop de requêtes — patientez (en-tête Retry-After)"],
      ];

  const t = en
    ? {
        lede: "Plug KeyWe into your tools: generate a pickup code as soon as a booking is confirmed, track your keyrings' status in real time.",
        genererCle: "Generate an API key",
        auth: "Authentication",
        endpointsTitre: "Endpoints",
        creerTitre: "Create a pickup code",
        creerLede: "The typical call at booking time: the guest gets their code by email, valid for 7 days.",
        reponse: "Response",
        codesTitre: "Response codes",
        colCode: "Code",
        colSens: "Meaning",
        pretTitre: "Ready to automate?",
        pretLede: "Generate your first key from your dashboard, in seconds.",
        mesCles: "My API keys",
      }
    : {
        lede: "Branchez KeyWe sur vos outils : générez un code de retrait dès qu'une réservation est confirmée, suivez l'état de vos trousseaux en temps réel.",
        genererCle: "Générer une clé API",
        auth: "Authentification",
        endpointsTitre: "Points d'entrée",
        creerTitre: "Créer un code de retrait",
        creerLede: "L'appel type au moment d'une réservation : le voyageur reçoit son code par email, valable 7 jours.",
        reponse: "Réponse",
        codesTitre: "Codes de réponse",
        colCode: "Code",
        colSens: "Signification",
        pretTitre: "Prêt à automatiser ?",
        pretLede: "Générez votre première clé depuis votre espace, en quelques secondes.",
        mesCles: "Mes clés API",
      };

  const chip = "mx-1 rounded bg-sable px-1.5 py-0.5 font-mono text-sm";

  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            <Terminal size={15} aria-hidden="true" /> API v1
          </p>
          <h1 className="mt-4 text-4xl font-black">{en ? "KeyWe API" : "API KeyWe"}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t.lede}</p>
          <Link
            href={l("/espace/api")}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
          >
            {t.genererCle} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <KeyRound size={22} className="text-primaire" aria-hidden="true" />
          {t.auth}
        </h2>
        {en ? (
          <>
            <p className="mt-3 text-gray-700">
              Every request must carry your API key in the
              <code className={chip}>Authorization</code> header. Keys start with
              <code className={chip}>kw_live_</code> and are shown only once: keep
              them like a password.
            </p>
            <p className="mt-3 text-gray-700">
              At creation, you choose the key&apos;s <strong>rights</strong> —{" "}
              <em>Read</em> (view your keyrings) and/or <em>Create codes</em>.
              Grant the minimum needed: a key lacking the required right gets a
              <code className={chip}>403</code>. The API is also limited to 120
              requests per minute per key (<code className={chip}>429</code>{" "}
              response, <code className="font-mono text-sm">Retry-After</code> header).
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 text-gray-700">
              Chaque requête doit porter votre clé API dans l&apos;en-tête
              <code className={chip}>Authorization</code>. Les clés commencent par
              <code className={chip}>kw_live_</code> et ne sont affichées
              qu&apos;une seule fois : conservez-les comme un mot de passe.
            </p>
            <p className="mt-3 text-gray-700">
              À la création, vous choisissez les <strong>droits</strong> de la clé
              — <em>Lecture</em> (consulter vos trousseaux) et/ou{" "}
              <em>Création de codes</em>. Accordez le minimum nécessaire : une clé
              dépourvue du droit requis reçoit un <code className={chip}>403</code>.
              L&apos;API est par ailleurs limitée à 120 requêtes par minute et par
              clé (réponse <code className={chip}>429</code>, en-tête{" "}
              <code className="font-mono text-sm">Retry-After</code>).
            </p>
          </>
        )}
        <Code>{`curl https://keywe.fr/api/v1/cles \\
  -H "Authorization: Bearer kw_live_your_key"`}</Code>

        <h2 className="mt-12 flex items-center gap-2 text-2xl font-black">
          <Zap size={22} className="text-primaire" aria-hidden="true" />
          {t.endpointsTitre}
        </h2>
        <ul className="mt-4 space-y-3">
          {endpoints.map((e) => (
            <li
              key={e.chemin}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <span
                className={`rounded-md px-2 py-1 font-mono text-xs font-bold text-white ${
                  e.methode === "GET" ? "bg-primaire" : "bg-skin"
                }`}
              >
                {e.methode}
              </span>
              <code className="font-mono text-sm font-semibold">{e.chemin}</code>
              <span className="w-full text-sm text-gray-600 sm:w-auto sm:flex-1">
                {e.description}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="mt-10 text-lg font-bold">{t.creerTitre}</h3>
        <p className="mt-2 text-gray-700">{t.creerLede}</p>
        <Code>{`curl -X POST https://keywe.fr/api/v1/codes \\
  -H "Authorization: Bearer kw_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key_id": "b0000000-0000-4000-a000-000000000001",
    "beneficiaire_nom": "Léa Martin",
    "beneficiaire_email": "lea@exemple.fr",
    "validite_jours": 7
  }'`}</Code>

        <h3 className="mt-8 text-lg font-bold">{t.reponse}</h3>
        <Code>{`{
  "id": "c0000000-0000-4000-a000-000000000009",
  "code": "H7KM2P",
  "qr_payload": "KEYWE:H7KM2P",
  "expire_le": "2026-07-30T10:00:00.000Z",
  "cle_en_depot": true
}`}</Code>

        <h3 className="mt-10 text-lg font-bold">{t.codesTitre}</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">{t.colCode}</th>
                <th scope="col" className="px-4 py-2 font-medium">{t.colSens}</th>
              </tr>
            </thead>
            <tbody>
              {erreurs.map(([code, sens]) => (
                <tr key={code} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-mono font-semibold">{code}</td>
                  <td className="px-4 py-2 text-gray-600">{sens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 rounded-3xl bg-sable p-8 text-center">
          <h2 className="text-xl font-black">{t.pretTitre}</h2>
          <p className="mx-auto mt-2 max-w-lg text-gray-700">{t.pretLede}</p>
          <Link
            href={l("/espace/api")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-encre px-5 py-3 font-semibold text-white hover:bg-encre-2"
          >
            {t.mesCles} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
