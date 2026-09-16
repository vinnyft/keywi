"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, XCircle } from "lucide-react";
import { actionCasierDeposer } from "@/lib/actions/client";
import { useLocale } from "@/lib/useLocale";

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
  const en = useLocale() === "en";
  const [etape, setEtape] = useState<Etape>({ nom: "pret" });

  const t = en
    ? {
        retour: "Return recorded — place the keyring in",
        ouvert: "Locker open ✓ — place the keyring in",
        caseNum: (n: number) => `Slot no. ${n}`,
        caseAria: (n: number) => `Slot number ${n}`,
        refermez: "Close the door firmly. Your recipients have been notified.",
        termine: "Done",
        titre: "Locker drop-off — 24/7",
        erreurDefaut:
          "Drop-off failed — check that the key is set up and linked to this locker.",
        ouverture: "Opening the locker…",
        deposer: "Drop off now",
      }
    : {
        retour: "Retour enregistré — rangez le trousseau dans la",
        ouvert: "Casier ouvert ✓ — rangez le trousseau dans la",
        caseNum: (n: number) => `Case n° ${n}`,
        caseAria: (n: number) => `Case numéro ${n}`,
        refermez: "Refermez bien la porte. Vos bénéficiaires ont été prévenus.",
        termine: "Terminé",
        titre: "Dépôt au casier — 24 h/24",
        erreurDefaut:
          "Dépôt impossible — vérifiez que la clé est bien réglée et rattachée à ce casier.",
        ouverture: "Ouverture du casier…",
        deposer: "Déposer maintenant",
      };

  async function deposer() {
    setEtape({ nom: "attente" });
    const r = await actionCasierDeposer(cleId);
    if (!r.ok) {
      setEtape({
        nom: "erreur",
        message: (r.message as string) ?? t.erreurDefaut,
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
            {etape.typeOperation === "retour" ? t.retour : t.ouvert}
          </p>
          <p
            className="my-2 font-black leading-none"
            style={{ fontSize: "clamp(6rem, 30vw, 13rem)" }}
            aria-label={t.caseAria(etape.caseNumero)}
          >
            {etape.caseNumero}
          </p>
          <p className="text-2xl font-bold">{t.caseNum(etape.caseNumero)}</p>
          <p className="mt-4 text-white/70">
            {etape.logement} — {casierNom}
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/60">{t.refermez}</p>
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
            {t.termine}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-primaire bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Lock size={18} className="text-primaire" aria-hidden="true" />
        {t.titre}
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {en ? (
          <>
            Standing in front of <strong>{casierNom}</strong>? Start the
            drop-off: a slot is assigned to you immediately, with no counter.
          </>
        ) : (
          <>
            Vous êtes devant <strong>{casierNom}</strong> ? Lancez le dépôt : une
            case vous est attribuée immédiatement, sans passer par un comptoir.
          </>
        )}
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
        {etape.nom === "attente" ? t.ouverture : t.deposer}
      </button>
    </section>
  );
}
