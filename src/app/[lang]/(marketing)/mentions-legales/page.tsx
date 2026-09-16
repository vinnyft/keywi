import type { Metadata } from "next";
import Link from "next/link";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Legal notice" : "Mentions légales",
    description:
      loc === "en"
        ? "Publisher, host and publication director of the Keywi website."
        : "Éditeur, hébergeur et responsable de publication du site Keywi.",
    alternates: alternatesLangues("/mentions-legales", loc),
  };
}

/**
 * Mentions légales — obligation de l'article 6-III de la LCEN. Les
 * valeurs entre crochets dépendent de l'immatriculation : à compléter
 * avant mise en ligne.
 */
export default async function PageMentionsLegales({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";

  const rubriques = [
    {
      titre: en ? "Site publisher" : "Éditeur du site",
      lignes: [
        en ? "Keywi — [legal form, e.g. SAS with share capital of €X]" : "Keywi — [forme sociale, ex. SAS au capital de X €]",
        en ? "[Registered office address]" : "[Adresse du siège social]",
        en ? "[Trade register of … under number …] · [VAT number]" : "[RCS de … sous le numéro …] · [N° TVA intracommunautaire]",
        "Contact : bonjour@keywi.fr",
      ],
    },
    {
      titre: en ? "Publication director" : "Directeur de la publication",
      lignes: [en ? "[Full name], acting as [role]" : "[Nom et prénom], en qualité de [fonction]"],
    },
    {
      titre: en ? "Host" : "Hébergeur",
      lignes: [
        "Vercel Inc.",
        en ? "340 S Lemon Ave #4133, Walnut, CA 91789, USA" : "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
        "vercel.com",
        en ? "Server processing runs in the Paris region." : "Les traitements serveur s'exécutent dans la région de Paris.",
      ],
    },
    {
      titre: en ? "Database and authentication" : "Base de données et authentification",
      lignes: [
        "Supabase Inc.",
        en ? "970 Toa Payoh North #07-04, Singapore 318992" : "970 Toa Payoh North #07-04, Singapour 318992",
        en ? "supabase.com · hosting region: [to be specified]" : "supabase.com · région d'hébergement : [à préciser]",
      ],
    },
  ];

  const t = en
    ? {
        h1: "Legal notice",
        maj: "Last updated",
        courtoisie: "Courtesy translation. The French version is the authoritative text.",
        piTitre: "Intellectual property",
        pi: "The Keywi brand, logo, texts and site interface are protected. Any reproduction, even partial, requires prior authorisation.",
        donneesTitre: "Personal data and cookies",
        donneesAvant: "Details of processing, retention periods and your rights are in the ",
        donneesLien: "privacy policy",
        donneesApres: ". Keywi sets no advertising or analytics cookies.",
        signalTitre: "Reporting content",
        signalAvant: "Any clearly unlawful content can be reported to ",
        signalApres: ".",
        note: "The bracketed details remain to be completed by the publisher before going live.",
      }
    : {
        h1: "Mentions légales",
        maj: "Dernière mise à jour",
        courtoisie: null as string | null,
        piTitre: "Propriété intellectuelle",
        pi: "La marque Keywi, le logo, les textes et l'interface du site sont protégés. Toute reproduction, même partielle, est soumise à autorisation préalable.",
        donneesTitre: "Données personnelles et cookies",
        donneesAvant: "Le détail des traitements, des durées de conservation et de vos droits figure dans la ",
        donneesLien: "politique de confidentialité",
        donneesApres: ". Keywi ne dépose aucun cookie publicitaire ni de mesure d'audience.",
        signalTitre: "Signalement d'un contenu",
        signalAvant: "Tout contenu manifestement illicite peut être signalé à ",
        signalApres: ".",
        note: "Les mentions entre crochets restent à compléter par l'éditeur avant mise en ligne.",
      };

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">{t.h1}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {t.maj} : {new Date().getFullYear()}
      </p>

      {t.courtoisie && (
        <p className="mt-4 rounded-xl border border-gray-200 bg-sable p-3 text-sm text-gray-600">
          {t.courtoisie}
        </p>
      )}

      <div className="mt-8 space-y-6 text-gray-700">
        {rubriques.map((r) => (
          <section key={r.titre}>
            <h2 className="text-xl font-bold">{r.titre}</h2>
            <div className="mt-2 space-y-0.5">
              {r.lignes.map((ligne) => (
                <p key={ligne}>{ligne}</p>
              ))}
            </div>
          </section>
        ))}

        <section>
          <h2 className="text-xl font-bold">{t.piTitre}</h2>
          <p className="mt-2">{t.pi}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.donneesTitre}</h2>
          <p className="mt-2">
            {t.donneesAvant}
            <Link className="underline" href={localise("/confidentialite", locale)}>
              {t.donneesLien}
            </Link>
            {t.donneesApres}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold">{t.signalTitre}</h2>
          <p className="mt-2">
            {t.signalAvant}
            <a className="underline" href="mailto:bonjour@keywi.fr">
              bonjour@keywi.fr
            </a>
            {t.signalApres}
          </p>
        </section>

        <p className="rounded-xl bg-sable p-4 text-sm text-gray-500">{t.note}</p>
      </div>
    </article>
  );
}
