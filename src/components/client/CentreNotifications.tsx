"use client";

import { useCallback, useState } from "react";
import { PackagePlus, PackageMinus, RotateCcw, KeyRound, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { actionMarquerLue } from "@/lib/actions/client";

/**
 * Centre de notifications in-app : alimenté en base par les
 * fonctions RPC, livré en direct par Supabase Realtime.
 */

interface Notification {
  id: string;
  type: string;
  payload: {
    logement?: string;
    commerce?: string;
    adresse?: string;
    case_numero?: number;
    code_6?: string;
    beneficiaire?: string;
  };
  lu: boolean;
  created_at: string;
}

const CONFIGS: Record<
  string,
  { titre: (p: Notification["payload"]) => string; icone: typeof Bell; classe: string }
> = {
  depot_effectue: {
    titre: (p) => `Vos clés « ${p.logement} » ont bien été déposées chez ${p.commerce}`,
    icone: PackagePlus,
    classe: "bg-primaire-pale text-primaire-fonce",
  },
  retour_effectue: {
    titre: (p) => `Vos clés « ${p.logement} » sont de retour chez ${p.commerce}`,
    icone: RotateCcw,
    classe: "bg-ambre-pale text-ambre",
  },
  retrait_effectue: {
    titre: (p) =>
      `Clés « ${p.logement} » récupérées par ${p.beneficiaire ?? "le bénéficiaire"} chez ${p.commerce}`,
    icone: PackageMinus,
    classe: "bg-menthe-pale text-menthe",
  },
  cles_disponibles: {
    titre: (p) =>
      `Les clés de « ${p.logement} » sont disponibles${p.commerce ? ` chez ${p.commerce}` : ""}${
        p.code_6 ? ` — code ${p.code_6}` : ""
      }`,
    icone: KeyRound,
    classe: "bg-primaire-pale text-primaire-fonce",
  },
};

export function CentreNotifications({
  userId,
  notificationsInitiales,
}: {
  userId: string;
  notificationsInitiales: Notification[];
}) {
  const [notifications, setNotifications] = useState(notificationsInitiales);

  const recharger = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as unknown as Notification[]);
  }, [userId]);

  useRealtime("notifications", recharger, `user_id=eq.${userId}`);

  return (
    <div>
      <h1 className="text-2xl font-bold">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Aucune notification. Les dépôts et retraits de vos clés apparaîtront ici
          en temps réel.
        </p>
      ) : (
        <ul className="mt-5 space-y-2" aria-live="polite">
          {notifications.map((n) => {
            const config = CONFIGS[n.type] ?? {
              titre: () => n.type,
              icone: Bell,
              classe: "bg-gray-100 text-gray-600",
            };
            const Icone = config.icone;
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-xl border bg-white p-4 ${
                  n.lu ? "border-gray-200" : "border-primaire"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${config.classe}`}
                >
                  <Icone size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.lu ? "text-gray-700" : "font-semibold"}`}>
                    {config.titre(n.payload)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(n.created_at).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                {!n.lu && (
                  <button
                    onClick={() => {
                      // Optimiste : marquée lue localement puis en base
                      setNotifications((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, lu: true } : x))
                      );
                      actionMarquerLue(n.id);
                    }}
                    className="shrink-0 text-xs font-medium text-primaire underline"
                  >
                    Marquer lue
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
