"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowLeft, KeyRound } from "lucide-react";
import { ScannerBadge } from "./ScannerBadge";
import {
  actionChercherRetrait,
  actionConfirmerRetrait,
} from "@/lib/actions/commercant";

/**
 * Flux de retrait d'une clé, côté commerçant :
 *  1. saisie (ou scan QR) du code de retrait à 6 caractères
 *  2. l'app affiche la case et le logement
 *  3. le commerçant sort le trousseau puis RE-SCANNE le badge
 *     (vérification croisée anti-erreur de case)
 *  4. confirmation → case libérée, hôte notifié
 */

type Etape =
  | { nom: "code" }
  | { nom: "recherche" }
  | {
      nom: "case";
      code: string;
      caseNumero: number;
      logement: string;
      beneficiaire: string | null;
    }
  | { nom: "verification"; code: string; caseNumero: number }
  | { nom: "succes"; caseNumero: number; logement: string; beneficiaire: string }
  | { nom: "erreur"; message: string };

export function FluxRetrait() {
  const [etape, setEtape] = useState<Etape>({ nom: "code" });
  const [code, setCode] = useState("");

  async function chercher(codeSaisi: string) {
    setEtape({ nom: "recherche" });
    const resultat = await actionChercherRetrait(codeSaisi);
    if (!resultat.ok) {
      setEtape({
        nom: "erreur",
        message: (resultat.message as string) ?? "Code de retrait inconnu.",
      });
      return;
    }
    setEtape({
      nom: "case",
      code: codeSaisi,
      caseNumero: resultat.case_numero as number,
      logement: resultat.logement as string,
      beneficiaire:
        (resultat.beneficiaire_nom as string | null) ??
        (resultat.beneficiaire_email as string | null),
    });
  }

  async function verifierBadge(codeRetrait: string, badge: string, caseNumero: number) {
    setEtape({ nom: "verification", code: codeRetrait, caseNumero });
    const resultat = await actionConfirmerRetrait(codeRetrait, badge);
    if (!resultat.ok) {
      setEtape({
        nom: "erreur",
        message:
          (resultat.message as string) ??
          "La vérification du badge a échoué — recommencez le retrait.",
      });
      return;
    }
    setEtape({
      nom: "succes",
      caseNumero: resultat.case_numero as number,
      logement: resultat.logement as string,
      beneficiaire: resultat.beneficiaire as string,
    });
  }

  return (
    <div className="space-y-4">
      <Link
        href="/commercant"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-encre"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Accueil
      </Link>

      {etape.nom === "code" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-bold">Code de retrait du client</h2>
          <p className="mt-1 text-sm text-gray-600">
            Le client vous présente un code à 6 caractères ou un QR code
            (contenu « KLAV:XXXXXX »).
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim().length >= 6) chercher(code);
            }}
          >
            <label htmlFor="code-retrait" className="sr-only">
              Code de retrait à 6 caractères
            </label>
            <input
              id="code-retrait"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
              autoComplete="off"
              maxLength={12}
              className="w-full rounded-lg border border-gray-300 px-3 py-4 text-center font-mono text-2xl tracking-[0.4em] uppercase"
              placeholder="••••••"
            />
            <button
              type="submit"
              disabled={code.trim().length < 6}
              className="w-full rounded-lg bg-primaire px-4 py-3 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-50"
            >
              Rechercher la clé
            </button>
          </form>
        </section>
      )}

      {(etape.nom === "recherche" ||
        (etape.nom === "verification" && true)) && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-16">
          <div
            className="size-10 animate-spin rounded-full border-4 border-primaire border-t-transparent"
            role="status"
            aria-label="Recherche en cours"
          />
          <p className="font-medium text-gray-700">
            {etape.nom === "recherche"
              ? "Recherche du code…"
              : "Vérification croisée du badge…"}
          </p>
        </div>
      )}

      {etape.nom === "case" && (
        <>
          {/* Où se trouve le trousseau */}
          <div className="rounded-2xl bg-encre p-6 text-center text-white">
            <p className="text-white/70">Sortez le trousseau de la</p>
            <p className="my-1 text-7xl font-black" aria-label={`Case numéro ${etape.caseNumero}`}>
              {etape.caseNumero}
            </p>
            <p className="text-xl font-bold">Case n° {etape.caseNumero}</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <KeyRound size={14} aria-hidden="true" />
              {etape.logement}
              {etape.beneficiaire ? ` — pour ${etape.beneficiaire}` : ""}
            </p>
          </div>

          {/* Re-scan croisé anti-erreur */}
          <ScannerBadge
            titre="Vérification : re-scannez le badge du trousseau"
            onScan={(badge) => verifierBadge(etape.code, badge, etape.caseNumero)}
          />
          <p className="text-center text-sm text-gray-600">
            Cette double vérification garantit que le trousseau sorti de la case
            est bien celui du client.
          </p>
        </>
      )}

      {etape.nom === "succes" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
          <CheckCircle2 size={56} className="text-menthe" aria-hidden="true" />
          <h2 className="text-xl font-bold">Retrait confirmé</h2>
          <p className="text-gray-600">
            Remettez le trousseau « {etape.logement} » à {etape.beneficiaire}.
            <br />
            La case n° {etape.caseNumero} est libérée, l&apos;hôte est notifié.
          </p>
          <button
            onClick={() => {
              setCode("");
              setEtape({ nom: "code" });
            }}
            className="mt-2 rounded-lg bg-primaire px-5 py-2.5 font-semibold text-white hover:bg-primaire-fonce"
          >
            Nouveau retrait
          </button>
        </div>
      )}

      {etape.nom === "erreur" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <XCircle size={56} className="text-red-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-red-800">Retrait impossible</h2>
          <p className="text-red-700">{etape.message}</p>
          <button
            onClick={() => {
              setCode("");
              setEtape({ nom: "code" });
            }}
            className="mt-2 rounded-lg bg-encre px-5 py-2.5 font-semibold text-white hover:bg-encre-2"
          >
            Recommencer
          </button>
        </div>
      )}
    </div>
  );
}
