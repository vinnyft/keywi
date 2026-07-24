"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, TriangleAlert } from "lucide-react";

/**
 * Erreur inattendue dans une page.
 * Volontairement sobre : on ne montre pas la pile d'exécution à
 * l'utilisateur, mais on la journalise pour le diagnostic.
 */
export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur applicative :", error);
  }, [error]);

  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center"
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-ambre-pale text-ambre">
        <TriangleAlert size={26} aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-2xl font-black">Quelque chose a coincé</h1>
      <p className="mx-auto mt-3 max-w-md text-gray-600">
        Une erreur inattendue est survenue de notre côté. Vos clés et vos codes
        de retrait ne sont pas affectés.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
        >
          <RotateCcw size={18} aria-hidden="true" /> Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50"
        >
          <Home size={18} aria-hidden="true" /> Accueil
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-xs text-gray-400">
          Référence : {error.digest}
        </p>
      )}
    </main>
  );
}
