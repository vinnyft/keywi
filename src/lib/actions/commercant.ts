"use server";

import { createClient } from "@/lib/supabase/server";
import {
  emailDepotEffectue,
  emailRetourEffectue,
  emailClesDisponibles,
  emailRetraitEffectue,
} from "@/lib/notifications";

/**
 * Actions de l'application comptoir (commerçant).
 * Fines enveloppes autour des RPC transactionnelles Postgres ;
 * après confirmation, on déclenche les emails Resend (le canal
 * in-app est déjà écrit en base par les RPC).
 */

type Resultat = { ok: boolean; [cle: string]: unknown };

function txt(valeur: unknown): string {
  return valeur == null ? "" : String(valeur);
}

/** DÉPÔT — étape 1 : scan du badge, validation et attribution de case */
export async function actionPreparerDepot(identifiant: string): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preparer_depot", {
    p_badge_uid: identifiant,
  });
  if (error) return { ok: false, message: error.message };
  return (data ?? { ok: false }) as unknown as Resultat;
}

/** DÉPÔT — étape 2 : confirmation, journalisation et notifications */
export async function actionConfirmerDepot(keyId: string): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirmer_depot", {
    p_key_id: keyId,
  });
  if (error) return { ok: false, message: error.message };

  const r = (data ?? { ok: false }) as unknown as Resultat;
  if (r.ok) {
    const commun = {
      hoteEmail: txt(r.hote_email),
      hoteNom: (r.hote_nom as string | null) ?? null,
      logement: txt(r.logement),
      commerce: txt(r.commerce),
      adresseCommerce: txt(r.adresse_commerce),
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
          commerce: txt(r.commerce),
          adresseCommerce: txt(r.adresse_commerce),
          code6: txt(b.code_6),
        });
      }
    }
  }
  return r;
}

/** DÉPÔT — annulation : libère la case réservée */
export async function actionAnnulerDepot(keyId: string): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("annuler_depot", {
    p_key_id: keyId,
  });
  if (error) return { ok: false, message: error.message };
  return (data ?? { ok: false }) as unknown as Resultat;
}

/** RETRAIT — étape 1 : recherche par code à 6 caractères */
export async function actionChercherRetrait(code: string): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("chercher_retrait", {
    p_code: code,
  });
  if (error) return { ok: false, message: error.message };
  return (data ?? { ok: false }) as unknown as Resultat;
}

/** RETRAIT — étape 2 : re-scan croisé du badge, confirmation */
export async function actionConfirmerRetrait(
  code: string,
  badge: string
): Promise<Resultat> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirmer_retrait", {
    p_code: code,
    p_badge_uid: badge,
  });
  if (error) return { ok: false, message: error.message };

  const r = (data ?? { ok: false }) as unknown as Resultat;
  if (r.ok) {
    await emailRetraitEffectue({
      hoteEmail: txt(r.hote_email),
      hoteNom: (r.hote_nom as string | null) ?? null,
      logement: txt(r.logement),
      commerce: txt(r.commerce),
      beneficiaire: txt(r.beneficiaire),
    });
  }
  return r;
}
