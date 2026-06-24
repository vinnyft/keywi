"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";

/**
 * Grille visuelle des cases du point relais : libre (vert pâle) ou
 * occupée (encre, avec le logement). Mise à jour en temps réel via
 * Supabase Realtime — sans rechargement.
 */

interface CaseAffichee {
  id: string;
  numero: number;
  statut: "libre" | "occupee";
  logement: string | null;
}

export function GrilleCases({ relayPointId }: { relayPointId: string }) {
  const [cases, setCases] = useState<CaseAffichee[] | null>(null);

  const charger = useCallback(async () => {
    const supabase = createClient();
    const [{ data: slots }, { data: cles }] = await Promise.all([
      supabase
        .from("slots")
        .select("id, numero, statut")
        .eq("relay_point_id", relayPointId)
        .order("numero"),
      supabase
        .from("keys")
        .select("slot_id, logement")
        .eq("relay_point_id", relayPointId)
        .not("slot_id", "is", null),
    ]);
    const logementParSlot = new Map(
      (cles ?? []).map((c) => [c.slot_id as string, c.logement])
    );
    setCases(
      (slots ?? []).map((s) => ({
        id: s.id,
        numero: s.numero,
        statut: s.statut,
        logement: logementParSlot.get(s.id) ?? null,
      }))
    );
  }, [relayPointId]);

  useEffect(() => {
    // Chargement initial (asynchrone) depuis Supabase
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState après un fetch, pas de rendu en cascade
    charger();
  }, [charger]);

  // Toute modification des cases ou des clés rafraîchit la grille
  useRealtime("slots", charger, `relay_point_id=eq.${relayPointId}`);
  useRealtime("keys", charger, `relay_point_id=eq.${relayPointId}`);

  if (!cases) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="size-10 animate-spin rounded-full border-4 border-primaire border-t-transparent"
          role="status"
          aria-label="Chargement des cases"
        />
      </div>
    );
  }

  const occupees = cases.filter((c) => c.statut === "occupee").length;

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">Mes cases</h2>
        <p className="text-sm text-gray-600">
          {occupees} occupée{occupees > 1 ? "s" : ""} / {cases.length}
        </p>
      </div>

      <ul
        className="grid grid-cols-4 gap-2 sm:grid-cols-5"
        aria-label="État des cases"
      >
        {cases.map((c) => (
          <li
            key={c.id}
            className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-1 text-center ${
              c.statut === "occupee"
                ? "border-encre bg-encre text-white"
                : "border-menthe/40 bg-menthe-pale text-menthe"
            }`}
          >
            <span className="text-xl font-black">{c.numero}</span>
            <span className="line-clamp-2 w-full px-0.5 text-[10px] leading-tight">
              {c.statut === "occupee" ? (c.logement ?? "Occupée") : "Libre"}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-gray-500">
        La grille se met à jour automatiquement à chaque dépôt ou retrait.
      </p>
    </div>
  );
}
