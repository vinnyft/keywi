import { NextResponse } from "next/server";
import { getStripe, stripeDisponible } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Stripe : à la confirmation du paiement
 * (checkout.session.completed), la clé passe en « payée » et le
 * dépôt devient possible au point relais.
 *
 * C'est le seul endroit du code où un tiers non authentifié peut
 * faire basculer un paiement en « payé ». La signature n'y est donc
 * pas optionnelle : sans STRIPE_WEBHOOK_SECRET la route refuse
 * tout, là où le repli précédent (`JSON.parse` du corps) offrait le
 * dépôt gratuit à quiconque savait POSTer un faux événement.
 *
 * En local : stripe listen --forward-to localhost:3000/api/stripe/webhook
 * (la CLI affiche le secret `whsec_…` à recopier dans .env.local)
 */
export async function POST(request: Request) {
  if (!stripeDisponible()) {
    return NextResponse.json(
      { message: "Stripe non configuré (paiement simulé actif)." },
      { status: 501 }
    );
  }

  const secretSignature = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretSignature) {
    console.error(
      "STRIPE_WEBHOOK_SECRET manquant : webhook refusé. Un événement non " +
        "signé n'est pas vérifiable, donc pas exploitable."
    );
    return NextResponse.json(
      { erreur: "Webhook non configuré." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ erreur: "Signature absente" }, { status: 400 });
  }

  const stripe = getStripe();
  const corps = await request.text();

  let evenement;
  try {
    evenement = stripe.webhooks.constructEvent(
      corps,
      signature,
      secretSignature
    );
  } catch {
    return NextResponse.json({ erreur: "Signature invalide" }, { status: 400 });
  }

  if (evenement.type === "checkout.session.completed") {
    const session = evenement.data.object;

    // « completed » ne veut pas dire « encaissé » : les moyens de
    // paiement asynchrones (virement, prélèvement) restent `unpaid`
    // un moment, et peuvent finir en échec.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ recu: true, ignore: "paiement_en_attente" });
    }

    const admin = createAdminClient();

    const { data: paiement } = await admin
      .from("paiements")
      .update({ statut: "paye" })
      .eq("stripe_session_id", session.id)
      .select("key_id")
      .maybeSingle();

    // La clé est marquée payée d'après le paiement retrouvé en base,
    // pas d'après les métadonnées de la session : c'est notre
    // enregistrement qui fait foi sur le rattachement.
    if (paiement?.key_id) {
      await admin
        .from("keys")
        .update({ paiement_statut: "paye" })
        .eq("id", paiement.key_id);
    }
  }

  return NextResponse.json({ recu: true });
}
