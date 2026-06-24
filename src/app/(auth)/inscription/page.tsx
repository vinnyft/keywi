"use client";

import { useActionState } from "react";
import Link from "next/link";
import { actionInscription } from "@/lib/actions/auth";

/** Page d'inscription hôte / voyageur */
export default function PageInscription() {
  const [etat, soumettre, attente] = useActionState(actionInscription, {
    erreur: null,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <p className="mt-1 text-sm text-gray-600">
        Gérez vos clés à distance en quelques minutes.
      </p>

      <form action={soumettre} className="mt-6 space-y-4">
        <div>
          <label htmlFor="nom" className="block text-sm font-medium">
            Nom complet
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Camille Dupont"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="vous@exemple.fr"
          />
        </div>
        <div>
          <label htmlFor="mot_de_passe" className="block text-sm font-medium">
            Mot de passe{" "}
            <span className="font-normal text-gray-500">(8 caractères minimum)</span>
          </label>
          <input
            id="mot_de_passe"
            name="mot_de_passe"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Vous êtes…</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm has-[:checked]:border-primaire has-[:checked]:bg-primaire-pale">
              <input type="radio" name="role" value="hote" defaultChecked />
              Hôte / propriétaire
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm has-[:checked]:border-primaire has-[:checked]:bg-primaire-pale">
              <input type="radio" name="role" value="voyageur" />
              Voyageur / invité
            </label>
          </div>
        </fieldset>

        {etat.erreur && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {etat.erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={attente}
          className="w-full rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white transition hover:bg-primaire-fonce disabled:opacity-60"
        >
          {attente ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-primaire underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
