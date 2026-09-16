"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  delaiLisible,
  reinitialiserLimite,
  verifierLimite,
} from "@/lib/limitation";
import { LOCALE_DEFAUT, estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Actions d'authentification (Supabase Auth).
 * Compatibles `useActionState` : (etatPrecedent, formData) → etat.
 * La langue est transmise par un champ caché `locale` du formulaire :
 * elle localise les messages d'erreur et les redirections.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type EtatConnexion = { erreur: string | null };
type EtatLien = { erreur: string | null; envoye: boolean };

/** Langue lue depuis le champ caché du formulaire. */
function lireLocale(formData: FormData): Locale {
  const v = String(formData.get("locale") ?? "");
  return estLocale(v) ? v : LOCALE_DEFAUT;
}

/** Messages localisés des actions d'authentification. */
function messages(locale: Locale) {
  const en = locale === "en";
  return {
    tropIp: (d: number) =>
      en
        ? `Too many attempts from this device. Try again in ${delaiLisible(d)}.`
        : `Trop de tentatives depuis cet appareil. Réessayez dans ${delaiLisible(d)}.`,
    tropCompte: (d: number) =>
      en
        ? `Too many attempts on this account. Try again in ${delaiLisible(d)}, or use « Forgot? ».`
        : `Trop de tentatives sur ce compte. Réessayez dans ${delaiLisible(d)}, ou passez par « Oublié ? ».`,
    emailNonConfirme: en
      ? "Your email isn't confirmed yet. Click the link sent when you signed up."
      : "Votre email n'est pas encore confirmé. Cliquez sur le lien reçu à l'inscription.",
    identifiants: en ? "Incorrect email or password." : "Email ou mot de passe incorrect.",
    lienImpossible: en
      ? "Couldn't send the link. Try again."
      : "Impossible d'envoyer le lien. Réessayez.",
    mdpCourt: en
      ? "The password must be at least 8 characters."
      : "Le mot de passe doit faire au moins 8 caractères.",
    tropTentatives: (d: number) =>
      en ? `Too many attempts. Try again in ${delaiLisible(d)}.` : `Trop de tentatives. Réessayez dans ${delaiLisible(d)}.`,
    compteExiste: en
      ? "An account already exists with this email."
      : "Un compte existe déjà avec cet email.",
    inscriptionImpossible: en
      ? "Sign-up failed. Please check your details."
      : "Inscription impossible. Vérifiez vos informations.",
    renseignerEmail: en ? "Enter your email." : "Renseignez votre email.",
    lienDejaDemande: (d: number) =>
      en
        ? `A link was requested recently. Check your inbox, or try again in ${delaiLisible(d)}.`
        : `Un lien a déjà été demandé récemment. Vérifiez vos emails, ou réessayez dans ${delaiLisible(d)}.`,
    mdpDifferents: en
      ? "The two passwords don't match."
      : "Les deux mots de passe ne correspondent pas.",
    lienExpire: en
      ? "Link expired. Request a new reset email."
      : "Lien expiré. Redemandez un email de réinitialisation.",
    mdpIdentique: en
      ? "This password is the same as the old one. Choose a different one."
      : "Ce mot de passe est identique à l'ancien. Choisissez-en un autre.",
    majImpossible: en
      ? "Update failed. The link may have expired — request a new email."
      : "Mise à jour impossible. Le lien a peut-être expiré — redemandez un email.",
  };
}

/**
 * Chemin de redirection accepté après connexion. `startsWith("/")`
 * ne suffit pas : « //evil.com » et « /\evil.com » sont des URL
 * absolues pour un navigateur — laisser passer `suivant` (issu de
 * l'URL) offrirait une redirection ouverte. Repli localisé.
 */
function destinationSure(suivant: string, locale: Locale): string {
  const suspect = [...suivant].some(
    (c) => c === "\\" || c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f
  );
  const interne =
    suivant.startsWith("/") && !suivant.startsWith("//") && !suspect;
  return interne ? suivant : localise("/espace", locale);
}

/** Callback des liens email, avec la langue préservée. */
function callbackUrl(locale: Locale, type?: "recovery"): string {
  const params = new URLSearchParams({ lang: locale });
  if (type) params.set("type", type);
  return `${SITE}/api/auth/callback?${params}`;
}

/** Connexion par email + mot de passe */
export async function actionConnexion(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const locale = lireLocale(formData);
  const m = messages(locale);
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const suivant = String(formData.get("suivant") ?? "");

  const quota = await verifierLimite("connexion", email);
  if (!quota.autorise) {
    return {
      erreur:
        quota.motif === "ip"
          ? m.tropIp(quota.reessayerDans)
          : m.tropCompte(quota.reessayerDans),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: motDePasse,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { erreur: m.emailNonConfirme };
    }
    return { erreur: m.identifiants };
  }

  await reinitialiserLimite("connexion", email);
  redirect(destinationSure(suivant, locale));
}

/** Envoi d'un lien magique (OTP par email) */
export async function actionLienMagique(
  _etat: EtatLien,
  formData: FormData
): Promise<EtatLien> {
  const locale = lireLocale(formData);
  const m = messages(locale);
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callbackUrl(locale) },
  });

  if (error) {
    return { erreur: m.lienImpossible, envoye: false };
  }
  return { erreur: null, envoye: true };
}

