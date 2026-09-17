import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { estLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Rapport hebdomadaire" };

export default async function PageRapport({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";

  const t = en
    ? {
        titre: "Weekly report",
        sousTitre: "Last 7 days — new prospects, outreach and meetings; signed and active are cumulative.",
        commercial: "Sales rep",
        prospects: "New",
        contacts: "Outreach",
        rdv: "Meetings",
        signes: "Signed",
        actifs: "Active",
        vide: "No data yet.",
      }
    : {
        titre: "Rapport hebdomadaire",
        sousTitre: "7 derniers jours — prospects ajoutés, prises de contact et RDV ; signés et actifs sont cumulés.",
        commercial: "Commercial",
        prospects: "Ajoutés",
        contacts: "Contacts",
        rdv: "RDV",
        signes: "Signés",
        actifs: "Actifs",
        vide: "Aucune donnée pour l'instant.",
      };

  const supabase = await createClient();
  const { data: lignes } = await supabase.rpc("rapport_commercial_hebdo");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-encre">{t.titre}</h2>
        <p className="text-sm text-gray-600">{t.sousTitre}</p>
      </div>

      {(lignes ?? []).length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">{t.vide}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">{t.commercial}</th>
                <th className="px-3 py-2 text-center">{t.prospects}</th>
                <th className="px-3 py-2 text-center">{t.contacts}</th>
                <th className="px-3 py-2 text-center">{t.rdv}</th>
                <th className="px-3 py-2 text-center">{t.signes}</th>
                <th className="px-3 py-2 text-center">{t.actifs}</th>
              </tr>
            </thead>
            <tbody>
              {(lignes ?? []).map((r) => (
                <tr key={r.commercial_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 font-medium text-encre">{r.commercial_nom ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{r.prospects_ajoutes}</td>
                  <td className="px-3 py-2 text-center">{r.contactes}</td>
                  <td className="px-3 py-2 text-center">{r.rdv}</td>
                  <td className="px-3 py-2 text-center font-semibold text-encre">{r.signes}</td>
                  <td className="px-3 py-2 text-center">{r.actifs_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
