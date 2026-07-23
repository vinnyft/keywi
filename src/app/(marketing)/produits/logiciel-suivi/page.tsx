import type { Metadata } from "next";
import Link from "next/link";
import {
  Table2,
  CalendarClock,
  Download,
  Activity,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Keywi Pro — logiciel de suivi de clés",
  description:
    "Keywi Pro : registre des trousseaux, échéances de retour, relances automatiques et export comptable. Pour conciergeries, agences et hôtels.",
};

const FONCTIONS = [
  {
    icone: Table2,
    titre: "Registre du parc",
    texte:
      "Tous vos trousseaux dans un tableau unique : statut, lieu, case, nombre de mouvements. Recherche instantanée par logement, badge ou point relais.",
  },
  {
    icone: CalendarClock,
    titre: "Échéances de retour",
    texte:
      "Fixez une date de retour attendue par clé. Passé le délai, l'équipe reçoit une relance automatique et la clé apparaît « en retard ».",
  },
  {
    icone: Activity,
    titre: "Journal inaltérable",
    texte:
      "Chaque dépôt, retrait et retour est horodaté et non modifiable — la traçabilité complète, même plusieurs mois après.",
  },
  {
    icone: Download,
    titre: "Export comptable",
    texte:
      "Sortez l'historique en CSV en un clic, prêt pour Excel : dates, lieux, cases, bénéficiaires.",
  },
];

/** Page produit : Keywi Pro (logiciel de suivi de clés) */
export default function PageLogicielSuivi() {
  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            <ShieldCheck size={15} aria-hidden="true" /> Inclus dans votre espace
          </p>
          <h1 className="mt-4 text-4xl font-black">Keywi Pro</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Le logiciel de suivi de clés pour ceux qui en gèrent beaucoup :
            conciergeries, agences immobilières, hôtels et gestionnaires.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/espace/registre"
              className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
            >
              Ouvrir mon registre <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/inscription"
              className="rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {FONCTIONS.map(({ icone: Icone, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
                <Icone size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold">{titre}</h2>
              <p className="mt-1 text-sm text-gray-600">{texte}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-sable p-8 text-center">
          <h2 className="text-2xl font-black">Déjà dans votre espace</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-700">
            Keywi Pro n&apos;est pas un logiciel à installer : le registre, les
            échéances et l&apos;export sont accessibles dès votre première clé
            déposée, sans supplément.
          </p>
          <Link
            href="/tarifs"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-encre px-5 py-3 font-semibold text-white hover:bg-encre-2"
          >
            Voir les tarifs <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
