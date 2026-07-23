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

export const metadata: Metadata = {
  title: "Certificat de traçabilité",
  robots: { index: false },
};

/**
 * Certificat de traçabilité — page publique par jeton.
 *
 * Matérialise ce que le journal immuable garantit déjà : la
 * chaîne de garde d'un trousseau, horodatée et non modifiable.
 * Destiné à être montré à un assureur, une agence, une
 * copropriété — ou simplement imprimé.
 */

const MOUVEMENTS = {
  depot: { libelle: "Dépôt au point relais", icone: PackagePlus, classe: "bg-primaire-pale text-primaire-fonce" },
  retrait: { libelle: "Retrait par un bénéficiaire", icone: PackageMinus, classe: "bg-menthe-pale text-menthe" },
  retour: { libelle: "Retour au point relais", icone: RotateCcw, classe: "bg-ambre-pale text-ambre" },
} as const;

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

const horodatage = (d: string) =>
  new Date(d).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });

export default async function PageCertificat({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

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

  return (
    <main id="contenu" className="mx-auto max-w-3xl px-4 py-10 print:py-0">
      {/* En-tête */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <Logo taille={34} />
        <div className="text-right">
          <h1 className="text-xl font-black">Certificat de traçabilité</h1>
          <p className="text-sm text-gray-600">
            Émis le {c.emis_le ? horodatage(c.emis_le) : "—"}
          </p>
        </div>
      </header>

      {/* Attestation */}
      <section className="mt-6 flex items-start gap-3 rounded-2xl bg-primaire-pale p-5">
        <ShieldCheck size={22} className="mt-0.5 shrink-0 text-primaire-fonce" aria-hidden="true" />
        <p className="text-sm text-primaire-fonce">
          Keywi atteste que le trousseau ci-dessous a fait l&apos;objet des
          mouvements listés. Chaque ligne est <strong>horodatée en base et non
          modifiable</strong> : le journal interdit toute réécriture après
          enregistrement.
          {nbVerifies > 0 && (
            <>
              {" "}
              <strong>{nbVerifies}</strong> mouvement{nbVerifies > 1 ? "s ont" : " a"} été
              vérifié{nbVerifies > 1 ? "s" : ""} par scan du badge physique au comptoir.
            </>
          )}
        </p>
      </section>

      {/* Identité du trousseau */}
      <section className="mt-6 rounded-2xl border border-gray-200 p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-gray-500">Trousseau</dt>
            <dd className="mt-0.5 font-bold">{c.logement}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Badge</dt>
            <dd className="mt-0.5 font-mono font-bold tracking-wider">{c.badge}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Sous gestion depuis</dt>
            <dd className="mt-0.5 font-medium">
              {c.creee_le
                ? new Date(c.creee_le).toLocaleDateString("fr-FR", {
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
        <h2 className="font-bold">
          Chaîne de garde — {mouvements.length} mouvement
          {mouvements.length > 1 ? "s" : ""}
        </h2>

        {mouvements.length === 0 ? (
          <p className="mt-3 rounded-xl border border-gray-200 p-5 text-gray-600">
            Aucun mouvement enregistré à ce jour.
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
                      {config?.libelle ?? m.type}
                      {m.case_numero && (
                        <span className="font-normal text-gray-600">
                          {" "}· case n° {m.case_numero}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {horodatage(m.created_at)}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {m.lieu ?? "—"}
                      {m.ville ? `, ${m.ville}` : ""}
                      {m.lieu_type === "casier" && " (casier 24/7)"}
                      {m.beneficiaire && ` — remis à ${m.beneficiaire}`}
                    </p>
                    {m.verifie_par_scan && (
                      <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-menthe-pale px-2 py-0.5 text-xs font-semibold text-menthe">
                        <ScanLine size={11} aria-hidden="true" /> Badge vérifié au comptoir
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
        <p>
          Certificat vérifiable à cette adresse. Le lien peut être révoqué à
          tout moment par le titulaire.
        </p>
        <p className="print:hidden inline-flex items-center gap-1.5">
          <Printer size={14} aria-hidden="true" /> Imprimable (Cmd + P)
        </p>
      </footer>
    </main>
  );
}
