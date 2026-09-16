import type { Metadata } from "next";
import { FluxDepot } from "@/components/commercant/FluxDepot";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "Key drop-off" : "Dépôt d'une clé" };
}

/** Flux de dépôt : scan du badge → case attribuée → confirmation */
export default function PageDepot() {
  return <FluxDepot />;
}
