/**
 * Configuration de l'internationalisation.
 *
 * Deux langues : le français (par défaut, sur les URLs nues —
 * « /tarifs ») et l'anglais (préfixé — « /en/tarifs »). Le proxy
 * réécrit en interne une URL nue vers /fr sans changer la barre
 * d'adresse ; l'anglais garde son préfixe visible. Choix assumé :
 * ne pas préfixer le français préserve les liens existants et le
 * référencement déjà en place.
 */

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_DEFAUT: Locale = "fr";

export function estLocale(valeur: string): valeur is Locale {
  return (LOCALES as readonly string[]).includes(valeur);
}

/** Libellés affichés dans le sélecteur de langue */
export const LIBELLE_LOCALE: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/**
 * Préfixe d'URL d'une locale : vide pour le français (URLs nues),
 * « /en » pour l'anglais.
 */
export function prefixe(locale: Locale): string {
  return locale === LOCALE_DEFAUT ? "" : `/${locale}`;
}

/**
 * Construit un lien tenant compte de la langue courante.
 * `localise("/tarifs", "en")` → « /en/tarifs » ; en français → « /tarifs ».
 * Les liens externes et les ancres sont renvoyés tels quels.
 */
export function localise(chemin: string, locale: Locale): string {
  if (!chemin.startsWith("/")) return chemin;
  const p = prefixe(locale);
  if (!p) return chemin;
  return chemin === "/" ? p : `${p}${chemin}`;
}

/**
 * Bloc `alternates` de métadonnées pour une page publique : lien
 * canonique dans la langue courante + variantes hreflang (fr, en,
 * x-default). `cheminNu` est le chemin sans préfixe (« /tarifs »).
 */
export function alternatesLangues(cheminNu: string, locale: Locale) {
  return {
    canonical: localise(cheminNu, locale),
    languages: {
      fr: cheminNu,
      en: localise(cheminNu, "en"),
      "x-default": cheminNu,
    },
  };
}

/**
 * Retire le préfixe de langue d'un chemin (« /en/tarifs » → « /tarifs »,
 * « /tarifs » → « /tarifs »). Utile côté proxy pour tester les zones
 * protégées indépendamment de la langue.
 */
export function retirerPrefixe(pathname: string): {
  locale: Locale;
  reste: string;
} {
  const seg = pathname.split("/")[1];
  if (estLocale(seg) && seg !== LOCALE_DEFAUT) {
    const reste = pathname.slice(`/${seg}`.length) || "/";
    return { locale: seg, reste };
  }
  return { locale: LOCALE_DEFAUT, reste: pathname };
}
