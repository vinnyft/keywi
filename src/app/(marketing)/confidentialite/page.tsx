import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Keywi protège et traite vos données personnelles.",
};

export default function PageConfidentialite() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">Confidentialité</h1>
      <p className="mt-2 text-sm text-gray-500">
        Dernière mise à jour : {new Date().getFullYear()}
      </p>

      <div className="mt-8 space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-bold">Données collectées</h2>
          <p className="mt-2">
            Nous collectons uniquement les informations nécessaires au service :
            identité, email, clés gérées, codes de retrait et journal des
            mouvements.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Utilisation</h2>
          <p className="mt-2">
            Vos données servent à assurer le dépôt, le suivi et la remise des
            clés, ainsi qu&apos;à vous envoyer les notifications associées. Elles
            ne sont jamais revendues.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Sécurité</h2>
          <p className="mt-2">
            L&apos;accès aux données est strictement cloisonné : chaque
            utilisateur ne voit que ce qui le concerne, via des règles de
            sécurité appliquées au niveau de la base de données.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Vos droits</h2>
          <p className="mt-2">
            Conformément au RGPD, vous pouvez accéder à vos données, les
            rectifier ou en demander la suppression en nous écrivant à
            bonjour@keywi.fr.
          </p>
        </section>

        <p className="rounded-xl bg-sable p-4 text-sm text-gray-500">
          Document fourni à titre d&apos;exemple dans le cadre de cette
          démonstration.
        </p>
      </div>
    </article>
  );
}
