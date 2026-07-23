import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RegistreCles, type LigneRegistre } from "@/components/client/RegistreCles";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";

export const metadata: Metadata = { title: "Registre des trousseaux" };

/**
 * Keywi Pro — registre complet du parc de clés : recherche,
 * filtres (dont « en retard ») et export CSV de l'historique.
 */
export default async function PageRegistre() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: cles }, { data: mouvements }] = await Promise.all([
    supabase
      .from("keys")
      .select(
        "id, logement, code_badge_imprime, statut, date_retour_attendue, created_at, relay_points(nom, type), slots(numero)"
      )
      .eq("hote_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("movements")
      .select("key_id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  // Agrégats par clé (la RLS limite déjà les mouvements à l'hôte)
  const compte = new Map<string, number>();
  const dernier = new Map<string, string>();
  for (const m of mouvements ?? []) {
    compte.set(m.key_id, (compte.get(m.key_id) ?? 0) + 1);
    if (!dernier.has(m.key_id)) dernier.set(m.key_id, m.created_at);
  }

  const lignes: LigneRegistre[] = (cles ?? []).map((c) => ({
    id: c.id,
    logement: c.logement,
    code_badge_imprime: c.code_badge_imprime,
    statut: c.statut,
    date_retour_attendue: c.date_retour_attendue,
    created_at: c.created_at,
    lieu: c.relay_points?.nom ?? null,
    lieuType: (c.relay_points?.type as "commerce" | "casier" | undefined) ?? null,
    caseNumero: c.slots?.numero ?? null,
    nbMouvements: compte.get(c.id) ?? 0,
    dernierMouvement: dernier.get(c.id) ?? null,
  }));

  return (
    <div>
      <RafraichirTempsReel table="keys" filtre={`hote_id=eq.${user!.id}`} />

      <h1 className="text-2xl font-black">Registre des trousseaux</h1>
      <p className="mt-1 text-gray-600">
        Tout votre parc de clés, filtrable et exportable — la vue Keywi Pro
        pour les conciergeries, agences et hôtels.
      </p>

      <div className="mt-6">
        <RegistreCles lignes={JSON.parse(JSON.stringify(lignes))} />
      </div>
    </div>
  );
}
