import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, CalendarDays, Euro, Archive, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatutCle } from "@/components/ui/StatutCle";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";
import { estLocale, localise, type Locale } from "@/lib/i18n";

export const metadata: Metadata = { title: "CRM KeyHost" };

/**
 * CRM KeyHost : vue business du parc de clés de l'hôte — nombre de
 * clés, jours d'occupation, revenus, cases. Rafraîchi en temps réel.
 */
function joursOccupation(
  mouvements: { type: "depot" | "retrait" | "retour"; created_at: string }[]
): number {
  let totalMs = 0;
  let debut: number | null = null;
  for (const m of mouvements) {
    const t = new Date(m.created_at).getTime();
    if ((m.type === "depot" || m.type === "retour") && debut === null) {
      debut = t;
    } else if (m.type === "retrait" && debut !== null) {
      totalMs += t - debut;
      debut = null;
    }
  }
  if (debut !== null) totalMs += Date.now() - debut;
  return totalMs / 86_400_000;
}

export default async function PageKeyHost({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";
  const intl = en ? "en-IE" : "fr-FR";
  const euros = (centimes: number) =>
    (centimes / 100).toLocaleString(intl, { style: "currency", currency: "EUR" });
  const l = (chemin: string) => localise(chemin, locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cles }, { data: mouvements }, { data: paiements }] =
    await Promise.all([
      supabase
        .from("keys")
        .select(
          "id, logement, statut, paiement_statut, code_badge_imprime, relay_point_id, date_retour_attendue, relay_points(nom), slots(numero)"
        )
        .eq("hote_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("movements")
        .select("key_id, type, created_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("paiements")
        .select("key_id, montant_centimes")
        .eq("hote_id", user!.id)
        .eq("statut", "paye"),
    ]);

  const mvtsParCle = new Map<string, { type: "depot" | "retrait" | "retour"; created_at: string }[]>();
  for (const m of mouvements ?? []) {
    if (!mvtsParCle.has(m.key_id)) mvtsParCle.set(m.key_id, []);
    mvtsParCle.get(m.key_id)!.push(m);
  }
  const revenusParCle = new Map<string, number>();
  for (const p of paiements ?? []) {
    if (p.key_id) {
      revenusParCle.set(p.key_id, (revenusParCle.get(p.key_id) ?? 0) + p.montant_centimes);
    }
  }

  const lignes = (cles ?? []).map((cle) => ({
    ...cle,
    jours: joursOccupation(mvtsParCle.get(cle.id) ?? []),
    revenus: revenusParCle.get(cle.id) ?? 0,
  }));

  const relaisUtilises = [...new Set(lignes.map((l) => l.relay_point_id).filter(Boolean))] as string[];
  const { count: casesLibres } = relaisUtilises.length
    ? await supabase
        .from("slots")
        .select("id", { count: "exact", head: true })
        .in("relay_point_id", relaisUtilises)
        .eq("statut", "libre")
    : { count: 0 };

  const enCase = lignes.filter((l) => l.slots).length;
  const joursTotal = lignes.reduce((somme, l) => somme + l.jours, 0);
  const revenusTotal = lignes.reduce((somme, l) => somme + l.revenus, 0);

  const t = en
    ? {
        lede: "Your key fleet at a glance, updated in real time.",
        deposer: "+ Drop off a key",
        clesGerees: "keys managed",
        cases: "slots used / free",
        joursCumules: "total occupancy days",
        revenus: "revenue generated",
        aucune: "No keys yet.",
        deposerPremiere: "Drop off your first key",
        thLogement: "Property",
        thStatut: "Status",
        thPointRelais: "Drop-off point",
        thCase: "Slot",
        thEcheance: "Due",
        thJours: "Days held",
        thRevenus: "Revenue",
        detail: "Details",
        enRetard: "Overdue",
        caseN: (n: number) => `slot ${n}`,
        jours: (v: string) => `${v} d`,
        moinsDUnJour: "< 1 d",
      }
    : {
        lede: "Votre parc de clés en un coup d'œil, mis à jour en temps réel.",
        deposer: "+ Déposer une clé",
        clesGerees: "clés gérées",
        cases: "cases occupées / libres",
        joursCumules: "jours d'occupation cumulés",
        revenus: "revenus générés",
        aucune: "Aucune clé pour l'instant.",
        deposerPremiere: "Déposez votre première clé",
        thLogement: "Logement",
        thStatut: "Statut",
        thPointRelais: "Point relais",
        thCase: "Case",
        thEcheance: "Échéance",
        thJours: "Jours occupés",
        thRevenus: "Revenus",
        detail: "Détail",
        enRetard: "En retard",
        caseN: (n: number) => `n° ${n}`,
        jours: (v: string) => `${v} j`,
        moinsDUnJour: "< 1 j",
      };

  const stats = [
    { icone: KeyRound, valeur: String(lignes.length), legende: t.clesGerees, classe: "text-primaire bg-primaire-pale" },
    { icone: Archive, valeur: `${enCase} / ${casesLibres ?? 0}`, legende: t.cases, classe: "text-encre bg-gray-100" },
    { icone: CalendarDays, valeur: joursTotal.toFixed(0), legende: t.joursCumules, classe: "text-menthe bg-menthe-pale" },
    { icone: Euro, valeur: euros(revenusTotal), legende: t.revenus, classe: "text-corail bg-corail/10" },
  ];

  return (
    <div>
      <RafraichirTempsReel table="keys" filtre={`hote_id=eq.${user!.id}`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">CRM KeyHost</h1>
          <p className="mt-1 text-gray-600">{t.lede}</p>
        </div>
        <Link
          href={l("/espace/deposer")}
          className="rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce"
        >
          {t.deposer}
        </Link>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icone: Icone, valeur, legende, classe }) => (
          <div key={legende} className="rounded-2xl border border-gray-200 bg-white p-4">
            <span className={`inline-flex size-9 items-center justify-center rounded-lg ${classe}`}>
              <Icone size={18} aria-hidden="true" />
            </span>
            <dd className="mt-2 text-2xl font-black">{valeur}</dd>
            <dt className="text-sm text-gray-600">{legende}</dt>
          </div>
        ))}
      </dl>

      {lignes.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          {t.aucune}{" "}
          <Link href={l("/espace/deposer")} className="font-semibold text-primaire underline">
            {t.deposerPremiere}
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t.thLogement}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thStatut}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thPointRelais}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thCase}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t.thEcheance}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{t.thJours}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{t.thRevenus}</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">{t.detail}</span></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-gray-100 last:border-0 hover:bg-sable/60">
                  <td className="px-4 py-3">
                    <Link href={l(`/espace/cles/${ligne.id}`)} className="font-semibold hover:text-primaire">
                      {ligne.logement}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">{ligne.code_badge_imprime}</span>
                  </td>
                  <td className="px-4 py-3"><StatutCle statut={ligne.statut} locale={locale} /></td>
                  <td className="px-4 py-3 text-gray-600">{ligne.relay_points?.nom ?? "—"}</td>
                  <td className="px-4 py-3">{ligne.slots ? t.caseN(ligne.slots.numero) : "—"}</td>
                  <td className="px-4 py-3">
                    {ligne.date_retour_attendue ? (
                      new Date(ligne.date_retour_attendue) < new Date() &&
                      ligne.statut !== "en_attente" &&
                      ligne.statut !== "perdue" ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {t.enRetard}
                        </span>
                      ) : (
                        <span className="text-gray-600">
                          {new Date(ligne.date_retour_attendue).toLocaleDateString(intl, {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {ligne.jours < 0.05 ? "—" : ligne.jours < 1 ? t.moinsDUnJour : t.jours(ligne.jours.toFixed(1))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {ligne.revenus ? euros(ligne.revenus) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={l(`/espace/cles/${ligne.id}`)} aria-label={`${t.detail} — ${ligne.logement}`}>
                      <ChevronRight size={16} className="text-gray-400" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
