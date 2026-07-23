"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { actionCasierDeposer } from "@/lib/actions/client";

/**
 * Dépôt self-service dans un casier connecté.
 * L'hôte, devant le casier, appuie sur le bouton : une case lui est
 * attribuée et affichée en grand, comme sur l'écran du comptoir.
 */

type Etape =
  | { nom: "pret" }
  | { nom: "attente" }
  | { nom: "case"; caseNumero: number; logement: string; typeOperation: string }
  | { nom: "erreur"; message: string };

export function DepotCasier({
  cleId,
  casierNom,
}: {
  cleId: string;
  casierNom: string;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>({ nom: "pret" });

  async function deposer() {
    setEtape({ nom: "attente" });
    const r = await actionCasierDeposer(cleId);
    if (!r.ok) {
      setEtape({
        nom: "erreur",
        message:
          (r.message as string) ??
          "Dépôt impossible — vérifiez que la clé est bien réglée et rattachée à ce casier.",
      });
      return;
    }
    setEtape({
      nom: "case",
      caseNumero: r.case_numero as number,
      logement: r.logement as string,
      typeOperation: r.type_operation as string,
    });
  }

  if (etape.nom === "case") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-encre text-white">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-lg text-white/70">
            {etape.typeOperation === "retour"
              ? "Retour enregistré — rangez le trousseau dans la"
              : "Casier ouvert ✓ — rangez le trousseau dans la"}
          </p>
          <p
            className="my-2 font-black leading-none"
            style={{ fontSize: "clamp(6rem, 30vw, 13rem)" }}
            aria-label={`Case numéro ${etape.caseNumero}`}
          >
            {etape.caseNumero}
          </p>
          <p className="text-2xl font-bold">Case n° {etape.caseNumero}</p>
          <p className="mt-4 text-white/70">
            {etape.logement} — {casierNom}
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/60">
            Refermez bien la porte. Vos bénéficiaires ont été prévenus.
          </p>
        </div>
        <div className="p-5">
          <button
            onClick={() => {
              setEtape({ nom: "pret" });
              router.refresh();
            }}
            autoFocus
            className="w-full rounded-xl bg-lime px-4 py-4 text-lg font-bold text-encre hover:brightness-105"
          >
            Terminé
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-primaire bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Lock size={18} className="text-primaire" aria-hidden="true" />
        Dépôt au casier — 24 h/24
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Vous êtes devant <strong>{casierNom}</strong> ? Lancez le dépôt : une
        case vous est attribuée immédiatement, sans passer par un comptoir.
      </p>

      {etape.nom === "erreur" && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          <XCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {etape.message}
        </p>
      )}

      <button
        onClick={deposer}
        disabled={etape.nom === "attente"}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primaire px-4 py-3 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
      >
        <CheckCircle2 size={18} aria-hidden="true" />
        {etape.nom === "attente" ? "Ouverture du casier…" : "Déposer maintenant"}
      </button>
    </section>
  );
}
