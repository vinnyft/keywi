"use client";

import { useActionState } from "react";
import { actionCandidature } from "@/lib/actions/client";
import type { Locale } from "@/lib/i18n";

export interface TextesCandidature {
  succes: string;
  nomCommerce: string;
  nomCommercePlaceholder: string;
  votreNom: string;
  votreNomPlaceholder: string;
  email: string;
  telephone: string;
  adresse: string;
  adressePlaceholder: string;
  codePostal: string;
  ville: string;
  message: string;
  messagePlaceholder: string;
  envoyer: string;
  envoi: string;
  obligatoires: string;
}

/** Formulaire de candidature commerçant (insertion publique en base) */
export function FormulaireCandidature({
  t,
  locale = "fr",
}: {
  t: TextesCandidature;
  locale?: Locale;
}) {
  const [etat, soumettre, attente] = useActionState(actionCandidature, {
    erreur: null,
    envoye: false,
  });

  if (etat.envoye) {
    return (
      <p
        role="status"
        className="mt-6 rounded-2xl bg-menthe-pale p-6 text-center font-medium text-menthe"
      >
        ✅ {t.succes}
      </p>
    );
  }

  return (
    <form action={soumettre} className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nom_commerce" className="block text-sm font-medium">
            {t.nomCommerce} *
          </label>
          <input id="nom_commerce" name="nom_commerce" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t.nomCommercePlaceholder} />
        </div>
        <div>
          <label htmlFor="nom_contact" className="block text-sm font-medium">
            {t.votreNom} *
          </label>
          <input id="nom_contact" name="nom_contact" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t.votreNomPlaceholder} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            {t.email} *
          </label>
          <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="contact@cafeducoin.fr" />
        </div>
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium">
            {t.telephone}
          </label>
          <input id="telephone" name="telephone" type="tel" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="01 23 45 67 89" />
        </div>
      </div>
      <div>
        <label htmlFor="adresse" className="block text-sm font-medium">
          {t.adresse} *
        </label>
        <input id="adresse" name="adresse" required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t.adressePlaceholder} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code_postal" className="block text-sm font-medium">
            {t.codePostal} *
          </label>
          <input id="code_postal" name="code_postal" required pattern="[0-9]{5}" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="75011" />
        </div>
        <div>
          <label htmlFor="ville" className="block text-sm font-medium">
            {t.ville}
          </label>
          <input id="ville" name="ville" defaultValue="Paris" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          {t.message}
        </label>
        <textarea id="message" name="message" rows={3} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder={t.messagePlaceholder} />
      </div>

      {etat.erreur && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {etat.erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={attente}
        className="w-full rounded-lg bg-corail px-4 py-3 font-bold text-white hover:bg-corail-fonce disabled:opacity-60"
      >
        {attente ? t.envoi : t.envoyer}
      </button>
      <p className="text-xs text-gray-500">{t.obligatoires}</p>
    </form>
  );
}
