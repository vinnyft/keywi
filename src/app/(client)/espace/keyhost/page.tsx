import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, CalendarDays, Euro, Archive, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatutCle } from "@/components/ui/StatutCle";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";

export const metadata: Metadata = { title: "CRM KeyHost" };

/**
 * CRM KeyHost : vue business du parc de clés de l'hôte —
 * nombre de clés, jours d'occupation par clé, revenus générés,
 * cases occupées / libres. Recalculé côté serveur et rafraîchi
 * en temps réel (RafraichirTempsReel) à chaque mouvement.
 */

/** Jours d'occupation d'une clé à partir de son journal de mouvements :
 *  périodes entre chaque arrivée (dépôt/retour) et le retrait suivant,
 *  période en cours incluse si la clé est toujours en case. */
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

const euros = (centimes: number) =>
  (centimes / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default async function PageKeyHost() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cles }, { data: mouvements }, { data: paiements }] =
    await Promise.all([
      supabase
        .from("keys")
        .select(
          "id, logement, statut, paiement_statut, code_badge_imprime, relay_point_id, relay_points(nom), slots(numero)"
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

  // Agrégats par clé (la RLS limite déjà mouvements/paiements à l'hôte)
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

  // Cases libres dans les points relais utilisés par l'hôte
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

  const stats = [
    { icone: KeyRound, valeur: String(lignes.length), legende: "clés gérées", classe: "text-primaire bg-primaire-pale" },
    { icone: Archive, valeur: `${enCase} / ${casesLibres ?? 0}`, legende: "cases occupées / libres", classe: "text-encre bg-gray-100" },
    { icone: CalendarDays, valeur: joursTotal.toFixed(0), legende: "jours d'occupation cumulés", classe: "text-menthe bg-menthe-pale" },
    { icone: Euro, valeur: euros(revenusTotal), legende: "revenus générés", classe: "text-corail bg-corail/10" },
  ];

  return (
    <div>
      {/* Re-rend la page à chaque mouvement sur mes clés (Realtime) */}
      <RafraichirTempsReel table="keys" filtre={`hote_id=eq.${user!.id}`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">CRM KeyHost</h1>
          <p className="mt-1 text-gray-600">
            Votre parc de clés en un coup d&apos;œil, mis à jour en temps réel.
          </p>
        </div>
        <Link
          href="/espace/deposer"
          className="rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce"
        >
          + Déposer une clé
        </Link>
      </div>

      {/* Indicateurs */}
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

      {/* Tableau du parc */}
      {lignes.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Aucune clé pour l&apos;instant.{" "}
          <Link href="/espace/deposer" className="font-semibold text-primaire underline">
            Déposez votre première clé
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Logement</th>
                <th scope="col" className="px-4 py-3 font-medium">Statut</th>
                <th scope="col" className="px-4 py-3 font-medium">Point relais</th>
                <th scope="col" className="px-4 py-3 font-medium">Case</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Jours occupés</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Revenus</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Détail</span></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-sable/60">
                  <td className="px-4 py-3">
                    <Link href={`/espace/cles/${l.id}`} className="font-semibold hover:text-primaire">
                      {l.logement}
                    </Link>
                    <span className="block font-mono text-xs text-gray-500">{l.code_badge_imprime}</span>
                  </td>
                  <td className="px-4 py-3"><StatutCle statut={l.statut} /></td>
                  <td className="px-4 py-3 text-gray-600">{l.relay_points?.nom ?? "—"}</td>
                  <td className="px-4 py-3">{l.slots ? `n° ${l.slots.numero}` : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {l.jours < 0.05 ? "—" : l.jours < 1 ? "< 1 j" : `${l.jours.toFixed(1)} j`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {l.revenus ? euros(l.revenus) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/espace/cles/${l.id}`} aria-label={`Détail de ${l.logement}`}>
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
