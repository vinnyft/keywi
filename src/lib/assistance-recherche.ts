import type { Locale } from "@/lib/i18n";

/**
 * Recherche « texte libre » pour le bot d'assistance, SANS IA.
 *
 * L'utilisateur peut taper une phrase (même mal orthographiée,
 * abrégée, en FR ou EN) plutôt que de cliquer un bouton. On :
 *   1. détecte la langue (heuristique par mots-repères + accents) ;
 *   2. apparie la phrase à un nœud de l'arbre par mots-clés, avec
 *      tolérance aux fautes (distance de Levenshtein).
 *
 * Aucun appel réseau, aucune donnée envoyée : tout est local et
 * déterministe. Si rien ne correspond assez, on renvoie null et le
 * bot propose les thèmes / le SAV.
 */

/** Minuscule, sans accents, ponctuation → espaces. */
function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Distance de Levenshtein bornée (suffisant pour des mots courts). */
function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  const ligne = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prec = ligne[0];
    ligne[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = ligne[j];
      ligne[j] = Math.min(
        ligne[j] + 1,
        ligne[j - 1] + 1,
        prec + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prec = temp;
    }
  }
  return ligne[n];
}

/** Un token correspond-il à un mot-clé, avec tolérance aux fautes ? */
function tokenApparie(token: string, mot: string): boolean {
  if (token === mot) return true;
  if (token.length < 3) return false;
  const seuil = mot.length <= 4 ? 1 : 2;
  if (distance(token, mot) <= seuil) return true;
  // préfixe/inclusion pour les mots longs (« recuperation » ⊃ « recup »)
  if (mot.length >= 4 && (token.startsWith(mot) || mot.startsWith(token))) return true;
  return false;
}

// -------------------------------------------------------------------
// Détection de langue
// -------------------------------------------------------------------

const MOTS_FR = new Set([
  "je", "j", "tu", "il", "elle", "on", "nous", "vous", "ma", "mon", "mes",
  "ta", "ton", "le", "la", "les", "une", "des", "du", "au", "aux", "pas",
  "pourquoi", "pq", "comment", "avec", "sans", "cle", "cles", "clef", "clefs",
  "marche", "arrive", "recuperer", "retirer", "retire", "deposer", "depot",
  "mot", "passe", "compte", "paiement", "payer", "paye", "ou", "quoi", "qui",
  "est", "sont", "mes", "pour", "chez", "trouve", "trouver", "aide", "bonjour",
]);

const MOTS_EN = new Set([
  "i", "you", "he", "she", "we", "my", "your", "the", "why", "how", "cant",
  "cannot", "dont", "with", "without", "key", "keys", "get", "got", "pick",
  "pickup", "drop", "dropoff", "password", "account", "payment", "pay",
  "where", "what", "who", "is", "are", "from", "cannot", "hello", "help",
  "cant", "please", "need", "want", "collect", "return",
]);

/** Devine la langue d'une phrase, sinon `defaut`. */
export function detecterLangue(texte: string, defaut: Locale): Locale {
  const accents = /[àâäéèêëîïôöùûüçœæ]/i.test(texte);
  const tokens = normaliser(texte).split(" ").filter(Boolean);
  let fr = accents ? 2 : 0;
  let en = 0;
  for (const t of tokens) {
    if (MOTS_FR.has(t)) fr++;
    if (MOTS_EN.has(t)) en++;
  }
  if (fr === en) return defaut;
  return fr > en ? "fr" : "en";
}

// -------------------------------------------------------------------
// Appariement phrase → nœud de l'arbre
// -------------------------------------------------------------------

/**
 * Règles ordonnées du plus spécifique au plus général. `mots` mêle
 * FR et EN (l'appariement est indépendant de la langue détectée).
 * Une entrée contenant un espace est une locution cherchée telle
 * quelle dans la phrase normalisée.
 */
interface Regle {
  noeud: string;
  mots: string[];
}

const REGLES: Regle[] = [
  // --- Problèmes de code (spécifiques) ---
  {
    noeud: "code_expire",
    mots: ["expire", "expired", "invalide", "invalid", "inconnu", "unknown", "marche pas", "works", "refuse", "rejected", "code faux", "mauvais code"],
  },
  { noeud: "code_lieu", mots: ["mauvais point", "wrong shop", "wrong point", "autre commerce", "wrong location"] },
  { noeud: "code_revoquer", mots: ["revoquer", "revoke", "annuler code", "cancel code", "desactiver"] },

  // --- Retrait / récupération ---
  {
    noeud: "retrait_pas_de_code",
    mots: ["pas recu", "pas de code", "no code", "didnt get", "not received", "recu aucun", "jamais recu"],
  },
  { noeud: "retrait_horaires", mots: ["horaires", "hours", "ferme", "closed", "ouvert", "open", "fermeture"] },
  {
    noeud: "retrait",
    mots: ["retirer", "retire", "retrait", "recuperer", "recuperation", "recup", "chercher", "pick", "pickup", "collect", "prendre", "key", "keys", "cle", "cles", "clef", "trousseau"],
  },

  // --- Dépôt ---
  { noeud: "depot_carte", mots: ["point relais", "carte", "map", "pres de moi", "near me", "proche", "trouver un", "no drop"] },
  { noeud: "depot_paye", mots: ["paye mais", "paid but", "rien ne se passe", "nothing happens", "statut bloque"] },
  {
    noeud: "depot",
    mots: ["deposer", "depot", "drop", "dropoff", "laisser", "poser", "deposit"],
  },

  // --- Paiement ---
  { noeud: "paiement_tarifs", mots: ["tarif", "tarifs", "prix", "price", "pricing", "cost", "combien", "how much", "coute", "abonnement", "subscription"] },
  { noeud: "paiement_echec", mots: ["paiement echoue", "payment failed", "carte refusee", "card declined", "echec paiement", "declined"] },
  { noeud: "paiement_facture", mots: ["facture", "invoice", "recu", "receipt", "justificatif"] },

  // --- Compte ---
  { noeud: "compte_mdp", mots: ["mot de passe", "password", "oublie", "forgot", "reinitialiser", "reset", "mdp"] },
  { noeud: "compte_connexion", mots: ["connexion", "connecter", "login", "log in", "sign in", "se connecter", "acceder", "loguer"] },
  { noeud: "compte_rgpd", mots: ["donnees", "rgpd", "gdpr", "supprimer compte", "delete account", "mes donnees", "my data", "confidentialite", "privacy", "exporter"] },

  // --- Devenir point relais ---
  { noeud: "commercant", mots: ["devenir point", "become partner", "partenaire", "partner", "commercant", "shop owner", "heberger", "heberger des cles", "rejoindre"] },
];

/**
 * Renvoie l'id de nœud le mieux apparié à la phrase, ou null si
 * aucune règle n'atteint le score minimal.
 */
export function chercherNoeud(texte: string): string | null {
  const q = normaliser(texte);
  if (!q) return null;
  const tokens = q.split(" ").filter(Boolean);

  let meilleur: string | null = null;
  let meilleurScore = 0;

  for (const regle of REGLES) {
    let score = 0;
    for (const mot of regle.mots) {
      if (mot.includes(" ")) {
        if (q.includes(mot)) score += 2; // locution = signal fort
      } else if (tokens.some((t) => tokenApparie(t, mot))) {
        score += 1;
      }
    }
    // Ordre des règles = priorité au plus spécifique en cas d'égalité
    if (score > meilleurScore) {
      meilleurScore = score;
      meilleur = regle.noeud;
    }
  }

  return meilleurScore >= 1 ? meilleur : null;
}
