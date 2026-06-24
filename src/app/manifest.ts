import type { MetadataRoute } from "next";

/**
 * Manifeste PWA : l'application KLAV s'installe sur l'écran
 * d'accueil (mobile et desktop) et s'ouvre en plein écran sur
 * l'entrée KeyHost / Guest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KLAV — Vos clés, en lieu sûr",
    short_name: "KLAV",
    description:
      "Gérez vos clés par points relais : dépôts, codes de retrait et suivi en temps réel.",
    lang: "fr",
    start_url: "/espace",
    display: "standalone",
    background_color: "#F7F6F2",
    theme_color: "#101B33",
    categories: ["business", "travel", "utilities"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icone-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
