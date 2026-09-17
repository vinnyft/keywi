import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  KeyRound,
  Smartphone,
  ShieldCheck,
  Bell,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listeCasUsage } from "@/content/cas-usage";
import { estLocale, localise, type Locale } from "@/lib/i18n";
import { getDictionnaire } from "@/lib/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    alternates: {
      canonical: localise("/", loc),
      languages: { fr: "/", en: "/en", "x-default": "/" },
    },
  };
}

/** Accueil du site public KeyWe */
export default async function PageAccueil({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = getDictionnaire(locale).home;
  const l = (chemin: string) => localise(chemin, locale);

  const supabase = await createClient();
  const { data } = await supabase.rpc("stats_publiques");
  const stats = (data ?? {}) as {
    nb_points_relais?: number;
    nb_mouvements?: number;
    nb_cles_gerees?: number;
  };

  const icones = [MapPin, KeyRound, Bell];
  const casUsage = listeCasUsage(locale);

  return (
    <>
      {/* Hero */}
      <section className="bg-encre text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              <ShieldCheck size={15} aria-hidden="true" /> {t.badge}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              {t.titre1}
              <br />
              <span className="text-lime">{t.titre2}</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">{t.lede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={l("/espace/deposer")}
                className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
              >
                {t.deposerCle} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href={l("/points-relais")}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10"
              >
                {t.voirCarte}
              </Link>
            </div>
          </div>

          {/* Indicateurs */}
          <dl className="grid grid-cols-3 gap-3">
            {[
              { v: stats.nb_points_relais ?? 0, l: t.statPointsRelais },
              { v: stats.nb_cles_gerees ?? 0, l: t.statClesGerees },
              { v: stats.nb_mouvements ?? 0, l: t.statMouvements },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl bg-white/5 p-5 text-center ring-1 ring-white/10"
              >
                <dd className="text-3xl font-black text-lime">{s.v}</dd>
                <dt className="mt-1 text-sm text-white/70">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-black">{t.commentTitre}</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-gray-600">
          {t.commentLede}
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.etapes.map((etape, i) => {
            const Icone = icones[i] ?? MapPin;
            return (
              <div
                key={etape.titre}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
                  <Icone size={22} aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-bold text-gray-400">
                  {t.etape} {i + 1}
                </p>
                <h3 className="text-lg font-bold">{etape.titre}</h3>
                <p className="mt-1 text-gray-600">{etape.texte}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="bg-sable">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-black">{t.penseTitre}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {casUsage.map((c) => (
              <Link
                key={c.slug}
                href={l(`/cas-usage/${c.slug}`)}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-primaire"
              >
                <span className="text-3xl" aria-hidden="true">
                  {c.emoji}
                </span>
                <h3 className="mt-3 font-bold group-hover:text-primaire">
                  {c.menu}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {c.accroche}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau commerçant */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-primaire px-6 py-12 text-center text-white sm:px-12">
          <Smartphone size={40} aria-hidden="true" />
          <h2 className="text-3xl font-black">{t.commercantTitre}</h2>
          <p className="max-w-xl text-white/80">{t.commercantLede}</p>
          <Link
            href={l("/devenir-point-relais")}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primaire hover:bg-white/90"
          >
            {t.devenirPointRelais} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
