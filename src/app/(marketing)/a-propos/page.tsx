import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos",
  description: "La mission de Keywi : rendre la remise de clés simple et sûre.",
};

export default function PageAPropos() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">À propos de Keywi</h1>
      <div className="mt-6 space-y-4 text-lg text-gray-700">
        <p>
          Keywi est né d&apos;un constat simple : remettre des clés ne devrait
          jamais être un casse-tête. Boîtes à clés fragiles, rendez-vous ratés,
          allers-retours interminables… il fallait une alternative de confiance,
          ancrée dans le quartier.
        </p>
        <p>
          Notre réponse : un réseau de <strong>commerces partenaires</strong>{" "}
          qui gardent vos clés en lieu sûr, à deux pas de chez vous. Vous déposez
          un trousseau muni d&apos;un badge, vous partagez un code de retrait, et
          vous suivez chaque mouvement en temps réel.
        </p>
        <p>
          Côté commerçants, c&apos;est un revenu complémentaire et du passage
          supplémentaire, sans matériel coûteux ni formation lourde.
        </p>
        <p>
          Keywi est conçu et opéré en France, dans le respect de vos données et de
          la confiance que vous nous accordez.
        </p>
      </div>
    </article>
  );
}
