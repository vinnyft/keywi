"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MOT_DE_CONFIRMATION,
  MOT_DE_CONFIRMATION_EN,
  MOTS_DE_CONFIRMATION,
} from "@/lib/suppression-compte";

/**
 * Suppression de compte (RGPD art. 17) — en autonomie, depuis
 * l'espace client, sans passer par une demande par email.
 *
 * La suppression est une ANONYMISATION : voir la migration
 * 0011_suppression_compte.sql pour le détail de ce qui est effacé
 * et de ce qui survit (journal des mouvements, écritures de
 * paiement), et pourquoi un `delete` est impossible ici.
 *
 * Deux temps :
 *   1. la RPC `supprimer_mon_compte` vide le schéma public de
 *      toute donnée personnelle, en une transaction ;
 *   2. le service role neutralise `auth.users` — l'email devient
 *      non routable et le compte est banni, ce qui referme
 *      définitivement la connexion et les liens magiques.
 */

/**
 * Mot à recopier pour confirmer — une case à cocher ne suffit pas
 * pour un geste irréversible. Le libellé partagé avec l'interface
 * vit dans `@/lib/suppression-compte` : un module « use server »
 * ne peut exporter que des fonctions asynchrones.
 */
export type EtatSuppression = { erreur: string | null };

export async function actionSupprimerCompte(
  _etat: EtatSuppression,
  formData: FormData
): Promise<EtatSuppression> {
  const en = String(formData.get("locale") ?? "fr") === "en";
  const confirmation = String(formData.get("confirmation") ?? "")
    .trim()
    .toUpperCase();

  if (!MOTS_DE_CONFIRMATION.includes(confirmation)) {
    const mot = en ? MOT_DE_CONFIRMATION_EN : MOT_DE_CONFIRMATION;
    return {
      erreur: en
        ? `Type “${mot}” to confirm the deletion.`
        : `Recopiez « ${mot} » pour confirmer la suppression.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      erreur: en ? "Session expired. Please log in again." : "Session expirée. Reconnectez-vous.",
    };
  }

  // 1. Anonymisation du schéma applicatif
  const { data, error } = await supabase.rpc("supprimer_mon_compte");
  const r = (data ?? { ok: false }) as unknown as {
    ok: boolean;
    message?: string;
  };

  if (error || !r.ok) {
    return {
      erreur:
        r.message ??
        (en
          ? "Deletion failed. Try again, or write to us at bonjour@keywe.fr."
          : "La suppression a échoué. Réessayez, ou écrivez-nous à bonjour@keywe.fr."),
    };
  }

  // 2. Neutralisation de l'identifiant de connexion.
  //    `.invalid` est un TLD réservé (RFC 2606) : plus aucun email
  //    ne peut atteindre cette adresse, et elle ne peut pas entrer
  //    en collision avec une future inscription.
  const admin = createAdminClient();

  // Les métadonnées sont FUSIONNÉES par GoTrue : un objet vide ne
  // les efface pas. Il faut nommer chaque clé et la mettre à null —
  // sans quoi le nom et l'email d'origine survivent à la suppression.
  const { data: avant } = await admin.auth.admin.getUserById(user.id);
  const metadonneesVidees = Object.fromEntries(
    Object.keys(avant?.user?.user_metadata ?? {}).map((cle) => [cle, null])
  );

  const { error: errAuth } = await admin.auth.admin.updateUserById(user.id, {
    email: `supprime-${user.id}@comptes-supprimes.keywi.invalid`,
    email_confirm: true,
    user_metadata: metadonneesVidees,
    // 100 ans : le compte ne peut plus servir à se connecter
    ban_duration: "876000h",
  });

  if (errAuth) {
    // Les données personnelles sont déjà effacées ; il ne reste que
    // l'identifiant de connexion. On le signale plutôt que de faire
    // croire à un échec complet.
    console.error("Neutralisation auth.users incomplète :", errAuth);
  }

  // 3. Ce que l'API d'administration ne couvre pas : `identity_data`,
  //    où GoTrue recopie le nom donné à l'inscription. Appelé après
  //    la réécriture de l'email, pour repartir de la valeur neutre.
  const { error: errIdentite } = await admin.rpc(
    "finaliser_suppression_auth",
    { p_user_id: user.id }
  );
  if (errIdentite) {
    console.error("Purge de auth.identities incomplète :", errIdentite);
  }

  await supabase.auth.signOut();
  redirect(en ? "/en/compte-supprime" : "/compte-supprime");
}
