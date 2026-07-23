"use client";

import { useState } from "react";
import { ShieldCheck, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { actionRevoquerCertificat } from "@/lib/actions/certificat";

/**
 * Accès au certificat de traçabilité d'une clé : lien partageable
 * (assureur, agence, copropriété) et révocation en un clic.
 */
export function CertificatCle({
  cleId,
  token,
  nbMouvements,
}: {
  cleId: string;
  token: string;
  nbMouvements: number;
}) {
  const [copie, setCopie] = useState(false);
  const lien = `/certificat/${token}`;

  async function copier() {
    await navigator.clipboard.writeText(`${window.location.origin}${lien}`);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <ShieldCheck size={18} className="text-primaire" aria-hidden="true" />
        Certificat de traçabilité
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        {nbMouvements > 0 ? (
          <>
            Une preuve horodatée des <strong>{nbMouvements} mouvement
            {nbMouvements > 1 ? "s" : ""}</strong> de ce trousseau, à présenter à
            un assureur, une agence ou une copropriété.
          </>
        ) : (
          <>
            Dès le premier dépôt, ce certificat attestera de chaque mouvement du
            trousseau, de façon non modifiable.
          </>
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={lien}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primaire px-4 py-2.5 text-sm font-semibold text-white hover:bg-primaire-fonce"
        >
          <ExternalLink size={15} aria-hidden="true" /> Ouvrir le certificat
        </a>
        <button
          onClick={copier}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          {copie ? (
            <>
              <Check size={15} className="text-menthe" aria-hidden="true" /> Lien copié
            </>
          ) : (
            <>
              <Copy size={15} aria-hidden="true" /> Copier le lien
            </>
          )}
        </button>
        <form action={actionRevoquerCertificat}>
          <input type="hidden" name="key_id" value={cleId} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            title="Génère un nouveau lien et invalide les précédents"
          >
            <RefreshCw size={15} aria-hidden="true" /> Révoquer le lien
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Toute personne disposant du lien peut consulter le certificat. Il ne
        révèle ni votre identité, ni l&apos;adresse du logement.
      </p>
    </section>
  );
}
