/**
 * URL de production canonique du site.
 *
 * Sert de base aux métadonnées SEO : `metadataBase`, liens canoniques,
 * sitemap et robots. Distincte de `NEXT_PUBLIC_SITE_URL` (qui vaut
 * `http://localhost:3000` en développement et sert aux liens des
 * emails) : un canonique ou un sitemap ne doivent jamais pointer vers
 * localhost. On n'accepte donc `NEXT_PUBLIC_SITE_URL` que s'il s'agit
 * d'une URL https ; sinon on retombe sur le domaine de la marque.
 *
 * En production : définir `NEXT_PUBLIC_SITE_URL=https://keywe.io`.
 */
const brut = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL =
  brut && brut.startsWith("https://")
    ? brut.replace(/\/+$/, "")
    : "https://keywe.io";
