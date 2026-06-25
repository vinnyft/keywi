import type { Database } from "@/lib/supabase/types";

type KeyStatus = Database["public"]["Enums"]["key_status"];

/**
 * Badge d'état d'une clé, aux couleurs du design system Keywi.
 */
const CONFIG: Record<KeyStatus, { libelle: string; classe: string }> = {
  en_attente: { libelle: "En attente de dépôt", classe: "bg-gray-100 text-gray-600" },
  deposee: { libelle: "Déposée", classe: "bg-primaire-pale text-primaire-fonce" },
  prete_retrait: { libelle: "Prête au retrait", classe: "bg-menthe-pale text-menthe" },
  retiree: { libelle: "Retirée", classe: "bg-gray-100 text-gray-500" },
  retour: { libelle: "De retour", classe: "bg-ambre-pale text-ambre" },
  perdue: { libelle: "Perdue", classe: "bg-red-100 text-red-700" },
};

export function StatutCle({ statut }: { statut: KeyStatus }) {
  const config = CONFIG[statut] ?? {
    libelle: statut,
    classe: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.classe}`}
    >
      {config.libelle}
    </span>
  );
}
