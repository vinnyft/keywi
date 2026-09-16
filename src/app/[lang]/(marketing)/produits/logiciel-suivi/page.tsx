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
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Keywi Pro — key-tracking software" : "Keywi Pro — logiciel de suivi de clés",
    description:
      loc === "en"
        ? "Keywi Pro: keyring register, return deadlines, automatic reminders and accounting export. For property managers, agencies and hotels."
        : "Keywi Pro : registre des trousseaux, échéances de retour, relances automatiques et export comptable. Pour conciergeries, agences et hôtels.",
    alternates: alternatesLangues("/produits/logiciel-suivi", loc),
  };
}

function contenu(locale: Locale) {
  if (locale === "en") {
    return {
      badge: "Included in your dashboard",
      h1: "Keywi Pro",
      lede: "The key-tracking software for those who manage a lot of them: property managers, estate agencies, hotels and operators.",
      registre: "Open my register",
      creerCompte: "Create an account",
      fonctions: [
        { icone: Table2, titre: "Fleet register", texte: "All your keyrings in one table: status, location, slot, movement count. Instant search by unit, tag or drop-off point." },
        { icone: CalendarClock, titre: "Return deadlines", texte: "Set an expected return date per key. Past the deadline, the team gets an automatic reminder and the key shows as « overdue »." },
        { icone: Activity, titre: "Tamper-proof log", texte: "Every drop-off, pickup and return is timestamped and unchangeable — full traceability, even months later." },
        { icone: Download, titre: "Accounting export", texte: "Export the history to CSV in one click, ready for Excel: dates, locations, slots, recipients." },
      ],
      dejaTitre: "Already in your dashboard",
      dejaTexte: "Keywi Pro isn't software to install: the register, deadlines and export are available from your very first drop-off, at no extra cost.",
      tarifs: "See pricing",
    };
  }
  return {
    badge: "Inclus dans votre espace",
    h1: "Keywi Pro",
    lede: "Le logiciel de suivi de clés pour ceux qui en gèrent beaucoup : conciergeries, agences immobilières, hôtels et gestionnaires.",
    registre: "Ouvrir mon registre",
    creerCompte: "Créer un compte",
    fonctions: [
      { icone: Table2, titre: "Registre du parc", texte: "Tous vos trousseaux dans un tableau unique : statut, lieu, case, nombre de mouvements. Recherche instantanée par logement, badge ou point relais." },
      { icone: CalendarClock, titre: "Échéances de retour", texte: "Fixez une date de retour attendue par clé. Passé le délai, l'équipe reçoit une relance automatique et la clé apparaît « en retard »." },
      { icone: Activity, titre: "Journal inaltérable", texte: "Chaque dépôt, retrait et retour est horodaté et non modifiable — la traçabilité complète, même plusieurs mois après." },
      { icone: Download, titre: "Export comptable", texte: "Sortez l'historique en CSV en un clic, prêt pour Excel : dates, lieux, cases, bénéficiaires." },
    ],
    dejaTitre: "Déjà dans votre espace",
    dejaTexte: "Keywi Pro n'est pas un logiciel à installer : le registre, les échéances et l'export sont accessibles dès votre première clé déposée, sans supplément.",
    tarifs: "Voir les tarifs",
  };
}

/** Page produit : Keywi Pro (logiciel de suivi de clés) */
export default async function PageLogicielSuivi({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = contenu(locale);
  const l = (chemin: string) => localise(chemin, locale);

  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            <ShieldCheck size={15} aria-hidden="true" /> {t.badge}
          </p>
          <h1 className="mt-4 text-4xl font-black">{t.h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t.lede}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={l("/espace/registre")}
              className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
            >
              {t.registre} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href={l("/inscription")}
              className="rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10"
            >
              {t.creerCompte}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {t.fonctions.map(({ icone: Icone, titre, texte }) => (
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
          <h2 className="text-2xl font-black">{t.dejaTitre}</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-700">{t.dejaTexte}</p>
          <Link
            href={l("/tarifs")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-encre px-5 py-3 font-semibold text-white hover:bg-encre-2"
          >
            {t.tarifs} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
