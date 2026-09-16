"use client";

import { useActionState } from "react";
import Link from "next/link";
import { actionNouveauMotDePasse } from "@/lib/actions/auth";
import { useLocale } from "@/lib/useLocale";
import { localise } from "@/lib/i18n";

/**
 * Choix du nouveau mot de passe, après ouverture du lien de
 * récupération reçu par email (la session ouverte autorise la
 * mise à jour).
 */
export default function PageReinitialiser() {
  const locale = useLocale();
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);
  const [etat, soumettre, attente] = useActionState(actionNouveauMotDePasse, {
    erreur: null,
  });

  return (
    <>
      <h1 className="text-xl font-bold">{en ? "New password" : "Nouveau mot de passe"}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {en
          ? "Choose a password of at least 8 characters."
          : "Choisissez un mot de passe d'au moins 8 caractères."}
      </p>

      <form action={soumettre} className="mt-5 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label htmlFor="mot_de_passe" className="block text-sm font-medium">
            {en ? "New password" : "Nouveau mot de passe"}
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
            {en ? "Confirmation" : "Confirmation"}
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
          {attente
            ? en
              ? "Saving…"
              : "Enregistrement…"
            : en
              ? "Save and log me in"
              : "Enregistrer et me connecter"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        {en ? "Link expired?" : "Lien expiré ?"}{" "}
        <Link
          href={l("/mot-de-passe-oublie")}
          className="font-semibold text-primaire underline"
        >
          {en ? "Request a new one" : "En redemander un"}
        </Link>
      </p>
    </>
  );
}
