"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useConfigurateurStore, usePanierStore } from "@/lib/configurateur/store";
import type { Settings, Color, PricingTier, ColorSurcharge } from "@/lib/supabase/types";
import { PanneauControles } from "./PanneauControles";
import { IndicateursConfig } from "./IndicateursConfig";

const ConfigurateurScene = dynamic(
  () => import("./ConfigurateurScene").then((m) => m.ConfigurateurScene),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#f5f5f5] animate-pulse rounded" /> }
);

interface Props {
  settings: Settings;
  tileColors: Color[];
  groutColors: Color[];
  pricingTiers: PricingTier[];
  colorSurcharges: ColorSurcharge[];
}

export function ConfigurateurClient({ settings, tileColors, groutColors, pricingTiers, colorSurcharges }: Props) {
  const {
    tailleCm, nbLongueur, nbLargeur, hauteurCm, couleurs, couleurJoint, seed, resultat,
    chargerConfig,
  } = useConfigurateurStore();
  const ajouterItem = usePanierStore((s) => s.ajouterItem);

  useEffect(() => {
    chargerConfig({ settings, tileColors, groutColors, pricingTiers, colorSurcharges });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nbHauteur = Math.max(1, Math.round(hauteurCm / tailleCm));

  function ajouterAuPanier() {
    if (!resultat) return;
    ajouterItem(
      {
        tailleCm, nbLongueur, nbLargeur, couleurs, couleurJoint, seed,
        hauteurCm,
      },
      resultat
    );
    // Toast feedback — simple alert pour l'instant
    alert("Configuration ajoutée au panier !");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* 3D Canvas */}
      <div className="flex-1 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] bg-white flex flex-col">
        <div className="flex-1" style={{ minHeight: 400 }}>
          <ConfigurateurScene
            tailleCm={tailleCm}
            nbLongueur={nbLongueur}
            nbLargeur={nbLargeur}
            nbHauteur={nbHauteur}
            couleurs={couleurs}
            couleurJoint={couleurJoint}
            seed={seed}
            dessousCarrelee={settings.dessous_carrelee}
          />
        </div>
        {/* Indicateurs sous le cube */}
        <div className="p-6 border-t border-[#e5e5e5]">
          <IndicateursConfig resultat={resultat} />
        </div>
      </div>

      {/* Panneau contrôles */}
      <div className="w-full lg:w-[420px] border-l border-[#e5e5e5] overflow-y-auto">
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.03em] text-[#0a0a0a]">Configurer</h1>
            <p className="text-sm text-[#6b6b6b] mt-1">Composez votre meuble mosaïque sur-mesure.</p>
          </div>

          <PanneauControles />

          <div className="pt-4 border-t border-[#e5e5e5]">
            <button
              onClick={ajouterAuPanier}
              disabled={!resultat}
              className="w-full py-4 px-6 text-base font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ajouter au panier
              {resultat && (
                <span className="ml-2 font-light">
                  — {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(resultat.prixTTC)}
                </span>
              )}
            </button>
            <p className="text-xs text-[#6b6b6b] text-center mt-3">
              Prix TTC · TVA 20 % · Livraison calculée au panier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
