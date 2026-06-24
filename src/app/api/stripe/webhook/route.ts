import { NextResponse } from "next/server";
import { getStripe, stripeDisponible } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Stripe (mode test) : à la confirmation du paiement
 * (checkout.session.completed), la clé passe en « payée » et le
 * dépôt devient possible au point relais.
 *
 * En local : stripe listen --forward-to localhost:3000/api/stripe/webhook
 */
export async function POST(request: Request) {
  if (!stripeDisponible()) {
    return NextResponse.json(
      { message: "Stripe non configuré (paiement simulé actif)." },
      { status: 501 }
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const corps = await request.text();

  let evenement;
  try {
    evenement = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(
          corps,
          signature!,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      : JSON.parse(corps); // tolérance locale sans secret de signature
  } catch {
    return NextResponse.json({ erreur: "Signature invalide" }, { status: 400 });
  }

  if (evenement.type === "checkout.session.completed") {
    const session = evenement.data.object as {
      id: string;
      metadata?: { key_id?: string };
    };
    const admin = createAdminClient();

    await admin
      .from("paiements")
      .update({ statut: "paye" })
      .eq("stripe_session_id", session.id);

    if (session.metadata?.key_id) {
      await admin
        .from("keys")
        .update({ paiement_statut: "paye" })
        .eq("id", session.metadata.key_id);
    }
  }

  return NextResponse.json({ recu: true });
}
