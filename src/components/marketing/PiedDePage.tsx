import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { listeCasUsage } from "@/content/cas-usage";
import { localise, type Locale } from "@/lib/i18n";
import type { Dictionnaire } from "@/lib/dictionaries";

/** Pied de page complet du site public, localisé. */
export function PiedDePage({
  dict,
  locale,
}: {
  dict: Dictionnaire["footer"];
  locale: Locale;
}) {
  const l = (chemin: string) => localise(chemin, locale);
  const casUsage = listeCasUsage(locale);

  return (
    <footer className="bg-encre text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo taille={32} sombre lien={l("/")} />
          <p className="mt-3 text-sm text-white/70">{dict.tagline}</p>
        </div>

        <nav aria-label={dict.produits}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            {dict.produits}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:underline" href={l("/produits/points-relais")}>{dict.pointsRelais}</Link></li>
            <li><Link className="hover:underline" href={l("/produits/casiers")}>{dict.casiers}</Link></li>
            <li><Link className="hover:underline" href={l("/produits/logiciel-suivi")}>{dict.logicielSuivi}</Link></li>
            <li><Link className="hover:underline" href={l("/tarifs")}>{dict.tarifs}</Link></li>
            <li><Link className="hover:underline" href={l("/devenir-point-relais")}>{dict.devenirPointRelais}</Link></li>
          </ul>
        </nav>

        <nav aria-label={dict.casUsage}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            {dict.casUsage}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {casUsage.map((c) => (
              <li key={c.slug}>
                <Link className="hover:underline" href={l(`/cas-usage/${c.slug}`)}>
                  {c.menu}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={dict.keywi}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            {dict.keywi}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:underline" href={l("/a-propos")}>{dict.aPropos}</Link></li>
            <li><Link className="hover:underline" href={l("/contact")}>{dict.contact}</Link></li>
            <li><Link className="hover:underline" href={l("/faq")}>{dict.faq}</Link></li>
            <li><Link className="hover:underline" href={l("/cgv")}>{dict.cgv}</Link></li>
            <li><Link className="hover:underline" href={l("/confidentialite")}>{dict.confidentialite}</Link></li>
            <li><Link className="hover:underline" href={l("/mentions-legales")}>{dict.mentionsLegales}</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Keywi — {dict.droits}
      </div>
    </footer>
  );
}
