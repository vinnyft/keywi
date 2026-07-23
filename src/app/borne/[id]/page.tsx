import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EcranBorne } from "@/components/casier/EcranBorne";

export const metadata: Metadata = {
  title: "Borne casier",
  robots: { index: false },
};

/**
 * Écran d'un casier connecté (terminal physique du casier).
 * Route publique — la sécurité tient au code de retrait lui-même,
 * exactement comme un digicode : sans code valide, rien ne s'ouvre.
 */
export default async function PageBorne({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: casier } = await supabase
    .from("relay_points")
    .select("id, nom, type, statut")
    .eq("id", id)
    .eq("type", "casier")
    .maybeSingle();

  if (!casier || casier.statut !== "actif") notFound();

  return <EcranBorne casierId={casier.id} casierNom={casier.nom} />;
}
