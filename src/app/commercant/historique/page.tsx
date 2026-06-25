import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HistoriqueJour, type Mouvement } from "@/components/commercant/HistoriqueJour";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";

export const metadata: Metadata = { title: "Historique du jour" };

/** Mouvements du jour du point relais, rafraîchis en temps réel */
export default async function PageHistorique() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pointRelais } = await supabase
    .from("relay_points")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  const { data: mouvements } = await supabase
    .from("movements")
    .select("id, type, created_at, details")
    .eq("relay_point_id", pointRelais!.id)
    .gte("created_at", debut.toISOString())
    .order("created_at", { ascending: false });

  return (
    <>
      <RafraichirTempsReel
        table="movements"
        filtre={`relay_point_id=eq.${pointRelais!.id}`}
      />
      <HistoriqueJour
        mouvements={JSON.parse(JSON.stringify(mouvements ?? [])) as Mouvement[]}
      />
    </>
  );
}
