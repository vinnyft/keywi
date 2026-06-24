"use client";

import { useCallback, useEffect, useState } from "react";
import { PackagePlus, PackageMinus, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";

/**
 * Mouvements du jour d'un point relais, rafraîchis en temps réel
 * (Supabase Realtime sur la table `movements`).
 */

interface Mouvement {
  id: string;
  type: "depot" | "retrait" | "retour";
  created_at: string;
  details: {
    case_numero?: number;
    logement?: string;
    beneficiaire?: string;
  } | null;
}

const CONFIG = {
  depot: { libelle: "Dépôt", icone: PackagePlus, classe: "bg-primaire-pale text-primaire-fonce" },
  retrait: { libelle: "Retrait", icone: PackageMinus, classe: "bg-menthe-pale text-menthe" },
  retour: { libelle: "Retour", icone: RotateCcw, classe: "bg-ambre-pale text-ambre" },
} as const;

export function HistoriqueJour({ relayPointId }: { relayPointId: string }) {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [charge, setCharge] = useState(false);

  const recharger = useCallback(async () => {
    const supabase = createClient();
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("movements")
      .select("id, type, created_at, details")
      .eq("relay_point_id", relayPointId)
      .gte("created_at", debut.toISOString())
      .order("created_at", { ascending: false });
    setMouvements((data ?? []) as unknown as Mouvement[]);
    setCharge(true);
  }, [relayPointId]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  useRealtime("movements", recharger, `relay_point_id=eq.${relayPointId}`);

  return (
    <div>
      <h1 className="text-xl font-bold">Historique du jour</h1>
      <p className="mt-1 text-sm text-gray-600">
        Tous les mouvements enregistrés à votre comptoir aujourd&apos;hui.
      </p>

      {charge && mouvements.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Aucun mouvement aujourd&apos;hui. Les dépôts et retraits scannés
          apparaîtront ici en direct.
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
                    {config.libelle}
                    {m.details?.case_numero != null && ` · case n° ${m.details.case_numero}`}
                  </p>
                  <p className="truncate text-xs text-gray-600">
                    {m.details?.logement ?? "—"}
                    {m.details?.beneficiaire && ` · remis à ${m.details.beneficiaire}`}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-gray-500">
                  {new Date(m.created_at).toLocaleTimeString("fr-FR", {
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
