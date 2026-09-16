"use client";

import { usePathname } from "next/navigation";
import { LOCALE_DEFAUT, estLocale, type Locale } from "@/lib/i18n";

/**
 * Langue courante côté client, déduite du premier segment de l'URL.
 * Le français vit sur des URLs nues, donc l'absence de préfixe (ou un
 * segment qui n'est pas une locale) signifie français.
 */
export function useLocale(): Locale {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/")[1];
  return estLocale(seg) ? seg : LOCALE_DEFAUT;
}
