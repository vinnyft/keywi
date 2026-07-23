"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genererCle } from "@/lib/api-auth";

/**
 * Gestion des clés API de l'hôte.
 * La valeur en clair n'est renvoyée qu'une seule fois, à la
 * création : seul son hachage est conservé en base.
 */

type EtatCle = { erreur: string | null; cle: string | null };

export async function actionCreerCleApi(
  _etat: EtatCle,
  formData: FormData
): Promise<EtatCle> {
  const nom = String(formData.get("nom") ?? "").trim() || "Clé sans nom";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée.", cle: null };

  const { cle, hash, prefixe } = genererCle();

  const { error } = await supabase.from("api_keys").insert({
    hote_id: user.id,
    nom,
    prefixe,
    cle_hash: hash,
  });

  if (error) {
    return { erreur: "Création impossible. Réessayez.", cle: null };
  }

  revalidatePath("/espace/api");
  return { erreur: null, cle };
}

/** Révoque une clé API (elle cesse immédiatement de fonctionner) */
export async function actionRevoquerCleApi(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  await supabase
    .from("api_keys")
    .update({ revoquee_le: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/espace/api");
}
