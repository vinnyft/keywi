import type { Locale } from "@/lib/i18n";
import { fr, type Dictionnaire } from "./fr";
import { en } from "./en";

/**
 * Dictionnaires de traduction. Objets de données simples (pas de
 * « server-only ») : un layout serveur charge le bon dictionnaire et
 * en passe les tranches utiles aux composants clients (en-tête,
 * sélecteur) via des props — le tout reste sérialisable.
 */
const DICTIONNAIRES: Record<Locale, Dictionnaire> = { fr, en };

export function getDictionnaire(locale: Locale): Dictionnaire {
  return DICTIONNAIRES[locale];
}

export type { Dictionnaire };
