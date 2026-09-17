"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estLocale, localise, LOCALE_DEFAUT, type Locale } from "@/lib/i18n";
import type { Database } from "@/lib/supabase/types";

/**
 * Actions du CRM commercial (prospection des points relais).
 * La RLS Postgres est la source de vérité (un commercial ne touche
 * que ses prospects) ; on revérifie le rôle en profondeur ici.
 */

type StatutProspect = Database["public"]["Enums"]["statut_prospect"];
type TypeActivite = Database["public"]["Enums"]["type_activite"];

const STATUTS: readonly StatutProspect[] = [
  "a_contacter",
  "contacte",
  "rdv",
  "signe",
  "actif",
  "perdu",
];
const TYPES: readonly TypeActivite[] = [
  "note",
  "appel",
  "visite",
  "email",
  "relance",
];

/** Valeur de formulaire nettoyée, ou null si vide. */
function texte(formData: FormData, cle: string): string | null {
  const v = String(formData.get(cle) ?? "").trim();
  return v === "" ? null : v;
}

/** Contexte authentifié réservé aux rôles commercial/admin. */
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
  const role = profil?.role;
  if (role !== "commercial" && role !== "admin") return null;
  return { supabase, user, role };
}

/** Crée un prospect (point relais à démarcher). */
export async function actionCreerProspect(formData: FormData) {
  const ctx = await contexte();
  if (!ctx) return;

  const nom = texte(formData, "nom_commerce");
  if (!nom) return;

  const arr = Number(formData.get("arrondissement"));
  const arrondissement =
    Number.isInteger(arr) && arr >= 1 && arr <= 20 ? arr : null;

  // Un commercial ne peut créer que pour lui-même (RLS). L'admin peut
  // assigner à un commercial via le champ `commercial_id`.
  const assigne = texte(formData, "commercial_id");
  const commercialId =
    ctx.role === "admin" && assigne ? assigne : ctx.user.id;

  await ctx.supabase.from("prospects").insert({
    nom_commerce: nom,
    adresse: texte(formData, "adresse"),
    code_postal: texte(formData, "code_postal"),
    arrondissement,
    contact_nom: texte(formData, "contact_nom"),
    contact_email: texte(formData, "contact_email"),
    contact_tel: texte(formData, "contact_tel"),
    source: texte(formData, "source"),
    notes: texte(formData, "notes"),
    commercial_id: commercialId,
  });

  revalidatePath("/commercial");
  const brut = String(formData.get("locale") ?? "");
  const locale: Locale = estLocale(brut) ? brut : LOCALE_DEFAUT;
  redirect(localise("/commercial", locale));
}

/** Fait avancer un prospect dans le pipeline. */
export async function actionMajStatutProspect(formData: FormData) {
  const ctx = await contexte();
  if (!ctx) return;

  const id = texte(formData, "prospect_id");
  const statut = String(formData.get("statut") ?? "") as StatutProspect;
  if (!id || !STATUTS.includes(statut)) return;

  await ctx.supabase.from("prospects").update({ statut }).eq("id", id);

  revalidatePath("/commercial");
  revalidatePath(`/commercial/prospect/${id}`);
}

/** Journalise une activité (appel, visite, note…) sur un prospect. */
export async function actionAjouterActivite(formData: FormData) {
  const ctx = await contexte();
  if (!ctx) return;

  const prospectId = texte(formData, "prospect_id");
  const contenu = texte(formData, "contenu");
  const type = String(formData.get("type") ?? "note") as TypeActivite;
  if (!prospectId || !contenu) return;

  await ctx.supabase.from("prospect_activites").insert({
    prospect_id: prospectId,
    type: TYPES.includes(type) ? type : "note",
    contenu,
    auteur_id: ctx.user.id,
  });

  revalidatePath(`/commercial/prospect/${prospectId}`);
}

/**
 * Définit / met à jour l'objectif mensuel d'un commercial.
 * Réservé à l'admin (la RLS des objectifs n'autorise l'écriture qu'à
 * l'admin) ; le champ `mois` est au format « AAAA-MM ».
 */
export async function actionDefinirObjectif(formData: FormData) {
  const ctx = await contexte();
  if (!ctx || ctx.role !== "admin") return;

  const commercialId = texte(formData, "commercial_id");
  const moisBrut = texte(formData, "mois");
  if (!commercialId || !moisBrut) return;
  const mois = /^\d{4}-\d{2}$/.test(moisBrut) ? `${moisBrut}-01` : null;
  if (!mois) return;

  const cibleSignes = Math.max(0, Number(formData.get("cible_signes")) || 0);
  const cibleContacts = Math.max(0, Number(formData.get("cible_contacts")) || 0);

  await ctx.supabase.from("objectifs_commerciaux").upsert(
    {
      commercial_id: commercialId,
      mois,
      cible_signes: cibleSignes,
      cible_contacts: cibleContacts,
    },
    { onConflict: "commercial_id,mois" }
  );

  revalidatePath("/admin");
  revalidatePath("/commercial");
}
