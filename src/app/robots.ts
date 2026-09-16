import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * robots.txt (généré par Next à /robots.txt).
 *
 * Le contenu public — accueil, points relais, tarifs, cas d'usage,
 * pages légales — est indexable. On ferme les espaces privés et
 * fonctionnels : rien d'utile à un moteur, et souvent des URLs
 * portant un jeton ou une session (certificat, borne, API, export).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/espace/",
        "/commercant/",
        "/admin/",
        "/api/",
        "/borne/",
        "/certificat/",
        "/compte-supprime",
        "/reinitialiser",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
