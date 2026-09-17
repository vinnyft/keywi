import type { Metadata } from "next";
import { MapPin, Clock, KeyRound, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { QrRetrait } from "@/components/client/QrRetrait";
import { estLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Retrait des clés",
  robots: { index: false },
};

type Retrait = {
  ok: boolean;
  code_6?: string;
  statut?: "actif" | "utilise" | "revoque" | "expire";
  perime?: boolean;
  expire_at?: string | null;
  usage_unique?: boolean;
  heure_debut?: string | null;
  heure_fin?: string | null;
  logement?: string;
  commerce?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  ville?: string | null;
};

function hhmm(h?: string | null): string | null {
  return h ? h.slice(0, 5) : null;
}

export default async function PageRetrait({
  params,
}: {
  params: Promise<{ lang: string; jeton: string }>;
}) {
  const { lang, jeton } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";

  const t = en
    ? {
        titre: "Pick up your keys",
        intro: "Show this code at the counter (or scan the QR at the locker).",
        lieu: "Pickup point",
        code: "Pickup code",
        reutilisable: "Reusable code",
        usageUnique: "Single use — works once",
        plage: "Usable only between",
        expireLe: "Valid until",
        indispo: "This link is no longer valid",
        indispoAide: "The code has been used, revoked or has expired. Ask the host for a new link.",
        introuvable: "Unknown link",
        introuvableAide: "This pickup link doesn't exist. Check the link you received.",
      }
    : {
        titre: "Récupérez vos clés",
        intro: "Présentez ce code au comptoir (ou scannez le QR à la borne).",
        lieu: "Point de retrait",
        code: "Code de retrait",
        reutilisable: "Code réutilisable",
        usageUnique: "Usage unique — fonctionne une fois",
        plage: "Utilisable seulement entre",
        expireLe: "Valable jusqu'au",
        indispo: "Ce lien n'est plus valable",
        indispoAide: "Le code a été utilisé, révoqué ou a expiré. Demandez un nouveau lien à l'hôte.",
        introuvable: "Lien inconnu",
        introuvableAide: "Ce lien de retrait n'existe pas. Vérifiez le lien reçu.",
      };

  const supabase = await createClient();
  const { data } = await supabase.rpc("retrait_public", { p_jeton: jeton });
  const r = (data ?? null) as Retrait | null;

  const enTete = (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-lg items-center px-4 py-3">
        <Logo taille={28} />
      </div>
    </header>
  );

  const cadre = (icone: React.ReactNode, titre: string, aide: string) => (
    <div className="flex min-h-screen flex-col bg-sable">
      {enTete}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          {icone}
          <h1 className="mt-3 text-lg font-bold text-encre">{titre}</h1>
          <p className="mt-2 text-sm text-gray-600">{aide}</p>
        </div>
      </main>
    </div>
  );

  if (!r?.ok) {
    return cadre(
      <AlertCircle className="mx-auto text-gray-400" size={40} aria-hidden="true" />,
      t.introuvable,
      t.introuvableAide
    );
  }

  if (r.perime) {
    return cadre(
      <AlertCircle className="mx-auto text-ambre" size={40} aria-hidden="true" />,
      t.indispo,
      t.indispoAide
    );
  }

  const debut = hhmm(r.heure_debut);
  const fin = hhmm(r.heure_fin);
  const adresseComplete = [r.adresse, [r.code_postal, r.ville].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex min-h-screen flex-col bg-sable">
      {enTete}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-encre">{t.titre}</h1>
        <p className="mt-1 text-sm text-gray-600">{t.intro}</p>
        {r.logement && (
          <p className="mt-1 text-sm font-medium text-encre">🔑 {r.logement}</p>
        )}

        {/* Code + QR */}
        <section className="mt-5 rounded-2xl border-2 border-primaire bg-white p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t.code}
          </p>
          <p className="mt-1 font-mono text-4xl font-black tracking-[0.3em] text-primaire-fonce">
            {r.code_6}
          </p>
          <div className="mt-4 flex justify-center">
            {r.code_6 && <QrRetrait code={r.code_6} />}
          </div>
        </section>

        {/* Lieu de retrait */}
        {r.commerce && (
          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MapPin size={14} aria-hidden="true" /> {t.lieu}
            </p>
            <p className="mt-1 font-bold text-encre">{r.commerce}</p>
            {adresseComplete && <p className="text-sm text-gray-600">{adresseComplete}</p>}
          </section>
        )}

        {/* Conditions */}
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <RefreshCw size={15} className="text-primaire" aria-hidden="true" />
            {r.usage_unique ? t.usageUnique : t.reutilisable}
          </li>
          {debut && fin && (
            <li className="flex items-center gap-2">
              <Clock size={15} className="text-primaire" aria-hidden="true" />
              {t.plage} {debut}–{fin}
            </li>
          )}
          {r.expire_at && (
            <li className="flex items-center gap-2">
              <KeyRound size={15} className="text-primaire" aria-hidden="true" />
              {t.expireLe}{" "}
              {new Date(r.expire_at).toLocaleDateString(en ? "en-IE" : "fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </li>
          )}
        </ul>
      </main>
    </div>
  );
}
