"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePanierStore } from "@/lib/configurateur/store";

export default function CheckoutPage() {
  const { items, promoValide, promoCode, sousTotal, vider } = usePanierStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  async function payer() {
    if (items.length === 0) return;
    setLoading(true);
    setErreur("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            config: i.config,
            quantite: i.quantite,
          })),
          promoCode: promoValide ? promoCode : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.erreur ?? "Erreur lors du paiement.");
        return;
      }
      if (data.url) {
        router.push(data.url);
      } else if (data.simule) {
        // Mode sans Stripe
        vider();
        router.push(`/confirmation?order=${data.orderId}`);
      }
    } catch {
      setErreur("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/panier");
  }, [hydrated, items.length, router]);

  const totalTTC = sousTotal();
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  if (!hydrated || items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-[#6b6b6b]">Chargement…</p>
        <Link href="/panier" className="text-sm text-[#1a56db] underline mt-4 block">← Retour au panier</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-3xl font-black tracking-[-0.04em] mb-8">Paiement</h1>

      <div className="border border-[#e5e5e5] rounded p-6 mb-6 space-y-3 text-sm">
        <h2 className="font-semibold text-[#0a0a0a]">Votre commande</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-[#1c1c1c]">
            <span>
              {Math.round(item.resultat.longueurCm)} × {Math.round(item.resultat.largeurCm)} × {Math.round(item.resultat.hauteurCm)} cm × {item.quantite}
            </span>
            <span className="font-medium">{fmt(item.resultat.prixTTC * item.quantite)}</span>
          </div>
        ))}
        <div className="border-t border-[#e5e5e5] pt-3 flex justify-between font-bold">
          <span>Total TTC (estimé)</span>
          <span>{fmt(totalTTC)}</span>
        </div>
        <p className="text-[10px] text-[#6b6b6b]">Le total final est calculé et validé côté serveur avant débit.</p>
      </div>

      {erreur && (
        <p className="text-sm text-[#c0392b] mb-4 p-3 bg-[#fdecea] rounded">{erreur}</p>
      )}

      <button
        onClick={payer}
        disabled={loading}
        className="w-full py-4 text-base font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Redirection…" : "Payer en sécurité →"}
      </button>

      <p className="text-xs text-center text-[#6b6b6b] mt-4">
        Paiement sécurisé par Stripe · Données chiffrées SSL
      </p>
    </div>
  );
}
