"use client";

import { useActionState } from "react";
import { actionCandidature } from "@/lib/actions/client";

/** Formulaire de candidature commerçant (insertion publique en base) */
export function FormulaireCandidature() {
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
        ✅ Candidature bien reçue ! Notre équipe vous recontacte sous 48 h
        ouvrées pour finaliser votre adhésion au réseau Keywi.
      </p>
    );
  }

  return (
    <form action={soumettre} className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nom_commerce" className="block text-sm font-medium">
            Nom du commerce *
          </label>
          <input
            id="nom_commerce"
            name="nom_commerce"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Café du Coin"
          />
        </div>
        <div>
          <label htmlFor="nom_contact" className="block text-sm font-medium">
            Votre nom *
          </label>
          <input
            id="nom_contact"
            name="nom_contact"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Jeanne Martin"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="contact@cafeducoin.fr"
          />
        </div>
        <div>
          <label htmlFor="telephone" className="block text-sm font-medium">
            Téléphone
          </label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="01 23 45 67 89"
          />
        </div>
      </div>
      <div>
        <label htmlFor="adresse" className="block text-sm font-medium">
          Adresse du commerce *
        </label>
        <input
          id="adresse"
          name="adresse"
          required
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="12 rue de la République"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="code_postal" className="block text-sm font-medium">
            Code postal *
          </label>
          <input
            id="code_postal"
            name="code_postal"
            required
            pattern="[0-9]{5}"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder="75011"
          />
        </div>
        <div>
          <label htmlFor="ville" className="block text-sm font-medium">
            Ville
          </label>
          <input
            id="ville"
            name="ville"
            defaultValue="Paris"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Parlez-nous de votre commerce
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Type de commerce, horaires, espace disponible derrière le comptoir…"
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
        className="w-full rounded-lg bg-corail px-4 py-3 font-bold text-white hover:bg-corail-fonce disabled:opacity-60"
      >
        {attente ? "Envoi…" : "Envoyer ma candidature"}
      </button>
      <p className="text-xs text-gray-500">
        * Champs obligatoires. Vos données ne servent qu&apos;au traitement de
        votre candidature (voir notre politique de confidentialité).
      </p>
    </form>
  );
}
