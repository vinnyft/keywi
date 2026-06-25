import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeDisponible } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!stripeDisponible()) {
    return NextResponse.json({ erreur: "Stripe non configuré." }, { status: 400 });
  }

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ erreur: "Webhook non configuré." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature invalide:", err);
    return NextResponse.json({ erreur: "Signature invalide." }, { status: 400 });
  }

  const adminDb = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      const { error } = await adminDb
        .from("orders")
        .update({ statut: "payee", stripe_session_id: session.id })
        .eq("id", orderId);

      if (error) console.error("Erreur mise à jour commande:", error);
    }
  }

  return NextResponse.json({ recu: true });
}
