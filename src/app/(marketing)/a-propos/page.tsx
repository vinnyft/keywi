import type { Metadata } from "next";

export const metadata: Metadata = { title: "Concept" };

export default function AProposPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-black tracking-[-0.04em] mb-8">Le concept KUBE</h1>
      <div className="space-y-6 text-[#1c1c1c] leading-relaxed">
        <p className="text-xl font-light">
          KUBE est née d'une obsession : le mobilier devrait être aussi précis qu'une conviction.
        </p>
        <p>
          Nos meubles sont des pavés — formes pures, angles droits, proportions maîtrisées.
          Pas de détail superflu. Juste la matière, la couleur, et la lumière qui joue sur les joints.
        </p>
        <p>
          La mosaïque n'est pas un habillage. C'est la structure même de l'objet : chaque carreau
          posé à la main, chaque joint tracé au millimètre, chaque surface pensée pour durer des décennies.
        </p>
        <p>
          Le configurateur 3D n'est pas un outil de vente. C'est le plan de fabrication.
          Ce que vous composez à l'écran, c'est exactement ce que nos artisans réalisent.
        </p>
        <h2 className="text-2xl font-bold mt-12 mb-4">Fabriqué en France</h2>
        <p>
          Notre atelier est en France. Les matériaux sont sourcés en Europe.
          Les délais sont de 6 à 8 semaines.
        </p>
      </div>
    </div>
  );
}
