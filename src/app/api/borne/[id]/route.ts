import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailRetraitEffectue } from "@/lib/notifications";

/**
 * Borne d'un casier connecté : le bénéficiaire tape son code à
 * 6 caractères sur l'écran, la case s'ouvre.
 *
 * La borne est un terminal physique de confiance (pas un visiteur
 * web) : on utilise donc le service role, et la RPC casier_retirer
 * n'est exécutable que par lui.
 *
 * POST /api/borne/<relay_point_id>  { code: "H7KM2P" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { code } = (await request.json().catch(() => ({}))) as { code?: string };

  if (!code || code.trim().length < 6) {
    return NextResponse.json(
      { ok: false, message: "Entrez votre code à 6 caractères." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("casier_retirer", {
    p_relay_point_id: id,
    p_code: code,
  });
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const r = (data ?? { ok: false }) as unknown as {
    ok: boolean;
    message?: string;
    case_numero?: number;
    logement?: string;
    casier?: string;
    beneficiaire?: string;
    hote_email?: string;
    hote_nom?: string | null;
  };

  // L'hôte est prévenu que ses clés ont été récupérées
  if (r.ok && r.hote_email) {
    await emailRetraitEffectue({
      hoteEmail: r.hote_email,
      hoteNom: r.hote_nom ?? null,
      logement: r.logement ?? "",
      commerce: r.casier ?? "",
      beneficiaire: r.beneficiaire ?? "",
    });
  }

  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
