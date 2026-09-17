import type { Database } from "@/lib/supabase/types";
import type { Locale } from "@/lib/i18n";

/**
 * Libellés et repères du CRM commercial, bilingues (FR/EN).
 * Centralisés ici pour que les pages restent lisibles.
 */

export type StatutProspect = Database["public"]["Enums"]["statut_prospect"];
export type TypeActivite = Database["public"]["Enums"]["type_activite"];

/** Étapes affichées comme pipeline (« perdu » est traité à part). */
export const PIPELINE: readonly StatutProspect[] = [
  "a_contacter",
  "contacte",
  "rdv",
  "signe",
  "actif",
];

/** Tous les statuts, dans l'ordre logique. */
export const STATUTS: readonly StatutProspect[] = [...PIPELINE, "perdu"];

export const TYPES_ACTIVITE: readonly TypeActivite[] = [
  "note",
  "appel",
  "visite",
  "email",
  "relance",
];

const LIBELLES_STATUT: Record<StatutProspect, { fr: string; en: string }> = {
  a_contacter: { fr: "À contacter", en: "To contact" },
  contacte: { fr: "Contacté", en: "Contacted" },
  rdv: { fr: "RDV", en: "Meeting" },
  signe: { fr: "Signé", en: "Signed" },
  actif: { fr: "Actif", en: "Active" },
  perdu: { fr: "Perdu", en: "Lost" },
};

const LIBELLES_TYPE: Record<TypeActivite, { fr: string; en: string }> = {
  note: { fr: "Note", en: "Note" },
  appel: { fr: "Appel", en: "Call" },
  visite: { fr: "Visite", en: "Visit" },
  email: { fr: "Email", en: "Email" },
  relance: { fr: "Relance", en: "Follow-up" },
};

export function libelleStatut(statut: StatutProspect, locale: Locale): string {
  return LIBELLES_STATUT[statut][locale];
}

export function libelleType(type: TypeActivite, locale: Locale): string {
  return LIBELLES_TYPE[type][locale];
}

/** Classes Tailwind d'un badge de statut. */
export function couleurStatut(statut: StatutProspect): string {
  switch (statut) {
    case "a_contacter":
      return "bg-gray-100 text-gray-700";
    case "contacte":
      return "bg-primaire-pale text-encre";
    case "rdv":
      return "bg-ambre-pale text-ambre";
    case "signe":
      return "bg-menthe-pale text-menthe";
    case "actif":
      return "bg-primaire text-white";
    case "perdu":
      return "bg-gray-200 text-gray-500";
  }
}
