"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Accès récurrents : l'hôte définit une intervention qui revient
 * (ménage du mardi, jardinier du samedi…). Keywi génère le code
 * avant chaque passage — l'hôte n'a plus rien à faire.
 */

type EtatRecurrent = { erreur: string | null; ok: boolean };

export async function actionCreerRecurrent(
  _etat: EtatRecurrent,
  formData: FormData
): Promise<EtatRecurrent> {
  const keyId = String(formData.get("key_id") ?? "");
  const nom = String(formData.get("beneficiaire_nom") ?? "").trim() || null;
  const email = String(formData.get("beneficiaire_email") ?? "").trim() || null;
  const heure = String(formData.get("heure_debut") ?? "09:00");
  const duree = Number(formData.get("duree_heures") ?? 12);

  // Cases à cocher « jour_0 » … « jour_6 »
  const jours = [0, 1, 2, 3, 4, 5, 6].filter((j) => formData.get(`jour_${j}`));

  if (jours.length === 0) {
    return { erreur: "Choisissez au moins un jour.", ok: false };
  }
  if (!email) {
    return { erreur: "L'email du prestataire est requis pour lui envoyer le code.", ok: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("acces_recurrents").insert({
    key_id: keyId,
    beneficiaire_nom: nom,
    beneficiaire_email: email,
    jours_semaine: jours,
    heure_debut: heure,
    duree_heures: duree,
  });

  if (error) {
    return { erreur: "Création impossible. Réessayez.", ok: false };
  }

  revalidatePath(`/espace/cles/${keyId}`);
  return { erreur: null, ok: true };
}

/** Active ou suspend une récurrence sans la supprimer */
export async function actionBasculerRecurrent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const keyId = String(formData.get("key_id") ?? "");
  const actif = formData.get("actif") === "true";

  const supabase = await createClient();
  await supabase.from("acces_recurrents").update({ actif: !actif }).eq("id", id);
  revalidatePath(`/espace/cles/${keyId}`);
}

export async function actionSupprimerRecurrent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const keyId = String(formData.get("key_id") ?? "");

  const supabase = await createClient();
  await supabase.from("acces_recurrents").delete().eq("id", id);
  revalidatePath(`/espace/cles/${keyId}`);
}