type EtatInscription = { erreur: string | null; envoye: boolean };

/**
 * Création de compte (hôte ou voyageur). La confirmation d'email est
 * exigée : aucune session n'est ouverte tant que le lien n'est pas
 * cliqué — on affiche donc « vérifiez vos emails ».
 */
export async function actionInscription(
  _etat: EtatInscription,
  formData: FormData
): Promise<EtatInscription> {
  const locale = lireLocale(formData);
  const m = messages(locale);
  const nom = String(formData.get("nom") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const role = formData.get("role") === "voyageur" ? "voyageur" : "hote";

  if (motDePasse.length < 8) {
    return { erreur: m.mdpCourt, envoye: false };
  }

  const quota = await verifierLimite("mot_de_passe_oublie", email);
  if (!quota.autorise) {
    return { erreur: m.tropTentatives(quota.reessayerDans), envoye: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: {
      // `langue` sert aux notifications email bilingues (voir
      // src/lib/notifications.ts) : chaque envoi lit profiles.langue.
      data: { nom, role, langue: locale },
      emailRedirectTo: callbackUrl(locale),
    },
  });

  if (error) {
    return {
      erreur: error.message.includes("already") ? m.compteExiste : m.inscriptionImpossible,
      envoye: false,
    };
  }

  // Le profil est créé par trigger depuis les métadonnées ; on fixe
  // explicitement la langue pour ne pas dépendre du contenu du trigger.
  if (locale !== LOCALE_DEFAUT && data.user?.id) {
    try {
      await createAdminClient()
        .from("profiles")
        .update({ langue: locale })
        .eq("id", data.user.id);
    } catch {
      // Sans effet sur l'inscription : le profil garde 'fr' par défaut.
    }
  }

  return { erreur: null, envoye: true };
}

/**
 * Mémorise la langue choisie via le sélecteur, pour un utilisateur
 * connecté — c'est cette préférence que lisent les emails bilingues
 * (voir src/lib/notifications.ts). Sans session, l'appel est ignoré.
 * Best-effort : appelé sans attendre depuis le sélecteur.
 */
export async function actionDefinirLangue(locale: Locale) {
  if (locale !== "fr" && locale !== "en") return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // RLS : un profil n'est modifiable que par son titulaire (id = auth.uid()).
  await supabase.from("profiles").update({ langue: locale }).eq("id", user.id);
}

/** Déconnexion (action de formulaire) */
export async function actionDeconnexion(formData?: FormData) {
  const locale = formData ? lireLocale(formData) : LOCALE_DEFAUT;
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(localise("/", locale));
}

type EtatReinit = { erreur: string | null; envoye: boolean };

/**
 * Demande de réinitialisation : réponse identique que l'adresse
 * existe ou non (anti-énumération), et quota bas (le formulaire est
 * un envoi d'email détournable).
 */
export async function actionMotDePasseOublie(
  _etat: EtatReinit,
  formData: FormData
): Promise<EtatReinit> {
  const locale = lireLocale(formData);
  const m = messages(locale);
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erreur: m.renseignerEmail, envoye: false };

  const quota = await verifierLimite("mot_de_passe_oublie", email);
  if (!quota.autorise) {
    return { erreur: m.lienDejaDemande(quota.reessayerDans), envoye: false };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl(locale, "recovery"),
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
  const locale = lireLocale(formData);
  const m = messages(locale);
  const mdp = String(formData.get("mot_de_passe") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (mdp.length < 8) {
    return { erreur: m.mdpCourt };
  }
  if (mdp !== confirmation) {
    return { erreur: m.mdpDifferents };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erreur: m.lienExpire };
  }

  const { error } = await supabase.auth.updateUser({ password: mdp });

  if (!error && user.email) {
    await reinitialiserLimite("connexion", user.email);
    await reinitialiserLimite("mot_de_passe_oublie", user.email);
  }
  if (error) {
    const identique =
      error.message.includes("should be different") ||
      error.code === "same_password";
    return { erreur: identique ? m.mdpIdentique : m.majImpossible };
  }

  redirect(localise("/espace", locale));
}
