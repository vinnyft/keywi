import "server-only";
import Stripe from "stripe";

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function stripeDisponible(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
