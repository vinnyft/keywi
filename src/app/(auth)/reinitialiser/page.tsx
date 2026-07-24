"use client";

import { useActionState } from "react";
import Link from "next/link";
import { actionNouveauMotDePasse } from "@/lib/actions/auth";

/**
 * Choix du nouveau mot de passe, après ouverture du lien de
 * récupération reçu par email (la session ouverte autorise la
 * mise à jour).
 */
export default function PageReinitialiser() {
  const [etat, soumettre, attente] = useActionState(actionNouveauMotDePasse, {
    erreur: null,
  });

  return (
    <>
      <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-gray-600">
        Choisissez un mot de passe d&apos;au moins 8 caractères.
      </p>

      <form action={soumettre} className="mt-5 space-y-4">
        <div>
          <label htmlFor="mot_de_passe" className="block text-sm font-medium">
            Nouveau mot de passe
          </label>
          <input
            id="mot_de_passe"
            name="mot_de_passe"
            type="password"
            required
            minLength={8}
            autoFocus
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="confirmation" className="block text-sm font-medium">
            Confirmation
          </label>
          <input
            id="confirmation"
            name="confirmation"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        {etat.erreur && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {etat.erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={attente}
          className="w-full rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
        >
          {attente ? "Enregistrement…" : "Enregistrer et me connecter"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Lien expiré ?{" "}
        <Link
          href="/mot-de-passe-oublie"
          className="font-semibold text-primaire underline"
        >
          En redemander un
        </Link>
      </p>
    </>
  );
}
