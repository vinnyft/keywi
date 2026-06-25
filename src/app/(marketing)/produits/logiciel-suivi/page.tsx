import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Logiciel de suivi de clés (bientôt)",
  description:
    "Keywi Pro : le logiciel de suivi de clés pour conciergeries, agences et hôtels. Bientôt disponible.",
};

/** Page teaser : logiciel de suivi de clés à venir */
export default function PageLogicielSuivi() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="inline-block rounded-full bg-ambre-pale px-3 py-1 text-sm font-bold text-ambre">
        🚧 Bientôt disponible
      </p>
      <h1 className="mt-5 text-3xl font-black sm:text-4xl">
        Keywi Pro — le logiciel de suivi de clés
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
        Le back-office des professionnels qui gèrent des dizaines de
        trousseaux : tableau de parc, affectations par équipe, alertes de
        non-retour, rapports d&apos;audit et API.
      </p>
      <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-gray-700">
        <li className="rounded-xl border border-gray-200 p-4">
          📊 <strong>Vue de parc</strong> — tous vos trousseaux, leur statut et leur localisation
        </li>
        <li className="rounded-xl border border-gray-200 p-4">
          👥 <strong>Équipes & permissions</strong> — qui peut retirer quoi, et quand
        </li>
        <li className="rounded-xl border border-gray-200 p-4">
          🔔 <strong>Alertes de non-retour</strong> — soyez prévenu avant que ça devienne un problème
        </li>
        <li className="rounded-xl border border-gray-200 p-4">
          🔌 <strong>API & intégrations</strong> — connectez votre PMS ou votre channel manager
        </li>
      </ul>
      <p className="mt-8 text-gray-600">
        Rejoignez la liste d&apos;attente pour un accès anticipé.
      </p>
      <Link
        href="/contact"
        className="mt-4 inline-block rounded-xl bg-primaire px-6 py-3 font-bold text-white hover:bg-primaire-fonce"
      >
        Rejoindre la liste d&apos;attente
      </Link>
    </section>
  );
}
