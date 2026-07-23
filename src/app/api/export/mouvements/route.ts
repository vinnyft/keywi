import { createClient } from "@/lib/supabase/server";

/**
 * Keywi Pro — export CSV de l'historique des mouvements.
 * La RLS restreint déjà les mouvements visibles à ceux des clés
 * de l'hôte connecté : aucun filtre supplémentaire n'est requis.
 *
 * GET /api/export/mouvements → fichier .csv
 */

/** Échappement CSV : guillemets doublés, champ cité si besoin */
function champ(valeur: unknown): string {
  const s = valeur == null ? "" : String(valeur);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const LIBELLES = {
  depot: "Dépôt",
  retrait: "Retrait",
  retour: "Retour",
} as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { data: mouvements, error } = await supabase
    .from("movements")
    .select(
      "created_at, type, details, keys(logement, code_badge_imprime), relay_points(nom, adresse, code_postal, ville)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(`Erreur : ${error.message}`, { status: 500 });
  }

  const enTete = [
    "Date",
    "Heure",
    "Type",
    "Logement",
    "Badge",
    "Lieu",
    "Adresse",
    "Case",
    "Bénéficiaire",
  ];

  const lignes = (mouvements ?? []).map((m) => {
    const d = new Date(m.created_at);
    const details = (m.details ?? {}) as {
      case_numero?: number;
      beneficiaire?: string;
    };
    const relais = m.relay_points;
    return [
      d.toLocaleDateString("fr-FR"),
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      LIBELLES[m.type] ?? m.type,
      m.keys?.logement ?? "",
      m.keys?.code_badge_imprime ?? "",
      relais?.nom ?? "",
      relais ? `${relais.adresse}, ${relais.code_postal} ${relais.ville}` : "",
      details.case_numero ?? "",
      details.beneficiaire ?? "",
    ]
      .map(champ)
      .join(";");
  });

  // BOM UTF-8 + séparateur « ; » : ouverture correcte dans Excel FR
  const csv = "﻿" + [enTete.join(";"), ...lignes].join("\r\n");
  const jour = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="keywi-mouvements-${jour}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
