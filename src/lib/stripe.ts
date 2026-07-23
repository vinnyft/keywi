import "server-only";

import Stripe from "stripe";

/**
 * Client Stripe (mode test).
 * Sans STRIPE_SECRET_KEY, le projet bascule en « paiement simulé » :
 * le flux complet reste testable en local sans compte Stripe.
 */

export const TARIFS = {
  /** Dépôt à l'unité : 7,90 € TTC */
  depotUnitaire: { centimes: 790, libelle: "Dépôt de clés Keywi (à l'unité)" },
  /**
   * Abonnement hôte : 5,49 €/mois par trousseau.
   * Calibré sur le coût réel du réseau : un cycle dépôt + retrait
   * rémunère le commerçant jusqu'à 2,40 € (voir remuneration_paliers),
   * le reste couvre le badge NFC, le support et la marge.
   */
  abonnementHote: { centimes: 549, libelle: "Abonnement hôte Keywi (mensuel)" },
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
