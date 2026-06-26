import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-black tracking-[-0.04em] mb-8">Mentions légales</h1>
      <div className="space-y-4 text-sm text-[#1c1c1c] leading-relaxed">
        <p><strong>Éditeur :</strong> KUBE SAS — [adresse]</p>
        <p><strong>Directeur de la publication :</strong> [nom]</p>
        <p><strong>Hébergement :</strong> Vercel Inc. — 340 Pine Street, San Francisco, CA 94104</p>
        <p><strong>Contact :</strong> bonjour@kube.fr</p>
        <p>Les données personnelles collectées lors d'une commande sont utilisées exclusivement pour le traitement et le suivi de celle-ci, conformément au RGPD.</p>
      </div>
    </div>
  );
}
