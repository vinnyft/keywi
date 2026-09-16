/**
 * Constantes partagées entre l'écran de suppression de compte et
 * l'action serveur qui l'exécute (`@/lib/actions/compte`).
 * Un module « use server » ne pouvant exporter que des fonctions
 * asynchrones, elles vivent ici.
 */

/**
 * Mot à recopier à l'identique pour confirmer la suppression, par
 * langue. La validation serveur accepte les deux (voir
 * `MOTS_DE_CONFIRMATION`) : un hôte francophone tape « SUPPRIMER »,
 * un anglophone « DELETE ».
 */
export const MOT_DE_CONFIRMATION = "SUPPRIMER";
export const MOT_DE_CONFIRMATION_EN = "DELETE";

/** Tous les mots acceptés par l'action serveur, en majuscules. */
export const MOTS_DE_CONFIRMATION = [MOT_DE_CONFIRMATION, MOT_DE_CONFIRMATION_EN];

/** Aperçu renvoyé par la RPC `apercu_suppression_compte` */
export interface ApercuSuppression {
  ok: boolean;
  role?: string;
  membre_depuis?: string;
  blocage: { code: string; message: string; nombre?: number } | null;
  trousseaux: number;
  codes_actifs: number;
  recurrences: number;
  mouvements: number;
  notifications: number;
  cles_api: number;
  paiements: number;
  codes_recus: number;
}
