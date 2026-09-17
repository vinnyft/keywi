import "server-only";

import Stripe from "stripe";

/**
 * Client Stripe.
 *
 * Sans STRIPE_SECRET_KEY, le projet bascule en « paiement simulé » :
 * le flux complet reste testable en local sans compte Stripe. Ce
 * repli valide les paiements d'office — il n'a donc rien à faire en
 * production, où une clé manquante est une panne et non un mode de
 * fonctionnement. `modePaiement()` est le seul point de décision.
 */

export const TARIFS = {
  /** Dépôt à l'unité : 7,90 € TTC */
  depotUnitaire: { centimes: 790, libelle: "Dépôt de clés KeyWe (à l'unité)" },
  /**
   * Abonnement hôte : 5,49 €/mois par trousseau.
   * Calibré sur le coût réel du réseau : un cycle dépôt + retrait
   * rémunère le commerçant jusqu'à 2,40 € (voir remuneration_paliers),
   * le reste couvre le badge NFC, le support et la marge.
   */
  abonnementHote: { centimes: 549, libelle: "Abonnement hôte KeyWe (mensuel)" },
} as const;

export function stripeDisponible(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** `stripe` : encaissement réel · `simule` : validé d'office (dev seul) */
export type ModePaiement = "stripe" | "simule";

/**
 * Mode de paiement actif, ou `null` si aucun n'est utilisable —
 * c'est-à-dire en production sans clé Stripe. L'appelant doit alors
 * refuser la commande plutôt que de la valider dans le vide.
 */
export function modePaiement(): ModePaiement | null {
  if (process.env.STRIPE_SECRET_KEY) return "stripe";
  return process.env.NODE_ENV === "production" ? null : "simule";
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant : paiement simulé actif.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}
