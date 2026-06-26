import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function CGVPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-black tracking-[-0.04em] mb-8">Conditions générales de vente</h1>
      <div className="space-y-6 text-[#1c1c1c] leading-relaxed text-sm">
        <section>
          <h2 className="text-lg font-bold mb-2">Article 1 — Objet</h2>
          <p>Les présentes CGV régissent les ventes de mobilier mosaïque sur-mesure réalisées sur le site KUBE. Toute commande implique l'acceptation sans réserve de ces conditions.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">Article 2 — Produits</h2>
          <p>Les produits KUBE sont fabriqués sur-mesure à partir de votre configuration. Les dimensions, couleurs et finitions correspondent exactement au rendu du configurateur 3D au moment de la commande.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">Article 3 — Prix</h2>
          <p>Les prix sont indiqués TTC (TVA 20 %). Le prix final est calculé côté serveur à partir de votre configuration et validé avant paiement.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">Article 4 — Délais de fabrication</h2>
          <p>La fabrication est lancée dès réception du paiement. Le délai standard est de 6 à 8 semaines. Vous serez informé par email à chaque changement de statut.</p>
        </section>
        <section>
          <h2 className="text-lg font-bold mb-2">Article 5 — Droit de rétractation</h2>
          <p>Conformément à l'article L121-21-8 du Code de la consommation, les produits fabriqués sur-mesure sont exclus du droit de rétractation. Toute commande confirmée est définitive.</p>
        </section>
      </div>
    </div>
  );
}
