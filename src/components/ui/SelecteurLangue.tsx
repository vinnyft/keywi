"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_DEFAUT } from "@/lib/i18n";
import { actionDefinirLangue } from "@/lib/actions/auth";

/**
 * Sélecteur de langue FR / EN pour la barre du site.
 *
 * Reste sur la page courante en changeant de langue : depuis
 * « /tarifs » (FR) le lien EN pointe vers « /en/tarifs », et
 * inversement. Rendu comme deux liens (fonctionne sans JS, lisible
 * par les lecteurs d'écran) ; la langue active est signalée.
 */
export function SelecteurLangue({ sombre = false }: { sombre?: boolean }) {
  const pathname = usePathname() || "/";
  const enAnglais = pathname === "/en" || pathname.startsWith("/en/");

  // Chemin sans préfixe de langue, base commune aux deux liens.
  const cheminNu = enAnglais ? pathname.slice(3) || "/" : pathname;
  const hrefFr = cheminNu;
  const hrefEn = cheminNu === "/" ? "/en" : `/en${cheminNu}`;

  const actif = enAnglais ? "en" : LOCALE_DEFAUT;
  const base = sombre ? "text-white/60" : "text-gray-500";
  const vif = sombre ? "text-white" : "text-encre";

  return (
    <div
      className="flex items-center gap-1 text-sm font-semibold"
      role="group"
      aria-label="Langue / Language"
    >
      <Link
        href={hrefFr}
        hrefLang="fr"
        aria-current={actif === "fr" ? "true" : undefined}
        onClick={() => void actionDefinirLangue("fr")}
        className={`rounded px-1.5 py-0.5 ${actif === "fr" ? vif : `${base} hover:${vif}`}`}
      >
        FR
      </Link>
      <span aria-hidden="true" className={base}>
        /
      </span>
      <Link
        href={hrefEn}
        hrefLang="en"
        aria-current={actif === "en" ? "true" : undefined}
        onClick={() => void actionDefinirLangue("en")}
        className={`rounded px-1.5 py-0.5 ${actif === "en" ? vif : `${base} hover:${vif}`}`}
      >
        EN
      </Link>
    </div>
  );
}
