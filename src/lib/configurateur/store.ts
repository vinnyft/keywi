"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Color, Settings, PricingTier, ColorSurcharge, ConfigMeuble } from "@/lib/supabase/types";
import { calculerPrix, type ResultatPrix } from "./pricing";

// ────────── Configurateur state ──────────

export interface ConfigurateurState {
  // User inputs
  tailleCm: number;
  nbLongueur: number;
  nbLargeur: number;
  hauteurCm: number;
  couleurs: string[];       // 1–4 hex
  couleurJoint: string;     // 1 hex
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
    couleurs: ["#F5F0E8"],
    couleurJoint: "#888888",
    seed: nouvelSeed(),

    settings: null,
    tileColors: [],
    groutColors: [],
    pricingTiers: [],
    colorSurcharges: [],
    resultat: null,

    setTaille: (v) => {
      const next = { ...get(), tailleCm: v };
      set({ tailleCm: v, resultat: recomputer(next) });
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
    regenererSeed: () => set({ seed: nouvelSeed() }),

    chargerConfig: ({ settings, tileColors, groutColors, pricingTiers, colorSurcharges }) => {
      const defaultTile = tileColors[0]?.hex ?? "#F5F0E8";
      const defaultGrout = groutColors.find((c) => c.nom.includes("Gris"))?.hex ?? "#888888";
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
        couleurJoint: current.couleurJoint !== "#888888" ? current.couleurJoint : defaultGrout,
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
