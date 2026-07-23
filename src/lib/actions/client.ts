"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  emailCodeRetrait,
  emailDepotEffectue,
  emailRetourEffectue,
  emailClesDisponibles,
} from "@/lib/notifications";
import { TARIFS, getStripe, stripeDisponible } from "@/lib/stripe";

/**
 * Actions de l'espace client (hôte / voyageur) et candidature
 * publique « Devenir point relais ».
 */

type EtatCode = { erreur: string | null; code: string | null };
type EtatCandidature = { erreur: string | null; envoye: boolean };

/** Génère un code de retrait pour une clé et l'envoie au bénéficiaire */
export async function actionCreerCode(
  _etat: EtatCode,
  formData: FormData
): Promise<EtatCode> {
  const keyId = String(formData.get("key_id") ?? "");
  const nom = (String(formData.get("beneficiaire_nom") ?? "").trim() || null) as
    | string
    | null;
  const email = (String(formData.get("beneficiaire_email") ?? "").trim() ||
    null) as string | null;
  const jours = Number(formData.get("validite_jours") ?? "0");
  const expireAt =
    jours > 0 ? new Date(Date.now() + jours * 86_400_000).toISOString() : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("creer_code_retrait", {
    p_key_id: keyId,
    p_beneficiaire_email: email ?? undefined,
    p_beneficiaire_nom: nom ?? undefined,
    p_expire_at: expireAt ?? undefined,
  });

  const r = (data ?? null) as { ok?: boolean; code_6?: string } | null;
  if (error || !r?.ok) {
    return { erreur: "Impossible de générer le code. Réessayez.", code: null };
  }

  // Envoi du code par email au bénéficiaire (si renseigné)
  if (email) {
    const { data: cle } = await supabase
      .from("keys")
      .select("logement, relay_points(nom, adresse, code_postal, ville)")
      .eq("id", keyId)
      .single();

    const relais = (cle?.relay_points ?? null) as {
      nom: string;
      adresse: string;
      code_postal: string;
      ville: string;
    } | null;

    await emailCodeRetrait({
      beneficiaireEmail: email,
      beneficiaireNom: nom,
      logement: cle?.logement ?? "votre logement",
      code6: r.code_6 ?? "",
      commerce: relais?.nom ?? null,
      adresseCommerce: relais
        ? `${relais.adresse}, ${relais.code_postal} ${relais.ville}`
        : null,
      cleEnDepot: Boolean((data as { cle_en_depot?: boolean }).cle_en_depot),
    });
  }

  revalidatePath(`/espace/cles/${keyId}`);
  return { erreur: null, code: r.code_6 ?? null };
}

/** Révoque un code de retrait (action de formulaire) */
export async function actionRevoquerCode(formData: FormData) {
  const id = String(formData.get("access_code_id") ?? "");
  const keyId = String(formData.get("key_id") ?? "");

  const supabase = await createClient();
  await supabase.rpc("revoquer_code", { p_access_code_id: id });

  revalidatePath(`/espace/cles/${keyId}`);
}

/**
 * Fixe (ou efface) la date de retour attendue d'une clé.
 * Changer l'échéance réarme la relance (retard_notifie repasse à false).
 */
export async function actionDefinirEcheance(formData: FormData) {
  const keyId = String(formData.get("key_id") ?? "");
  const brut = String(formData.get("date_retour_attendue") ?? "").trim();
  // <input type="date"> → fin de journée locale, pour ne pas être
  // « en retard » dès le matin du jour choisi
  const echeance = brut ? new Date(`${brut}T23:59:59`).toISOString() : null;

  const supabase = await createClient();
  await supabase
    .from("keys")
    .update({ date_retour_attendue: echeance, retard_notifie: false })
    .eq("id", keyId);

  revalidatePath(`/espace/cles/${keyId}`);
  revalidatePath("/espace/keyhost");
}

/** Marque une notification comme lue */
export async function actionMarquerLue(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ lu: true }).eq("id", id);
  revalidatePath("/espace/notifications");
}

