import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifierCron } from "@/lib/cron-auth";

/**
 * Tâche planifiée — purge des données arrivées à échéance.
 *
 * Applique les durées de conservation annoncées dans la politique
 * de confidentialité (RGPD art. 5.1.e) : voir la RPC
 * `purger_donnees` (migration 0014) pour le détail de ce qui est
 * effacé, minimisé, et de ce qui est délibérément conservé.
 *
 * À appeler une fois par jour. Protégée par CRON_SECRET, obligatoire
 * en production (voir `verifierCron`).
 *
 *   GET /api/cron/purge
 */
export async function GET(request: Request) {
  const refus = verifierCron(request);
  if (refus) return refus;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("purger_donnees");
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? { ok: true });
}
