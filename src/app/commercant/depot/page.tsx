import type { Metadata } from "next";
import { FluxDepot } from "@/components/commercant/FluxDepot";

export const metadata: Metadata = { title: "Dépôt d'une clé" };

/** Flux de dépôt : scan du badge → case attribuée → confirmation */
export default function PageDepot() {
  return <FluxDepot />;
}
