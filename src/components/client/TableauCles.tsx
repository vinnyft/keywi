"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { StatutCle } from "@/components/ui/StatutCle";
import type { Database } from "@/lib/supabase/types";

/**
 * Liste des clés de l'hôte, mise à jour en temps réel : dès que le
 * commerçant scanne un dépôt ou un retrait, le statut change ici
 * sans rechargement de page.
 */

type KeyStatus = Database["public"]["Enums"]["key_status"];

export interface CleAffichee {
  id: string;
  logement: string;
  statut: KeyStatus;
  paiement_statut: string;
  code_badge_imprime: string;
  created_at: string;
  relay_points: { nom: string; adresse: string } | null;
  slots: { numero: number } | null;
}

export function TableauCles({
  hoteId,
  clesInitiales,
}: {
  hoteId: string;
  clesInitiales: CleAffichee[];
}) {
  const [cles, setCles] = useState<CleAffichee[]>(clesInitiales);

  const recharger = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("keys")
      .select(
        "id, logement, statut, paiement_statut, code_badge_imprime, created_at, relay_points(nom, adresse), slots(numero)"
      )
      .eq("hote_id", hoteId)
      .order("created_at", { ascending: false });
    if (data) setCles(data as unknown as CleAffichee[]);
  }, [hoteId]);

  // Realtime : tout changement sur mes clés rafraîchit la liste
  useRealtime("keys", recharger, `hote_id=eq.${hoteId}`);

  if (cles.length === 0) {
    return (
      <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
        Vous n&apos;avez pas encore de clé enregistrée.{" "}
        <Link href="/espace/deposer" className="font-semibold text-primaire underline">
          Déposez votre première clé
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3" aria-live="polite">
      {cles.map((cle) => (
        <li key={cle.id}>
          <Link
            href={`/espace/cles/${cle.id}`}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-primaire"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{cle.logement}</p>
                <StatutCle statut={cle.statut} />
                {cle.paiement_statut === "en_attente" && (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    Paiement requis
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-gray-600">
                {cle.relay_points
                  ? `${cle.relay_points.nom} — ${cle.relay_points.adresse}`
                  : "Point relais non choisi"}
                {cle.slots ? ` · case n° ${cle.slots.numero}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Badge : <span className="font-mono font-semibold">{cle.code_badge_imprime}</span>
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-gray-400" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
