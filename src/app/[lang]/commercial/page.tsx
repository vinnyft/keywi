import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { estLocale, localise, type Locale } from "@/lib/i18n";
import {
  PIPELINE,
  libelleStatut,
  couleurStatut,
  type StatutProspect,
} from "@/content/commercial";

export const metadata: Metadata = { title: "Pipeline commercial" };

/** Premier jour du mois courant, au format ISO « AAAA-MM-01 ». */
function moisCourantISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export default async function PageCommercial({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);

  const t = en
    ? {
        titre: "My prospects",
        sousTitre: "Drop-off points to sign across Paris.",
        ajouter: "New prospect",
        objectif: "This month's target",
        signes: "signed",
        aucunObjectif: "No target set yet.",
        vide: "No prospect in this stage.",
        aucun: "No prospect yet — add your first one.",
        arr: "arr.",
        total: "prospects",
        codeTitre: "Your referral code",
        codeAide: "Give it to the shops you canvass so they're linked to you when they apply.",
      }
    : {
        titre: "Mes prospects",
        sousTitre: "Points relais à signer dans Paris.",
        ajouter: "Nouveau prospect",
        objectif: "Objectif du mois",
        signes: "signés",
        aucunObjectif: "Aucun objectif défini.",
        vide: "Aucun prospect à cette étape.",
        aucun: "Aucun prospect — ajoutez le premier.",
        arr: "arr.",
        total: "prospects",
        codeTitre: "Votre code de parrainage",
        codeAide: "Donnez-le aux commerçants que vous démarchez : ils vous seront rattachés à leur candidature.",
      };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: prospects }, { data: objectif }, { data: profil }] = await Promise.all([
    supabase.from("prospects").select("*").order("updated_at", { ascending: false }),
    user
      ? supabase
          .from("objectifs_commerciaux")
          .select("cible_signes, cible_contacts")
          .eq("commercial_id", user.id)
          .eq("mois", moisCourantISO())
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("profiles")
          .select("code_commercial")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const codeParrainage = profil?.code_commercial ?? null;

  const liste = prospects ?? [];
  const parStatut = (s: StatutProspect) => liste.filter((p) => p.statut === s);
  const signes = liste.filter(
    (p) => p.statut === "signe" || p.statut === "actif"
  ).length;
  const cible = objectif?.cible_signes ?? 0;
  const pourcent = cible > 0 ? Math.min(100, Math.round((signes / cible) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-encre">{t.titre}</h2>
          <p className="text-sm text-gray-600">{t.sousTitre}</p>
        </div>
        <Link
          href={l("/commercial/nouveau")}
          className="shrink-0 rounded-lg bg-primaire px-3 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
        >
          + {t.ajouter}
        </Link>
      </div>

      {/* Code de parrainage à communiquer aux commerçants démarchés */}
      {codeParrainage && (
        <div className="rounded-xl border border-primaire/30 bg-primaire/5 p-4">
          <p className="text-sm font-semibold text-encre">{t.codeTitre}</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-primaire">
            {codeParrainage}
          </p>
          <p className="mt-1 text-xs text-gray-600">{t.codeAide}</p>
        </div>
      )}

      {/* Objectif du mois */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-encre">{t.objectif}</p>
        {cible > 0 ? (
          <>
            <p className="mt-1 text-2xl font-bold text-encre">
              {signes}
              <span className="text-base font-normal text-gray-500"> / {cible} {t.signes}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primaire"
                style={{ width: `${pourcent}%` }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-gray-500">{t.aucunObjectif}</p>
        )}
      </div>

      {/* Compteurs par étape */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {PIPELINE.map((s) => (
          <div key={s} className="rounded-lg border border-gray-200 bg-white p-2 text-center">
            <p className="text-lg font-bold text-encre">{parStatut(s).length}</p>
            <p className="text-[11px] text-gray-500">{libelleStatut(s, locale)}</p>
          </div>
        ))}
      </div>

      {/* Prospects groupés par étape */}
      {liste.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">{t.aucun}</p>
      ) : (
        <div className="space-y-5">
          {PIPELINE.map((s) => {
            const groupe = parStatut(s);
            if (groupe.length === 0) return null;
            return (
              <section key={s}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-encre">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${couleurStatut(s)}`}>
                    {libelleStatut(s, locale)}
                  </span>
                  <span className="text-gray-400">{groupe.length}</span>
                </h3>
                <ul className="space-y-2">
                  {groupe.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={l(`/commercial/prospect/${p.id}`)}
                        className="block rounded-lg border border-gray-200 bg-white p-3 hover:border-primaire"
                      >
                        <p className="font-medium text-encre">{p.nom_commerce}</p>
                        <p className="text-xs text-gray-500">
                          {[
                            p.arrondissement ? `${p.arrondissement}ᵉ ${t.arr}` : null,
                            p.adresse,
                            p.contact_nom,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
