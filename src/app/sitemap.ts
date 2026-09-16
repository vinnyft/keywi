import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { localise } from "@/lib/i18n";
import { CAS_USAGE_SLUGS } from "@/content/cas-usage";

/**
 * sitemap.xml (généré par Next à /sitemap.xml).
 *
 * Uniquement les pages publiques indexables. Les espaces privés,
 * pages d'authentification et pages `noindex` (certificat, borne,
 * compte supprimé) en sont volontairement absents.
 *
 * Site bilingue : chaque page est listée dans ses deux versions
 * (français sur l'URL nue, anglais sous /en) et chaque entrée porte
 * les liens alternatifs hreflang vers l'autre langue.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const maj = new Date();

  const pages: { chemin: string; freq: MetadataRoute.Sitemap[number]["changeFrequency"]; prio: number }[] = [
    { chemin: "/", freq: "weekly", prio: 1 },
    { chemin: "/points-relais", freq: "daily", prio: 0.9 },
    { chemin: "/devenir-point-relais", freq: "monthly", prio: 0.8 },
    { chemin: "/tarifs", freq: "monthly", prio: 0.8 },
    { chemin: "/produits/points-relais", freq: "monthly", prio: 0.7 },
    { chemin: "/produits/casiers", freq: "monthly", prio: 0.6 },
    { chemin: "/produits/logiciel-suivi", freq: "monthly", prio: 0.6 },
    { chemin: "/faq", freq: "monthly", prio: 0.6 },
    { chemin: "/a-propos", freq: "yearly", prio: 0.5 },
    { chemin: "/developpeurs", freq: "monthly", prio: 0.5 },
    { chemin: "/contact", freq: "yearly", prio: 0.5 },
    { chemin: "/cgv", freq: "yearly", prio: 0.3 },
    { chemin: "/confidentialite", freq: "yearly", prio: 0.3 },
    { chemin: "/mentions-legales", freq: "yearly", prio: 0.3 },
    ...CAS_USAGE_SLUGS.map((slug) => ({
      chemin: `/cas-usage/${slug}`,
      freq: "monthly" as const,
      prio: 0.7,
    })),
  ];

  const url = (chemin: string, loc: "fr" | "en") =>
    `${SITE_URL}${localise(chemin, loc)}`;

  return pages.flatMap(({ chemin, freq, prio }) => {
    const alternates = {
      languages: { fr: url(chemin, "fr"), en: url(chemin, "en") },
    };
    return [
      { url: url(chemin, "fr"), lastModified: maj, changeFrequency: freq, priority: prio, alternates },
      { url: url(chemin, "en"), lastModified: maj, changeFrequency: freq, priority: prio, alternates },
    ];
  });
}
