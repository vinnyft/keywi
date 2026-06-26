import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ConfigurateurClient } from "@/components/configurateur/ConfigurateurClient";

export const metadata: Metadata = { title: "Configurateur" };

export default async function ConfigurateurPage() {
  const supabase = await createClient();

  const [
    { data: settings },
    { data: tileColors },
    { data: groutColors },
    { data: pricingTiers },
    { data: colorSurcharges },
  ] = await Promise.all([
    supabase.from("settings").select("*").single(),
    supabase.from("colors").select("*").eq("type", "tile").eq("actif", true).order("ordre"),
    supabase.from("colors").select("*").eq("type", "grout").eq("actif", true).order("ordre"),
    supabase.from("pricing_tiers").select("*").order("taille_min_cm"),
    supabase.from("color_surcharges").select("*").order("nb_couleurs"),
  ]);

  return (
    <ConfigurateurClient
      settings={settings ?? {
        id: 1, hauteur_fixe_cm: 45, cout_fixe: 50, forfait_livraison: 80,
        seuil_livraison_gratuite: null, dessous_carrelee: false,
        texte_accueil: "Le mobilier mosaïque sur-mesure.", updated_at: new Date().toISOString(),
      }}
      tileColors={tileColors ?? []}
      groutColors={groutColors ?? []}
      pricingTiers={pricingTiers ?? []}
      colorSurcharges={colorSurcharges ?? []}
    />
  );
}
