import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HistoriqueJour } from "@/components/commercant/HistoriqueJour";

export const metadata: Metadata = { title: "Historique du jour" };

/** Mouvements du jour du point relais (temps réel) */
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

  return <HistoriqueJour relayPointId={pointRelais!.id} />;
}