/** Candidature publique « Devenir point relais » */
export async function actionCandidature(
  _etat: EtatCandidature,
  formData: FormData
): Promise<EtatCandidature> {
  const champs = {
    nom_commerce: String(formData.get("nom_commerce") ?? "").trim(),
    nom_contact: String(formData.get("nom_contact") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    telephone: String(formData.get("telephone") ?? "").trim() || null,
    adresse: String(formData.get("adresse") ?? "").trim(),
    code_postal: String(formData.get("code_postal") ?? "").trim(),
    ville: String(formData.get("ville") ?? "").trim() || "Paris",
    message: String(formData.get("message") ?? "").trim() || null,
  };

  if (!champs.nom_commerce || !champs.nom_contact || !champs.email) {
    return { erreur: "Merci de renseigner les champs obligatoires.", envoye: false };
  }

  // Insertion via service role : le formulaire est public (anon)
  const admin = createAdminClient();
  const { error } = await admin.from("candidatures_commercants").insert(champs);

  if (error) {
    return { erreur: "Envoi impossible pour le moment. Réessayez.", envoye: false };
  }
  return { erreur: null, envoye: true };
}

type ResultatDepot = {
  ok: boolean;
  erreur?: string;
  url?: string;
  keyId?: string;
  badge?: string;
  simule?: boolean;
};

/**
 * Dépôt d'une clé par l'hôte : enregistre la clé (badge généré),
 * crée le paiement, puis bascule sur Stripe Checkout ou — sans
 * clé Stripe en local — sur un « paiement simulé » validé d'office.
 */
export async function actionDeposerCle(input: {
  relayPointId: string;
  logement: string;
}): Promise<ResultatDepot> {
  const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const logement = input.logement.trim();
  if (!logement || !input.relayPointId) {
    return { ok: false, erreur: "Choisissez un point relais et nommez le logement." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée, reconnectez-vous." };

  // Badge imprimé unique (RPC dédiée)
  const { data: badge, error: errBadge } = await supabase.rpc("generer_code_badge");
  if (errBadge || !badge) {
    return { ok: false, erreur: "Impossible de générer le badge. Réessayez." };
  }

  // Enregistrement de la clé (RLS : hote_id = auth.uid())
  const { data: cle, error: errCle } = await supabase
    .from("keys")
    .insert({
      hote_id: user.id,
      relay_point_id: input.relayPointId,
      logement,
      code_badge_imprime: badge as string,
    })
    .select("id")
    .single();
  if (errCle || !cle) {
    return { ok: false, erreur: "Enregistrement de la clé impossible." };
  }

  // Les paiements sont réservés au service role (RLS sans policy d'écriture)
  const admin = createAdminClient();
  const montant = TARIFS.depotUnitaire.centimes;

  if (stripeDisponible()) {
    const { data: paiement } = await admin
      .from("paiements")
      .insert({
        hote_id: user.id,
        key_id: cle.id,
        type: "depot_unitaire",
        montant_centimes: montant,
      })
      .select("id")
      .single();

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: montant,
            product_data: { name: TARIFS.depotUnitaire.libelle },
          },
        },
      ],
      success_url: `${SITE}/espace/cles/${cle.id}?paiement=succes`,
      cancel_url: `${SITE}/espace/cles/${cle.id}?paiement=annule`,
      metadata: { key_id: cle.id },
    });

    if (paiement) {
      await admin
        .from("paiements")
        .update({ stripe_session_id: session.id })
        .eq("id", paiement.id);
    }

    return { ok: true, url: session.url ?? undefined };
  }

  // Paiement simulé (local sans Stripe) : validé immédiatement
  await admin.from("paiements").insert({
    hote_id: user.id,
    key_id: cle.id,
    type: "depot_unitaire",
    montant_centimes: montant,
    statut: "paye",
  });
  await admin.from("keys").update({ paiement_statut: "paye" }).eq("id", cle.id);

  return { ok: true, simule: true, keyId: cle.id, badge: badge as string };
}

type ResultatCasier = { ok: boolean; [cle: string]: unknown };

function txt(valeur: unknown): string {
  return valeur == null ? "" : String(valeur);
}

/**
 * Dépôt self-service dans un casier connecté : l'hôte, devant le
 * casier, obtient un numéro de case et y range son trousseau.
 * Pas de commerçant — la RPC fait tout en une transaction.
 */
export async function actionCasierDeposer(keyId: string): Promise<ResultatCasier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée." };

  const { data, error } = await supabase.rpc("casier_deposer", { p_key_id: keyId });
  if (error) return { ok: false, message: error.message };

  const r = (data ?? { ok: false }) as unknown as ResultatCasier;

  if (r.ok) {
    // Emails : l'hôte se confirme à lui-même le dépôt, les
    // bénéficiaires apprennent que les clés sont disponibles
    const { data: profil } = await supabase
      .from("profiles")
      .select("email, nom")
      .eq("id", user.id)
      .single();

    const commun = {
      hoteEmail: txt(profil?.email),
      hoteNom: profil?.nom ?? null,
      logement: txt(r.logement),
      commerce: txt(r.casier),
      adresseCommerce: txt(r.adresse_casier),
    };
    if (r.type_operation === "retour") {
      await emailRetourEffectue(commun);
    } else {
      await emailDepotEffectue(commun);
    }

    const beneficiaires = Array.isArray(r.beneficiaires)
      ? (r.beneficiaires as Array<Record<string, unknown>>)
      : [];
    for (const b of beneficiaires) {
      if (b.email) {
        await emailClesDisponibles({
          beneficiaireEmail: txt(b.email),
          beneficiaireNom: (b.nom as string | null) ?? null,
          logement: txt(r.logement),
          commerce: txt(r.casier),
          adresseCommerce: txt(r.adresse_casier),
          code6: txt(b.code_6),
        });
      }
    }
    // Pas de revalidatePath ici : re-rendre la page démonterait
    // l'écran plein écran qui affiche le numéro de case. Le
    // rafraîchissement se fait au clic sur « Terminé ».
  }

  return r;
}
