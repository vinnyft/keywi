import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Limitation de débit des points sensibles (connexion, mot de
 * passe oublié, borne de casier).
 *
 * Voir `supabase/migrations/0012_limitation_debit.sql` : les
 * compteurs vivent en base, seul endroit partagé entre les
 * instances serveur, et n'y sont écrits que sous forme
 * d'empreintes — la table ne contient ni email ni adresse IP.
 */

/** Poivre du hachage : rend les empreintes non énumérables. */
const POIVRE =
  process.env.RATE_LIMIT_PEPPER ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function empreinte(valeur: string): string {
  return createHash("sha256")
    .update(`${POIVRE}:${valeur.toLowerCase().trim()}`)
    .digest("hex");
}

/**
 * IP réelle de l'appelant. Derrière Vercel, `x-forwarded-for`
 * porte la chaîne des relais : le premier élément est le client.
 */
export async function adresseIp(): Promise<string | null> {
  const entetes = await headers();
  const chaine = entetes.get("x-forwarded-for");
  const ip = chaine?.split(",")[0]?.trim() || entetes.get("x-real-ip")?.trim();
  return ip || null;
}

export interface Limite {
  /** Tentatives autorisées pour une même clé (email, code…) */
  maxCle: number;
  /** Tentatives autorisées depuis une même IP */
  maxIp: number;
  /** Largeur de la fenêtre glissante, en secondes */
  fenetreSecondes: number;
}

/** Barèmes par action, au même endroit pour être relus d'un coup d'œil. */
export const BAREMES = {
  /** Bourrage de mot de passe sur un compte précis */
  connexion: { maxCle: 5, maxIp: 30, fenetreSecondes: 900 },
  /**
   * Volontairement bas : un utilisateur légitime demande un lien,
   * pas dix. Limite aussi l'usage du formulaire comme moyen
   * d'inonder la boîte d'un tiers.
   */
  mot_de_passe_oublie: { maxCle: 3, maxIp: 10, fenetreSecondes: 3600 },
  /**
   * Devinette de code à 6 caractères devant un casier. Le seuil est
   * par casier, pas par visiteur : c'est le seul angle qui tienne
   * face à une attaque distribuée. Large pour l'usage réel (un
   * retrait légitime remet le compteur à zéro), ramène le balayage
   * à quelques milliers d'essais par jour face à 31⁶ combinaisons.
   */
  borne: { maxCle: 15, maxIp: 20, fenetreSecondes: 600 },
  /**
   * API publique, par clé et par minute. Confortable pour une
   * automatisation honnête (un check-in déclenche une poignée
   * d'appels), assez bas pour qu'une clé fuitée ne serve pas de
   * robot d'envoi d'emails ou de générateur de codes en masse.
   */
  api: { maxCle: 120, maxIp: 240, fenetreSecondes: 60 },
} as const satisfies Record<string, Limite>;

export type Action = keyof typeof BAREMES;

export interface Verdict {
  autorise: boolean;
  /** Secondes à attendre avant une nouvelle tentative */
  reessayerDans: number;
  /** `cle` = compte visé saturé · `ip` = source saturée */
  motif?: "cle" | "ip";
}

/**
 * Consomme une tentative et dit si elle est permise.
 *
 * En cas de panne du compteur, on laisse passer : la base est de
 * toute façon indispensable au reste de l'authentification, et
 * transformer un incident en refus généralisé de connexion serait
 * un déni de service auto-infligé.
 */
export async function verifierLimite(
  action: Action,
  cle: string
): Promise<Verdict> {
  const bareme = BAREMES[action];
  const ip = await adresseIp();

  const { data, error } = await createAdminClient().rpc("verifier_limite", {
    p_action: action,
    p_empreinte_cle: empreinte(cle),
    // `null` explicite (et non `undefined`) : l'argument n'a pas de
    // valeur par défaut côté Postgres, il doit être transmis.
    p_empreinte_ip: ip ? empreinte(ip) : null,
    p_max_cle: bareme.maxCle,
    p_max_ip: bareme.maxIp,
    p_fenetre_secondes: bareme.fenetreSecondes,
  });

  if (error) {
    console.error("Limitation de débit indisponible :", error.message);
    return { autorise: true, reessayerDans: 0 };
  }

  const r = (data ?? { autorise: true }) as unknown as {
    autorise: boolean;
    motif?: "cle" | "ip";
    reessayer_dans?: number;
  };

  return {
    autorise: r.autorise,
    motif: r.motif,
    reessayerDans: r.reessayer_dans ?? 0,
  };
}

/** Efface l'ardoise d'une clé après un succès. */
export async function reinitialiserLimite(action: Action, cle: string) {
  const { error } = await createAdminClient().rpc("reinitialiser_limite", {
    p_action: action,
    p_empreinte_cle: empreinte(cle),
  });
  if (error) console.error("Réinitialisation du compteur :", error.message);
}

/** « 3 min » / « 45 s » — pour l'affichage du délai d'attente. */
export function delaiLisible(secondes: number): string {
  if (secondes < 60) return `${secondes} s`;
  const minutes = Math.ceil(secondes / 60);
  return minutes < 60
    ? `${minutes} min`
    : `${Math.ceil(minutes / 60)} h`;
}
