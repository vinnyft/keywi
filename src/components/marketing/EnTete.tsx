"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { CAS_USAGE } from "@/content/cas-usage";

/**
 * En-tête du site public : menus Produits et Cas d'usage en
 * listes déroulantes accessibles (boutons + aria-expanded),
 * burger sur mobile.
 */
export function EnTete() {
  const [menuMobile, setMenuMobile] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null);

  const produits = [
    { href: "/produits/points-relais", libelle: "Points relais", note: "Le réseau public Keywi" },
    { href: "/produits/casiers", libelle: "Casiers connectés", note: "Bientôt disponible" },
    { href: "/produits/logiciel-suivi", libelle: "Logiciel de suivi de clés", note: "Bientôt disponible" },
  ];

  function basculer(menu: string) {
    setMenuOuvert((actuel) => (actuel === menu ? null : menu));
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo taille={32} />

        {/* Navigation bureau */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {/* Menu Produits */}
          <div className="relative">
            <button
              onClick={() => basculer("produits")}
              aria-expanded={menuOuvert === "produits"}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Produits <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOuvert === "produits" && (
              <ul className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {produits.map((p) => (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      onClick={() => setMenuOuvert(null)}
                      className="block rounded-lg px-3 py-2 hover:bg-gray-50"
                    >
                      <span className="block text-sm font-semibold">{p.libelle}</span>
                      <span className="block text-xs text-gray-500">{p.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Menu Cas d'usage */}
          <div className="relative">
            <button
              onClick={() => basculer("cas")}
              aria-expanded={menuOuvert === "cas"}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Cas d&apos;usage <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menuOuvert === "cas" && (
              <ul className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                {CAS_USAGE.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/cas-usage/${c.slug}`}
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

          <Link href="/points-relais" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            Trouver un point relais
          </Link>
          <Link href="/devenir-point-relais" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            Devenir point relais
          </Link>
          <Link href="/tarifs" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100">
            Tarifs
          </Link>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/connexion"
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Connexion
          </Link>
          <Link
            href="/espace/deposer"
            className="rounded-lg bg-primaire px-4 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
          >
            Déposer mes clés
          </Link>
        </div>

        {/* Burger mobile */}
        <button
          className="lg:hidden"
          onClick={() => setMenuMobile(!menuMobile)}
          aria-expanded={menuMobile}
          aria-label={menuMobile ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {menuMobile ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation mobile */}
      {menuMobile && (
        <nav aria-label="Navigation mobile" className="border-t border-gray-200 bg-white px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {[
              { href: "/produits/points-relais", libelle: "Produits" },
              { href: "/cas-usage/hotes-airbnb", libelle: "Cas d'usage" },
              { href: "/points-relais", libelle: "Trouver un point relais" },
              { href: "/devenir-point-relais", libelle: "Devenir point relais" },
              { href: "/tarifs", libelle: "Tarifs" },
              { href: "/connexion", libelle: "Connexion" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuMobile(false)}
                  className="block rounded-lg px-3 py-2.5 font-medium hover:bg-gray-50"
                >
                  {l.libelle}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/espace/deposer"
                onClick={() => setMenuMobile(false)}
                className="mt-2 block rounded-lg bg-primaire px-3 py-2.5 text-center font-semibold text-white"
              >
                Déposer mes clés
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
