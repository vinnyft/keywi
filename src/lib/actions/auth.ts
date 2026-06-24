"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Actions d'authentification (Supabase Auth).
 * Compatibles `useActionState` : (etatPrecedent, formData) → etat.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type EtatConnexion = { erreur: string | null };
type EtatLien = { erreur: string | null; envoye: boolean };

/** Connexion par email + mot de passe */
export async function actionConnexion(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const suivant = String(formData.get("suivant") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    return { erreur: "Email ou mot de passe incorrect." };
  }

  redirect(suivant && suivant.startsWith("/") ? suivant : "/espace");
}

/** Envoi d'un lien magique (OTP par email) */
export async function actionLienMagique(
  _etat: EtatLien,
  formData: FormData
): Promise<EtatLien> {
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE}/api/auth/callback` },
  });

  if (error) {
    return { erreur: "Impossible d'envoyer le lien. Réessayez.", envoye: false };
  }
  return { erreur: null, envoye: true };
}

/** Création de compte (hôte ou voyageur) */
export async function actionInscription(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const role = formData.get("role") === "voyageur" ? "voyageur" : "hote";

  if (motDePasse.length < 8) {
    return { erreur: "Le mot de passe doit faire au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: {
      data: { nom, role },
      emailRedirectTo: `${SITE}/api/auth/callback`,
    },
  });

  if (error) {
    return {
      erreur:
        error.message.includes("already")
          ? "Un compte existe déjà avec cet email."
          : "Inscription impossible. Vérifiez vos informations.",
    };
  }

  redirect("/espace");
}

/** Déconnexion (action de formulaire) */
export async function actionDeconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
