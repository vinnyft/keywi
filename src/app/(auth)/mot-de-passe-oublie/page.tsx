"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { actionMotDePasseOublie } from "@/lib/actions/auth";

/** Demande d'un lien de réinitialisation du mot de passe */
export default function PageMotDePasseOublie() {
  const [etat, soumettre, attente] = useActionState(actionMotDePasseOublie, {
    erreur: null,
    envoye: false,
  });

  if (etat.envoye) {
    return (
      <div className="text-center">
        <MailCheck size={40} className="mx-auto text-menthe" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold">Vérifiez votre boîte mail</h1>
        <p role="status" className="mt-2 text-gray-600">
          Si un compte Keywi existe avec cette adresse, vous venez de recevoir
          un lien pour choisir un nouveau mot de passe. Il est valable une
          heure.
        </p>
        <Link
          href="/connexion"
          className="mt-6 inline-block font-semibold text-primaire underline"
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-gray-600">
        Indiquez votre adresse : nous vous enverrons un lien pour en choisir un
        nouveau.
      </p>

      <form action={soumettre} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="vous@exemple.fr"
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
          {attente ? "Envoi…" : "Recevoir le lien"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        <Link href="/connexion" className="font-semibold text-primaire underline">
          Retour à la connexion
        </Link>
      </p>
    </>
  );
}
