"use client";

import { useConfigurateurStore } from "@/lib/configurateur/store";
import { getPaletteByFamily } from "@/lib/configurateur/palette";
import type { MotifMosaique } from "@/lib/configurateur/tiles";

const MOTIFS: { id: MotifMosaique; label: string }[] = [
  { id: "aleatoire", label: "Aléatoire" },
  { id: "lignes", label: "Lignes" },
  { id: "croise", label: "Croisé" },
  { id: "uni", label: "Uni" },
  { id: "accent", label: "Accent" },
];

// Mini aperçu 4×4 du motif avec les couleurs choisies (2 couleurs de
// démonstration si moins de 2 sélectionnées).
function MotifPreview({ motif, couleurs }: { motif: MotifMosaique; couleurs: string[] }) {
  const palette = couleurs.length >= 2 ? couleurs : ["#cfcabd", "#7d8a99"];
  const nb = palette.length;
  const N = 4;
  const cells: string[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let c: string;
      switch (motif) {
        case "uni":
          c = palette[0];
          break;
        case "lignes":
          c = palette[y % nb];
          break;
        case "croise":
          c = palette[(x + y) % nb];
          break;
        case "accent":
          c = (x === 1 && y === 2) || (x === 3 && y === 0) ? palette[1] : palette[0];
          break;
        default: // aléatoire — motif fixe pour l'aperçu
          c = palette[(x * 2 + y * 3 + (x ^ y)) % nb];
      }
      cells.push(c);
    }
  }
  return (
    <div
      className="grid gap-px rounded-sm overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${N}, 1fr)`, width: 32, height: 32, background: "#e8e4da" }}
    >
      {cells.map((c, i) => (
        <span key={i} style={{ background: c }} />
      ))}
    </div>
  );
}

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
    hauteurCm, setHauteurCm,
    couleurs, toggleCouleur,
    couleurJoint, setCouleurJoint,
    motif, setMotif,
    groutColors,
    regenererSeed,
  } = useConfigurateurStore();

  const FALLBACK_GROUT_COLORS = [
    { id: "g1", hex: "#F3EFE7", nom: "Joint Ivoire" },
    { id: "g2", hex: "#FFFFFF", nom: "Joint Blanc" },
    { id: "g3", hex: "#C8B89A", nom: "Joint Sable" },
    { id: "g4", hex: "#808080", nom: "Joint Gris" },
    { id: "g5", hex: "#333333", nom: "Joint Anthracite" },
    { id: "g6", hex: "#111111", nom: "Joint Noir" },
  ];

  const grouts = groutColors.length ? groutColors : FALLBACK_GROUT_COLORS;
  const paletteGrouped = getPaletteByFamily();

  // Bornes : chaque dimension (nb carreaux × taille) reste ≤ 150 cm.
  const maxNb = Math.max(1, Math.floor(150 / tailleCm));

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
        <BoutonQte value={nbLongueur} onChange={setNbLongueur} min={1} max={maxNb} />
        <p className="text-xs text-[#6b6b6b] mt-1">→ {(nbLongueur * tailleCm)} cm</p>
      </div>

      {/* Nombre de carreaux largeur */}
      <div>
        <SectionLabel>Carreaux en largeur</SectionLabel>
        <BoutonQte value={nbLargeur} onChange={setNbLargeur} min={1} max={maxNb} />
        <p className="text-xs text-[#6b6b6b] mt-1">→ {(nbLargeur * tailleCm)} cm</p>
      </div>

      {/* Hauteur */}
      <div>
        <SectionLabel>Hauteur</SectionLabel>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={150}
            step={1}
            value={hauteurCm}
            onChange={(e) => setHauteurCm(Number(e.target.value))}
            className="flex-1 accent-[#0a0a0a]"
          />
          <span className="w-16 text-right text-sm font-semibold text-[#0a0a0a]">
            {hauteurCm} cm
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-[#6b6b6b] mt-1">
          <span>1 cm</span>
          <span>150 cm</span>
        </div>
      </div>

      {/* Couleurs carreaux — palette complète groupée par famille */}
      <div>
        <SectionLabel>Couleur(s) des carreaux (1 à 4)</SectionLabel>
        <div className="space-y-3">
          {paletteGrouped.map(({ family, label, couleurs: familyCouleurs }) => (
            <div key={family}>
              <p className="text-[10px] text-[#9b9b9b] uppercase tracking-wider mb-1.5">
                {label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {familyCouleurs.map((color) => {
                  const selected = couleurs.includes(color.hex);
                  return (
                    <div key={color.hex} className="relative">
                      <button
                        onClick={() => toggleCouleur(color.hex)}
                        title={color.name}
                        className={`w-8 h-8 rounded-sm border-2 transition-all ${
                          selected
                            ? "border-[#1a56db] scale-110 shadow-md"
                            : "border-transparent hover:border-[#6b6b6b]"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        aria-pressed={selected}
                        aria-label={color.name}
                      />
                      {color.isNew && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#1a56db]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {motif === "aleatoire" && couleurs.length > 1 && (
          <button
            onClick={regenererSeed}
            className="mt-3 text-xs text-[#6b6b6b] underline hover:text-[#0a0a0a] transition-colors"
          >
            Mélanger différemment
          </button>
        )}
      </div>

      {/* Motif de répartition */}
      <div>
        <SectionLabel>Disposition des couleurs</SectionLabel>
        <div className="grid grid-cols-5 gap-2">
          {MOTIFS.map((m) => {
            const selected = motif === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMotif(m.id)}
                title={m.label}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-md border-2 transition-all ${
                  selected
                    ? "border-[#1a56db] bg-[#f0f5ff]"
                    : "border-[#e5e5e5] hover:border-[#9b9b9b]"
                }`}
              >
                <MotifPreview motif={m.id} couleurs={couleurs} />
                <span className="text-[9px] leading-tight text-center text-[#4b4b4b]">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
        {couleurs.length < 2 && (
          <p className="text-[11px] text-[#9b9b9b] mt-2">
            Choisissez au moins 2 couleurs pour voir les dispositions.
          </p>
        )}
      </div>

      {/* Couleur joint */}
      <div>
        <SectionLabel>Couleur du joint</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {grouts.map((color) => {
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
