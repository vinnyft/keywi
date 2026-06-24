"use client";

import { useCallback, useState } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { createClient } from "@/lib/supabase/client";
import { StatutCle } from "@/components/ui/StatutCle";
import type { Database } from "@/lib/supabase/types";

type KeyStatus = Database["public"]["Enums"]["key_status"];

/**
 * Pastille de statut d'une clé qui se met à jour en direct
 * (Supabase Realtime) pendant que le commerçant scanne.
 */
export function SuiviCleTempsReel({
  cleId,
  statutInitial,
}: {
  cleId: string;
  statutInitial: KeyStatus;
}) {
  const [statut, setStatut] = useState<KeyStatus>(statutInitial);

  const recharger = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("keys")
      .select("statut")
      .eq("id", cleId)
      .single();
    if (data) setStatut(data.statut);
  }, [cleId]);

  useRealtime("keys", recharger, `id=eq.${cleId}`);

  return (
    <span aria-live="polite">
      <StatutCle statut={statut} />
    </span>
  );
}
