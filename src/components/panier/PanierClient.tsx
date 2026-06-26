"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePanierStore } from "@/lib/configurateur/store";
import { ChampPromo } from "./ChampPromo";

interface Props {
  forfaitLivraison: number;
  seuilGratuite: number | null;
}

export function PanierClient({ forfaitLivraison, seuilGratuite }: Props) {
  const { items, supprimerItem, changerQuantite, promoValide, sousTotal } = usePanierStore();
  const router = useRouter();

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  const totalTTC = sousTotal();
  const livraison = seuilGratuite !== null && totalTTC >= seuilGratuite ? 0 : forfaitLivraison;

  let remise = 0;
  if (promoValide) {
    if (promoValide.type === "pourcentage") remise = totalTTC * (promoValide.valeur / 100);
    else if (promoValide.type === "montant_fixe") remise = promoValide.valeur;
    else if (promoValide.type === "livraison_gratuite") remise = livraison;
  }

  const totalFinal = Math.max(0, totalTTC + livraison - remise);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl font-black tracking-[-0.04em] mb-4">Panier vide</h1>
        <p className="text-[#6b6b6b] mb-8">Aucune configuration dans votre panier.</p>
        <Link href="/configurateur" className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors">
          Configurer un meuble
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black tracking-[-0.04em] mb-8">Panier</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Articles */}
        <div className="flex-1 space-y-4">
          {items.map((item) => {
            const cfg = item.config;
            return (
              <div key={item.id} className="border border-[#e5e5e5] rounded p-6 flex gap-4">
                {/* Mini palette */}
                <div className="w-12 h-12 rounded-sm border border-[#e5e5e5] flex flex-wrap overflow-hidden shrink-0">
                  {cfg.couleurs.slice(0, 4).map((hex, i) => (
                    <div key={i} className="w-1/2 h-1/2" style={{ backgroundColor: hex }} />
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0a0a0a]">
                    {Math.round(item.resultat.longueurCm)} × {Math.round(item.resultat.largeurCm)} × {Math.round(item.resultat.hauteurCm)} cm
                  </p>
                  <p className="text-sm text-[#6b6b6b]">
                    Carreau {cfg.tailleCm} cm · {cfg.couleurs.length} couleur{cfg.couleurs.length > 1 ? "s" : ""} · {item.resultat.nbCarreauxTotal} carreaux
                  </p>
                  <p className="text-sm text-[#6b6b6b]">{item.resultat.surfaceM2.toFixed(2)} m²</p>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => changerQuantite(item.id, item.quantite - 1)} className="w-7 h-7 border border-[#e5e5e5] rounded text-sm hover:bg-[#f5f5f5]">−</button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantite}</span>
                      <button onClick={() => changerQuantite(item.id, item.quantite + 1)} className="w-7 h-7 border border-[#e5e5e5] rounded text-sm hover:bg-[#f5f5f5]">+</button>
                    </div>
                    <button onClick={() => supprimerItem(item.id)} className="text-xs text-[#6b6b6b] underline hover:text-[#c0392b] transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-[#0a0a0a]">{fmt(item.resultat.prixTTC * item.quantite)}</p>
                  {item.quantite > 1 && (
                    <p className="text-xs text-[#6b6b6b]">{fmt(item.resultat.prixTTC)} / pièce</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Récap */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="border border-[#e5e5e5] rounded p-6 space-y-4 sticky top-24">
            <h2 className="font-bold text-[#0a0a0a]">Récapitulatif</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b6b6b]">Sous-total</span>
                <span>{fmt(totalTTC)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6b6b]">Livraison</span>
                <span>{livraison === 0 ? "Offerte" : fmt(livraison)}</span>
              </div>
              {remise > 0 && (
                <div className="flex justify-between text-[#0e7a5c]">
                  <span>Code promo</span>
                  <span>−{fmt(remise)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-[#e5e5e5] pt-4 flex justify-between font-bold">
              <span>Total TTC</span>
              <span>{fmt(totalFinal)}</span>
            </div>

            <ChampPromo sousTotal={totalTTC} nbArticles={items.reduce((s, i) => s + i.quantite, 0)} />

            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-4 text-sm font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors"
            >
              Commander →
            </button>

            <Link href="/configurateur" className="block text-center text-xs text-[#6b6b6b] underline hover:text-[#0a0a0a] transition-colors">
              Ajouter un meuble
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
