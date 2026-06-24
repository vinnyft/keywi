"use client";

import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";

/**
 * Composant invisible : réexécute le Server Component parent
 * (`router.refresh()`) à chaque changement Realtime sur la table
 * écoutée. Permet d'afficher des données serveur toujours fraîches
 * sans transformer la page en composant client.
 */
export function RafraichirTempsReel({
  table,
  filtre,
}: {
  table: string;
  filtre?: string;
}) {
  const router = useRouter();
  useRealtime(table, () => router.refresh(), filtre);
  return null;
}
