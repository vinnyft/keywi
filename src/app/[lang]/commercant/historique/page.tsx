import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HistoriqueJour, type Mouvement } from "@/components/commercant/HistoriqueJour";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";
import type { Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "Today's history" : "Historique du jour" };
}

/** Mouvements du jour du point relais, rafraîchis en temps réel */
export default async function PageHistorique({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = lang === "en" ? "en" : "fr";
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
        locale={locale}
      />
    </>
  );
}
