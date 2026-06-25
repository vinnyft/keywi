"use client";

import { useState } from "react";
import { usePanierStore } from "@/lib/configurateur/store";

interface Props {
  sousTotal: number;
  nbArticles: number;
}

export function ChampPromo({ sousTotal, nbArticles }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const { promoValide, setPromo, setPromoCode } = usePanierStore();

  async function valider() {
    if (!code.trim()) return;
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/promo/valider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), sousTotal, nbArticles }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur ?? "Code invalide.");
        setPromo(null);
      } else {
        setPromo(data);
        setPromoCode(code.trim().toUpperCase());
      }
    } catch {
      setErreur("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  if (promoValide) {
    return (
      <div className="bg-[#e8f9f3] border border-[#0e7a5c] rounded p-3 text-sm flex justify-between items-center">
        <span className="text-[#0e7a5c] font-medium">{promoValide.description ?? "Promo appliquée"}</span>
        <button
          onClick={() => { setPromo(null); setPromoCode(""); setCode(""); }}
          className="text-[#6b6b6b] underline text-xs"
        >
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && valider()}
          placeholder="Code promo"
          className="flex-1 border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]"
        />
        <button
          onClick={valider}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium border border-[#0a0a0a] rounded hover:bg-[#0a0a0a] hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? "…" : "OK"}
        </button>
      </div>
      {erreur && <p className="text-xs text-[#c0392b]">{erreur}</p>}
    </div>
  );
}
