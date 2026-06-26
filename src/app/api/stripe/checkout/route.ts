import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripeDisponible, getStripe } from "@/lib/stripe";
import { calculerPrix } from "@/lib/configurateur/pricing";
import type { ConfigMeuble } from "@/lib/supabase/types";

interface CartItem {
  config: ConfigMeuble;
  quantite: number;
}

export async function POST(request: NextRequest) {
  try {
    const { items, promoCode }: { items: CartItem[]; promoCode: string | null } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ erreur: "Panier vide." }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [
      { data: settings },
      { data: tiers },
      { data: surcharges },
    ] = await Promise.all([
      adminDb.from("settings").select("*").single(),
      adminDb.from("pricing_tiers").select("*"),
      adminDb.from("color_surcharges").select("*"),
    ]);

    if (!settings || !tiers || !surcharges) {
      return NextResponse.json({ erreur: "Configuration manquante." }, { status: 500 });
    }

    const lignes = items.map((item) => {
      const res = calculerPrix(
        {
          tailleCm: item.config.tailleCm,
          nbLongueur: item.config.nbLongueur,
          nbLargeur: item.config.nbLargeur,
          nbCouleurs: item.config.couleurs.length,
          hauteurCm: settings.hauteur_fixe_cm,
          dessousCarrelee: settings.dessous_carrelee,
        },
        tiers,
        surcharges,
        settings
      );
      return { config: item.config, resultat: res, quantite: item.quantite };
    });

    const montantHT = lignes.reduce((s, l) => s + l.resultat.prixHT * l.quantite, 0);
    const montantTTC = lignes.reduce((s, l) => s + l.resultat.prixTTC * l.quantite, 0);

    let promoId: string | null = null;
    let promoRemise = 0;
    let livraisonGratuite = false;

    if (promoCode) {
      const { data: promo } = await adminDb
        .from("promotions")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("actif", true)
        .single();

      if (promo) {
        const now = new Date();
        const valid =
          (!promo.date_debut || new Date(promo.date_debut) <= now) &&
          (!promo.date_fin || new Date(promo.date_fin) >= now) &&
          (!promo.seuil_montant || montantTTC >= promo.seuil_montant);

        if (valid) {
          promoId = promo.id;
          if (promo.type === "pourcentage") promoRemise = montantTTC * (promo.valeur / 100);
          else if (promo.type === "montant_fixe") promoRemise = promo.valeur;
          else if (promo.type === "livraison_gratuite") livraisonGratuite = true;
        }
      }
    }

    const fraisLivraison =
      livraisonGratuite ||
      (settings.seuil_livraison_gratuite !== null && montantTTC >= settings.seuil_livraison_gratuite)
        ? 0
        : settings.forfait_livraison;

    const totalFinal = Math.max(0, montantTTC + fraisLivraison - promoRemise);

    const { data: commande, error: cmdErr } = await adminDb
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        montant_ht: Math.round(montantHT * 100) / 100,
        montant_ttc: Math.round(totalFinal * 100) / 100,
        promo_id: promoId,
        promo_remise: Math.round(promoRemise * 100) / 100,
        frais_livraison: fraisLivraison,
        statut: "en_attente_paiement",
      })
      .select("id")
      .single();

    if (cmdErr || !commande) {
      return NextResponse.json({ erreur: "Erreur base de données." }, { status: 500 });
    }

    await adminDb.from("order_items").insert(
      lignes.map((l) => ({
        order_id: commande.id,
        config_json: l.config as unknown as import("@/lib/supabase/types").Json,
        longueur_cm: l.resultat.longueurCm,
        largeur_cm: l.resultat.largeurCm,
        hauteur_cm: l.resultat.hauteurCm,
        surface_m2: l.resultat.surfaceM2,
        nb_carreaux_total: l.resultat.nbCarreauxTotal,
        prix_unitaire: l.resultat.prixTTC,
        quantite: l.quantite,
      }))
    );

    if (!stripeDisponible()) {
      await adminDb
        .from("orders")
        .update({ statut: "payee" })
        .eq("id", commande.id);

      return NextResponse.json({ simule: true, orderId: commande.id });
    }

    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: lignes.map((l) => ({
        price_data: {
          currency: "eur",
          unit_amount: Math.round(l.resultat.prixTTC * 100),
          product_data: {
            name: `Meuble KUBE ${Math.round(l.resultat.longueurCm)}×${Math.round(l.resultat.largeurCm)}×${Math.round(l.resultat.hauteurCm)} cm`,
            description: `Carreau ${l.config.tailleCm} cm · ${l.resultat.nbCarreauxTotal} carreaux · ${l.resultat.surfaceM2.toFixed(2)} m²`,
          },
        },
        quantity: l.quantite,
      })),
      ...(fraisLivraison > 0 && {
        shipping_options: [{
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: Math.round(fraisLivraison * 100), currency: "eur" },
            display_name: "Livraison",
          },
        }],
      }),
      metadata: { order_id: commande.id },
      success_url: `${origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier`,
    });

    await adminDb
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", commande.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ erreur: "Erreur serveur." }, { status: 500 });
  }
}
