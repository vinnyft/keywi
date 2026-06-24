import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { CAS_USAGE } from "@/content/cas-usage";

/** Pied de page complet du site public */
export function PiedDePage() {
  return (
    <footer className="bg-encre text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo taille={32} sombre />
          <p className="mt-3 text-sm text-white/70">
            Le réseau français de points relais pour clés. Déposez près de chez
            vous, gérez les accès à distance.
          </p>
        </div>

        <nav aria-label="Produits">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Produits
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:underline" href="/produits/points-relais">Points relais</Link></li>
            <li><Link className="hover:underline" href="/produits/casiers">Casiers connectés</Link></li>
            <li><Link className="hover:underline" href="/produits/logiciel-suivi">Logiciel de suivi</Link></li>
            <li><Link className="hover:underline" href="/tarifs">Tarifs</Link></li>
            <li><Link className="hover:underline" href="/devenir-point-relais">Devenir point relais</Link></li>
          </ul>
        </nav>

        <nav aria-label="Cas d'usage">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            Cas d&apos;usage
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {CAS_USAGE.map((c) => (
              <li key={c.slug}>
                <Link className="hover:underline" href={`/cas-usage/${c.slug}`}>
                  {c.menu}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="KLAV">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">
            KLAV
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:underline" href="/a-propos">À propos</Link></li>
            <li><Link className="hover:underline" href="/contact">Contact</Link></li>
            <li><Link className="hover:underline" href="/faq">FAQ</Link></li>
            <li><Link className="hover:underline" href="/cgv">CGV</Link></li>
            <li><Link className="hover:underline" href="/confidentialite">Confidentialité</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} KLAV — Tous droits réservés. Fait avec ♥ à Paris.
      </div>
    </footer>
  );
}
