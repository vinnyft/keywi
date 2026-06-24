import type { Metadata } from "next";
import { Euro, Clock, Boxes, HeartHandshake } from "lucide-react";
import { FormulaireCandidature } from "@/components/marketing/FormulaireCandidature";

export const metadata: Metadata = {
  title: "Devenir point relais",
  description:
    "Transformez votre commerce en point relais KLAV : un revenu complémentaire à chaque mouvement de clés.",
};

const ATOUTS = [
  {
    icone: Euro,
    titre: "Un revenu complémentaire",
    texte:
      "Jusqu'à 1,20 € reversé pour chaque dépôt, retrait ou retour scanné, versé en début de mois suivant.",
  },
  {
    icone: Clock,
    titre: "Zéro contrainte",
    texte:
      "Quelques secondes par mouvement : un scan, une case attribuée, c'est rangé. Aucune formation lourde.",
  },
  {
    icone: Boxes,
    titre: "Le kit fourni",
    texte:
      "Cases numérotées, badges et signalétique installés par notre équipe. Aucun investissement de votre part.",
  },
  {
    icone: HeartHandshake,
    titre: "Plus de passage",
    texte:
      "Les clients qui viennent déposer ou récupérer une clé découvrent votre commerce.",
  },
];

/** Page partenaires + formulaire de candidature */
export default function PageDevenirPointRelais() {
  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-4xl font-black">Devenez point relais KLAV</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Votre comptoir a déjà tout ce qu&apos;il faut. Rejoignez le réseau et
            rendez service à votre quartier — tout en arrondissant vos fins de
            mois.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ATOUTS.map(({ icone: Icone, titre, texte }) => (
            <div
              key={titre}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-corail/10 text-corail">
                <Icone size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold">{titre}</h2>
              <p className="mt-1 text-sm text-gray-600">{texte}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <h2 className="text-center text-2xl font-black">
            Proposez votre commerce
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Remplissez ce formulaire : notre équipe vous recontacte sous 48 h
            ouvrées.
          </p>
          <FormulaireCandidature />
        </div>
      </section>
    </>
  );
}
