import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente et d'utilisation du service KLAV.",
};

export default function PageCgv() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">Conditions générales</h1>
      <p className="mt-2 text-sm text-gray-500">
        Dernière mise à jour : {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-bold">1. Objet</h2>
          <p className="mt-2">
            Les présentes conditions régissent l&apos;utilisation du service KLAV
            de dépôt et de remise de clés via un réseau de commerces partenaires.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">2. Service</h2>
          <p className="mt-2">
            KLAV met en relation des déposants et des points relais. Le déposant
            reste responsable des clés confiées et des accès qu&apos;il partage
            via les codes de retrait.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">3. Tarifs et paiement</h2>
          <p className="mt-2">
            Les dépôts sont facturés à l&apos;unité ou via un abonnement, aux
            tarifs indiqués sur la page Tarifs. Les paiements sont traités de
            façon sécurisée.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">4. Responsabilité</h2>
          <p className="mt-2">
            KLAV s&apos;engage à assurer la traçabilité de chaque mouvement. La
            remise des clés est conditionnée à la présentation d&apos;un code de
            retrait valide et à la vérification du badge.
          </p>
        </section>

        <p className="rounded-xl bg-sable p-4 text-sm text-gray-500">
          Document fourni à titre d&apos;exemple dans le cadre de cette
          démonstration. À remplacer par vos conditions juridiques définitives
          avant toute mise en production.
        </p>
      </div>
    </article>
  );
}
