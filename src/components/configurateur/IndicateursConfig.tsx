"use client";

import type { ResultatPrix } from "@/lib/configurateur/pricing";

interface Props {
  resultat: ResultatPrix | null;
  loading?: boolean;
}

export function IndicateursConfig({ resultat, loading }: Props) {
  if (!resultat) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
      <div className="p-4 border border-[#e5e5e5] rounded">
        <p className="text-[11px] uppercase tracking-widest text-[#6b6b6b] mb-1">Dimensions</p>
        <p className="font-semibold text-sm text-[#0a0a0a]">
          {Math.round(resultat.longueurCm)} × {Math.round(resultat.largeurCm)} × {Math.round(resultat.hauteurCm)} cm
        </p>
      </div>
      <div className="p-4 border border-[#e5e5e5] rounded">
        <p className="text-[11px] uppercase tracking-widest text-[#6b6b6b] mb-1">Carreaux</p>
        <p className="font-semibold text-sm text-[#0a0a0a]">
          {resultat.nbCarreauxTotal.toLocaleString("fr-FR")}
        </p>
      </div>
      <div className="p-4 border border-[#e5e5e5] rounded">
        <p className="text-[11px] uppercase tracking-widest text-[#6b6b6b] mb-1">Surface</p>
        <p className="font-semibold text-sm text-[#0a0a0a]">
          {resultat.surfaceM2.toFixed(2)} m²
        </p>
      </div>
      <div className="p-4 border border-[#1a56db] rounded bg-[#eff4ff]">
        <p className="text-[11px] uppercase tracking-widest text-[#1a56db] mb-1">Prix TTC</p>
        <p className={`font-bold text-lg text-[#0a0a0a] ${loading ? "opacity-50" : ""}`}>
          {fmt(resultat.prixTTC)}
        </p>
      </div>
    </div>
  );
}
