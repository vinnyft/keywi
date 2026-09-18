import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailAlerteCapaciteEquipe, emailCapaciteRelais } from "@/lib/notifications";
import { verifierCron } from "@/lib/cron-auth";

/**
 * Alerte de capacité : repère les points relais ayant dépassé 80 %
 * de cases occupées et prévient l'admin + le commercial signataire
 * (pour planifier une nouvelle boîte à clés + badges) ainsi que le
 * relais lui-même. Idempotent côté base (drapeau capacite_alertee_le).
 *
 *   GET /api/cron/capacite-relais
 * Protégé par CRON_SECRET : Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const refus = verifierCron(request);
  if (refus) return refus;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("verifier_capacite_relais");
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const relais = data ?? [];
  for (const r of relais) {
    const commun = {
      relaisNom: r.relais_nom,
      adresse: r.adresse,
      ville: r.ville,
      pourcent: Number(r.pourcent),
      occupees: Number(r.occupees),
      capacite: Number(r.capacite),
    };

    // Équipe : tous les admins + le commercial signataire
    await emailAlerteCapaciteEquipe({
      ...commun,
      commercialNom: r.commercial_nom,
      commercialEmail: r.commercial_email,
    });

    // Le relais lui-même (s'il a un email)
    if (r.owner_email) {
      await emailCapaciteRelais({ ...commun, email: r.owner_email });
    }
  }

  return NextResponse.json({ ok: true, relais_alertes: relais.length });
}
