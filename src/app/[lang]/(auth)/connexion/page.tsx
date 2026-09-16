"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { actionConnexion, actionLienMagique } from "@/lib/actions/auth";
import { useLocale } from "@/lib/useLocale";
import { localise } from "@/lib/i18n";

function textes(en: boolean) {
  return {
    h1: en ? "Log in" : "Connexion",
    lede: en ? "Good to see you back on Keywi." : "Heureux de vous revoir sur Keywi.",
    methode: en ? "Login method" : "Méthode de connexion",
    motDePasseTab: en ? "Password" : "Mot de passe",
    lienTab: en ? "Magic link" : "Lien magique",
    email: en ? "Email address" : "Adresse email",
    motDePasse: en ? "Password" : "Mot de passe",
    oublie: en ? "Forgot?" : "Oublié ?",
    connexion: en ? "Logging in…" : "Connexion…",
    seConnecter: en ? "Log in" : "Se connecter",
    lienEnvoye: en ? "Link sent! Check your inbox" : "Lien envoyé ! Vérifiez votre boîte mail",
    localHint: en ? "locally: " : "en local : ",
    envoi: en ? "Sending…" : "Envoi…",
    recevoirLien: en ? "Send me a login link" : "Recevoir un lien de connexion",
    pasDeCompte: en ? "No account yet?" : "Pas encore de compte ?",
    creerCompte: en ? "Create an account" : "Créer un compte",
  };
}

function FormulaireConnexion() {
  const locale = useLocale();
  const en = locale === "en";
  const t = textes(en);
  const l = (chemin: string) => localise(chemin, locale);
  const searchParams = useSearchParams();
  const suivant = searchParams.get("suivant") ?? "";
  const [methode, setMethode] = useState<"mot_de_passe" | "lien">("mot_de_passe");

  const [etatMdp, soumettreMdp, attenteMdp] = useActionState(actionConnexion, {
    erreur: null,
  });
  const [etatLien, soumettreLien, attenteLien] = useActionState(actionLienMagique, {
    erreur: null,
    envoye: false,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">{t.h1}</h1>
      <p className="mt-1 text-sm text-gray-600">{t.lede}</p>

      <div
        className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
        role="tablist"
        aria-label={t.methode}
      >
        <button
          role="tab"
          aria-selected={methode === "mot_de_passe"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            methode === "mot_de_passe" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
          onClick={() => setMethode("mot_de_passe")}
        >
          {t.motDePasseTab}
        </button>
        <button
          role="tab"
          aria-selected={methode === "lien"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            methode === "lien" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
          onClick={() => setMethode("lien")}
        >
          {t.lienTab}
        </button>
      </div>

      {methode === "mot_de_passe" ? (
        <form action={soumettreMdp} className="mt-6 space-y-4">
          <input type="hidden" name="suivant" value={suivant} />
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t.email}
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
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="mot_de_passe" className="block text-sm font-medium">
                {t.motDePasse}
              </label>
              <Link
                href={l("/mot-de-passe-oublie")}
                className="text-sm font-medium text-primaire underline"
              >
                {t.oublie}
              </Link>
            </div>
            <input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          {etatMdp.erreur && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {etatMdp.erreur}
            </p>
          )}
          <button
            type="submit"
            disabled={attenteMdp}
            className="w-full rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white transition hover:bg-primaire-fonce disabled:opacity-60"
          >
            {attenteMdp ? t.connexion : t.seConnecter}
          </button>
        </form>
      ) : (
        <form action={soumettreLien} className="mt-6 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label htmlFor="email-lien" className="block text-sm font-medium">
              {t.email}
            </label>
            <input
              id="email-lien"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="vous@exemple.fr"
            />
          </div>
          {etatLien.envoye ? (
            <p
              role="status"
              className="rounded-lg bg-menthe-pale px-3 py-2 text-sm font-medium text-menthe"
            >
              {t.lienEnvoye}
              {process.env.NODE_ENV === "development" && (
                <>
                  {" "}
                  ({t.localHint}
                  <a href="http://localhost:54324" className="underline" target="_blank">
                    Mailpit
                  </a>
                  )
                </>
              )}
              .
            </p>
          ) : (
            <>
              {etatLien.erreur && (
                <p role="alert" className="text-sm font-medium text-red-700">
                  {etatLien.erreur}
                </p>
              )}
              <button
                type="submit"
                disabled={attenteLien}
                className="w-full rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white transition hover:bg-primaire-fonce disabled:opacity-60"
              >
                {attenteLien ? t.envoi : t.recevoirLien}
              </button>
            </>
          )}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        {t.pasDeCompte}{" "}
        <Link href={l("/inscription")} className="font-semibold text-primaire underline">
          {t.creerCompte}
        </Link>
      </p>
    </div>
  );
}

export default function PageConnexion() {
  return (
    <Suspense>
      <FormulaireConnexion />
    </Suspense>
  );
}
