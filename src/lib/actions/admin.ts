"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocoder } from "@/lib/geocodage";
import {
  emailReponseCandidature,
  emailBienvenueCommercant,
} from "@/lib/notifications";

/**
 * Actions de la page d'administration.
 * La RLS garantit déjà que seul un profil admin peut modifier les
 * candidatures ; on revérifie le rôle par sécurité en profondeur.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Nombre de cases installées par défaut dans un nouveau point relais */
const CASES_PAR_DEFAUT = 20;

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

/**
 * Valide ou refuse une candidature commerçant.
 *
 * En cas de validation, la candidature ne se contente pas de
 * changer de statut : le commerçant est réellement intégré au
 * réseau — compte créé, adresse géocodée, point relais ouvert
 * avec ses cases, et accès envoyés.
 */
export async function actionTraiterCandidature(formData: FormData) {
  const supabase = await verifierAdmin();
  if (!supabase) return;

  const id = String(formData.get("candidature_id") ?? "");
  const decision = formData.get("decision") === "valider" ? "validee" : "refusee";

  const { data: candidature } = await supabase
    .from("candidatures_commercants")
    .update({ statut: decision })
    .eq("id", id)
    .select("email, nom_contact, nom_commerce, adresse, code_postal, ville, telephone")
    .single();

  if (!candidature) {
    revalidatePath("/admin");
    return;
  }

  // Refus : simple réponse courtoise, rien à créer
  if (decision === "refusee") {
    await emailReponseCandidature({
      email: candidature.email,
      nomContact: candidature.nom_contact,
      nomCommerce: candidature.nom_commerce,
      decision,
    });
    revalidatePath("/admin");
    return;
  }

  const admin = createAdminClient();

  // 1. Compte commerçant. Sans mot de passe défini : il le choisira
  //    lui-même via le lien de l'email de bienvenue.
  const { data: creation, error: erreurCompte } = await admin.auth.admin.createUser({
    email: candidature.email,
    email_confirm: true,
    user_metadata: { nom: candidature.nom_contact, role: "commercant" },
  });

  let commercantId = creation?.user?.id;

  // L'adresse peut déjà avoir un compte (candidature d'un hôte
  // existant, ou double candidature) : on le réutilise.
  if (erreurCompte || !commercantId) {
    const { data: profilExistant } = await admin
      .from("profiles")
      .select("id")
      .eq("email", candidature.email)
      .maybeSingle();
    if (!profilExistant) {
      revalidatePath("/admin");
      return;
    }
    commercantId = profilExistant.id;
    await admin.from("profiles").update({ role: "commercant" }).eq("id", commercantId);
  }

  // 2. Coordonnées réelles, pour que le point apparaisse au bon
  //    endroit sur la carte publique
  const { lat, lng } = await geocoder(
    candidature.adresse,
    candidature.code_postal,
    candidature.ville
  );

  // 3. Point relais actif — le trigger generer_cases crée les cases
  const { error: erreurRelais } = await admin.from("relay_points").insert({
    nom: candidature.nom_commerce,
    adresse: candidature.adresse,
    code_postal: candidature.code_postal,
    ville: candidature.ville,
    lat,
    lng,
    capacite: CASES_PAR_DEFAUT,
    owner_id: commercantId,
    statut: "actif",
    type: "commerce",
  });
  if (erreurRelais) {
    revalidatePath("/admin");
    return;
  }

  // 4. Lien de définition du mot de passe, puis email de bienvenue
  const { data: lien } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: candidature.email,
    options: { redirectTo: `${SITE}/api/auth/callback?type=recovery` },
  });

  await emailBienvenueCommercant({
    email: candidature.email,
    nomContact: candidature.nom_contact,
    nomCommerce: candidature.nom_commerce,
    adresse: `${candidature.adresse}, ${candidature.code_postal} ${candidature.ville}`,
    nbCases: CASES_PAR_DEFAUT,
    lienAcces: lien?.properties?.action_link ?? `${SITE}/mot-de-passe-oublie`,
  });

  revalidatePath("/admin");
  revalidatePath("/points-relais");
}
