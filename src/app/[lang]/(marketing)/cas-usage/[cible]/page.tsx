import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  CAS_USAGE_SLUGS,
  getCasUsage,
  listeCasUsage,
} from "@/content/cas-usage";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Landing page « Cas d'usage » : un gabarit unique pour les 7
 * cibles, dans les deux langues, générées statiquement.
 */
export function generateStaticParams() {
  return CAS_USAGE_SLUGS.map((cible) => ({ cible }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; cible: string }>;
}): Promise<Metadata> {
  const { lang, cible } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const cas = getCasUsage(cible, locale);
  return cas
    ? {
        title: cas.menu,
        description: cas.accroche,
        alternates: alternatesLangues(`/cas-usage/${cas.slug}`, locale),
      }
    : { title: "Cas d'usage" };
}

export default async function PageCasUsage({
  params,
}: {
  params: Promise<{ lang: string; cible: string }>;
}) {
  const { lang, cible } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const cas = getCasUsage(cible, locale);
  if (!cas) notFound();

  const l = (chemin: string) => localise(chemin, locale);
  const t =
    locale === "en"
      ? {
          deposer: "Drop off my keys",
          tarifs: "See pricing",
          autres: "KeyWe also fits…",
        }
      : {
          deposer: "Déposer mes clés",
          tarifs: "Voir les tarifs",
          autres: "KeyWe s'adapte aussi à…",
        };
  const autres = listeCasUsage(locale).filter((c) => c.slug !== cas.slug);

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
              href={l("/espace/deposer")}
              className="rounded-xl bg-corail px-6 py-3 font-bold hover:bg-corail-fonce"
            >
              {t.deposer}
            </Link>
            <Link
              href={l("/tarifs")}
              className="rounded-xl border-2 border-white/30 px-6 py-3 font-bold hover:bg-white/10"
            >
              {t.tarifs}
            </Link>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-lg leading-relaxed text-gray-700">{cas.description}</p>
      </section>

      {/* Bénéfices */}
      <section className="bg-sable" aria-label={t.autres}>
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
      <section className="mx-auto max-w-5xl px-4 pb-16" aria-label={t.autres}>
        <h2 className="text-center text-xl font-bold">{t.autres}</h2>
        <ul className="mt-5 flex flex-wrap justify-center gap-2">
          {autres.map((c) => (
            <li key={c.slug}>
              <Link
                href={l(`/cas-usage/${c.slug}`)}
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
