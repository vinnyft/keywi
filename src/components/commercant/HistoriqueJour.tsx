import { PackagePlus, PackageMinus, RotateCcw } from "lucide-react";
import type { Locale } from "@/lib/i18n";

/**
 * Liste présentationnelle des mouvements du jour d'un point relais.
 * Les données sont chargées côté serveur par la page et rafraîchies
 * en temps réel via <RafraichirTempsReel> (router.refresh).
 */

export interface Mouvement {
  id: string;
  type: "depot" | "retrait" | "retour";
  created_at: string;
  details: {
    case_numero?: number;
    logement?: string;
    beneficiaire?: string;
  } | null;
}

const CONFIG: Record<
  Mouvement["type"],
  { libelle: Record<Locale, string>; icone: typeof PackagePlus; classe: string }
> = {
  depot: {
    libelle: { fr: "Dépôt", en: "Drop-off" },
    icone: PackagePlus,
    classe: "bg-primaire-pale text-primaire-fonce",
  },
  retrait: {
    libelle: { fr: "Retrait", en: "Pickup" },
    icone: PackageMinus,
    classe: "bg-menthe-pale text-menthe",
  },
  retour: {
    libelle: { fr: "Retour", en: "Return" },
    icone: RotateCcw,
    classe: "bg-ambre-pale text-ambre",
  },
};

export function HistoriqueJour({
  mouvements,
  locale = "fr",
}: {
  mouvements: Mouvement[];
  locale?: Locale;
}) {
  const en = locale === "en";
  const t = en
    ? {
        titre: "Today's history",
        intro: "All the movements recorded at your counter today.",
        aucun: "No movement today. Scanned drop-offs and pickups appear here live.",
        caseNum: (n: number) => `slot no. ${n}`,
        remisA: "handed to",
      }
    : {
        titre: "Historique du jour",
        intro: "Tous les mouvements enregistrés à votre comptoir aujourd'hui.",
        aucun:
          "Aucun mouvement aujourd'hui. Les dépôts et retraits scannés apparaîtront ici en direct.",
        caseNum: (n: number) => `case n° ${n}`,
        remisA: "remis à",
      };

  return (
    <div>
      <h1 className="text-xl font-bold">{t.titre}</h1>
      <p className="mt-1 text-sm text-gray-600">{t.intro}</p>

      {mouvements.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          {t.aucun}
        </p>
      ) : (
        <ul className="mt-5 space-y-2" aria-live="polite">
          {mouvements.map((m) => {
            const config = CONFIG[m.type];
            const Icone = config.icone;
            return (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${config.classe}`}
                >
                  <Icone size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {config.libelle[locale]}
                    {m.details?.case_numero != null && ` · ${t.caseNum(m.details.case_numero)}`}
                  </p>
                  <p className="truncate text-xs text-gray-600">
                    {m.details?.logement ?? "—"}
                    {m.details?.beneficiaire && ` · ${t.remisA} ${m.details.beneficiaire}`}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-gray-500">
                  {new Date(m.created_at).toLocaleTimeString(en ? "en-IE" : "fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
