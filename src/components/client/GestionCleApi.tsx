"use client";

import { useActionState, useState } from "react";
import { Copy, Check, KeyRound, TriangleAlert } from "lucide-react";
import { actionCreerCleApi } from "@/lib/actions/api";

/**
 * Création d'une clé API : la valeur en clair est affichée une
 * seule fois (elle n'est jamais stockée, seulement son hachage).
 */
export function GestionCleApi() {
  const [etat, soumettre, attente] = useActionState(actionCreerCleApi, {
    erreur: null,
    cle: null,
  });
  const [copie, setCopie] = useState(false);

  async function copier(valeur: string) {
    await navigator.clipboard.writeText(valeur);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <KeyRound size={18} className="text-primaire" aria-hidden="true" />
        Nouvelle clé API
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Donnez-lui un nom pour la reconnaître (ex. « Automatisation Airbnb »).
      </p>

      {etat.cle ? (
        <div className="mt-4 rounded-xl border-2 border-primaire bg-primaire-pale p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-primaire-fonce">
            <TriangleAlert size={15} aria-hidden="true" />
            Copiez cette clé maintenant — elle ne sera plus jamais affichée.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-sm">
              {etat.cle}
            </code>
            <button
              onClick={() => copier(etat.cle!)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primaire px-3 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
            >
              {copie ? (
                <>
                  <Check size={15} aria-hidden="true" /> Copié
                </>
              ) : (
                <>
                  <Copy size={15} aria-hidden="true" /> Copier
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <form action={soumettre} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="nom" className="block text-sm font-medium">
              Nom de la clé
            </label>
            <input
              id="nom"
              name="nom"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Automatisation Airbnb"
            />
          </div>
          <button
            type="submit"
            disabled={attente}
            className="rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
          >
            {attente ? "Génération…" : "Générer une clé"}
          </button>
          {etat.erreur && (
            <p role="alert" className="w-full text-sm font-medium text-red-700">
              {etat.erreur}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
