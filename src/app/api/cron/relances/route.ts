import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailRappelRetour } from "@/lib/notifications";

/**
 * Job de relance des clés en retard (échéance dépassée).
 * La RPC `relancer_retards` marque chaque clé comme notifiée et crée
 * la notification in-app ; cette route envoie ensuite les emails.
 *
 * À appeler périodiquement (cron Vercel, GitHub Action, curl…) :
 *   GET /api/cron/relances
 * En production, protéger avec CRON_SECRET :
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  // Protection optionnelle par secret (activée si CRON_SECRET est défini)
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("relancer_retards");
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const relances = ((data as { relances?: unknown[] })?.relances ?? []) as Array<{
    hote_email: string;
    hote_nom: string | null;
    logement: string;
    echeance: string;
    commerce: string | null;
    adresse_commerce: string | null;
  }>;

  for (const r of relances) {
    await emailRappelRetour({
      hoteEmail: r.hote_email,
      hoteNom: r.hote_nom,
      logement: r.logement,
      echeance: r.echeance,
      commerce: r.commerce,
      adresseCommerce: r.adresse_commerce,
    });
  }

  return NextResponse.json({ ok: true, nb_relances: relances.length });
}
