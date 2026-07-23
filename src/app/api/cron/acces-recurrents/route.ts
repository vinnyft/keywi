import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailAccesRecurrent } from "@/lib/notifications";

/**
 * Tâche planifiée — accès récurrents.
 * Génère les codes des interventions prévues dans les 24 h et les
 * envoie aux prestataires. À appeler une fois par heure.
 *
 * La RPC est idempotente (derniere_occurrence) : deux exécutions
 * rapprochées ne produisent pas deux codes pour la même
 * intervention.
 *
 * Protection : si CRON_SECRET est défini, l'en-tête
 * `Authorization: Bearer <CRON_SECRET>` est exigé.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const entete = request.headers.get("authorization");
    if (entete !== `Bearer ${secret}`) {
      return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("generer_codes_recurrents");
  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const r = (data ?? { ok: false }) as unknown as {
    ok: boolean;
    nb_codes: number;
    envois: Array<{
      beneficiaire_email: string | null;
      beneficiaire_nom: string | null;
      logement: string;
      code_6: string;
      intervention_le: string;
      commerce: string | null;
      adresse: string | null;
    }>;
  };

  let envoyes = 0;
  for (const e of r.envois ?? []) {
    if (!e.beneficiaire_email) continue;
    await emailAccesRecurrent({
      beneficiaireEmail: e.beneficiaire_email,
      beneficiaireNom: e.beneficiaire_nom,
      logement: e.logement,
      code6: e.code_6,
      interventionLe: e.intervention_le,
      dureeHeures: 12,
      commerce: e.commerce,
      adresseCommerce: e.adresse,
    });
    envoyes += 1;
  }

  return NextResponse.json({ ok: true, codes_generes: r.nb_codes, emails: envoyes });
}
