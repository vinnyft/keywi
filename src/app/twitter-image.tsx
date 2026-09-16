/**
 * Image de la carte Twitter/X : identique à l'Open Graph. On
 * réexporte le générateur pour ne maintenir qu'une seule carte —
 * Next émet alors `twitter:image` en plus de `og:image`.
 */
export { alt, size, contentType, default } from "./opengraph-image";
