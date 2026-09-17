import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/server";
import { RechercheRelais, type TextesRecherche } from "@/components/marketing/RechercheRelais";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Find a drop-off point" : "Trouver un point relais",
    description:
      loc === "en"
        ? "Map of KeyWe partner shops where you can drop off and pick up keys."
        : "Carte des commerces partenaires KeyWe où déposer et récupérer des clés.",
    alternates: alternatesLangues("/points-relais", loc),
  };
}

/**
 * Régénération toutes les 2 minutes (ISR) : servir une version cachée
 * épargne à Supabase deux requêtes par visiteur. La disponibilité des
 * cases peut accuser jusqu'à 2 min de retard — acceptable ici.
 */
export const revalidate = 120;

const TEXTES: Record<Locale, { h1: string; lede: string; recherche: TextesRecherche }> = {
  fr: {
    h1: "Trouver un point relais",
    lede: "Nos commerces partenaires vous accueillent pour déposer ou récupérer des clés pendant leurs horaires d'ouverture. Cherchez celui qui vous arrange.",
    recherche: {
      rechercheLabel: "Rechercher par adresse ou code postal",
      placeholder: "Adresse, code postal… (ex. 75011)",
      horaires: "Horaires",
      deposerIci: "Déposer ici",
      aucun: "Aucun point relais ne correspond — essayez un autre code postal.",
      complet: "Complet actuellement",
      caseSingulier: "case libre",
      casePluriel: "cases libres",
      voirAvant: "Voir ",
      voirApres: " sur la carte",
    },
  },
  en: {
    h1: "Find a drop-off point",
    lede: "Our partner shops welcome you to drop off or pick up keys during their opening hours. Find the one that suits you.",
    recherche: {
      rechercheLabel: "Search by address or postcode",
      placeholder: "Address, postcode… (e.g. 75011)",
      horaires: "Opening hours",
      deposerIci: "Drop off here",
      aucun: "No drop-off point matches — try another postcode.",
      complet: "Currently full",
      caseSingulier: "free slot",
      casePluriel: "free slots",
      voirAvant: "View ",
      voirApres: " on the map",
    },
  },
};

/** Carte publique des points relais actifs + disponibilité des cases */
export default async function PagePointsRelais({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = TEXTES[locale];

  const supabase = createPublicClient();

  const { data: points } = await supabase
    .from("relay_points")
    .select("id, nom, adresse, code_postal, ville, lat, lng, horaires, description, type")
    .eq("statut", "actif")
    .order("nom");

  const { data: slotsLibres } = await supabase
    .from("slots")
    .select("relay_point_id")
    .eq("statut", "libre");

  const casesParPoint = new Map<string, number>();
  for (const s of slotsLibres ?? []) {
    casesParPoint.set(s.relay_point_id, (casesParPoint.get(s.relay_point_id) ?? 0) + 1);
  }

  const pointsAvecCases = (points ?? []).map((p) => ({
    ...p,
    horaires: p.horaires as Record<string, string> | null,
    casesLibres: casesParPoint.get(p.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black">{t.h1}</h1>
      <p className="mt-2 max-w-2xl text-gray-600">{t.lede}</p>

      <RechercheRelais
        points={JSON.parse(JSON.stringify(pointsAvecCases))}
        t={t.recherche}
        deposerHref={localise("/espace/deposer", locale)}
      />
    </div>
  );
}
