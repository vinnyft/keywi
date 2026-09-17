import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ScanLine, Bell, ShieldCheck } from "lucide-react";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Drop-off points" : "Points relais",
    description:
      loc === "en"
        ? "The KeyWe public drop-off network: neighbourhood shops equipped to keep and hand over your keys safely."
        : "Le réseau public de points relais KeyWe : des commerces de quartier équipés pour garder et remettre vos clés en toute sécurité.",
    alternates: alternatesLangues("/produits/points-relais", loc),
  };
}

function contenu(locale: Locale) {
  if (locale === "en") {
    return {
      h1: "The drop-off network",
      lede: "Neighbourhood shops selected and equipped by KeyWe to keep your keyrings and hand them to the right people, on presentation of a code.",
      voirCarte: "See the network map",
      cards: [
        { icone: MapPin, titre: "Always a shop within reach", texte: "Cafés, bookshops, dry cleaners, grocers: the network leans on the extended hours of local shops, until 11pm for some." },
        { icone: ScanLine, titre: "Tag scanned at every movement", texte: "Each keyring carries a unique RFID tag. The owner scans it at drop-off and pickup: two keyrings can never be mixed up." },
        { icone: Bell, titre: "You know everything, live", texte: "Drop-off confirmed, keys collected, keyring returned: instant notifications by email and in your dashboard." },
        { icone: ShieldCheck, titre: "Dedicated, anonymous slots", texte: "Keyrings are stored in numbered slots, with no address or name: a lost tag leads to no door." },
      ],
      ctaTitre: "Ready to free your pockets?",
      deposer: "Drop off my keys",
      tarifs: "See pricing",
    };
  }
  return {
    h1: "Le réseau de points relais",
    lede: "Des commerces de quartier sélectionnés et équipés par KeyWe pour garder vos trousseaux et les remettre aux bonnes personnes, sur présentation d'un code.",
    voirCarte: "Voir la carte du réseau",
    cards: [
      { icone: MapPin, titre: "Toujours un commerce à portée", texte: "Cafés, librairies, pressings, épiceries : le réseau s'appuie sur les horaires étendus des commerces de proximité, jusqu'à 23 h pour certains." },
      { icone: ScanLine, titre: "Badge scanné à chaque mouvement", texte: "Chaque trousseau porte un badge RFID unique. Le commerçant le scanne au dépôt comme au retrait : impossible de confondre deux trousseaux." },
      { icone: Bell, titre: "Vous savez tout, en direct", texte: "Dépôt confirmé, clés récupérées, trousseau de retour : notifications immédiates par email et dans votre espace." },
      { icone: ShieldCheck, titre: "Cases dédiées et anonymes", texte: "Les trousseaux sont rangés dans des cases numérotées, sans adresse ni nom : un badge perdu ne mène à aucune porte." },
    ],
    ctaTitre: "Prêt à libérer vos poches ?",
    deposer: "Déposer mes clés",
    tarifs: "Voir les tarifs",
  };
}

export default async function PageProduitPointsRelais({
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
          <h1 className="text-3xl font-black sm:text-4xl">{t.h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t.lede}</p>
          <Link
            href={l("/points-relais")}
            className="mt-8 inline-block rounded-xl bg-corail px-6 py-3 font-bold hover:bg-corail-fonce"
          >
            {t.voirCarte}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 md:grid-cols-2">
        {t.cards.map(({ icone: Icone, titre, texte }) => (
          <div key={titre} className="rounded-2xl border border-gray-200 p-6">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primaire-pale">
              <Icone size={24} className="text-primaire" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-bold">{titre}</h2>
            <p className="mt-2 text-sm text-gray-600">{texte}</p>
          </div>
        ))}
      </section>

      <section className="bg-sable">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <h2 className="text-2xl font-black">{t.ctaTitre}</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={l("/espace/deposer")}
              className="rounded-xl bg-primaire px-6 py-3 font-bold text-white hover:bg-primaire-fonce"
            >
              {t.deposer}
            </Link>
            <Link
              href={l("/tarifs")}
              className="rounded-xl border-2 border-primaire px-6 py-3 font-bold text-primaire hover:bg-primaire-pale"
            >
              {t.tarifs}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
