import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ScanLine, Bell, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Points relais",
  description:
    "Le réseau public de points relais Keywi : des commerces de quartier équipés pour garder et remettre vos clés en toute sécurité.",
};

/** Produit phare : le réseau public de points relais */
export default function PageProduitPointsRelais() {
  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">Le réseau de points relais</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Des commerces de quartier sélectionnés et équipés par Keywi pour
            garder vos trousseaux et les remettre aux bonnes personnes, sur
            présentation d&apos;un code.
          </p>
          <Link
            href="/points-relais"
            className="mt-8 inline-block rounded-xl bg-corail px-6 py-3 font-bold hover:bg-corail-fonce"
          >
            Voir la carte du réseau
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 md:grid-cols-2">
        {[
          {
            icone: MapPin,
            titre: "Toujours un commerce à portée",
            texte:
              "Cafés, librairies, pressings, épiceries : le réseau s'appuie sur les horaires étendus des commerces de proximité, jusqu'à 23 h pour certains.",
          },
          {
            icone: ScanLine,
            titre: "Badge scanné à chaque mouvement",
            texte:
              "Chaque trousseau porte un badge RFID unique. Le commerçant le scanne au dépôt comme au retrait : impossible de confondre deux trousseaux.",
          },
          {
            icone: Bell,
            titre: "Vous savez tout, en direct",
            texte:
              "Dépôt confirmé, clés récupérées, trousseau de retour : notifications immédiates par email et dans votre espace.",
          },
          {
            icone: ShieldCheck,
            titre: "Cases dédiées et anonymes",
            texte:
              "Les trousseaux sont rangés dans des cases numérotées, sans adresse ni nom : un badge perdu ne mène à aucune porte.",
          },
        ].map(({ icone: Icone, titre, texte }) => (
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
          <h2 className="text-2xl font-black">Prêt à libérer vos poches ?</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/espace/deposer"
              className="rounded-xl bg-primaire px-6 py-3 font-bold text-white hover:bg-primaire-fonce"
            >
              Déposer mes clés
            </Link>
            <Link
              href="/tarifs"
              className="rounded-xl border-2 border-primaire px-6 py-3 font-bold text-primaire hover:bg-primaire-pale"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
