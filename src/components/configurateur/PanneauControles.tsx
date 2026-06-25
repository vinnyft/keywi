"use client";

import { useConfigurateurStore } from "@/lib/configurateur/store";
import type { Color } from "@/lib/supabase/types";

function BoutonQte({
  value,
  onChange,
  min = 1,
  max = 50,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded text-lg font-medium hover:bg-[#f5f5f5] transition-colors"
        aria-label="Diminuer"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="w-14 text-center border border-[#e5e5e5] rounded py-1 text-sm font-medium focus:outline-none focus:border-[#1a56db]"
        min={min}
        max={max}
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] rounded text-lg font-medium hover:bg-[#f5f5f5] transition-colors"
        aria-label="Augmenter"
      >
        +
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest text-[#6b6b6b] mb-3 font-medium">
      {children}
    </p>
  );
}

export function PanneauControles() {
  const {
    tailleCm, setTaille,
    nbLongueur, setNbLongueur,
    nbLargeur, setNbLargeur,
    couleurs, toggleCouleur,
    couleurJoint, setCouleurJoint,
    tileColors, groutColors,
    settings,
    regenererSeed,
  } = useConfigurateurStore();

  const hauteurCm = settings?.hauteur_fixe_cm ?? 45;

  return (
    <div className="space-y-8">
      {/* Taille carreau */}
      <div>
        <SectionLabel>Taille du carreau</SectionLabel>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={tailleCm}
            onChange={(e) => setTaille(Number(e.target.value))}
            className="flex-1 accent-[#0a0a0a]"
          />
          <span className="w-16 text-right text-sm font-semibold text-[#0a0a0a]">
            {tailleCm} cm
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-[#6b6b6b] mt-1">
          <span>1 cm</span>
          <span>10 cm</span>
        </div>
      </div>

      {/* Nombre de carreaux longueur */}
      <div>
        <SectionLabel>Carreaux en longueur</SectionLabel>
        <BoutonQte value={nbLongueur} onChange={setNbLongueur} min={2} max={60} />
        <p className="text-xs text-[#6b6b6b] mt-1">→ {(nbLongueur * tailleCm)} cm</p>
      </div>

      {/* Nombre de carreaux largeur */}
      <div>
        <SectionLabel>Carreaux en largeur</SectionLabel>
        <BoutonQte value={nbLargeur} onChange={setNbLargeur} min={2} max={60} />
        <p className="text-xs text-[#6b6b6b] mt-1">→ {(nbLargeur * tailleCm)} cm</p>
      </div>

      {/* Hauteur fixe */}
      <div>
        <SectionLabel>Hauteur</SectionLabel>
        <p className="text-sm font-semibold text-[#0a0a0a]">{hauteurCm} cm</p>
        <p className="text-xs text-[#6b6b6b]">Définie par KUBE</p>
      </div>

      {/* Couleurs carreaux */}
      <div>
        <SectionLabel>Couleur(s) des carreaux (1 à 4)</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {tileColors.map((color: Color) => {
            const selected = couleurs.includes(color.hex);
            return (
              <button
                key={color.id}
                onClick={() => toggleCouleur(color.hex)}
                title={color.nom}
                className={`w-10 h-10 rounded-sm border-2 transition-all ${
                  selected
                    ? "border-[#1a56db] scale-110 shadow-md"
                    : "border-transparent hover:border-[#6b6b6b]"
                }`}
                style={{ backgroundColor: color.hex }}
                aria-pressed={selected}
                aria-label={color.nom}
              />
            );
          })}
        </div>
        {couleurs.length > 1 && (
          <button
            onClick={regenererSeed}
            className="mt-2 text-xs text-[#6b6b6b] underline hover:text-[#0a0a0a] transition-colors"
          >
            Mélanger différemment
          </button>
        )}
      </div>

      {/* Couleur joint */}
      <div>
        <SectionLabel>Couleur du joint</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {groutColors.map((color: Color) => {
            const selected = couleurJoint === color.hex;
            return (
              <button
                key={color.id}
                onClick={() => setCouleurJoint(color.hex)}
                title={color.nom}
                className={`w-10 h-10 rounded-sm border-2 transition-all ${
                  selected
                    ? "border-[#1a56db] scale-110 shadow-md"
                    : "border-transparent hover:border-[#6b6b6b]"
                }`}
                style={{ backgroundColor: color.hex }}
                aria-pressed={selected}
                aria-label={color.nom}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
