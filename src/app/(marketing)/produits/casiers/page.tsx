import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Lock, Zap, MapPin, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Casiers connectés",
  description:
    "Les casiers Keywi : déposez et récupérez vos clés 24 h/24, sans comptoir, avec le même code de retrait.",
};

const ATOUTS = [
  {
    icone: Clock,
    titre: "Accès 24 h/24",
    texte:
      "Plus de contrainte d'horaires : arrivée tard le soir, départ à l'aube, le casier est toujours ouvert.",
  },
  {
    icone: Lock,
    titre: "Case individuelle",
    texte:
      "Chaque trousseau a sa propre case verrouillée. La porte ne s'ouvre qu'avec le code du bénéficiaire.",
  },
  {
    icone: Zap,
    titre: "Dépôt en self-service",
    texte:
      "Vous déposez vous-même depuis votre espace : une case vous est attribuée à l'instant, sans passer par un commerçant.",
  },
];

/** Page produit : casiers connectés (accès 24/7) */
export default async function PageCasiers() {
  const supabase = await createClient();
  const { data: casiers } = await supabase
    .from("relay_points")
    .select("id, nom, adresse, code_postal, ville, horaires")
    .eq("type", "casier")
    .eq("statut", "actif")
    .order("nom");

  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
            <Clock size={15} aria-hidden="true" /> Disponible à Paris
          </p>
          <h1 className="mt-4 text-4xl font-black">Casiers connectés Keywi</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Pour les clés qui n&apos;attendent pas : des casiers automatiques
            accessibles 24 h/24, déverrouillés par le même code à 6 caractères
            que nos points relais.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/espace/deposer"
              className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
            >
              Déposer dans un casier <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/points-relais"
              className="rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10"
            >
              Voir la carte
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {ATOUTS.map(({ icone: Icone, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
                <Icone size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold">{titre}</h2>
              <p className="mt-1 text-sm text-gray-600">{texte}</p>
            </div>
          ))}
        </div>

        {/* Casiers en service */}
        <h2 className="mt-14 text-2xl font-black">Nos casiers en service</h2>
        {!casiers?.length ? (
          <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
            Les premiers casiers arrivent très bientôt. En attendant, nos
            commerces partenaires vous accueillent.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {casiers.map((c) => {
              const horaires = c.horaires as Record<string, string> | null;
              return (
                <li
                  key={c.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5"
                >
                  <h3 className="flex items-center gap-1.5 font-bold">
                    <MapPin size={16} className="text-primaire" aria-hidden="true" />
                    {c.nom}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {c.adresse}, {c.code_postal} {c.ville}
                  </p>
                  {horaires &&
                    Object.entries(horaires).map(([jours, heures]) => (
                      <p
                        key={jours}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primaire-pale px-3 py-1 text-xs font-semibold text-primaire-fonce"
                      >
                        <Clock size={12} aria-hidden="true" />
                        <span className="capitalize">{jours}</span> : {heures}
                      </p>
                    ))}
                </li>
              );
            })}
          </ul>
        )}

        {/* Comment ça marche */}
        <div className="mt-14 rounded-3xl bg-sable p-8">
          <h2 className="text-2xl font-black">Comment ça marche</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              "Choisissez un casier au moment du dépôt, puis réglez en ligne.",
              "Devant le casier, lancez le dépôt depuis votre espace : votre numéro de case s'affiche.",
              "Votre bénéficiaire tape son code sur l'écran du casier — la case s'ouvre.",
            ].map((texte, i) => (
              <li key={texte} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primaire font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-gray-700">{texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
