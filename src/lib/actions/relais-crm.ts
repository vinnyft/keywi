"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Mini-CRM du point relais : le commerçant gère le carnet de ses
 * clients récurrents. La RLS restreint déjà chaque carnet au point
 * relais possédé ; on revérifie le rôle et on rattache l'écriture au
 * point du commerçant connecté.
 */

function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v === "" ? null : v;
}

/** Contexte : commerçant (ou admin) + identifiant de son point relais. */
async function contexte() {
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
  if (profil?.role !== "commercant" && profil?.role !== "admin") return null;
  const { data: point } = await supabase
    .from("relay_points")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  return { supabase, user, pointId: point?.id ?? null };
}

/** Ajoute un client au carnet du point relais. */
export async function actionCreerClientRelais(formData: FormData) {
  const ctx = await contexte();
  if (!ctx || !ctx.pointId) return;

  const nom = texte(formData, "nom");
  if (!nom) return;

  await ctx.supabase.from("relais_clients").insert({
    relay_point_id: ctx.pointId,
    nom,
    contact: texte(formData, "contact"),
    notes: texte(formData, "notes"),
    derniere_visite: texte(formData, "derniere_visite"),
    cree_par: ctx.user.id,
  });

  revalidatePath("/commercant/clients");
}

/** Met à jour une fiche client (la RLS garantit la propriété). */
export async function actionMajClientRelais(formData: FormData) {
  const ctx = await contexte();
  if (!ctx) return;

  const id = texte(formData, "client_id");
  if (!id) return;

  await ctx.supabase
    .from("relais_clients")
    .update({
      nom: texte(formData, "nom") ?? undefined,
      contact: texte(formData, "contact"),
      notes: texte(formData, "notes"),
      derniere_visite: texte(formData, "derniere_visite"),
    })
    .eq("id", id);

  revalidatePath("/commercant/clients");
}

/** Supprime une fiche client. */
export async function actionSupprimerClientRelais(formData: FormData) {
  const ctx = await contexte();
  if (!ctx) return;

  const id = texte(formData, "client_id");
  if (!id) return;

  await ctx.supabase.from("relais_clients").delete().eq("id", id);

  revalidatePath("/commercant/clients");
}
