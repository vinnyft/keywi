"use client";

import { useState } from "react";
import { Delete, CheckCircle2, XCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";

/**
 * Écran tactile d'un casier connecté : pavé de saisie du code de
 * retrait à 6 caractères, puis ouverture de la case.
 * Conçu pour un écran en extérieur : gros caractères, fort contraste.
 */

type Etat =
  | { nom: "saisie" }
  | { nom: "ouverture" }
  | { nom: "ouvert"; caseNumero: number; logement: string; beneficiaire: string }
  | { nom: "erreur"; message: string };

const TOUCHES = [
  "A", "B", "C", "D", "E", "F", "G", "H", "J",
  "K", "M", "N", "P", "Q", "R", "S", "T", "U",
  "V", "W", "X", "Y", "Z", "2", "3", "4", "5",
  "6", "7", "8", "9",
];

export function EcranBorne({
  casierId,
  casierNom,
  locale = "fr",
}: {
  casierId: string;
  casierNom: string;
  locale?: Locale;
}) {
  const en = locale === "en";
  const [code, setCode] = useState("");
  const [etat, setEtat] = useState<Etat>({ nom: "saisie" });

  const t = en
    ? {
        caseOuverte: "Slot open — take the keyring",
        caseAria: (n: number) => `Slot number ${n}`,
        caseNum: (n: number) => `Slot no. ${n}`,
        pour: "for",
        termine: "Done",
        entrez: "Enter your pickup code",
        codeAria: (c: string) => `Code entered: ${c || "empty"}`,
        codeRefuse: "Code declined.",
        effacer: "Delete",
        ouverture: "Opening…",
        ouvrir: "Open my slot",
        aide: "The 6-character code was sent to you by the host, by email or message.",
      }
    : {
        caseOuverte: "Case ouverte — récupérez le trousseau",
        caseAria: (n: number) => `Case numéro ${n}`,
        caseNum: (n: number) => `Case n° ${n}`,
        pour: "pour",
        termine: "Terminé",
        entrez: "Entrez votre code de retrait",
        codeAria: (c: string) => `Code saisi : ${c || "vide"}`,
        codeRefuse: "Code refusé.",
        effacer: "Effacer",
        ouverture: "Ouverture…",
        ouvrir: "Ouvrir ma case",
        aide: "Le code à 6 caractères vous a été envoyé par l'hôte, par email ou message.",
      };

  async function valider() {
    setEtat({ nom: "ouverture" });
    const res = await fetch(`/api/borne/${casierId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const r = await res.json();
    if (!r.ok) {
      setEtat({ nom: "erreur", message: r.message ?? t.codeRefuse });
      return;
    }
    setEtat({
      nom: "ouvert",
      caseNumero: r.case_numero,
      logement: r.logement,
      beneficiaire: r.beneficiaire,
    });
  }

  function recommencer() {
    setCode("");
    setEtat({ nom: "saisie" });
  }

  if (etat.nom === "ouvert") {
    return (
      <div className="flex min-h-screen flex-col bg-encre text-white">
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <CheckCircle2 size={64} className="text-lime" aria-hidden="true" />
          <p className="mt-4 text-lg text-white/70">{t.caseOuverte}</p>
          <p
            className="my-2 font-black leading-none"
            style={{ fontSize: "clamp(6rem, 28vw, 12rem)" }}
            aria-label={t.caseAria(etat.caseNumero)}
          >
            {etat.caseNumero}
          </p>
          <p className="text-2xl font-bold">{t.caseNum(etat.caseNumero)}</p>
          <p className="mt-4 text-white/70">
            {etat.logement} — {t.pour} {etat.beneficiaire}
          </p>
        </div>
        <div className="p-5">
          <button
            onClick={recommencer}
            className="w-full rounded-xl bg-lime px-4 py-5 text-lg font-bold text-encre"
          >
            {t.termine}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-encre px-5 py-8 text-white">
      <div className="mx-auto w-full max-w-md">
        <p className="text-center text-sm uppercase tracking-widest text-white/50">
          {casierNom}
        </p>
        <h1 className="mt-2 text-center text-2xl font-black">{t.entrez}</h1>

        {/* Code saisi */}
        <div
          className="mt-6 flex justify-center gap-2"
          role="status"
          aria-label={t.codeAria(code)}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className={`flex h-16 w-11 items-center justify-center rounded-xl font-mono text-2xl font-black ${
                code[i] ? "bg-white text-encre" : "bg-white/10 text-white/30"
              }`}
            >
              {code[i] ?? "•"}
            </span>
          ))}
        </div>

        {etat.nom === "erreur" && (
          <p
            role="alert"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-500/20 p-3 text-center text-sm font-medium text-red-200"
          >
            <XCircle size={16} aria-hidden="true" /> {etat.message}
          </p>
        )}

        {/* Pavé */}
        <div className="mt-6 grid grid-cols-6 gap-2">
          {TOUCHES.map((touche) => (
            <button
              key={touche}
              onClick={() => code.length < 6 && setCode(code + touche)}
              disabled={code.length >= 6 || etat.nom === "ouverture"}
              className="rounded-lg bg-white/10 py-4 font-mono text-lg font-bold hover:bg-white/20 disabled:opacity-30"
            >
              {touche}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => setCode(code.slice(0, -1))}
            disabled={!code || etat.nom === "ouverture"}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/30 py-4 font-semibold hover:bg-white/10 disabled:opacity-30"
          >
            <Delete size={18} aria-hidden="true" /> {t.effacer}
          </button>
          <button
            onClick={valider}
            disabled={code.length < 6 || etat.nom === "ouverture"}
            className="col-span-2 rounded-xl bg-lime py-4 text-lg font-bold text-encre disabled:opacity-40"
          >
            {etat.nom === "ouverture" ? t.ouverture : t.ouvrir}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">{t.aide}</p>
      </div>
    </div>
  );
}
