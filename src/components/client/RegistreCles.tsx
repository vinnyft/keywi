"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download, ChevronRight, CalendarClock } from "lucide-react";
import { StatutCle } from "@/components/ui/StatutCle";
import { useLocale } from "@/lib/useLocale";
import { localise, type Locale } from "@/lib/i18n";
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

type ValeurFiltre = "tous" | KeyStatus | "retard";

const FILTRES_STATUT: { valeur: ValeurFiltre; libelle: Record<Locale, string> }[] = [
  { valeur: "tous", libelle: { fr: "Tous", en: "All" } },
  { valeur: "retard", libelle: { fr: "En retard", en: "Overdue" } },
  { valeur: "en_attente", libelle: { fr: "En attente", en: "Pending" } },
  { valeur: "deposee", libelle: { fr: "Déposées", en: "Dropped off" } },
  { valeur: "prete_retrait", libelle: { fr: "Prêtes au retrait", en: "Ready for pickup" } },
  { valeur: "retiree", libelle: { fr: "Retirées", en: "Picked up" } },
];

function estEnRetard(l: LigneRegistre) {
  return (
    l.date_retour_attendue != null &&
    new Date(l.date_retour_attendue) < new Date() &&
    l.statut !== "en_attente" &&
    l.statut !== "perdue"
  );
}

export function RegistreCles({ lignes }: { lignes: LigneRegistre[] }) {
  const locale = useLocale();
  const en = locale === "en";
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<ValeurFiltre>("tous");

  const dateCourte = (d: string) =>
    new Date(d).toLocaleDateString(en ? "en-IE" : "fr-FR", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });

  const t = en
    ? {
        rechercheLabel: "Search a property, a tag or a place",
        recherchePlaceholder: "Property, tag, drop-off point…",
        exportCsv: "Export CSV",
        filtrerLabel: "Filter by status",
        resultats: (n: number, total: number) =>
          `${n} keyring${n > 1 ? "s" : ""} of ${total}`,
        aucun: "No keyring matches this search.",
        thLogement: "Property",
        thStatut: "Status",
        thLieu: "Place",
        thCase: "Slot",
        thEcheance: "Deadline",
        thMouvements: "Movements",
        thDernier: "Latest",
        thDetail: "Details",
        enRetard: "Overdue",
        caseNum: (n: number) => `no. ${n}`,
        detailDe: (l: string) => `Details of ${l}`,
      }
    : {
        rechercheLabel: "Rechercher un logement, un badge ou un lieu",
        recherchePlaceholder: "Logement, badge, point relais…",
        exportCsv: "Export CSV",
        filtrerLabel: "Filtrer par statut",
        resultats: (n: number, total: number) =>
          `${n} trousseau${n > 1 ? "x" : ""} sur ${total}`,
        aucun: "Aucun trousseau ne correspond à cette recherche.",
        thLogement: "Logement",
        thStatut: "Statut",
        thLieu: "Lieu",
        thCase: "Case",
        thEcheance: "Échéance",
        thMouvements: "Mouvements",
        thDernier: "Dernier",
        thDetail: "Détail",
        enRetard: "En retard",
        caseNum: (n: number) => `n° ${n}`,
        detailDe: (l: string) => `Détail de ${l}`,
      };

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
            {t.rechercheLabel}
          </label>
          <input
            id="recherche-registre"
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t.recherchePlaceholder}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {/* Téléchargement de fichier (route API renvoyant un CSV), pas une
            navigation de page : l'ancre est correcte, <Link> ne convient pas. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/export/mouvements"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <Download size={16} aria-hidden="true" /> {t.exportCsv}
        </a>
      </div>

      {/* Filtres */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t.filtrerLabel}>
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
              {f.libelle[locale]}
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
        {t.resultats(resultats.length, lignes.length)}
      </p>

      {/* Tableau */}
      {resultats.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          {t.aucun}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t.thLogement}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thStatut}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thLieu}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thCase}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thEcheance}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{t.thMouvements}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thDernier}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t.thDetail}</span></th>
              </tr>
            </thead>
            <tbody>
              {resultats.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-sable/60">
                  <td className="px-4 py-3">
                    <Link
                      href={localise(`/espace/cles/${l.id}`, locale)}
                      className="font-semibold hover:text-primaire"
                    >
                      {l.logement}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">
                      {l.code_badge_imprime}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatutCle statut={l.statut} locale={locale} /></td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.lieu ?? "—"}
                    {l.lieuType === "casier" && (
                      <span className="ml-1.5 rounded-full bg-skin px-1.5 py-0.5 text-[10px] font-bold text-white">
                        24/7
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{l.caseNumero ? t.caseNum(l.caseNumero) : "—"}</td>
                  <td className="px-4 py-3">
                    {l.date_retour_attendue ? (
                      estEnRetard(l) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          <CalendarClock size={11} aria-hidden="true" /> {t.enRetard}
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
                    <Link
                      href={localise(`/espace/cles/${l.id}`, locale)}
                      aria-label={t.detailDe(l.logement)}
                    >
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
