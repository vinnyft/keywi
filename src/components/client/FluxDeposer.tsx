"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import { CarteRelaisDynamique } from "@/components/carte/CarteRelaisDynamique";
import type { PointRelaisCarte } from "@/components/carte/CarteRelais";
import { actionDeposerCle } from "@/lib/actions/client";

/**
 * Flux de dépôt côté hôte :
 *  1. choix d'un point relais (liste + carte) ;
 *  2. nom du logement ;
 *  3. paiement (Stripe test ou simulé en local) → badge généré.
 */

interface PointDispo extends PointRelaisCarte {
  casesLibres: number;
}

export function FluxDeposer({ points }: { points: PointDispo[] }) {
  const router = useRouter();
  const [selection, setSelection] = useState<PointDispo | null>(null);
  const [logement, setLogement] = useState("");
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function payer() {
    if (!selection || logement.trim().length < 2) return;
    setAttente(true);
    setErreur(null);
    const r = await actionDeposerCle({
      relayPointId: selection.id,
      logement: logement.trim(),
    });
    if (!r.ok) {
      setErreur(r.erreur ?? "Une erreur est survenue.");
      setAttente(false);
      return;
    }
    if (r.url) {
      window.location.href = r.url; // Stripe Checkout
      return;
    }
    router.push(`/espace/cles/${r.keyId}?paiement=simule`);
  }

  // Étape 2 : nom du logement + paiement
  if (selection) {
    return (
      <div className="mx-auto max-w-lg">
        <button
          onClick={() => setSelection(null)}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-encre"
        >
          <ArrowLeft size={16} aria-hidden="true" /> Changer de point relais
        </button>

        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5">
          <p className="flex items-center gap-1.5 font-bold">
            <MapPin size={16} className="text-primaire" aria-hidden="true" />
            {selection.nom}
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            {selection.adresse}, {selection.code_postal} {selection.ville}
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              payer();
            }}
          >
            <div>
              <label htmlFor="logement" className="block text-sm font-medium">
                Nom du logement
              </label>
              <input
                id="logement"
                value={logement}
                onChange={(e) => setLogement(e.target.value)}
                required
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Studio Bretagne, Appart Bastille…"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ce nom vous aide à reconnaître la clé dans votre tableau de bord.
              </p>
            </div>

            <div className="rounded-xl bg-sable p-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Dépôt de clés KLAV (à l&apos;unité)</span>
                <span className="font-bold">7,90 €</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Paiement unique. Un badge à coller sur le trousseau est généré
                aussitôt.
              </p>
            </div>

            {erreur && (
              <p role="alert" className="text-sm font-medium text-red-700">
                {erreur}
              </p>
            )}

            <button
              type="submit"
              disabled={attente || logement.trim().length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primaire px-4 py-3 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
            >
              <CreditCard size={18} aria-hidden="true" />
              {attente ? "Redirection vers le paiement…" : "Payer et générer le badge"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Étape 1 : choix du point relais
  return (
    <div>
      <div className="flex items-start gap-2">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primaire" aria-hidden="true" />
        <p className="text-gray-700">
          Choisissez le point relais où vous déposerez votre trousseau. La
          disponibilité des cases est indiquée en temps réel.
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        <ul className="space-y-3 lg:col-span-2 lg:max-h-[520px] lg:overflow-y-auto lg:pr-1">
          {points.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setSelection(p)}
                disabled={p.casesLibres === 0}
                className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-primaire disabled:opacity-50"
              >
                <p className="flex items-center gap-1.5 font-bold">
                  <MapPin size={15} className="text-primaire" aria-hidden="true" />
                  {p.nom}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {p.adresse}, {p.code_postal} {p.ville}
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    p.casesLibres > 0 ? "text-menthe" : "text-red-700"
                  }`}
                >
                  {p.casesLibres > 0
                    ? `${p.casesLibres} case${p.casesLibres > 1 ? "s" : ""} libre${p.casesLibres > 1 ? "s" : ""}`
                    : "Complet actuellement"}
                </p>
              </button>
            </li>
          ))}
          {points.length === 0 && (
            <li className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-600">
              Aucun point relais actif pour l&apos;instant.
            </li>
          )}
        </ul>

        <div className="lg:col-span-3">
          <CarteRelaisDynamique
            points={points}
            surSelection={(p) => {
              const pt = points.find((x) => x.id === p.id);
              if (pt && pt.casesLibres > 0) setSelection(pt);
            }}
            hauteur="520px"
          />
        </div>
      </div>
    </div>
  );
}
