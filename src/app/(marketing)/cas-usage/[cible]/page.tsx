import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { CAS_USAGE, getCasUsage } from "@/content/cas-usage";

/**
 * Landing page « Cas d'usage » : un gabarit unique pour les 7
 * cibles (hôtes Airbnb, conciergeries, agents immobiliers…),
 * générées statiquement.
 */

export function generateStaticParams() {
  return CAS_USAGE.map((c) => ({ cible: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cible: string }>;
}): Promise<Metadata> {
  const { cible } = await params;
  const cas = getCasUsage(cible);
  return cas
    ? { title: cas.menu, description: cas.accroche }
    : { title: "Cas d'usage" };
}

export default async function PageCasUsage({
  params,
}: {
  params: Promise<{ cible: string }>;
}) {
  const { cible } = await params;
  const cas = getCasUsage(cible);
  if (!cas) notFound();

  return (
    <>
      {/* Hero du cas d'usage */}
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">
            {cas.emoji}
          </span>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">{cas.titre}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{cas.accroche}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/espace/deposer"
              className="rounded-xl bg-corail px-6 py-3 font-bold hover:bg-corail-fonce"
            >
              Déposer mes clés
            </Link>
            <Link
              href="/tarifs"
              className="rounded-xl border-2 border-white/30 px-6 py-3 font-bold hover:bg-white/10"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-lg leading-relaxed text-gray-700">{cas.description}</p>
      </section>

      {/* Bénéfices */}
      <section className="bg-sable" aria-label="Bénéfices">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12 md:grid-cols-3">
          {cas.benefices.map((b) => (
            <div key={b.titre} className="rounded-2xl bg-white p-5">
              <CheckCircle2 size={22} className="text-menthe" aria-hidden="true" />
              <h2 className="mt-2 font-bold">{b.titre}</h2>
              <p className="mt-1 text-sm text-gray-600">{b.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Témoignage */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <figure className="rounded-2xl border-l-4 border-primaire bg-primaire-pale p-6">
          <blockquote className="text-lg font-medium text-encre">
            « {cas.temoignage.citation} »
          </blockquote>
          <figcaption className="mt-3 text-sm font-semibold text-primaire-fonce">
            — {cas.temoignage.auteur}
          </figcaption>
        </figure>
      </section>

      {/* Maillage vers les autres cas */}
      <section className="mx-auto max-w-5xl px-4 pb-16" aria-label="Autres cas d'usage">
        <h2 className="text-center text-xl font-bold">KLAV s&apos;adapte aussi à…</h2>
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {CAS_USAGE.filter((c) => c.slug !== cas.slug).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/cas-usage/${c.slug}`}
                className="inline-block rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-primaire hover:text-primaire"
              >
                {c.emoji} {c.menu}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
