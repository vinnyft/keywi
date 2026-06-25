"use client";

import { useActionState, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Mail, MessageCircle, Copy, Check } from "lucide-react";
import { actionCreerCode, actionRevoquerCode } from "@/lib/actions/client";

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

const LIBELLES_STATUT_CODE: Record<CodeAcces["statut"], string> = {
  actif: "Actif",
  utilise: "Utilisé",
  revoque: "Révoqué",
  expire: "Expiré",
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
  const [etat, soumettre, attente] = useActionState(actionCreerCode, {
    erreur: null,
    code: null,
  });
  const [copie, setCopie] = useState<string | null>(null);

  function messagePartage(code: string) {
    return encodeURIComponent(
      `Bonjour ! Voici votre code Keywi pour récupérer les clés de « ${logement} »` +
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
        <h2 className="font-bold">Partager un accès</h2>
        <p className="mt-1 text-sm text-gray-600">
          Générez un code de retrait à 6 caractères pour un voyageur, un
          prestataire de ménage, un proche…
        </p>
        <form action={soumettre} className="mt-3 space-y-3">
          <input type="hidden" name="key_id" value={cleId} />
          <div>
            <label htmlFor="beneficiaire_nom" className="block text-sm font-medium">
              Prénom du bénéficiaire <span className="text-gray-400">(optionnel)</span>
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
              Email du bénéficiaire <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              id="beneficiaire_email"
              name="beneficiaire_email"
              type="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="lea@exemple.fr"
            />
            <p className="mt-1 text-xs text-gray-500">
              Le code lui sera envoyé par email, avec une alerte dès que les
              clés seront disponibles.
            </p>
          </div>
          <div>
            <label htmlFor="validite_jours" className="block text-sm font-medium">
              Validité
            </label>
            <select
              id="validite_jours"
              name="validite_jours"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              defaultValue="7"
            >
              <option value="1">24 heures</option>
              <option value="3">3 jours</option>
              <option value="7">7 jours</option>
              <option value="0">Sans expiration</option>
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
            {attente ? "Génération…" : "Générer un code de retrait"}
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
              Code actif
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
                Révoquer
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
                  Expire le{" "}
                  {new Date(code.expire_at).toLocaleDateString("fr-FR", {
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
                `Code de retrait des clés — ${logement}`
              )}&body=${messagePartage(code.code_6)}`}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-2 py-2 font-medium hover:bg-gray-50"
            >
              <Mail size={15} aria-hidden="true" /> Email
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
                  <Check size={15} className="text-menthe" aria-hidden="true" /> Copié
                </>
              ) : (
                <>
                  <Copy size={15} aria-hidden="true" /> Copier
                </>
              )}
            </button>
          </div>
        </section>
      ))}

      {/* Historique des codes */}
      {codesPasses.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-600">Codes précédents</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {codesPasses.map((code) => (
              <li key={code.id} className="flex items-center justify-between">
                <span className="font-mono font-semibold text-gray-500 line-through">
                  {code.code_6}
                </span>
                <span className="text-xs text-gray-500">
                  {LIBELLES_STATUT_CODE[code.statut]}
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
