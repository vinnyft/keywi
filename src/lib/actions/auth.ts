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

type EtatReinit = { erreur: string | null; envoye: boolean };

/**
 * Demande de réinitialisation : envoie un lien de récupération.
 * La réponse est volontairement identique que l'adresse existe ou
 * non — sinon le formulaire permettrait d'énumérer les comptes.
 */
export async function actionMotDePasseOublie(
  _etat: EtatReinit,
  formData: FormData
): Promise<EtatReinit> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erreur: "Renseignez votre email.", envoye: false };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE}/api/auth/callback?type=recovery`,
  });

  return { erreur: null, envoye: true };
}

type EtatNouveauMdp = { erreur: string | null };

/**
 * Définit le nouveau mot de passe. La session ouverte par le lien
 * de récupération fait office d'autorisation.
 */
export async function actionNouveauMotDePasse(
  _etat: EtatNouveauMdp,
  formData: FormData
): Promise<EtatNouveauMdp> {
  const mdp = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (mdp.length < 8) {
    return { erreur: "Le mot de passe doit faire au moins 8 caractères." };
  }
  if (mdp !== confirmation) {
    return { erreur: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erreur: "Lien expiré. Redemandez un email de réinitialisation." };
  }

  const { error } = await supabase.auth.updateUser({ password: mdp });
  if (error) {
    // Supabase refuse notamment un mot de passe identique au précédent :
    // le dire explicitement évite à l'utilisateur de tourner en rond
    const identique =
      error.message.includes("should be different") ||
      error.code === "same_password";
    return {
      erreur: identique
        ? "Ce mot de passe est identique à l'ancien. Choisissez-en un autre."
        : "Mise à jour impossible. Le lien a peut-être expiré — redemandez un email.",
    };
  }

  redirect("/espace");
}
