"use client";

import { useActionState, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { actionSupprimerCompte } from "@/lib/actions/compte";
import { MOT_DE_CONFIRMATION, MOT_DE_CONFIRMATION_EN } from "@/lib/suppression-compte";
import { useLocale } from "@/lib/useLocale";

/**
 * Confirmation finale de la suppression de compte.
 *
 * Le geste est irréversible : on demande de recopier un mot, ce
 * qu'aucun clic accidentel ne produit. Le bouton reste désactivé
 * tant que le mot n'est pas exact — la validation est refaite
 * côté serveur, l'action étant appelable directement.
 */
export function SuppressionCompte({
  blocage,
}: {
  blocage: { code: string; message: string } | null;
}) {
  const locale = useLocale();
  const en = locale === "en";
  const mot = en ? MOT_DE_CONFIRMATION_EN : MOT_DE_CONFIRMATION;
  const [etat, soumettre, attente] = useActionState(actionSupprimerCompte, {
    erreur: null,
  });
  const [saisie, setSaisie] = useState("");

  if (blocage) {
    return (
      <div className="rounded-2xl border border-ambre bg-ambre-pale p-5">
        <p className="flex items-start gap-2 font-bold text-ambre">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {en ? "Deletion not possible right now" : "Suppression impossible pour l'instant"}
        </p>
        <p className="mt-1.5 text-sm text-ambre">{blocage.message}</p>
      </div>
    );
  }

  const motExact = saisie.trim().toUpperCase() === mot;

  return (
    <form
      action={soumettre}
      className="rounded-2xl border border-red-200 bg-red-50 p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <h2 className="font-bold text-red-800">
        {en ? "Confirm deletion" : "Confirmer la suppression"}
      </h2>
      <p className="mt-1 text-sm text-red-900">
        {en ? (
          <>
            This action is <strong>final</strong>: no cooling-off period, no
            possible restoration. To confirm, type <strong>{mot}</strong> below.
          </>
        ) : (
          <>
            Cette action est <strong>définitive</strong> : aucun délai de
            rétractation, aucune restauration possible. Pour confirmer, recopiez{" "}
            <strong>{mot}</strong> ci-dessous.
          </>
        )}
      </p>

      <label
        htmlFor="confirmation"
        className="mt-4 block text-sm font-semibold text-red-900"
      >
        {en ? `Type “${mot}”` : `Recopiez « ${mot} »`}
      </label>
      <input
        id="confirmation"
        name="confirmation"
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        aria-describedby={etat.erreur ? "erreur-suppression" : undefined}
        className="mt-1.5 w-full max-w-xs rounded-lg border border-red-300 bg-white px-3 py-2 font-mono tracking-widest uppercase"
      />

      {etat.erreur && (
        <p
          id="erreur-suppression"
          role="alert"
          className="mt-3 text-sm font-semibold text-red-800"
        >
          {etat.erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={!motExact || attente}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {attente
          ? en
            ? "Deleting…"
            : "Suppression en cours…"
          : en
            ? "Permanently delete my account"
            : "Supprimer définitivement mon compte"}
      </button>
    </form>
  );
}
