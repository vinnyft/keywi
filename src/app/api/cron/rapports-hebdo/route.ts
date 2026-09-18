import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  emailRapportAdmin,
  emailRapportCommercial,
  emailRapportRelais,
  emailRapportHote,
  type LigneCleHote,
} from "@/lib/notifications";
import { verifierCron } from "@/lib/cron-auth";

/**
 * Rapports hebdomadaires, envoyés le lundi (cron Vercel).
 * Quatre destinataires distincts, chacun avec ses agrégats :
 *   - admin      → indicateurs globaux (rapport_admin_hebdo)
 *   - commercial → pipeline de prospection (rapport_commercial_hebdo_tous)
 *   - relais     → activité + rémunération (rapport_relais_hebdo_tous)
 *   - hôte       → état de ses clés « en cours » (rapport_hote_hebdo_tous)
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

  // 4. Un récap par hôte (regroupe ses clés « en cours »)
  const { data: lignesHote } = await admin.rpc("rapport_hote_hebdo_tous");
  const parHote = new Map<
    string,
    { nom: string | null; cles: LigneCleHote[] }
  >();
  for (const l of lignesHote ?? []) {
    if (!l.hote_email) continue;
    const entree = parHote.get(l.hote_email) ?? { nom: l.hote_nom, cles: [] };
    entree.cles.push({
      logement: l.logement,
      statut: l.statut,
      relaisNom: l.relais_nom,
      relaisVille: l.relais_ville,
      derniereAction: l.derniere_action,
      derniereActionLe: l.derniere_action_le,
      enRetard: l.en_retard,
    });
    parHote.set(l.hote_email, entree);
  }
  for (const [email, { nom, cles }] of parHote) {
    await emailRapportHote({ email, hoteNom: nom, cles });
  }

  return NextResponse.json({
    ok: true,
    admin_envoye: Boolean(kpis),
    commerciaux: listeCommerciaux.length,
    relais: listeRelais.length,
    hotes: parHote.size,
  });
}
