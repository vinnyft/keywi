import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Casiers connectés (bientôt)",
  description:
    "Les casiers connectés KLAV arrivent : un accès aux clés 24 h/24, sans comptoir.",
};

/** Page teaser : casiers connectés à venir */
export default function PageCasiers() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="inline-block rounded-full bg-ambre-pale px-3 py-1 text-sm font-bold text-ambre">
        🚧 Bientôt disponible
      </p>
      <h1 className="mt-5 text-3xl font-black sm:text-4xl">Casiers connectés KLAV</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
        Pour les clés qui n&apos;attendent pas : des casiers automatiques
        accessibles 24 h/24 dans les halls d&apos;immeubles, gares et
        commerces, déverrouillés par le même code KLAV que vos points relais.
      </p>
      <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-gray-700">
        <li className="rounded-xl border border-gray-200 p-4">
          ⏰ <strong>Accès 24 h/24</strong> — plus de contrainte d&apos;horaires
        </li>
        <li className="rounded-xl border border-gray-200 p-4">
          🔐 <strong>Même code, même appli</strong> — l&apos;expérience KLAV, sans comptoir
        </li>
        <li className="rounded-xl border border-gray-200 p-4">
          🏢 <strong>Pensé pour les immeubles</strong> — proposez-le à votre copropriété
        </li>
      </ul>
      <p className="mt-8 text-gray-600">
        Envie d&apos;être informé du lancement ou d&apos;accueillir un casier ?
      </p>
      <Link
        href="/contact"
        className="mt-4 inline-block rounded-xl bg-primaire px-6 py-3 font-bold text-white hover:bg-primaire-fonce"
      >
        Être tenu informé
      </Link>
    </section>
  );
}
