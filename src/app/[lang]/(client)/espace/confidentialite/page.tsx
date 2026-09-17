import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download,
  FileText,
  KeyRound,
  Mail,
  ScrollText,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { localise, type Locale } from "@/lib/i18n";
import type { ApercuSuppression } from "@/lib/suppression-compte";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "My data" : "Mes données" };
}

/**
 * Inventaire de ce que KeyWe détient sur l'utilisateur connecté.
 *
 * Le RGPD donne des droits ; encore faut-il pouvoir les exercer
 * sans écrire à une adresse de contact. Cet écran rend l'accès
 * (art. 15), la portabilité (art. 20) et l'effacement (art. 17)
 * exerçables en deux clics, depuis l'espace client.
 */
export default async function PageConfidentialiteEspace({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = lang === "en" ? "en" : "fr";
  const en = locale === "en";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(localise("/connexion?suivant=/espace/confidentialite", locale));

  const [{ data: profil }, { data: brut }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nom, email, telephone, role, created_at")
      .eq("id", user.id)
      .single(),
    supabase.rpc("apercu_suppression_compte"),
  ]);

  const apercu = (brut ?? null) as unknown as ApercuSuppression | null;

  const t = en
    ? {
        titre: "My data",
        intro: "Everything KeyWe holds about you, and what you can do with it. Member since ",
        conservons: "What we keep",
        emporter: "Take my data with me",
        emporterAide:
          "The complete history of your movements, in CSV format, readable by any spreadsheet.",
        telecharger: "Download the export",
        vosDroits: "Your rights",
        droitsTexte1: "Rectification, restriction, objection: write to us at ",
        droitsTexte2: ". The details of processing are described in the ",
        politique: "privacy policy",
        supprimer: "Delete my account",
        supprimerTexte:
          "Your identity is erased from our systems, permanently. The movement log and accounting records remain, but made anonymous: nothing links them to you any more.",
        voirEfface: "See what will be erased",
        enregistres: (n: number) => `${n} registered`,
        actifs: (n: number) => `${n} active`,
        mouvementsN: (n: number) => `${n} movement${n > 1 ? "s" : ""}`,
        ecritures: (n: number) => `${n} record${n > 1 ? "s" : ""}`,
        identiteT: "Identity",
        identiteD: "Name, email and phone provided at sign-up.",
        trousseauxT: "Keyrings",
        trousseauxD: "Property name, tag, chosen drop-off point.",
        codesT: "Pickup codes",
        codesD: "The name and email of the recipients you shared access with.",
        journalT: "Movement log",
        journalD: "Every drop-off, pickup and return: date, place, slot. Not editable.",
        paiementsT: "Payments",
        paiementsD: "Amount and date of paid drop-offs. Kept 10 years (accounting obligation).",
      }
    : {
        titre: "Mes données",
        intro: "Tout ce que KeyWe détient à votre sujet, et ce que vous pouvez en faire. Membre depuis le ",
        conservons: "Ce que nous conservons",
        emporter: "Emporter mes données",
        emporterAide:
          "L'historique complet de vos mouvements, au format CSV, lisible par n'importe quel tableur.",
        telecharger: "Télécharger l'export",
        vosDroits: "Vos droits",
        droitsTexte1: "Rectification, limitation, opposition : écrivez-nous à ",
        droitsTexte2: ". Le détail des traitements est décrit dans la ",
        politique: "politique de confidentialité",
        supprimer: "Supprimer mon compte",
        supprimerTexte:
          "Votre identité est effacée de nos bases, définitivement. Le journal des mouvements et les écritures comptables subsistent, mais rendus anonymes : plus rien ne les rattache à vous.",
        voirEfface: "Voir ce qui sera effacé",
        enregistres: (n: number) => `${n} enregistré(s)`,
        actifs: (n: number) => `${n} actif(s)`,
        mouvementsN: (n: number) => `${n} mouvement(s)`,
        ecritures: (n: number) => `${n} écriture(s)`,
        identiteT: "Identité",
        identiteD: "Nom, email et téléphone renseignés à l'inscription.",
        trousseauxT: "Trousseaux",
        trousseauxD: "Nom du logement, badge, point relais choisi.",
        codesT: "Codes de retrait",
        codesD: "Le nom et l'email des bénéficiaires à qui vous avez partagé un accès.",
        journalT: "Journal des mouvements",
        journalD: "Chaque dépôt, retrait et retour : date, lieu, case. Non modifiable.",
        paiementsT: "Paiements",
        paiementsD:
          "Montant et date des dépôts réglés. Conservés 10 ans (obligation comptable).",
      };

  const inventaire = [
    {
      icone: UserRound,
      titre: t.identiteT,
      valeur: [profil?.nom, profil?.email, profil?.telephone].filter(Boolean).join(" · "),
      detail: t.identiteD,
    },
    {
      icone: KeyRound,
      titre: t.trousseauxT,
      valeur: t.enregistres(apercu?.trousseaux ?? 0),
      detail: t.trousseauxD,
    },
    {
      icone: Mail,
      titre: t.codesT,
      valeur: t.actifs(apercu?.codes_actifs ?? 0),
      detail: t.codesD,
    },
    {
      icone: ScrollText,
      titre: t.journalT,
      valeur: t.mouvementsN(apercu?.mouvements ?? 0),
      detail: t.journalD,
    },
    {
      icone: FileText,
      titre: t.paiementsT,
      valeur: t.ecritures(apercu?.paiements ?? 0),
      detail: t.paiementsD,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black">{t.titre}</h1>
      <p className="mt-1 max-w-2xl text-gray-600">
        {t.intro}
        {profil?.created_at
          ? new Date(profil.created_at).toLocaleDateString(en ? "en-IE" : "fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "—"}
        .
      </p>

      {/* ----- Inventaire ----- */}
      <section
        aria-labelledby="titre-inventaire"
        className="mt-6 rounded-2xl border border-gray-200 bg-white p-5"
      >
        <h2 id="titre-inventaire" className="font-bold">
          {t.conservons}
        </h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {inventaire.map(({ icone: Icone, titre, valeur, detail }) => (
            <li key={titre} className="flex gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primaire-pale text-primaire-fonce">
                <Icone size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {titre}
                  <span className="ml-2 font-normal text-gray-600">
                    {valeur}
                  </span>
                </p>
                <p className="text-sm text-gray-500">{detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ----- Portabilité ----- */}
      <section
        aria-labelledby="titre-export"
        className="mt-5 rounded-2xl border border-gray-200 bg-white p-5"
      >
        <h2 id="titre-export" className="font-bold">
          {t.emporter}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t.emporterAide}</p>
        {/* Téléchargement d'un CSV (route API), pas une navigation de page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/export/mouvements"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <Download size={16} aria-hidden="true" /> {t.telecharger}
        </a>
      </section>

      {/* ----- Droits ----- */}
      <section
        aria-labelledby="titre-droits"
        className="mt-5 rounded-2xl bg-primaire-pale p-5"
      >
        <h2
          id="titre-droits"
          className="flex items-center gap-2 font-bold text-primaire-fonce"
        >
          <ShieldCheck size={18} aria-hidden="true" /> {t.vosDroits}
        </h2>
        <p className="mt-1 text-sm text-primaire-fonce">
          {t.droitsTexte1}
          <a className="underline" href="mailto:bonjour@keywe.io">
            bonjour@keywe.io
          </a>
          {t.droitsTexte2}
          <Link className="underline" href={localise("/confidentialite", locale)}>
            {t.politique}
          </Link>
          .
        </p>
      </section>

      {/* ----- Suppression ----- */}
      <section
        aria-labelledby="titre-suppression"
        className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5"
      >
        <h2
          id="titre-suppression"
          className="flex items-center gap-2 font-bold text-red-800"
        >
          <Trash2 size={18} aria-hidden="true" /> {t.supprimer}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-red-900">{t.supprimerTexte}</p>
        <Link
          href={localise("/espace/supprimer-compte", locale)}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
        >
          {t.voirEfface}
        </Link>
      </section>
    </div>
  );
}
