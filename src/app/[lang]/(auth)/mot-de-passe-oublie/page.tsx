"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { actionMotDePasseOublie } from "@/lib/actions/auth";
import { useLocale } from "@/lib/useLocale";
import { localise } from "@/lib/i18n";

/** Demande d'un lien de réinitialisation du mot de passe */
export default function PageMotDePasseOublie() {
  const locale = useLocale();
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);
  const [etat, soumettre, attente] = useActionState(actionMotDePasseOublie, {
    erreur: null,
    envoye: false,
  });

  if (etat.envoye) {
    return (
      <div className="text-center">
        <MailCheck size={40} className="mx-auto text-menthe" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold">
          {en ? "Check your inbox" : "Vérifiez votre boîte mail"}
        </h1>
        <p role="status" className="mt-2 text-gray-600">
          {en
            ? "If a Keywi account exists with this address, you've just received a link to choose a new password. It's valid for one hour."
            : "Si un compte Keywi existe avec cette adresse, vous venez de recevoir un lien pour choisir un nouveau mot de passe. Il est valable une heure."}
        </p>
        <Link
          href={l("/connexion")}
          className="mt-6 inline-block font-semibold text-primaire underline"
        >
          {en ? "Back to login" : "Retour à la connexion"}
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">{en ? "Forgot password" : "Mot de passe oublié"}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {en
          ? "Enter your address: we'll send you a link to choose a new one."
          : "Indiquez votre adresse : nous vous enverrons un lien pour en choisir un nouveau."}
      </p>

      <form action={soumettre} className="mt-5 space-y-4">
        <input type="hidden" name="locale" value={locale} />
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
          {attente ? (en ? "Sending…" : "Envoi…") : en ? "Send the link" : "Recevoir le lien"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        <Link href={l("/connexion")} className="font-semibold text-primaire underline">
          {en ? "Back to login" : "Retour à la connexion"}
        </Link>
      </p>
    </>
  );
}
