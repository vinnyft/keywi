import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RechercheRelais } from "@/components/marketing/RechercheRelais";

export const metadata: Metadata = {
  title: "Trouver un point relais",
  description:
    "Carte des commerces partenaires Keywi où déposer et récupérer des clés.",
};

/** Carte publique des points relais actifs + disponibilité des cases */
export default async function PagePointsRelais() {
  const supabase = await createClient();

  const { data: points } = await supabase
    .from("relay_points")
    .select("id, nom, adresse, code_postal, ville, lat, lng, horaires, description")
    .eq("statut", "actif")
    .order("nom");

  const { data: slotsLibres } = await supabase
    .from("slots")
    .select("relay_point_id")
    .eq("statut", "libre");

  const casesParPoint = new Map<string, number>();
  for (const s of slotsLibres ?? []) {
    casesParPoint.set(
      s.relay_point_id,
      (casesParPoint.get(s.relay_point_id) ?? 0) + 1
    );
  }

  const pointsAvecCases = (points ?? []).map((p) => ({
    ...p,
    horaires: p.horaires as Record<string, string> | null,
    casesLibres: casesParPoint.get(p.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black">Trouver un point relais</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Nos commerces partenaires vous accueillent pour déposer ou récupérer des
        clés pendant leurs horaires d&apos;ouverture. Cherchez celui qui vous
        arrange.
      </p>

      <RechercheRelais points={JSON.parse(JSON.stringify(pointsAvecCases))} />
    </div>
  );
}
