"use client";

import { useActionState, useState } from "react";
import { Copy, Check, KeyRound, TriangleAlert } from "lucide-react";
import { actionCreerCleApi } from "@/lib/actions/api";
import { useLocale } from "@/lib/useLocale";

/**
 * Création d'une clé API : la valeur en clair est affichée une
 * seule fois (elle n'est jamais stockée, seulement son hachage).
 */
export function GestionCleApi() {
  const en = useLocale() === "en";
  const [etat, soumettre, attente] = useActionState(actionCreerCleApi, {
    erreur: null,
    cle: null,
  });
  const [copie, setCopie] = useState(false);

  const t = en
    ? {
        titre: "New API key",
        sousTitre: "Give it a name to recognise it (e.g. “Airbnb automation”).",
        copiezMaintenant: "Copy this key now — it will never be shown again.",
        copie: "Copied",
        copier: "Copy",
        nomLabel: "Key name",
        nomPlaceholder: "Airbnb automation",
        generation: "Generating…",
        generer: "Generate a key",
        droits: "Key permissions",
        lire: "Read my keyrings",
        creer: "Create pickup codes",
      }
    : {
        titre: "Nouvelle clé API",
        sousTitre: "Donnez-lui un nom pour la reconnaître (ex. « Automatisation Airbnb »).",
        copiezMaintenant: "Copiez cette clé maintenant — elle ne sera plus jamais affichée.",
        copie: "Copié",
        copier: "Copier",
        nomLabel: "Nom de la clé",
        nomPlaceholder: "Automatisation Airbnb",
        generation: "Génération…",
        generer: "Générer une clé",
        droits: "Droits de la clé",
        lire: "Lire mes trousseaux",
        creer: "Créer des codes de retrait",
      };

  async function copier(valeur: string) {
    await navigator.clipboard.writeText(valeur);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <KeyRound size={18} className="text-primaire" aria-hidden="true" />
        {t.titre}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{t.sousTitre}</p>

      {etat.cle ? (
        <div className="mt-4 rounded-xl border-2 border-primaire bg-primaire-pale p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-primaire-fonce">
            <TriangleAlert size={15} aria-hidden="true" />
            {t.copiezMaintenant}
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
                  <Check size={15} aria-hidden="true" /> {t.copie}
                </>
              ) : (
                <>
                  <Copy size={15} aria-hidden="true" /> {t.copier}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <form action={soumettre} className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <label htmlFor="nom" className="block text-sm font-medium">
                {t.nomLabel}
              </label>
              <input
                id="nom"
                name="nom"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={t.nomPlaceholder}
              />
            </div>
            <button
              type="submit"
              disabled={attente}
              className="rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
            >
              {attente ? t.generation : t.generer}
            </button>
          </div>

          {/* Moindre privilège : l'hôte n'accorde que ce dont son
              intégration a besoin. Une clé de reporting ne coche que
              « lire », une automatisation de check-in que « créer ». */}
          <fieldset>
            <legend className="text-sm font-medium">{t.droits}</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="portees"
                  value="lire"
                  defaultChecked
                  className="size-4 rounded border-gray-300"
                />
                {t.lire}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="portees"
                  value="creer"
                  defaultChecked
                  className="size-4 rounded border-gray-300"
                />
                {t.creer}
              </label>
            </div>
          </fieldset>

          {etat.erreur && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {etat.erreur}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
