"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type CarteRelais from "./CarteRelais";

/**
 * Enveloppe « client only » de la carte Leaflet : `ssr: false`
 * empêche le rendu serveur (Leaflet a besoin de `window`).
 */
const Carte = dynamic(() => import("./CarteRelais"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-2xl bg-sable text-gray-500"
      style={{ minHeight: 320, height: "100%" }}
    >
      Chargement de la carte…
    </div>
  ),
});

export function CarteRelaisDynamique(props: ComponentProps<typeof CarteRelais>) {
  return <Carte {...props} />;
}
