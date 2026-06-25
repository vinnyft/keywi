import Link from "next/link";
import {
  MapPin,
  KeyRound,
  Smartphone,
  ShieldCheck,
  Bell,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CAS_USAGE } from "@/content/cas-usage";

/** Accueil du site public Keywi */
export default async function PageAccueil() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("stats_publiques");
  const stats = (data ?? {}) as {
    nb_points_relais?: number;
    nb_mouvements?: number;
    nb_cles_gerees?: number;
  };

  const etapes = [
    {
      icone: MapPin,
      titre: "Déposez près de chez vous",
      texte:
        "Choisissez un commerce partenaire sur la carte et déposez votre trousseau muni d'un badge Keywi.",
    },
    {
      icone: KeyRound,
      titre: "Partagez un code",
      texte:
        "Générez un code de retrait à 6 caractères et envoyez-le à votre voyageur, votre prestataire ou un proche.",
    },
    {
      icone: Bell,
      titre: "Suivez en temps réel",
      texte:
        "Chaque dépôt, retrait ou retour vous est notifié instantanément, par email et dans votre espace.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-encre text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              <ShieldCheck size={15} aria-hidden="true" /> Réseau français de points relais
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
              Vos clés, en lieu sûr,
              <br />
              <span className="text-lime">près de chez vous.</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">
              Déposez vos clés dans un commerce de confiance et gérez les accès à
              distance — sans boîte à clés, sans attente, sans stress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/espace/deposer"
                className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
              >
                Déposer une clé <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/points-relais"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-semibold hover:bg-white/10"
              >
                Voir la carte
              </Link>
            </div>
          </div>

          {/* Indicateurs */}
          <dl className="grid grid-cols-3 gap-3">
            {[
              { v: stats.nb_points_relais ?? 0, l: "points relais" },
              { v: stats.nb_cles_gerees ?? 0, l: "clés gérées" },
              { v: stats.nb_mouvements ?? 0, l: "mouvements" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl bg-white/5 p-5 text-center ring-1 ring-white/10"
              >
                <dd className="text-3xl font-black text-lime">{s.v}</dd>
                <dt className="mt-1 text-sm text-white/70">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-black">Comment ça marche ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-gray-600">
          Trois étapes suffisent pour confier vos clés et garder la main sur
          chaque accès.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {etapes.map(({ icone: Icone, titre, texte }, i) => (
            <div
              key={titre}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
                <Icone size={22} aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-bold text-gray-400">Étape {i + 1}</p>
              <h3 className="text-lg font-bold">{titre}</h3>
              <p className="mt-1 text-gray-600">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="bg-sable">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-black">Pensé pour vous</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAS_USAGE.map((c) => (
              <Link
                key={c.slug}
                href={`/cas-usage/${c.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-primaire"
              >
                <span className="text-3xl" aria-hidden="true">
                  {c.emoji}
                </span>
                <h3 className="mt-3 font-bold group-hover:text-primaire">
                  {c.menu}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {c.accroche}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau commerçant */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-primaire px-6 py-12 text-center text-white sm:px-12">
          <Smartphone size={40} aria-hidden="true" />
          <h2 className="text-3xl font-black">
            Commerçant ? Rejoignez le réseau Keywi.
          </h2>
          <p className="max-w-xl text-white/80">
            Transformez votre comptoir en point relais : un revenu complémentaire
            à chaque mouvement, une application simple, aucun matériel coûteux.
          </p>
          <Link
            href="/devenir-point-relais"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primaire hover:bg-white/90"
          >
            Devenir point relais <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
