"use client";

import { QRCodeSVG } from "qrcode.react";
import { MapPin, Clock, KeyRound, Navigation } from "lucide-react";

/**
 * Liste des clés partagées avec un bénéficiaire (vue Guest).
 * Données issues de la RPC `guest_mes_cles`.
 */

export interface CleGuest {
  code_6: string;
  qr_payload: string;
  expire_at: string | null;
  logement: string;
  cle_statut:
    | "en_attente"
    | "deposee"
    | "prete_retrait"
    | "retiree"
    | "retour"
    | "perdue";
  commerce: string | null;
  adresse: string | null;
  horaires: Record<string, string> | null;
  lat: number | null;
  lng: number | null;
  depose_le: string | null;
  cout_centimes: number;
}

const euros = (centimes: number) =>
  (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function disponible(statut: CleGuest["cle_statut"]) {
  return statut === "deposee" || statut === "prete_retrait" || statut === "retour";
}

function depuis(date: string | null): string | null {
  if (!date) return null;
  const jours = (Date.now() - new Date(date).getTime()) / 86_400_000;
  if (jours < 1) return "aujourd'hui";
  if (jours < 2) return "depuis hier";
  return `depuis ${Math.floor(jours)} jours`;
}

export function ClesGuest({ cles }: { cles: CleGuest[] }) {
  if (cles.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
        Aucune clé partagée avec vous pour le moment. Quand un hôte vous
        enverra un code de retrait, il apparaîtra ici.
      </p>
    );
  }

  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {cles.map((cle) => {
        const pret = disponible(cle.cle_statut);
        return (
          <li
            key={cle.code_6}
            className={`rounded-2xl border bg-white p-5 ${
              pret ? "border-menthe" : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="flex items-center gap-1.5 font-bold">
                <KeyRound size={16} className="text-primaire" aria-hidden="true" />
                {cle.logement}
              </h2>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  pret ? "bg-menthe-pale text-menthe" : "bg-ambre-pale text-ambre"
                }`}
              >
                {pret ? "Disponible" : "Pas encore déposée"}
              </span>
            </div>

            {pret ? (
              <div className="mt-4 flex items-center gap-4">
                <div className="rounded-lg border border-gray-200 p-2">
                  <QRCodeSVG
                    value={cle.qr_payload}
                    size={84}
                    aria-label={`QR code ${cle.code_6}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Code de retrait</p>
                  <p className="font-mono text-2xl font-black tracking-[0.2em] text-primaire-fonce">
                    {cle.code_6}
                  </p>
                  {cle.depose_le && (
                    <p className="mt-1 text-xs text-gray-500">
                      Au point relais {depuis(cle.depose_le)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-sable p-3 text-sm text-gray-600">
                Vous recevrez une alerte dès que les clés seront déposées au
                point relais. Votre code : {" "}
                <span className="font-mono font-semibold">{cle.code_6}</span>
              </p>
            )}

            {cle.commerce && (
              <div className="mt-4 border-t border-gray-100 pt-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <MapPin size={14} className="text-primaire" aria-hidden="true" />
                  {cle.commerce}
                </p>
                {cle.adresse && (
                  <p className="mt-0.5 pl-5 text-gray-600">{cle.adresse}</p>
                )}
                {cle.horaires && Object.keys(cle.horaires).length > 0 && (
                  <details className="mt-1 pl-5">
                    <summary className="flex cursor-pointer items-center gap-1 font-medium text-gray-700">
                      <Clock size={13} aria-hidden="true" /> Horaires
                    </summary>
                    <dl className="mt-1 space-y-0.5 text-gray-600">
                      {Object.entries(cle.horaires).map(([jours, heures]) => (
                        <div key={jours} className="flex gap-2">
                          <dt className="font-medium capitalize">{jours} :</dt>
                          <dd>{heures}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
                {cle.lat != null && cle.lng != null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${cle.lat}&mlon=${cle.lng}#map=18/${cle.lat}/${cle.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 pl-5 text-sm font-semibold text-primaire underline"
                  >
                    <Navigation size={13} aria-hidden="true" /> Itinéraire
                  </a>
                )}
              </div>
            )}

            <p className="mt-3 text-xs text-gray-400">
              Dépôt réglé par l&apos;hôte : {euros(cle.cout_centimes)}
              {cle.expire_at &&
                ` · code valable jusqu'au ${new Date(cle.expire_at).toLocaleDateString(
                  "fr-FR",
                  { day: "numeric", month: "long" }
                )}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
