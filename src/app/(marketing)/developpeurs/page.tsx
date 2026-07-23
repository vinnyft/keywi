import type { Metadata } from "next";
import Link from "next/link";
import { Terminal, KeyRound, Zap, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "API développeurs",
  description:
    "L'API Keywi : listez vos clés et créez des codes de retrait par programmation. Automatisez vos check-in Airbnb ou PMS.",
};

/** Bloc de code réutilisable (lecture seule, défilement horizontal) */
function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-encre p-4 text-sm text-white">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

const ENDPOINTS = [
  {
    methode: "GET",
    chemin: "/api/v1/cles",
    description: "Liste vos trousseaux : statut, lieu, case, échéance de retour.",
  },
  {
    methode: "POST",
    chemin: "/api/v1/codes",
    description:
      "Crée un code de retrait pour une clé et l'envoie au bénéficiaire par email.",
  },
];

export default function PageDeveloppeurs() {
  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            <Terminal size={15} aria-hidden="true" /> API v1
          </p>
          <h1 className="mt-4 text-4xl font-black">API Keywi</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Branchez Keywi sur vos outils : générez un code de retrait dès
            qu&apos;une réservation est confirmée, suivez l&apos;état de vos
            trousseaux en temps réel.
          </p>
          <Link
            href="/espace/api"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
          >
            Générer une clé API <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        {/* Authentification */}
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <KeyRound size={22} className="text-primaire" aria-hidden="true" />
          Authentification
        </h2>
        <p className="mt-3 text-gray-700">
          Chaque requête doit porter votre clé API dans l&apos;en-tête
          <code className="mx-1 rounded bg-sable px-1.5 py-0.5 font-mono text-sm">
            Authorization
          </code>
          . Les clés commencent par
          <code className="mx-1 rounded bg-sable px-1.5 py-0.5 font-mono text-sm">
            kw_live_
          </code>
          et ne sont affichées qu&apos;une seule fois : conservez-les comme un
          mot de passe.
        </p>
        <Code>{`curl https://keywi.fr/api/v1/cles \\
  -H "Authorization: Bearer kw_live_votre_cle"`}</Code>

        {/* Endpoints */}
        <h2 className="mt-12 flex items-center gap-2 text-2xl font-black">
          <Zap size={22} className="text-primaire" aria-hidden="true" />
          Points d&apos;entrée
        </h2>
        <ul className="mt-4 space-y-3">
          {ENDPOINTS.map((e) => (
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

        {/* Exemple complet */}
        <h3 className="mt-10 text-lg font-bold">Créer un code de retrait</h3>
        <p className="mt-2 text-gray-700">
          L&apos;appel type au moment d&apos;une réservation : le voyageur
          reçoit son code par email, valable 7 jours.
        </p>
        <Code>{`curl -X POST https://keywi.fr/api/v1/codes \\
  -H "Authorization: Bearer kw_live_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key_id": "b0000000-0000-4000-a000-000000000001",
    "beneficiaire_nom": "Léa Martin",
    "beneficiaire_email": "lea@exemple.fr",
    "validite_jours": 7
  }'`}</Code>

        <h3 className="mt-8 text-lg font-bold">Réponse</h3>
        <Code>{`{
  "id": "c0000000-0000-4000-a000-000000000009",
  "code": "H7KM2P",
  "qr_payload": "KEYWI:H7KM2P",
  "expire_le": "2026-07-30T10:00:00.000Z",
  "cle_en_depot": true
}`}</Code>

        {/* Codes d'erreur */}
        <h3 className="mt-10 text-lg font-bold">Codes de réponse</h3>
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Code</th>
                <th scope="col" className="px-4 py-2 font-medium">Signification</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["200 / 201", "Succès"],
                ["400", "Requête incomplète ou invalide"],
                ["401", "Clé API manquante, invalide ou révoquée"],
                ["404", "Ressource introuvable ou hors de votre compte"],
              ].map(([code, sens]) => (
                <tr key={code} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-mono font-semibold">{code}</td>
                  <td className="px-4 py-2 text-gray-600">{sens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 rounded-3xl bg-sable p-8 text-center">
          <h2 className="text-xl font-black">Prêt à automatiser ?</h2>
          <p className="mx-auto mt-2 max-w-lg text-gray-700">
            Générez votre première clé depuis votre espace, en quelques
            secondes.
          </p>
          <Link
            href="/espace/api"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-encre px-5 py-3 font-semibold text-white hover:bg-encre-2"
          >
            Mes clés API <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
