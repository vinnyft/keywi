import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/types";

/**
 * Fabriques de données pour les tests.
 *
 * Chaque test crée ses propres hôtes, points relais et clés, puis
 * les supprime : le jeu de démonstration n'est jamais modifié, et
 * les tests peuvent tourner en boucle sans dériver.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type Client = SupabaseClient<Database>;

/** Client service role : contourne la RLS, sert à préparer/nettoyer */
export const admin: Client = createClient<Database>(URL, SERVICE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Client authentifié comme un utilisateur donné — la RLS s'applique */
export async function clientDe(email: string, motDePasse: string): Promise<Client> {
  const c = createClient<Database>(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await c.auth.signInWithPassword({ email, password: motDePasse });
  if (error) throw new Error(`Connexion ${email} impossible : ${error.message}`);
  return c;
}

const MDP_TEST = "motDePasseTest2026";
let compteur = 0;

/** Identifiant unique, pour que deux exécutions ne se marchent pas dessus */
function jeton() {
  compteur += 1;
  return `t${Date.now().toString(36)}${compteur}`;
}

export interface Contexte {
  hoteId: string;
  hoteEmail: string;
  commercantId: string;
  commercantEmail: string;
  relayPointId: string;
  motDePasse: string;
  nettoyer: () => Promise<void>;
}

/**
 * Monte un décor complet : un hôte, un commerçant, et un point
 * relais appartenant à ce commerçant (avec ses cases).
 */
export async function monterContexte(nbCases = 3): Promise<Contexte> {
  const id = jeton();
  const hoteEmail = `hote.${id}@test.keywi`;
  const commercantEmail = `commercant.${id}@test.keywi`;

  const { data: h, error: eh } = await admin.auth.admin.createUser({
    email: hoteEmail,
    password: MDP_TEST,
    email_confirm: true,
    user_metadata: { nom: `Hôte ${id}`, role: "hote" },
  });
  if (eh) throw new Error(`Création hôte : ${eh.message}`);

  const { data: c, error: ec } = await admin.auth.admin.createUser({
    email: commercantEmail,
    password: MDP_TEST,
    email_confirm: true,
    user_metadata: { nom: `Commerce ${id}`, role: "commercant" },
  });
  if (ec) throw new Error(`Création commerçant : ${ec.message}`);

  const hoteId = h.user!.id;
  const commercantId = c.user!.id;

  const { data: relais, error: er } = await admin
    .from("relay_points")
    .insert({
      nom: `Point test ${id}`,
      adresse: "1 rue de Test",
      code_postal: "75001",
      ville: "Paris",
      lat: 48.86,
      lng: 2.34,
      capacite: nbCases,
      owner_id: commercantId,
      statut: "actif",
    })
    .select("id")
    .single();
  if (er) throw new Error(`Création point relais : ${er.message}`);

  const relayPointId = relais.id;

  return {
    hoteId,
    hoteEmail,
    commercantId,
    commercantEmail,
    relayPointId,
    motDePasse: MDP_TEST,
    async nettoyer() {
      // L'ordre importe peu : les cascades font le travail, mais on
      // reste explicite pour ne rien laisser derrière.
      await admin.from("relay_points").delete().eq("id", relayPointId);
      await admin.auth.admin.deleteUser(hoteId);
      await admin.auth.admin.deleteUser(commercantId);
    },
  };
}

/** Crée une clé payée, rattachée au point relais du contexte */
export async function creerCle(
  ctx: Contexte,
  logement = "Logement test"
): Promise<{ id: string; badge: string }> {
  const { data: badge } = await admin.rpc("generer_code_badge");
  const { data, error } = await admin
    .from("keys")
    .insert({
      hote_id: ctx.hoteId,
      relay_point_id: ctx.relayPointId,
      logement,
      code_badge_imprime: badge as string,
      paiement_statut: "paye",
    })
    .select("id, code_badge_imprime")
    .single();
  if (error) throw new Error(`Création clé : ${error.message}`);
  return { id: data.id, badge: data.code_badge_imprime };
}
