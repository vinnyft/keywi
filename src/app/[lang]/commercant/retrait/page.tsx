import type { Metadata } from "next";
import { FluxRetrait } from "@/components/commercant/FluxRetrait";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "Key pickup" : "Retrait d'une clé" };
}

/** Flux de retrait : code à 6 caractères → case → re-scan croisé du badge */
export default function PageRetrait() {
  return <FluxRetrait />;
}
