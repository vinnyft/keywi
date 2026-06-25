"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emailReponseCandidature } from "@/lib/notifications";

/**
 * Actions de la page d'administration.
 * La RLS garantit déjà que seul un profil admin peut modifier les
 * candidatures ; on revérifie le rôle par sécurité en profondeur.
 */

async function verifierAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profil?.role === "admin" ? supabase : null;
}

/** Valide ou refuse une candidature commerçant, puis répond par email */
export async function actionTraiterCandidature(formData: FormData) {
  const supabase = await verifierAdmin();
  if (!supabase) return;

  const id = String(formData.get("candidature_id") ?? "");
  const decision = formData.get("decision") === "valider" ? "validee" : "refusee";

  const { data: candidature } = await supabase
    .from("candidatures_commercants")
    .update({ statut: decision })
    .eq("id", id)
    .select("email, nom_contact, nom_commerce")
    .single();

  // Réponse automatique au commerçant, aux couleurs Keywi
  if (candidature) {
    await emailReponseCandidature({
      email: candidature.email,
      nomContact: candidature.nom_contact,
      nomCommerce: candidature.nom_commerce,
      decision,
    });
  }

  revalidatePath("/admin");
}
