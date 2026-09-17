import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Lock, Zap, MapPin, ArrowRight } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

// Liste des casiers en cache 5 min (client public sans cookies) —
// pas besoin d'être à la seconde, et ça épargne la base sous charge.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Smart lockers" : "Casiers connectés",
    description:
      loc === "en"
        ? "KeyWe lockers: drop off and pick up your keys 24/7, no counter, with the same pickup code."
        : "Les casiers KeyWe : déposez et récupérez vos clés 24 h/24, sans comptoir, avec le même code de retrait.",
    alternates: alternatesLangues("/produits/casiers", loc),
  };
}

function contenu(locale: Locale) {
  if (locale === "en") {
    return {
      badge: "Available in Paris",
      h1: "KeyWe smart lockers",
      lede: "For keys that can't wait: automated lockers open 24/7, unlocked by the same 6-character code as our drop-off points.",
      deposer: "Drop off in a locker",
      voirCarte: "See the map",
      atouts: [
        { icone: Clock, titre: "24/7 access", texte: "No more time constraints: late-night arrival, dawn departure — the locker is always open." },
        { icone: Lock, titre: "Individual compartment", texte: "Each keyring has its own locked compartment. The door only opens with the recipient's code." },
        { icone: Zap, titre: "Self-service drop-off", texte: "You drop off yourself from your dashboard: a compartment is assigned instantly, no shop owner involved." },
      ],
      enServiceTitre: "Our lockers in service",
      aucun: "The first lockers are arriving very soon. In the meantime, our partner shops are here for you.",
      commentTitre: "How it works",
      etapes: [
        "Pick a locker when dropping off, then pay online.",
        "At the locker, start the drop-off from your dashboard: your compartment number appears.",
        "Your recipient types their code on the locker screen — the compartment opens.",
      ],
    };
  }
  return {
    badge: "Disponible à Paris",
    h1: "Casiers connectés KeyWe",
    lede: "Pour les clés qui n'attendent pas : des casiers automatiques accessibles 24 h/24, déverrouillés par le même code à 6 caractères que nos points relais.",
    deposer: "Déposer dans un casier",
    voirCarte: "Voir la carte",
    atouts: [
      { icone: Clock, titre: "Accès 24 h/24", texte: "Plus de contrainte d'horaires : arrivée tard le soir, départ à l'aube, le casier est toujours ouvert." },
      { icone: Lock, titre: "Case individuelle", texte: "Chaque trousseau a sa propre case verrouillée. La porte ne s'ouvre qu'avec le code du bénéficiaire." },
      { icone: Zap, titre: "Dépôt en self-service", texte: "Vous déposez vous-même depuis votre espace : une case vous est attribuée à l'instant, sans passer par un commerçant." },
    ],
    enServiceTitre: "Nos casiers en service",
    aucun: "Les premiers casiers arrivent très bientôt. En attendant, nos commerces partenaires vous accueillent.",
    commentTitre: "Comment ça marche",
    etapes: [
      "Choisissez un casier au moment du dépôt, puis réglez en ligne.",
      "Devant le casier, lancez le dépôt depuis votre espace : votre numéro de case s'affiche.",
      "Votre bénéficiaire tape son code sur l'écran du casier — la case s'ouvre.",
    ],
  };
}

/** Page produit : casiers connectés (accès 24/7) */
export default async function PageCasiers({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = contenu(locale);
  const l = (chemin: string) => localise(chemin, locale);

  const supabase = createPublicClient();
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
            <Clock size={15} aria-hidden="true" /> {t.badge}
          </p>
          <h1 className="mt-4 text-4xl font-black">{t.h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t.lede}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={l("/espace/deposer")}
              className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
            >
              {t.deposer} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href={l("/points-relais")}
              className="rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10"
            >
              {t.voirCarte}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {t.atouts.map(({ icone: Icone, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
                <Icone size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold">{titre}</h2>
              <p className="mt-1 text-sm text-gray-600">{texte}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-2xl font-black">{t.enServiceTitre}</h2>
        {!casiers?.length ? (
          <p className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
            {t.aucun}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {casiers.map((c) => {
              const horaires = c.horaires as Record<string, string> | null;
              return (
                <li key={c.id} className="rounded-2xl border border-gray-200 bg-white p-5">
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

        <div className="mt-14 rounded-3xl bg-sable p-8">
          <h2 className="text-2xl font-black">{t.commentTitre}</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {t.etapes.map((texte, i) => (
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
