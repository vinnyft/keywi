"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { actionInscription } from "@/lib/actions/auth";
import { useLocale } from "@/lib/useLocale";
import { localise } from "@/lib/i18n";

/** Page d'inscription hôte / voyageur */
export default function PageInscription() {
  const locale = useLocale();
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);
  const [etat, soumettre, attente] = useActionState(actionInscription, {
    erreur: null,
    envoye: false,
  });

  if (etat.envoye) {
    return (
      <div>
        <span className="flex size-12 items-center justify-center rounded-full bg-primaire-pale text-primaire-fonce">
          <MailCheck size={24} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold">
          {en ? "Check your inbox" : "Vérifiez votre boîte mail"}
        </h1>
        <p className="mt-2 text-gray-600">
          {en
            ? "We've just sent you a confirmation link. Click it to activate your account, then log in. The link is valid for one hour."
            : "Nous venons de vous envoyer un lien de confirmation. Cliquez dessus pour activer votre compte, puis connectez-vous. Le lien est valable une heure."}
        </p>
        <p className="mt-6 text-sm text-gray-600">
          <Link href={l("/connexion")} className="font-semibold text-primaire underline">
            {en ? "Back to login" : "Retour à la connexion"}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{en ? "Create an account" : "Créer un compte"}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {en ? "Manage your keys remotely in a few minutes." : "Gérez vos clés à distance en quelques minutes."}
      </p>

      <form action={soumettre} className="mt-6 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label htmlFor="nom" className="block text-sm font-medium">
            {en ? "Full name" : "Nom complet"}
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
            {en ? "Email address" : "Adresse email"}
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
            {en ? "Password" : "Mot de passe"}{" "}
            <span className="font-normal text-gray-500">
              ({en ? "8 characters minimum" : "8 caractères minimum"})
            </span>
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
          <legend className="text-sm font-medium">{en ? "You are…" : "Vous êtes…"}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm has-[:checked]:border-primaire has-[:checked]:bg-primaire-pale">
              <input type="radio" name="role" value="hote" defaultChecked />
              {en ? "Host / owner" : "Hôte / propriétaire"}
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm has-[:checked]:border-primaire has-[:checked]:bg-primaire-pale">
              <input type="radio" name="role" value="voyageur" />
              {en ? "Traveller / guest" : "Voyageur / invité"}
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
          {attente ? (en ? "Creating…" : "Création…") : en ? "Create my account" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {en ? "Already registered?" : "Déjà inscrit ?"}{" "}
        <Link href={l("/connexion")} className="font-semibold text-primaire underline">
          {en ? "Log in" : "Se connecter"}
        </Link>
      </p>
    </div>
  );
}
