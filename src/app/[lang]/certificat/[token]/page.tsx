import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  ScanLine,
  Printer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "en" ? "Traceability certificate" : "Certificat de traçabilité",
    robots: { index: false },
  };
}

/**
 * Certificat de traçabilité — page publique par jeton, bilingue.
 *
 * Matérialise ce que le journal immuable garantit déjà : la
 * chaîne de garde d'un trousseau, horodatée et non modifiable.
 * Destiné à être montré à un assureur, une agence, une
 * copropriété — ou simplement imprimé.
 */

const MOUVEMENTS: Record<
  "depot" | "retrait" | "retour",
  { libelle: Record<Locale, string>; icone: typeof PackagePlus; classe: string }
> = {
  depot: {
    libelle: { fr: "Dépôt au point relais", en: "Drop-off at the point" },
    icone: PackagePlus,
    classe: "bg-primaire-pale text-primaire-fonce",
  },
  retrait: {
    libelle: { fr: "Retrait par un bénéficiaire", en: "Pickup by a recipient" },
    icone: PackageMinus,
    classe: "bg-menthe-pale text-menthe",
  },
  retour: {
    libelle: { fr: "Retour au point relais", en: "Return to the point" },
    icone: RotateCcw,
    classe: "bg-ambre-pale text-ambre",
  },
};

interface Mouvement {
  type: keyof typeof MOUVEMENTS;
  created_at: string;
  lieu: string | null;
  lieu_type: string | null;
  ville: string | null;
  case_numero: string | null;
  beneficiaire: string | null;
  verifie_par_scan: boolean;
}

export default async function PageCertificat({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}) {
  const { lang, token } = await params;
  const en = lang === "en";
  const supabase = await createClient();

  const horodatage = (d: string) =>
    new Date(d).toLocaleString(en ? "en-IE" : "fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });

  const { data } = await supabase.rpc("certificat_public", { p_token: token });
  const c = (data ?? { ok: false }) as unknown as {
    ok: boolean;
    logement?: string;
    badge?: string;
    statut?: string;
    creee_le?: string;
    emis_le?: string;
    mouvements?: Mouvement[];
  };

  if (!c.ok) notFound();

  const mouvements = c.mouvements ?? [];
  const nbVerifies = mouvements.filter((m) => m.verifie_par_scan).length;

  const t = en
    ? {
        titre: "Traceability certificate",
        emisLe: "Issued on",
        attestation:
          "KeyWe certifies that the keyring below underwent the listed movements. Each line is",
        attestationFort: "timestamped in the database and tamper-proof",
        attestationFin: ": the log forbids any rewrite after recording.",
        verifies: (n: number) =>
          ` ${n} movement${n > 1 ? "s were" : " was"} verified by scanning the physical tag at the counter.`,
        trousseau: "Keyring",
        badge: "Tag",
        depuis: "Under management since",
        chaine: (n: number) => `Chain of custody — ${n} movement${n > 1 ? "s" : ""}`,
        aucun: "No movement recorded to date.",
        caseNum: (n: string) => ` · slot no. ${n}`,
        casier: " (24/7 locker)",
        remisA: (b: string) => ` — handed to ${b}`,
        verifieComptoir: "Tag verified at the counter",
        footerNote:
          "Certificate verifiable at this address. The link can be revoked at any time by the holder.",
        imprimable: "Printable (Cmd + P)",
      }
    : {
        titre: "Certificat de traçabilité",
        emisLe: "Émis le",
        attestation:
          "KeyWe atteste que le trousseau ci-dessous a fait l'objet des mouvements listés. Chaque ligne est",
        attestationFort: "horodatée en base et non modifiable",
        attestationFin: " : le journal interdit toute réécriture après enregistrement.",
        verifies: (n: number) =>
          ` ${n} mouvement${n > 1 ? "s ont" : " a"} été vérifié${n > 1 ? "s" : ""} par scan du badge physique au comptoir.`,
        trousseau: "Trousseau",
        badge: "Badge",
        depuis: "Sous gestion depuis",
        chaine: (n: number) => `Chaîne de garde — ${n} mouvement${n > 1 ? "s" : ""}`,
        aucun: "Aucun mouvement enregistré à ce jour.",
        caseNum: (n: string) => ` · case n° ${n}`,
        casier: " (casier 24/7)",
        remisA: (b: string) => ` — remis à ${b}`,
        verifieComptoir: "Badge vérifié au comptoir",
        footerNote:
          "Certificat vérifiable à cette adresse. Le lien peut être révoqué à tout moment par le titulaire.",
        imprimable: "Imprimable (Cmd + P)",
      };

  return (
    <main id="contenu" className="mx-auto max-w-3xl px-4 py-10 print:py-0">
      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <Logo taille={34} />
        <div className="text-right">
          <h1 className="text-xl font-black">{t.titre}</h1>
          <p className="text-sm text-gray-600">
            {t.emisLe} {c.emis_le ? horodatage(c.emis_le) : "—"}
          </p>
        </div>
      </header>

      {/* Attestation */}
      <section className="mt-6 flex items-start gap-3 rounded-2xl bg-primaire-pale p-5">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-primaire-fonce" aria-hidden="true" />
        <p className="text-sm text-primaire-fonce">
          {t.attestation} <strong>{t.attestationFort}</strong>
          {t.attestationFin}
          {nbVerifies > 0 && <>{t.verifies(nbVerifies)}</>}
        </p>
      </section>

      {/* Identité du trousseau */}
      <section className="mt-6 rounded-2xl border border-gray-200 p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-gray-500">{t.trousseau}</dt>
            <dd className="mt-0.5 font-bold">{c.logement}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{t.badge}</dt>
            <dd className="mt-0.5 font-mono font-bold tracking-wider">{c.badge}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">{t.depuis}</dt>
            <dd className="mt-0.5 font-medium">
              {c.creee_le
                ? new Date(c.creee_le).toLocaleDateString(en ? "en-IE" : "fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Chaîne de garde */}
      <section className="mt-6">
        <h2 className="font-bold">{t.chaine(mouvements.length)}</h2>

        {mouvements.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 p-5 text-gray-600">
            {t.aucun}
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {mouvements.map((m, i) => {
              const config = MOUVEMENTS[m.type];
              const Icone = config?.icone ?? PackagePlus;
              return (
                <li
                  key={`${m.created_at}-${i}`}
                  className="flex gap-3 rounded-xl border border-gray-200 p-4"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config?.classe ?? "bg-gray-100"}`}
                  >
                    <Icone size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {config?.libelle[en ? "en" : "fr"] ?? m.type}
                      {m.case_numero && (
                        <span className="font-normal text-gray-600">
                          {t.caseNum(m.case_numero)}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{horodatage(m.created_at)}</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {m.lieu ?? "—"}
                      {m.ville ? `, ${m.ville}` : ""}
                      {m.lieu_type === "casier" && t.casier}
                      {/* Initiales seulement : le certificat prouve une
                          remise nominative sans divulguer l'identité du
                          bénéficiaire (voir migration 0013). */}
                      {m.beneficiaire && t.remisA(m.beneficiaire)}
                    </p>
                    {m.verifie_par_scan && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-menthe-pale px-2 py-0.5 text-xs font-semibold text-menthe">
                        <ScanLine size={11} aria-hidden="true" /> {t.verifieComptoir}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5 text-sm text-gray-500">
        <p>{t.footerNote}</p>
        <p className="print:hidden inline-flex items-center gap-1.5">
          <Printer size={14} aria-hidden="true" /> {t.imprimable}
        </p>
      </footer>
    </main>
  );
}
