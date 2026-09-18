import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailCleSouffrance } from "@/lib/notifications";
import { verifierCron } from "@/lib/cron-auth";

/**
 * Clés en souffrance : repère les clés qui occupent une case depuis
 * plus de 30 jours sans être récupérées et prévient le relais +
 * l'admin. Idempotent côté base (drapeau souffrance_alertee_le,
 * relance hebdomadaire).
 *
 *   GET /api/cron/cles-souffrance
 * Protégé par CRON_SECRET : Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const refus = verifierCron(request);
  if (refus) return refus;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("verifier_cles_souffrance");
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const cles = data ?? [];
  for (const c of cles) {
    await emailCleSouffrance({
      logement: c.logement,
      relaisNom: c.relais_nom,
      adresse: c.adresse,
      ville: c.ville,
      jours: Number(c.jours),
      ownerEmail: c.owner_email,
    });
  }

  return NextResponse.json({ ok: true, cles_signalees: cles.length });
}
