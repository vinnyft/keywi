"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download, ChevronRight, CalendarClock } from "lucide-react";
import { StatutCle } from "@/components/ui/StatutCle";
import type { Database } from "@/lib/supabase/types";

/**
 * Registre des trousseaux (Keywi Pro) : recherche, filtres par
 * statut / lieu / retard, et export CSV de l'historique.
 * Le filtrage est fait côté client : un parc d'hôte tient
 * largement en mémoire, et la réponse est instantanée.
 */

type KeyStatus = Database["public"]["Enums"]["key_status"];

export interface LigneRegistre {
  id: string;
  logement: string;
  code_badge_imprime: string;
  statut: KeyStatus;
  date_retour_attendue: string | null;
  created_at: string;
  lieu: string | null;
  lieuType: "commerce" | "casier" | null;
  caseNumero: number | null;
  nbMouvements: number;
  dernierMouvement: string | null;
}

const FILTRES_STATUT: { valeur: "tous" | KeyStatus | "retard"; libelle: string }[] = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: "retard", libelle: "En retard" },
  { valeur: "en_attente", libelle: "En attente" },
  { valeur: "deposee", libelle: "Déposées" },
  { valeur: "prete_retrait", libelle: "Prêtes au retrait" },
  { valeur: "retiree", libelle: "Retirées" },
];

function estEnRetard(l: LigneRegistre) {
  return (
    l.date_retour_attendue != null &&
    new Date(l.date_retour_attendue) < new Date() &&
    l.statut !== "en_attente" &&
    l.statut !== "perdue"
  );
}

const dateCourte = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });

export function RegistreCles({ lignes }: { lignes: LigneRegistre[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"tous" | KeyStatus | "retard">("tous");

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return lignes.filter((l) => {
      const correspond =
        !q ||
        l.logement.toLowerCase().includes(q) ||
        l.code_badge_imprime.toLowerCase().includes(q) ||
        (l.lieu ?? "").toLowerCase().includes(q);
      if (!correspond) return false;
      if (filtre === "tous") return true;
      if (filtre === "retard") return estEnRetard(l);
      return l.statut === filtre;
    });
  }, [lignes, recherche, filtre]);

  const nbRetard = useMemo(() => lignes.filter(estEnRetard).length, [lignes]);

  return (
    <div>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <label htmlFor="recherche-registre" className="sr-only">
            Rechercher un logement, un badge ou un lieu
          </label>
          <input
            id="recherche-registre"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Logement, badge, point relais…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <a
          href="/api/export/mouvements"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <Download size={16} aria-hidden="true" /> Export CSV
        </a>
      </div>

      {/* Filtres */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        {FILTRES_STATUT.map((f) => {
          const actif = filtre === f.valeur;
          const compteur = f.valeur === "retard" ? nbRetard : null;
          return (
            <button
              key={f.valeur}
              onClick={() => setFiltre(f.valeur)}
              aria-pressed={actif}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                actif
                  ? "bg-encre text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f.libelle}
              {compteur != null && compteur > 0 && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-xs font-bold ${
                    actif ? "bg-white/20" : "bg-red-100 text-red-700"
                  }`}
                >
                  {compteur}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-gray-600" aria-live="polite">
        {resultats.length} trousseau{resultats.length > 1 ? "x" : ""} sur {lignes.length}
      </p>

      {/* Tableau */}
      {resultats.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Aucun trousseau ne correspond à cette recherche.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Logement</th>
                <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                <th scope="col" className="px-4 py-3 font-medium">Lieu</th>
                <th scope="col" className="px-4 py-3 font-medium">Case</th>
                <th scope="col" className="px-4 py-3 font-medium">Échéance</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Mouvements</th>
                <th scope="col" className="px-4 py-3 font-medium">Dernier</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Détail</span></th>
              </tr>
            </thead>
            <tbody>
              {resultats.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-sable/60">
                  <td className="px-4 py-3">
                    <Link href={`/espace/cles/${l.id}`} className="font-semibold hover:text-primaire">
                      {l.logement}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">
                      {l.code_badge_imprime}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatutCle statut={l.statut} /></td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.lieu ?? "—"}
                    {l.lieuType === "casier" && (
                      <span className="ml-1.5 rounded-full bg-skin px-1.5 py-0.5 text-[10px] font-bold text-white">
                        24/7
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{l.caseNumero ? `n° ${l.caseNumero}` : "—"}</td>
                  <td className="px-4 py-3">
                    {l.date_retour_attendue ? (
                      estEnRetard(l) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          <CalendarClock size={11} aria-hidden="true" /> En retard
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          {dateCourte(l.date_retour_attendue)}
                        </span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{l.nbMouvements}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.dernierMouvement ? dateCourte(l.dernierMouvement) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/espace/cles/${l.id}`} aria-label={`Détail de ${l.logement}`}>
                      <ChevronRight size={16} className="text-gray-400" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
