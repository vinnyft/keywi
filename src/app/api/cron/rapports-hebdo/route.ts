import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  emailRapportAdmin,
  emailRapportCommercial,
  emailRapportRelais,
} from "@/lib/notifications";
import { verifierCron } from "@/lib/cron-auth";

/**
 * Rapports hebdomadaires, envoyés le lundi (cron Vercel).
 * Trois destinataires distincts, chacun avec ses agrégats :
 *   - admin      → indicateurs globaux (rapport_admin_hebdo)
 *   - commercial → pipeline de prospection (rapport_commercial_hebdo_tous)
 *   - relais     → activité + rémunération (rapport_relais_hebdo_tous)
 *
 *   GET /api/cron/rapports-hebdo
 * Protégé par CRON_SECRET : Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: Request) {
  const refus = verifierCron(request);
  if (refus) return refus;

  const admin = createAdminClient();

  // 1. Rapport admin global → tous les comptes admin
  const { data: kpis } = await admin.rpc("rapport_admin_hebdo");
  if (kpis) {
    await emailRapportAdmin(kpis as Parameters<typeof emailRapportAdmin>[0]);
  }

  // 2. Un rapport par commercial
  const { data: commerciaux } = await admin.rpc("rapport_commercial_hebdo_tous");
  const listeCommerciaux = commerciaux ?? [];
  for (const c of listeCommerciaux) {
    if (!c.commercial_email) continue;
    await emailRapportCommercial({
      email: c.commercial_email,
      commercialNom: c.commercial_nom,
      prospectsAjoutes: Number(c.prospects_ajoutes),
      contactes: Number(c.contactes),
      rdv: Number(c.rdv),
      signes: Number(c.signes),
      actifsTotal: Number(c.actifs_total),
      cibleSignes: Number(c.cible_signes),
    });
  }

  // 3. Un rapport par point relais actif
  const { data: relais } = await admin.rpc("rapport_relais_hebdo_tous");
  const listeRelais = relais ?? [];
  for (const r of listeRelais) {
    if (!r.owner_email) continue;
    await emailRapportRelais({
      email: r.owner_email,
      relaisNom: r.relais_nom,
      mouvementsSemaine: Number(r.mouvements_semaine),
      clesEnGestion: Number(r.cles_en_gestion),
      caMoisCentimes: Number(r.ca_mois_centimes),
      nbMouvementsMois: Number(r.nb_mouvements_mois),
    });
  }

  return NextResponse.json({
    ok: true,
    admin_envoye: Boolean(kpis),
    commerciaux: listeCommerciaux.length,
    relais: listeRelais.length,
  });
}
