import type { Database } from "@/lib/supabase/types";
import type { Locale } from "@/lib/i18n";

type KeyStatus = Database["public"]["Enums"]["key_status"];

/**
 * Badge d'état d'une clé, aux couleurs du design system KeyWe.
 * Le libellé suit la langue (`locale`), la couleur est partagée.
 */
const CLASSE: Record<KeyStatus, string> = {
  en_attente: "bg-gray-100 text-gray-600",
  deposee: "bg-primaire-pale text-primaire-fonce",
  prete_retrait: "bg-menthe-pale text-menthe",
  retiree: "bg-gray-100 text-gray-500",
  retour: "bg-ambre-pale text-ambre",
  perdue: "bg-red-100 text-red-700",
};

const LIBELLE: Record<Locale, Record<KeyStatus, string>> = {
  fr: {
    en_attente: "En attente de dépôt",
    deposee: "Déposée",
    prete_retrait: "Prête au retrait",
    retiree: "Retirée",
    retour: "De retour",
    perdue: "Perdue",
  },
  en: {
    en_attente: "Awaiting drop-off",
    deposee: "Dropped off",
    prete_retrait: "Ready for pickup",
    retiree: "Picked up",
    retour: "Returned",
    perdue: "Lost",
  },
};

export function StatutCle({
  statut,
  locale = "fr",
}: {
  statut: KeyStatus;
  locale?: Locale;
}) {
  const classe = CLASSE[statut] ?? "bg-gray-100 text-gray-600";
  const libelle = LIBELLE[locale][statut] ?? statut;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classe}`}
    >
      {libelle}
    </span>
  );
}
