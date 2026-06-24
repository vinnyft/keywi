"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Abonnement Supabase Realtime (postgres_changes) : appelle onChange
 * à chaque insertion / mise à jour / suppression sur la table.
 * Utilisé pour rafraîchir les tableaux de bord sans rechargement.
 *
 * @param table   nom de la table publique à écouter
 * @param onChange callback (re-fetch des données, etc.)
 * @param filtre  filtre Realtime optionnel, ex. `relay_point_id=eq.${id}`
 */
export function useRealtime(
  table: string,
  onChange: () => void,
  filtre?: string
) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`realtime:${table}:${filtre ?? "tous"}`)
      .on(
        "postgres_changes",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { event: "*", schema: "public", table, filter: filtre } as any,
        () => onChangeRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [table, filtre]);
}
