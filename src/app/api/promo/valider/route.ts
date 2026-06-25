import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { code, sousTotal, nbArticles } = await request.json();

  if (!code) {
    return NextResponse.json({ erreur: "Code manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: promo, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("actif", true)
    .single();

  if (error || !promo) {
    return NextResponse.json({ erreur: "Code promo invalide ou expiré." }, { status: 404 });
  }

  const now = new Date();
  if (promo.date_debut && new Date(promo.date_debut) > now) {
    return NextResponse.json({ erreur: "Ce code n'est pas encore actif." }, { status: 400 });
  }
  if (promo.date_fin && new Date(promo.date_fin) < now) {
    return NextResponse.json({ erreur: "Ce code promo est expiré." }, { status: 400 });
  }
  if (promo.seuil_montant && sousTotal < promo.seuil_montant) {
    return NextResponse.json({
      erreur: `Montant minimum requis : ${promo.seuil_montant} €.`,
    }, { status: 400 });
  }
  if (promo.seuil_quantite && nbArticles < promo.seuil_quantite) {
    return NextResponse.json({
      erreur: `Ce code nécessite au moins ${promo.seuil_quantite} article(s).`,
    }, { status: 400 });
  }

  return NextResponse.json({
    id: promo.id,
    type: promo.type,
    valeur: promo.valeur,
    description: promo.description,
  });
}
