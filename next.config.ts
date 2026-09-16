import type { NextConfig } from "next";

/**
 * En-têtes de sécurité.
 *
 * Choix assumé : la CSP est portée par la configuration, sans nonce.
 * La variante à nonce (documentée par Next) impose un rendu
 * dynamique sur **toutes** les pages — la carte, les tarifs et les
 * cas d'usage perdraient leur génération statique pour un gain
 * mince ici : l'application n'utilise aucun `dangerouslySetInnerHTML`
 * et React échappe tout ce qu'il affiche.
 *
 * Ce que cette CSP apporte malgré `unsafe-inline` : plus aucun
 * script, style, image, police ou requête ne peut partir vers une
 * origine non listée. Une injection réussie ne pourrait donc ni
 * charger de code tiers, ni exfiltrer quoi que ce soit.
 */

const enProduction = process.env.NODE_ENV === "production";

/** Origine Supabase : REST, Auth, et Realtime en WebSocket */
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWs = supabase.replace(/^http/, "ws");

const csp = [
  `default-src 'self'`,
  // 'unsafe-inline' : Next injecte ses scripts d'hydratation en ligne.
  // 'unsafe-eval' en développement seulement — React s'en sert pour
  // reconstruire les piles d'appel serveur dans le navigateur.
  `script-src 'self' 'unsafe-inline'${enProduction ? "" : " 'unsafe-eval'"}`,
  // Tailwind et Leaflet posent des styles en ligne.
  `style-src 'self' 'unsafe-inline'`,
  // Tuiles OpenStreetMap, marqueurs encodés en data:, captures en blob:
  `img-src 'self' data: blob: https://tile.openstreetmap.org`,
  `font-src 'self' data:`,
  `connect-src 'self' ${supabase} ${supabaseWs}`.replace(/\s+/g, " ").trim(),
  `frame-src 'none'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  // Le paiement quitte le site par redirection, pas par soumission de
  // formulaire : aucune origine externe n'est nécessaire ici.
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  ...(enProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const enTetes = [
  { key: "Content-Security-Policy", value: csp },
  // Redondant avec frame-ancestors, mais compris des navigateurs anciens
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Un code de retrait passant par une URL ne doit pas fuiter en Referer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // Le scan NFC de l'app commerçant n'est volontairement pas listé :
    // il reste autorisé par défaut, le bloquer casserait le comptoir.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  ...(enProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:chemin*", headers: enTetes }];
  },
};

export default nextConfig;
