"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Color, Settings, PricingTier, ColorSurcharge, ConfigMeuble } from "@/lib/supabase/types";
import { calculerPrix, type ResultatPrix } from "./pricing";
import type { MotifMosaique } from "./tiles";

// ────────── Configurateur state ──────────

export interface ConfigurateurState {
  // User inputs
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  hauteurCm: number;
  couleurs: string[];       // 1–4 hex
  couleurJoint: string;     // 1 hex
  motif: MotifMosaique;     // répartition des couleurs
  seed: number;

  // Loaded from DB
  settings: Settings | null;
  tileColors: Color[];
  groutColors: Color[];
  pricingTiers: PricingTier[];
  colorSurcharges: ColorSurcharge[];

  // Computed result
  resultat: ResultatPrix | null;

  // Actions
  setTaille: (v: number) => void;
  setNbLongueur: (v: number) => void;
  setNbLargeur: (v: number) => void;
  setHauteurCm: (v: number) => void;
  toggleCouleur: (hex: string) => void;
  setCouleurJoint: (hex: string) => void;
  setMotif: (motif: MotifMosaique) => void;
  regenererSeed: () => void;
  chargerConfig: (params: {
    settings: Settings;
    tileColors: Color[];
    groutColors: Color[];
    pricingTiers: PricingTier[];
    colorSurcharges: ColorSurcharge[];
  }) => void;
  restaurerConfig: (config: ConfigMeuble) => void;
}

function nouvelSeed() {
  return Math.floor(Math.random() * 0xffffff);
}

function recomputer(state: ConfigurateurState): ResultatPrix | null {
  if (!state.settings || !state.pricingTiers.length || !state.colorSurcharges.length) {
    return null;
  }
  return calculerPrix(
    {
      tailleCm: state.tailleCm,
      nbLongueur: state.nbLongueur,
      nbLargeur: state.nbLargeur,
      nbCouleurs: state.couleurs.length,
      hauteurCm: state.hauteurCm,
      dessousCarrelee: state.settings.dessous_carrelee,
    },
    state.pricingTiers,
    state.colorSurcharges,
    state.settings
  );
}

export const useConfigurateurStore = create<ConfigurateurState>()(
  (set, get) => ({
    tailleCm: 5,
    nbLongueur: 10,
    nbLargeur: 8,
    hauteurCm: 45,
    couleurs: ["#ECE5D8"],
    couleurJoint: "#F3EFE7",
    motif: "aleatoire",
    seed: nouvelSeed(),

    settings: null,
    tileColors: [],
    groutColors: [],
    pricingTiers: [],
    colorSurcharges: [],
    resultat: null,

    setTaille: (v) => {
      // Chaque dimension (nb carreaux × taille) reste bornée à 150 cm.
      const maxNb = Math.max(1, Math.floor(150 / v));
      const s = get();
      const nbLongueur = Math.min(s.nbLongueur, maxNb);
      const nbLargeur = Math.min(s.nbLargeur, maxNb);
      const hauteurCm = Math.min(s.hauteurCm, 150);
      const next = { ...s, tailleCm: v, nbLongueur, nbLargeur, hauteurCm };
      set({ tailleCm: v, nbLongueur, nbLargeur, hauteurCm, resultat: recomputer(next) });
    },
    setNbLongueur: (v) => {
      const next = { ...get(), nbLongueur: v };
      set({ nbLongueur: v, resultat: recomputer(next) });
    },
    setNbLargeur: (v) => {
      const next = { ...get(), nbLargeur: v };
      set({ nbLargeur: v, resultat: recomputer(next) });
    },
    setHauteurCm: (v) => {
      const next = { ...get(), hauteurCm: v };
      set({ hauteurCm: v, resultat: recomputer(next) });
    },
    toggleCouleur: (hex) => {
      const current = get().couleurs;
      let next: string[];
      if (current.includes(hex)) {
        next = current.length > 1 ? current.filter((c) => c !== hex) : current;
      } else {
        next = current.length < 4 ? [...current, hex] : current;
      }
      const nextState = { ...get(), couleurs: next };
      set({ couleurs: next, resultat: recomputer(nextState) });
    },
    setCouleurJoint: (hex) => set({ couleurJoint: hex }),
    setMotif: (motif) => set({ motif }),
    regenererSeed: () => set({ seed: nouvelSeed() }),

    chargerConfig: ({ settings, tileColors, groutColors, pricingTiers, colorSurcharges }) => {
      const defaultTile = tileColors[0]?.hex ?? "#ECE5D8";
      const defaultGrout = groutColors[0]?.hex ?? "#F3EFE7";
      const current = get();
      const nextState = {
        ...current,
        settings,
        tileColors,
        groutColors,
        pricingTiers,
        colorSurcharges,
        hauteurCm: current.hauteurCm !== 45 ? current.hauteurCm : settings.hauteur_fixe_cm,
        couleurs: current.couleurs.length ? current.couleurs : [defaultTile],
        couleurJoint: current.couleurJoint === "#888888" ? defaultGrout : current.couleurJoint,
      };
      set({ ...nextState, resultat: recomputer(nextState) });
    },

    restaurerConfig: (config) => {
      const current = get();
      const nextState = {
        ...current,
        tailleCm: config.tailleCm,
        nbLongueur: config.nbLongueur,
        nbLargeur: config.nbLargeur,
        couleurs: config.couleurs,
        couleurJoint: config.couleurJoint,
        motif: config.motif ?? "aleatoire",
        seed: config.seed,
      };
      set({ ...nextState, resultat: recomputer(nextState) });
    },
  })
);

// ────────── Panier state ──────────

export interface PanierItem {
  id: string;
  config: ConfigMeuble;
  resultat: ResultatPrix;
  quantite: number;
}

export interface PanierState {
  items: PanierItem[];
  promoCode: string;
  promoValide: { id: string; type: string; valeur: number; description: string | null } | null;
  ajouterItem: (config: ConfigMeuble, resultat: ResultatPrix) => void;
  supprimerItem: (id: string) => void;
  changerQuantite: (id: string, quantite: number) => void;
  setPromo: (promo: PanierState["promoValide"]) => void;
  setPromoCode: (code: string) => void;
  vider: () => void;
  totalArticles: () => number;
  sousTotal: () => number;
}

export const usePanierStore = create<PanierState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: "",
      promoValide: null,

      ajouterItem: (config, resultat) =>
        set((s) => ({
          items: [
            ...s.items,
            { id: crypto.randomUUID(), config, resultat, quantite: 1 },
          ],
        })),

      supprimerItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      changerQuantite: (id, quantite) =>
        set((s) => ({
          items: quantite <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => (i.id === id ? { ...i, quantite } : i)),
        })),

      setPromo: (promo) => set({ promoValide: promo }),
      setPromoCode: (code) => set({ promoCode: code }),
      vider: () => set({ items: [], promoCode: "", promoValide: null }),

      totalArticles: () => get().items.reduce((s, i) => s + i.quantite, 0),
      sousTotal: () =>
        get().items.reduce((s, i) => s + i.resultat.prixTTC * i.quantite, 0),
    }),
    {
      name: "kube-panier",
      skipHydration: true,
    }
  )
);
