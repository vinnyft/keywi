"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { actionConnexion, actionLienMagique } from "@/lib/actions/auth";

/** Page de connexion : mot de passe ou lien magique */
function FormulaireConnexion() {
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
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-gray-600">
        Heureux de vous revoir sur Keywi.
      </p>

      {/* Bascule mot de passe / lien magique */}
      <div
        className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
        role="tablist"
        aria-label="Méthode de connexion"
      >
        <button
          role="tab"
          aria-selected={methode === "mot_de_passe"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            methode === "mot_de_passe" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
          onClick={() => setMethode("mot_de_passe")}
        >
          Mot de passe
        </button>
        <button
          role="tab"
          aria-selected={methode === "lien"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            methode === "lien" ? "bg-white shadow-sm" : "text-gray-600"
          }`}
          onClick={() => setMethode("lien")}
        >
          Lien magique
        </button>
      </div>

      {methode === "mot_de_passe" ? (
        <form action={soumettreMdp} className="mt-6 space-y-4">
          <input type="hidden" name="suivant" value={suivant} />
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
              Mot de passe
            </label>
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
            {attenteMdp ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <form action={soumettreLien} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email-lien" className="block text-sm font-medium">
              Adresse email
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
              Lien envoyé ! Vérifiez votre boîte mail
              {process.env.NODE_ENV === "development" && (
                <>
                  {" "}
                  (en local :{" "}
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
                {attenteLien ? "Envoi…" : "Recevoir un lien de connexion"}
              </button>
            </>
          )}
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-primaire underline">
          Créer un compte
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
