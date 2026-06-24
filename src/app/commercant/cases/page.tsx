import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GrilleCases } from "@/components/commercant/GrilleCases";

export const metadata: Metadata = { title: "Mes cases" };

/** Vue « Mes cases » : grille visuelle temps réel libre/occupée */
export default async function PageCases() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pointRelais } = await supabase
    .from("relay_points")
    .select("id, capacite")
    .eq("owner_id", user!.id)
    .single();

  return <GrilleCases relayPointId={pointRelais!.id} />;
}
