import type { PricingTier, ColorSurcharge, Settings } from "@/lib/supabase/types";

export interface PrixConfig {
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  nbCouleurs: number;
  hauteurCm: number;
  dessousCarrelee: boolean;
}

export interface ResultatPrix {
  longueurCm: number;
  largeurCm: number;
  hauteurCm: number;
  nbCarreauHauteur: number;
  nbCarreauxTotal: number;
  surfaceM2: number;
  prixParM2: number;
  surchargeCouleursPct: number;
  coutFixe: number;
  prixHT: number;
  prixTTC: number; // TVA 20%
}

export function calculerPrix(
  config: PrixConfig,
  tiers: PricingTier[],
  surcharges: ColorSurcharge[],
  settings: Settings
): ResultatPrix {
  const { tailleCm, nbLongueur, nbLargeur, nbCouleurs, hauteurCm, dessousCarrelee } = config;

  const longueurCm = nbLongueur * tailleCm;
  const largeurCm = nbLargeur * tailleCm;
  const nbCarreauHauteur = Math.round(hauteurCm / tailleCm);

  // Comptage total des carreaux
  const carreauxDessus = nbLongueur * nbLargeur;
  const carreauxDessous = dessousCarrelee ? nbLongueur * nbLargeur : 0;
  const carreauxFacesLongueur = 2 * nbLongueur * nbCarreauHauteur;
  const carreauxFacesLargeur = 2 * nbLargeur * nbCarreauHauteur;
  const nbCarreauxTotal = carreauxDessus + carreauxDessous + carreauxFacesLongueur + carreauxFacesLargeur;

  // Surface en m²
  const cm2Tom2 = (cm: number) => cm / 100;
  const surfaceDessus = cm2Tom2(longueurCm) * cm2Tom2(largeurCm);
  const surfaceDessous = dessousCarrelee ? surfaceDessus : 0;
  const surfaceFacesLongueur = 2 * cm2Tom2(longueurCm) * cm2Tom2(hauteurCm);
  const surfaceFacesLargeur = 2 * cm2Tom2(largeurCm) * cm2Tom2(hauteurCm);
  const surfaceM2 = surfaceDessus + surfaceDessous + surfaceFacesLongueur + surfaceFacesLargeur;

  // Prix par m² selon palier de taille
  const tier = tiers
    .sort((a, b) => a.taille_min_cm - b.taille_min_cm)
    .find((t) => tailleCm >= t.taille_min_cm && tailleCm <= t.taille_max_cm)
    ?? tiers.sort((a, b) => a.taille_min_cm - b.taille_min_cm)[0];

  const prixParM2 = tier?.prix_par_m2 ?? 480;

  // Surcharge couleurs
  const surcharge = surcharges.find((s) => s.nb_couleurs === nbCouleurs);
  const surchargeCouleursPct = (surcharge?.surcharge_pct ?? 0) / 100;

  const coutFixe = settings.cout_fixe;

  const prixHT = surfaceM2 * prixParM2 * (1 + surchargeCouleursPct) + coutFixe;
  const prixTTC = prixHT * 1.2;

  return {
    longueurCm,
    largeurCm,
    hauteurCm,
    nbCarreauHauteur,
    nbCarreauxTotal,
    surfaceM2: Math.round(surfaceM2 * 1000) / 1000,
    prixParM2,
    surchargeCouleursPct,
    coutFixe,
    prixHT: Math.round(prixHT * 100) / 100,
    prixTTC: Math.round(prixTTC * 100) / 100,
  };
}

// Déterminer les frais de livraison
export function calculerLivraison(
  montantTTC: number,
  settings: Settings
): number {
  if (
    settings.seuil_livraison_gratuite !== null &&
    montantTTC >= settings.seuil_livraison_gratuite
  ) {
    return 0;
  }
  return settings.forfait_livraison;
}
