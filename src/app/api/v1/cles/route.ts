import { authentifierRequete, nonAutorise } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * API publique — GET /api/v1/cles
 * Liste les clés de l'hôte porteur de la clé API, avec leur
 * statut, leur emplacement et leur échéance de retour.
 */
export async function GET(request: Request) {
  const ctx = await authentifierRequete(request);
  if (!ctx) return nonAutorise();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("keys")
    .select(
      "id, logement, code_badge_imprime, statut, paiement_statut, date_retour_attendue, created_at, relay_points(nom, adresse, code_postal, ville, type), slots(numero)"
    )
    .eq("hote_id", ctx.hoteId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ erreur: error.message }, { status: 500 });
  }

  const cles = (data ?? []).map((k) => ({
    id: k.id,
    logement: k.logement,
    badge: k.code_badge_imprime,
    statut: k.statut,
    paiement: k.paiement_statut,
    date_retour_attendue: k.date_retour_attendue,
    creee_le: k.created_at,
    lieu: k.relay_points
      ? {
          nom: k.relay_points.nom,
          type: k.relay_points.type,
          adresse: `${k.relay_points.adresse}, ${k.relay_points.code_postal} ${k.relay_points.ville}`,
        }
      : null,
    case_numero: k.slots?.numero ?? null,
  }));

  return Response.json({ donnees: cles, total: cles.length });
}
