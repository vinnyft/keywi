import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KUBE — Mobilier mosaïque sur-mesure",
    short_name: "KUBE",
    description: "Configurez votre meuble mosaïque sur-mesure en 3D.",
    lang: "fr",
    start_url: "/configurateur",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [{ src: "/favicon.ico", sizes: "any" }],
  };
}
