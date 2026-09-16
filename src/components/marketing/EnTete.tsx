"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SelecteurLangue } from "@/components/ui/SelecteurLangue";
import { listeCasUsage } from "@/content/cas-usage";
import { localise, type Locale } from "@/lib/i18n";
import type { Dictionnaire } from "@/lib/dictionaries";

/**
 * En-tête du site public : menus Produits et Cas d'usage en listes
 * déroulantes accessibles, sélecteur de langue, burger sur mobile.
 * Libellés et liens dépendent de la langue courante.
 */
export function EnTete({
  dict,
  locale,
}: {
  dict: Dictionnaire["nav"];
  locale: Locale;
}) {
  const [menuMobile, setMenuMobile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);
  const l = (chemin: string) => localise(chemin, locale);
  const casUsage = listeCasUsage(locale);

  const produits = [
    { href: "/produits/points-relais", ...dict.produitsItems.pointsRelais },
    { href: "/produits/casiers", ...dict.produitsItems.casiers },
    { href: "/produits/logiciel-suivi", ...dict.produitsItems.logiciel },
  ];

  function basculer(menu: string) {
    setMenuOuvert((actuel) => (actuel === menu ? null : menu));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo taille={32} lien={l("/")} />

        {/* Navigation bureau */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          <div className="relative">
            <button
              onClick={() => basculer("produits")}
              aria-expanded={menuOuvert === "produits"}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              {dict.produits} <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOuvert === "produits" && (
              <ul className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {produits.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={l(p.href)}
                      onClick={() => setMenuOuvert(null)}
                      className="block rounded-lg px-3 py-2 hover:bg-gray-50"
                    >
                      <span className="block text-sm font-semibold">{p.label}</span>
                      <span className="block text-xs text-gray-500">{p.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => basculer("cas")}
              aria-expanded={menuOuvert === "cas"}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              {dict.casUsage} <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOuvert === "cas" && (
              <ul className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {casUsage.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={l(`/cas-usage/${c.slug}`)}
                      onClick={() => setMenuOuvert(null)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      {c.emoji} {c.menu}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link href={l("/points-relais")} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            {dict.trouverPointRelais}
          </Link>
          <Link href={l("/devenir-point-relais")} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            {dict.devenirPointRelais}
          </Link>
          <Link href={l("/tarifs")} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            {dict.tarifs}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <SelecteurLangue />
          <Link
            href={l("/connexion")}
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            {dict.connexion}
          </Link>
          <Link
            href={l("/espace/deposer")}
            className="rounded-lg bg-primaire px-4 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
          >
            {dict.deposerMesCles}
          </Link>
        </div>

        {/* Burger mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <SelecteurLangue />
          <button
            onClick={() => setMenuMobile(!menuMobile)}
            aria-expanded={menuMobile}
            aria-label={menuMobile ? dict.fermerMenu : dict.ouvrirMenu}
          >
            {menuMobile ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Navigation mobile */}
      {menuMobile && (
        <nav aria-label="Navigation mobile" className="border-t border-gray-200 bg-white px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {[
              { href: "/produits/points-relais", libelle: dict.produits },
              { href: "/cas-usage/hotes-airbnb", libelle: dict.casUsage },
              { href: "/points-relais", libelle: dict.trouverPointRelais },
              { href: "/devenir-point-relais", libelle: dict.devenirPointRelais },
              { href: "/tarifs", libelle: dict.tarifs },
              { href: "/connexion", libelle: dict.connexion },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={l(item.href)}
                  onClick={() => setMenuMobile(false)}
                  className="block rounded-lg px-3 py-2.5 font-medium hover:bg-gray-50"
                >
                  {item.libelle}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={l("/espace/deposer")}
                onClick={() => setMenuMobile(false)}
                className="mt-2 block rounded-lg bg-primaire px-3 py-2.5 text-center font-semibold text-white"
              >
                {dict.deposerMesCles}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
