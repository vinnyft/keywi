import type { Metadata } from "next";
import { PanierClient } from "@/components/panier/PanierClient";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Panier" };

export default async function PanierPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("forfait_livraison, seuil_livraison_gratuite").single();

  return (
    <PanierClient
      forfaitLivraison={settings?.forfait_livraison ?? 80}
      seuilGratuite={settings?.seuil_livraison_gratuite ?? null}
    />
  );
}
