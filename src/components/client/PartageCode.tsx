"use client";

import { useActionState, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";
import { actionCreerCode, actionRevoquerCode } from "@/lib/actions/client";
import { useLocale } from "@/lib/useLocale";
import type { Locale } from "@/lib/i18n";

/**
 * Gestion des codes de retrait d'une clé : génération, affichage
 * QR code, partage par email / WhatsApp, révocation.
 */

interface CodeAcces {
  id: string;
  code_6: string;
  qr_payload: string;
  beneficiaire_email: string | null;
  beneficiaire_nom: string | null;
  expire_at: string | null;
  statut: "actif" | "utilise" | "revoque" | "expire";
  created_at: string;
}

const LIBELLES_STATUT_CODE: Record<Locale, Record<CodeAcces["statut"], string>> = {
  fr: { actif: "Actif", utilise: "Utilisé", revoque: "Révoqué", expire: "Expiré" },
  en: { actif: "Active", utilise: "Used", revoque: "Revoked", expire: "Expired" },
};

export function PartageCode({
  cleId,
  logement,
  commerce,
  codes,
}: {
  cleId: string;
  logement: string;
  commerce: string | null;
  codes: CodeAcces[];
}) {
  const locale = useLocale();
  const en = locale === "en";
  const [etat, soumettre, attente] = useActionState(actionCreerCode, {
    erreur: null,
    code: null,
  });
  const [copie, setCopie] = useState<string | null>(null);

  const t = en
    ? {
        titre: "Share access",
        intro:
          "Generate a 6-character pickup code for a guest, a cleaner, a relative…",
        prenom: "Recipient's first name",
        optionnel: "(optional)",
        email: "Recipient's email",
        emailAide:
          "The code will be emailed to them, with an alert as soon as the keys are available.",
        validite: "Validity",
        h24: "24 hours",
        j3: "3 days",
        j7: "7 days",
        sansExp: "No expiry",
        generation: "Generating…",
        generer: "Generate a pickup code",
        codeActif: "Active code",
        revoquer: "Revoke",
        expireLe: "Expires on",
        emailBtn: "Email",
        copie: "Copied",
        copier: "Copy",
        precedents: "Previous codes",
        sujetEmail: (l: string) => `Key pickup code — ${l}`,
      }
    : {
        titre: "Partager un accès",
        intro:
          "Générez un code de retrait à 6 caractères pour un voyageur, un prestataire de ménage, un proche…",
        prenom: "Prénom du bénéficiaire",
        optionnel: "(optionnel)",
        email: "Email du bénéficiaire",
        emailAide:
          "Le code lui sera envoyé par email, avec une alerte dès que les clés seront disponibles.",
        validite: "Validité",
        h24: "24 heures",
        j3: "3 jours",
        j7: "7 jours",
        sansExp: "Sans expiration",
        generation: "Génération…",
        generer: "Générer un code de retrait",
        codeActif: "Code actif",
        revoquer: "Révoquer",
        expireLe: "Expire le",
        emailBtn: "Email",
        copie: "Copié",
        copier: "Copier",
        precedents: "Codes précédents",
        sujetEmail: (l: string) => `Code de retrait des clés — ${l}`,
      };

  function messagePartage(code: string) {
    return encodeURIComponent(
      en
        ? `Hi! Here is your Keywi code to pick up the keys for “${logement}”` +
            (commerce ? ` at ${commerce}` : "") +
            `: ${code}`
        : `Bonjour ! Voici votre code Keywi pour récupérer les clés de « ${logement} »` +
            (commerce ? ` chez ${commerce}` : "") +
            ` : ${code}`
    );
  }

  async function copier(code: string) {
    await navigator.clipboard.writeText(code);
    setCopie(code);
    setTimeout(() => setCopie(null), 2000);
  }

  const codesActifs = codes.filter((c) => c.statut === "actif");
  const codesPasses = codes.filter((c) => c.statut !== "actif");

  return (
    <div className="space-y-5">
      {/* Génération d'un nouveau code */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold">{t.titre}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.intro}</p>
        <form action={soumettre} className="mt-3 space-y-3">
          <input type="hidden" name="key_id" value={cleId} />
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label htmlFor="beneficiaire_nom" className="block text-sm font-medium">
              {t.prenom} <span className="text-gray-400">{t.optionnel}</span>
            </label>
            <input
              id="beneficiaire_nom"
              name="beneficiaire_nom"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Léa"
            />
          </div>
          <div>
            <label htmlFor="beneficiaire_email" className="block text-sm font-medium">
              {t.email} <span className="text-gray-400">{t.optionnel}</span>
            </label>
            <input
              id="beneficiaire_email"
              name="beneficiaire_email"
              type="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder={en ? "lea@example.com" : "lea@exemple.fr"}
            />
            <p className="mt-1 text-xs text-gray-500">{t.emailAide}</p>
          </div>
          <div>
            <label htmlFor="validite_jours" className="block text-sm font-medium">
              {t.validite}
            </label>
            <select
              id="validite_jours"
              name="validite_jours"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              defaultValue="7"
            >
              <option value="1">{t.h24}</option>
              <option value="3">{t.j3}</option>
              <option value="7">{t.j7}</option>
              <option value="0">{t.sansExp}</option>
            </select>
          </div>
          {etat.erreur && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {etat.erreur}
            </p>
          )}
          <button
            type="submit"
            disabled={attente}
            className="w-full rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
          >
            {attente ? t.generation : t.generer}
          </button>
        </form>
      </section>

      {/* Codes actifs avec QR + partage */}
      {codesActifs.map((code) => (
        <section
          key={code.id}
          className="rounded-2xl border-2 border-primaire bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-600">
              {t.codeActif}
              {code.beneficiaire_nom || code.beneficiaire_email
                ? ` — ${code.beneficiaire_nom ?? code.beneficiaire_email}`
                : ""}
            </h3>
            <form action={actionRevoquerCode}>
              <input type="hidden" name="access_code_id" value={code.id} />
              <input type="hidden" name="key_id" value={cleId} />
              <button
                type="submit"
                className="text-sm font-medium text-red-700 underline hover:text-red-800"
              >
                {t.revoquer}
              </button>
            </form>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <div className="rounded-lg border border-gray-200 p-2">
              <QRCodeSVG value={code.qr_payload} size={96} aria-label={`QR code ${code.code_6}`} />
            </div>
            <div>
              <p className="font-mono text-3xl font-black tracking-[0.25em] text-primaire-fonce">
                {code.code_6}
              </p>
              {code.expire_at && (
                <p className="mt-1 text-xs text-gray-500">
                  {t.expireLe}{" "}
                  {new Date(code.expire_at).toLocaleDateString(en ? "en-IE" : "fr-FR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Partage */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <a
              href={`mailto:${code.beneficiaire_email ?? ""}?subject=${encodeURIComponent(
                t.sujetEmail(logement)
              )}&body=${messagePartage(code.code_6)}`}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-2 py-2 font-medium hover:bg-gray-50"
            >
              <Mail size={15} aria-hidden="true" /> {t.emailBtn}
            </a>
            <a
              href={`https://wa.me/?text=${messagePartage(code.code_6)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-2 py-2 font-medium hover:bg-gray-50"
            >
              <MessageCircle size={15} aria-hidden="true" /> WhatsApp
            </a>
            <button
              onClick={() => copier(code.code_6)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-2 py-2 font-medium hover:bg-gray-50"
            >
              {copie === code.code_6 ? (
                <>
                  <Check size={15} className="text-menthe" aria-hidden="true" /> {t.copie}
                </>
              ) : (
                <>
                  <Copy size={15} aria-hidden="true" /> {t.copier}
                </>
              )}
            </button>
          </div>
        </section>
      ))}

      {/* Historique des codes */}
      {codesPasses.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-600">{t.precedents}</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {codesPasses.map((code) => (
              <li key={code.id} className="flex items-center justify-between">
                <span className="font-mono font-semibold text-gray-500 line-through">
                  {code.code_6}
                </span>
                <span className="text-xs text-gray-500">
                  {LIBELLES_STATUT_CODE[locale][code.statut]}
                  {code.beneficiaire_nom ? ` · ${code.beneficiaire_nom}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
