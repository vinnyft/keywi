"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { ScannerBadge } from "./ScannerBadge";
import {
  actionAnnulerDepot,
  actionConfirmerDepot,
  actionPreparerDepot,
} from "@/lib/actions/commercant";
import { useLocale } from "@/lib/useLocale";
import { localise } from "@/lib/i18n";

/**
 * Flux de dépôt d'une clé, côté commerçant :
 *  1. scan du badge (NFC / USB / manuel)
 *  2. validation + case attribuée → AFFICHAGE PLEIN ÉCRAN du numéro
 *  3. le commerçant range le trousseau et confirme d'un tap
 *  4. statut mis à jour, notifications parties → écran de succès
 */

type Etape =
  | { nom: "scan" }
  | { nom: "verification" }
  | {
      nom: "case";
      keyId: string;
      caseNumero: number;
      logement: string;
      hoteNom: string | null;
      typeOperation: "depot" | "retour";
    }
  | { nom: "confirmation" }
  | { nom: "succes"; caseNumero: number; logement: string; typeOperation: string }
  | { nom: "erreur"; message: string };

export function FluxDepot() {
  const locale = useLocale();
  const en = locale === "en";
  const [etape, setEtape] = useState<Etape>({ nom: "scan" });

  const t = en
    ? {
        accueil: "Home",
        verifAria: "Verification in progress",
        verification: "Checking the tag…",
        enregistrement: "Recording the drop-off…",
        retourRangez: "Key return — place the keyring in",
        valideRangez: "Valid tag ✓ — place the keyring in",
        caseAria: (n: number) => `Slot number ${n}`,
        caseNum: (n: number) => `Slot no. ${n}`,
        hote: "host",
        annuler: "Cancel",
        range: "Stored ✓",
        retourEnr: "Return recorded",
        depotEnr: "Drop-off recorded",
        succesLigne: (l: string, n: number) => `“${l}” is in slot no. ${n}.`,
        notifDepot: "The host and the recipients have been notified automatically.",
        notifRetour: "The host has been notified automatically.",
        scannerAutre: "Scan another key",
        depotImpossible: "Drop-off failed",
        reessayer: "Try again",
        badgeRefuse: "Tag rejected — check that it's a valid Keywi tag.",
        confirmationEchec: "Confirmation failed.",
      }
    : {
        accueil: "Accueil",
        verifAria: "Vérification en cours",
        verification: "Vérification du badge…",
        enregistrement: "Enregistrement du dépôt…",
        retourRangez: "Retour de clés — rangez le trousseau dans la",
        valideRangez: "Badge valide ✓ — rangez le trousseau dans la",
        caseAria: (n: number) => `Case numéro ${n}`,
        caseNum: (n: number) => `Case n° ${n}`,
        hote: "hôte",
        annuler: "Annuler",
        range: "C'est rangé ✓",
        retourEnr: "Retour enregistré",
        depotEnr: "Dépôt enregistré",
        succesLigne: (l: string, n: number) => `« ${l} » est dans la case n° ${n}.`,
        notifDepot: "L'hôte et les bénéficiaires ont été notifiés automatiquement.",
        notifRetour: "L'hôte a été notifié automatiquement.",
        scannerAutre: "Scanner une autre clé",
        depotImpossible: "Dépôt impossible",
        reessayer: "Réessayer",
        badgeRefuse: "Badge refusé — vérifiez qu'il s'agit d'un badge Keywi valide.",
        confirmationEchec: "La confirmation a échoué.",
      };

  async function surScan(identifiant: string) {
    setEtape({ nom: "verification" });
    const resultat = await actionPreparerDepot(identifiant);
    if (!resultat.ok) {
      setEtape({
        nom: "erreur",
        message: (resultat.message as string) ?? t.badgeRefuse,
      });
      return;
    }
    setEtape({
      nom: "case",
      keyId: resultat.key_id as string,
      caseNumero: resultat.case_numero as number,
      logement: resultat.logement as string,
      hoteNom: resultat.hote_nom as string | null,
      typeOperation: resultat.type_operation as "depot" | "retour",
    });
  }

  async function confirmer(keyId: string) {
    setEtape({ nom: "confirmation" });
    const resultat = await actionConfirmerDepot(keyId);
    if (!resultat.ok) {
      setEtape({
        nom: "erreur",
        message: (resultat.message as string) ?? t.confirmationEchec,
      });
      return;
    }
    setEtape({
      nom: "succes",
      caseNumero: resultat.case_numero as number,
      logement: resultat.logement as string,
      typeOperation: resultat.type_operation as string,
    });
  }

  async function annuler(keyId: string) {
    await actionAnnulerDepot(keyId);
    setEtape({ nom: "scan" });
  }

  return (
    <div className="space-y-4">
      <Link
        href={localise("/commercant", locale)}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-encre"
      >
        <ArrowLeft size={16} aria-hidden="true" /> {t.accueil}
      </Link>

      {etape.nom === "scan" && <ScannerBadge onScan={surScan} />}

      {(etape.nom === "verification" || etape.nom === "confirmation") && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-16">
          <div
            className="size-10 animate-spin rounded-full border-4 border-primaire border-t-transparent"
            role="status"
            aria-label={t.verifAria}
          />
          <p className="font-medium text-gray-700">
            {etape.nom === "verification" ? t.verification : t.enregistrement}
          </p>
        </div>
      )}

      {/* AFFICHAGE PLEIN ÉCRAN de la case attribuée */}
      {etape.nom === "case" && (
        <div className="fixed inset-0 z-50 flex flex-col bg-encre text-white">
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-lg text-white/70">
              {etape.typeOperation === "retour" ? t.retourRangez : t.valideRangez}
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
              {etape.logement}
              {etape.hoteNom ? ` — ${t.hote} : ${etape.hoteNom}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5">
            <button
              onClick={() => annuler(etape.keyId)}
              className="rounded-xl border border-white/30 px-4 py-4 font-semibold hover:bg-white/10"
            >
              {t.annuler}
            </button>
            <button
              onClick={() => confirmer(etape.keyId)}
              autoFocus
              className="rounded-xl bg-menthe px-4 py-4 text-lg font-bold text-white hover:brightness-110"
            >
              {t.range}
            </button>
          </div>
        </div>
      )}

      {etape.nom === "succes" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
          <CheckCircle2 size={56} className="text-menthe" aria-hidden="true" />
          <h2 className="text-xl font-bold">
            {etape.typeOperation === "retour" ? t.retourEnr : t.depotEnr}
          </h2>
          <p className="text-gray-600">
            {t.succesLigne(etape.logement, etape.caseNumero)}
            <br />
            {etape.typeOperation === "depot" ? t.notifDepot : t.notifRetour}
          </p>
          <button
            onClick={() => setEtape({ nom: "scan" })}
            className="mt-2 rounded-lg bg-primaire px-5 py-2.5 font-semibold text-white hover:bg-primaire-fonce"
          >
            {t.scannerAutre}
          </button>
        </div>
      )}

      {etape.nom === "erreur" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <XCircle size={56} className="text-red-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-red-800">{t.depotImpossible}</h2>
          <p className="text-red-700">{etape.message}</p>
          <button
            onClick={() => setEtape({ nom: "scan" })}
            className="mt-2 rounded-lg bg-encre px-5 py-2.5 font-semibold text-white hover:bg-encre-2"
          >
            {t.reessayer}
          </button>
        </div>
      )}
    </div>
  );
}
