import "server-only";

/**
 * Géocodage via l'API Adresse (Base Adresse Nationale, service
 * public français) : gratuite, sans clé, et bien plus précise que
 * les géocodeurs génériques sur les adresses françaises.
 *
 * https://adresse.data.gouv.fr/api-doc/adresse
 */

export interface Coordonnees {
  lat: number;
  lng: number;
  /** Score de confiance BAN, de 0 à 1 */
  score: number;
  /** Libellé normalisé retourné par la BAN */
  adresseNormalisee: string;
}

/** Repli : centre de Paris, si la BAN ne trouve rien */
const PARIS: Coordonnees = {
  lat: 48.8566,
  lng: 2.3522,
  score: 0,
  adresseNormalisee: "",
};

export async function geocoder(
  adresse: string,
  codePostal: string,
  ville: string
): Promise<Coordonnees> {
  const requete = `${adresse} ${codePostal} ${ville}`.trim();
  const url =
    "https://api-adresse.data.gouv.fr/search/?" +
    new URLSearchParams({ q: requete, postcode: codePostal, limit: "1" });

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Une adresse ne bouge pas : on peut mettre en cache une journée
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return PARIS;

    const data = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { score?: number; label?: string };
      }>;
    };

    const f = data.features?.[0];
    const coords = f?.geometry?.coordinates;
    if (!coords) return PARIS;

    // La BAN renvoie [longitude, latitude] — l'ordre GeoJSON
    return {
      lng: coords[0],
      lat: coords[1],
      score: f?.properties?.score ?? 0,
      adresseNormalisee: f?.properties?.label ?? "",
    };
  } catch {
    // Un géocodage raté ne doit pas bloquer la validation :
    // l'admin pourra corriger les coordonnées ensuite
    return PARIS;
  }
}
