import type { MetadataRoute } from "next";

/**
 * Manifeste PWA : l'application Keywi s'installe sur l'écran
 * d'accueil (mobile et desktop) et s'ouvre en plein écran sur
 * l'entrée KeyHost / Guest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Keywi — Vos clés, en lieu sûr",
    short_name: "Keywi",
    description:
      "Gérez vos clés par points relais : dépôts, codes de retrait et suivi en temps réel.",
    lang: "fr",
    start_url: "/espace",
    display: "standalone",
    background_color: "#FBFAF3",
    theme_color: "#3A5230",
    categories: ["business", "travel", "utilities"],
    icons: [
      { src: "/brand/app-icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/brand/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
