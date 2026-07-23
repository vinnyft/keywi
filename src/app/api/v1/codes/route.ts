import { authentifierRequete, nonAutorise, erreurApi } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailCodeRetrait } from "@/lib/notifications";

/**
 * API publique — POST /api/v1/codes
 * Crée un code de retrait pour une clé. C'est l'endpoint clé pour
 * automatiser un check-in (réservation Airbnb, PMS hôtelier…).
 *
 * Corps JSON :
 *   { "key_id": "...", "beneficiaire_nom": "Léa",
 *     "beneficiaire_email": "lea@ex.fr", "validite_jours": 7 }
 */
export async function POST(request: Request) {
  const ctx = await authentifierRequete(request);
  if (!ctx) return nonAutorise();

  const corps = (await request.json().catch(() => null)) as {
    key_id?: string;
    beneficiaire_nom?: string;
    beneficiaire_email?: string;
    validite_jours?: number;
  } | null;

  if (!corps?.key_id) {
    return erreurApi("Champ « key_id » requis.", 400);
  }

  const admin = createAdminClient();

  // La clé doit appartenir au porteur de la clé API
  const { data: cle } = await admin
    .from("keys")
    .select("id, logement, statut, relay_points(nom, adresse, code_postal, ville)")
    .eq("id", corps.key_id)
    .eq("hote_id", ctx.hoteId)
    .maybeSingle();

  if (!cle) {
    return erreurApi("Clé introuvable ou non rattachée à votre compte.", 404);
  }

  const jours = Number(corps.validite_jours ?? 0);
  const expireAt =
    jours > 0 ? new Date(Date.now() + jours * 86_400_000).toISOString() : null;

  // Variante API : l'hôte est passé explicitement (auth.uid() est
  // nul côté service role), après validation de la clé API
  const { data, error } = await admin.rpc("api_creer_code_retrait", {
    p_key_id: corps.key_id,
    p_hote_id: ctx.hoteId,
    p_beneficiaire_email: corps.beneficiaire_email ?? undefined,
    p_beneficiaire_nom: corps.beneficiaire_nom ?? undefined,
    p_expire_at: expireAt ?? undefined,
  });

  const r = (data ?? null) as {
    ok?: boolean;
    code_6?: string;
    qr_payload?: string;
    access_code_id?: string;
    cle_en_depot?: boolean;
  } | null;

  if (error || !r?.ok) {
    return erreurApi("Création du code impossible.", 400);
  }

  // Même email que depuis l'interface, si un destinataire est fourni
  if (corps.beneficiaire_email) {
    const relais = cle.relay_points;
    await emailCodeRetrait({
      beneficiaireEmail: corps.beneficiaire_email,
      beneficiaireNom: corps.beneficiaire_nom ?? null,
      logement: cle.logement,
      code6: r.code_6 ?? "",
      commerce: relais?.nom ?? null,
      adresseCommerce: relais
        ? `${relais.adresse}, ${relais.code_postal} ${relais.ville}`
        : null,
      cleEnDepot: Boolean(r.cle_en_depot),
    });
  }

  return Response.json(
    {
      id: r.access_code_id,
      code: r.code_6,
      qr_payload: r.qr_payload,
      expire_le: expireAt,
      cle_en_depot: r.cle_en_depot,
    },
    { status: 201 }
  );
}
