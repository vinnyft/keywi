"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { CarteRelaisDynamique } from "@/components/carte/CarteRelaisDynamique";
import type { PointRelaisCarte } from "@/components/carte/CarteRelais";

/**
 * Recherche de point relais : champ adresse/code postal + carte
 * Leaflet + fiches détaillées (horaires, disponibilité). Les libellés
 * sont fournis par la page (localisés) via la prop `t`.
 */

interface PointRelaisPublic extends PointRelaisCarte {
  horaires: Record<string, string> | null;
  description: string | null;
  casesLibres: number;
}

export interface TextesRecherche {
  rechercheLabel: string;
  placeholder: string;
  horaires: string;
  deposerIci: string;
  aucun: string;
  complet: string;
  caseSingulier: string;
  casePluriel: string;
  voirAvant: string;
  voirApres: string;
}

export function RechercheRelais({
  points,
  t,
  deposerHref,
}: {
  points: PointRelaisPublic[];
  t: TextesRecherche;
  deposerHref: string;
}) {
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<string | null>(null);

  const filtres = points.filter(
    (p) =>
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.adresse.toLowerCase().includes(recherche.toLowerCase()) ||
      p.code_postal.includes(recherche) ||
      p.ville.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <label htmlFor="recherche-relais" className="sr-only">
          {t.rechercheLabel}
        </label>
        <input
          id="recherche-relais"
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t.placeholder}
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        />

        <ul className="mt-4 max-h-[480px] space-y-3 overflow-y-auto pr-1">
          {filtres.map((p) => (
            <li key={p.id}>
              <article
                className={`rounded-2xl border bg-white p-4 transition ${
                  selection === p.id ? "border-corail" : "border-gray-200"
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setSelection(p.id)}
                  aria-label={`${t.voirAvant}${p.nom}${t.voirApres}`}
                >
                  <h2 className="flex items-center gap-1.5 font-bold">
                    <MapPin size={15} className="shrink-0 text-primaire" aria-hidden="true" />
                    {p.nom}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {p.adresse}, {p.code_postal} {p.ville}
                  </p>
                </button>
                {p.description && (
                  <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                )}
                {p.horaires && (
                  <details className="mt-2 text-sm">
                    <summary className="flex cursor-pointer items-center gap-1 font-medium text-gray-700">
                      <Clock size={13} aria-hidden="true" /> {t.horaires}
                    </summary>
                    <dl className="mt-1 space-y-0.5 pl-5 text-gray-600">
                      {Object.entries(p.horaires).map(([jours, heures]) => (
                        <div key={jours} className="flex gap-2">
                          <dt className="font-medium capitalize">{jours} :</dt>
                          <dd>{heures}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
                <p className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      p.casesLibres > 0 ? "text-menthe" : "text-red-700"
                    }`}
                  >
                    {p.casesLibres > 0
                      ? `${p.casesLibres} ${p.casesLibres > 1 ? t.casePluriel : t.caseSingulier}`
                      : t.complet}
                  </span>
                  <Link
                    href={deposerHref}
                    className="text-sm font-semibold text-primaire underline"
                  >
                    {t.deposerIci}
                  </Link>
                </p>
              </article>
            </li>
          ))}
          {filtres.length === 0 && (
            <li className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-600">
              {t.aucun}
            </li>
          )}
        </ul>
      </div>

      <div className="lg:col-span-3">
        <CarteRelaisDynamique
          points={filtres}
          pointSelectionne={selection}
          hauteur="560px"
        />
      </div>
    </div>
  );
}
