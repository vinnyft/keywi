import "server-only";

import Stripe from "stripe";

/**
 * Client Stripe (mode test).
 * Sans STRIPE_SECRET_KEY, le projet bascule en « paiement simulé » :
 * le flux complet reste testable en local sans compte Stripe.
 */

export const TARIFS = {
  /** Dépôt à l'unité : 7,90 € TTC */
  depotUnitaire: { centimes: 790, libelle: "Dépôt de clés KLAV (à l'unité)" },
  /** Abonnement hôte : 5,49 €/mois (sous KeyNest, ~5,95 £) */
  abonnementHote: { centimes: 549, libelle: "Abonnement hôte KLAV (mensuel)" },
} as const;

export function stripeDisponible(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant : paiement simulé actif.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
