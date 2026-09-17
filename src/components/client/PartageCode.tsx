"use client";

import { useActionState, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Mail, MessageCircle, Check, Link2, RefreshCw, Clock } from "lucide-react";
import { actionCreerCode, actionRevoquerCode } from "@/lib/actions/client";
import { useLocale } from "@/lib/useLocale";
import { localise, type Locale } from "@/lib/i18n";

/**
 * Gestion des codes de retrait d'une clé : génération (mode
 * réutilisable / usage unique + plage horaire optionnelle), affichage
 * QR code, partage du LIEN de retrait (email / WhatsApp / copie),
 * révocation. Le bénéficiaire n'a pas de compte : il ouvre le lien.
 */

interface CodeAcces {
  id: string;
  code_6: string;
  qr_payload: string;
  jeton: string;
  usage_unique: boolean;
  heure_debut: string | null;
  heure_fin: string | null;
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

/** « HH:MM:SS » → « HH:MM » */
function hhmm(h: string | null): string | null {
  return h ? h.slice(0, 5) : null;
}

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
          "Generate a pickup link for a guest, a cleaner, a relative — no account needed on their side.",
        prenom: "Recipient's first name",
        optionnel: "(optional)",
        email: "Recipient's email",
        emailAide:
          "The link will be emailed to them, with an alert as soon as the keys are available.",
        mode: "Pickup mode",
        reutilisable: "Reusable",
        usageUnique: "Single use",
        modeAide: "A single-use code stops working after the first pickup.",
        plage: "Usable only between (optional)",
        de: "from",
        a: "to",
        validite: "Validity",
        h24: "24 hours",
        j3: "3 days",
        j7: "7 days",
        sansExp: "No expiry",
        generation: "Generating…",
        generer: "Generate a pickup link",
        codeActif: "Active link",
        revoquer: "Revoke",
        expireLe: "Expires on",
        lien: "Pickup link",
        emailBtn: "Email",
        copie: "Copied",
        copier: "Copy link",
        precedents: "Previous codes",
        sujetEmail: (l: string) => `Key pickup — ${l}`,
        badgeUnique: "Single use",
        badgeReutil: "Reusable",
      }
    : {
        titre: "Partager un accès",
        intro:
          "Générez un lien de retrait pour un voyageur, un prestataire, un proche — sans compte de leur côté.",
        prenom: "Prénom du bénéficiaire",
        optionnel: "(optionnel)",
        email: "Email du bénéficiaire",
        emailAide:
          "Le lien lui sera envoyé par email, avec une alerte dès que les clés seront disponibles.",
        mode: "Mode de retrait",
        reutilisable: "Réutilisable",
        usageUnique: "Usage unique",
        modeAide: "Un code à usage unique cesse de fonctionner après le premier retrait.",
        plage: "Utilisable seulement entre (optionnel)",
        de: "de",
        a: "à",
        validite: "Validité",
        h24: "24 heures",
        j3: "3 jours",
        j7: "7 jours",
        sansExp: "Sans expiration",
        generation: "Génération…",
        generer: "Générer un lien de retrait",
        codeActif: "Lien actif",
        revoquer: "Révoquer",
        expireLe: "Expire le",
        lien: "Lien de retrait",
        emailBtn: "Email",
        copie: "Copié",
        copier: "Copier le lien",
        precedents: "Codes précédents",
        sujetEmail: (l: string) => `Retrait des clés — ${l}`,
        badgeUnique: "Usage unique",
        badgeReutil: "Réutilisable",
      };

  function lienRetrait(jeton: string) {
    const chemin = localise(`/retrait/${jeton}`, locale);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${chemin}`;
  }

  function messagePartage(lien: string) {
    return encodeURIComponent(
      en
        ? `Hi! Here is your KeyWe link to pick up the keys for “${logement}”` +
            (commerce ? ` at ${commerce}` : "") +
            `: ${lien}`
        : `Bonjour ! Voici votre lien KeyWe pour récupérer les clés de « ${logement} »` +
            (commerce ? ` chez ${commerce}` : "") +
            ` : ${lien}`
    );
  }

  async function copier(cle: string, valeur: string) {
    await navigator.clipboard.writeText(valeur);
    setCopie(cle);
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

          {/* Mode de retrait */}
          <fieldset>
            <legend className="text-sm font-medium">{t.mode}</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm has-[:checked]:border-primaire has-[:checked]:bg-primaire-pale">
                <input type="radio" name="mode_retrait" value="reutilisable" />
                {t.reutilisable}
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm has-[:checked]:border-primaire has-[:checked]:bg-primaire-pale">
                <input type="radio" name="mode_retrait" value="unique" defaultChecked />
                {t.usageUnique}
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">{t.modeAide}</p>
          </fieldset>

          {/* Plage horaire optionnelle */}
          <div>
            <label className="block text-sm font-medium">{t.plage}</label>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-gray-500">{t.de}</span>
              <input
                type="time"
                name="heure_debut"
                className="rounded-lg border border-gray-300 px-2 py-1.5"
              />
              <span className="text-gray-500">{t.a}</span>
              <input
                type="time"
                name="heure_fin"
                className="rounded-lg border border-gray-300 px-2 py-1.5"
              />
            </div>
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

      {/* Codes actifs avec QR + partage du lien */}
      {codesActifs.map((code) => {
        const lien = lienRetrait(code.jeton);
        const debut = hhmm(code.heure_debut);
        const fin = hhmm(code.heure_fin);
        return (
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

            {/* Badges mode / plage */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-sable px-2 py-0.5 font-medium text-encre">
                <RefreshCw size={12} aria-hidden="true" />
                {code.usage_unique ? t.badgeUnique : t.badgeReutil}
              </span>
              {debut && fin && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sable px-2 py-0.5 font-medium text-encre">
                  <Clock size={12} aria-hidden="true" />
                  {debut}–{fin}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4">
              <div className="rounded-lg border border-gray-200 p-2">
                <QRCodeSVG value={lien} size={96} aria-label={`QR ${code.code_6}`} />
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

            {/* Lien de retrait */}
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-600">{t.lien}</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  {lien}
                </code>
                <button
                  onClick={() => copier(code.id, lien)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  {copie === code.id ? (
                    <>
                      <Check size={15} className="text-menthe" aria-hidden="true" /> {t.copie}
                    </>
                  ) : (
                    <>
                      <Link2 size={15} aria-hidden="true" /> {t.copier}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Partage */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <a
                href={`mailto:${code.beneficiaire_email ?? ""}?subject=${encodeURIComponent(
                  t.sujetEmail(logement)
                )}&body=${messagePartage(lien)}`}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-2 py-2 font-medium hover:bg-gray-50"
              >
                <Mail size={15} aria-hidden="true" /> {t.emailBtn}
              </a>
              <a
                href={`https://wa.me/?text=${messagePartage(lien)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-2 py-2 font-medium hover:bg-gray-50"
              >
                <MessageCircle size={15} aria-hidden="true" /> WhatsApp
              </a>
            </div>
          </section>
        );
      })}

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
