import type { Metadata } from "next";
import { FluxRetrait } from "@/components/commercant/FluxRetrait";

export const metadata: Metadata = { title: "Retrait d'une clé" };

/** Flux de retrait : code à 6 caractères → case → re-scan croisé du badge */
export default function PageRetrait() {
  return <FluxRetrait />;
}
