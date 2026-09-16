import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Authentification de l'API publique Keywi.
 *
 * Une clé API a la forme `kw_live_<32 octets en base64url>`. Seul
 * son SHA-256 est stocké : la valeur en clair n'existe qu'une fois,
 * au moment de la création, et n'est jamais récupérable ensuite.
 */

export const PREFIXE_CLE = "kw_live_";

/** Génère une nouvelle clé API (valeur en clair + son hachage) */
export function genererCle(): { cle: string; hash: string; prefixe: string } {
  const cle = PREFIXE_CLE + randomBytes(24).toString("base64url");
  return { cle, hash: hacher(cle), prefixe: cle.slice(0, 16) };
}

/** SHA-256 hexadécimal — le seul format stocké en base */
export function hacher(cle: string): string {
  return createHash("sha256").update(cle).digest("hex");
}

/** Droits que peut porter une clé API */
export type PorteeApi = "lire" | "creer";

export interface ContexteApi {
  apiKeyId: string;
  hoteId: string;
  nomCle: string;
  portees: PorteeApi[];
}

/**
 * Valide l'en-tête `Authorization: Bearer <clé>` d'une requête.
 * Retourne le contexte (hôte propriétaire, portées) ou null si la
 * clé est absente, malformée, inconnue ou révoquée.
 */
export async function authentifierRequete(
  request: Request
): Promise<ContexteApi | null> {
  const entete = request.headers.get("authorization");
  if (!entete?.startsWith("Bearer ")) return null;

  const cle = entete.slice(7).trim();
  if (!cle.startsWith(PREFIXE_CLE)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("api_resoudre_cle", {
    p_hash: hacher(cle),
  });
  if (error) return null;

  const r = (data ?? { ok: false }) as {
    ok: boolean;
    api_key_id?: string;
    hote_id?: string;
    nom?: string;
    portees?: string[];
  };
  if (!r.ok || !r.hote_id || !r.api_key_id) return null;

  return {
    apiKeyId: r.api_key_id,
    hoteId: r.hote_id,
    nomCle: r.nom ?? "",
    portees: (r.portees ?? []).filter(
      (p): p is PorteeApi => p === "lire" || p === "creer"
    ),
  };
}

/**
 * Vérifie qu'une clé porte la portée requise. Retourne une réponse
 * 403 à renvoyer telle quelle, ou null si l'accès est permis.
 */
export function exigerPortee(
  ctx: ContexteApi,
  portee: PorteeApi
): Response | null {
  if (ctx.portees.includes(portee)) return null;
  return Response.json(
    {
      erreur: `Cette clé API n'a pas la portée « ${portee} » requise pour cette opération.`,
    },
    { status: 403 }
  );
}

/**
 * Limite le débit d'une clé API. Le compteur est porté par la clé —
 * une clé fuitée ne peut pas marteler l'API depuis mille IP — avec
 * un plafond IP en second rideau. Retourne une réponse 429 à
 * renvoyer telle quelle, ou null si la requête peut passer.
 */
export async function limiterApi(ctx: ContexteApi): Promise<Response | null> {
  const { verifierLimite } = await import("@/lib/limitation");
  const verdict = await verifierLimite("api", ctx.apiKeyId);
  if (verdict.autorise) return null;
  return Response.json(
    { erreur: "Trop de requêtes. Réessayez dans un instant." },
    {
      status: 429,
      headers: { "Retry-After": String(verdict.reessayerDans) },
    }
  );
}

/** Réponse d'erreur JSON normalisée de l'API */
export function erreurApi(message: string, statut: number) {
  return Response.json({ erreur: message }, { status: statut });
}

/** 401 standard, avec l'indication du schéma attendu */
export function nonAutorise() {
  return Response.json(
    { erreur: "Clé API manquante ou invalide. Utilisez : Authorization: Bearer kw_live_…" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
  );
}
