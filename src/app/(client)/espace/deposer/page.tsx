import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FluxDeposer } from "@/components/client/FluxDeposer";

export const metadata: Metadata = { title: "Déposer une clé" };

/**
 * Flux de dépôt côté hôte :
 * 1. choisir un point relais sur la carte
 * 2. enregistrer la clé (nom du logement)
 * 3. payer (Stripe test ou paiement simulé)
 * → code badge généré, dépôt possible au comptoir
 */
export default async function PageDeposer() {
  const supabase = await createClient();

  // Points relais actifs + nombre de cases libres pour la carte
  const { data: points } = await supabase
    .from("relay_points")
    .select("id, nom, adresse, code_postal, ville, lat, lng, horaires, type")
    .eq("statut", "actif")
    .order("nom");

  const { data: slotsLibres } = await supabase
    .from("slots")
    .select("relay_point_id")
    .eq("statut", "libre");

  const casesParPoint = new Map<string, number>();
  for (const s of slotsLibres ?? []) {
    casesParPoint.set(s.relay_point_id, (casesParPoint.get(s.relay_point_id) ?? 0) + 1);
  }

  const pointsAvecCases = (points ?? []).map((p) => ({
    ...p,
    casesLibres: casesParPoint.get(p.id) ?? 0,
  }));

  return <FluxDeposer points={JSON.parse(JSON.stringify(pointsAvecCases))} />;
}
