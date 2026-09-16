import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Download, Lock, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SuppressionCompte } from "@/components/client/SuppressionCompte";
import { localise, type Locale } from "@/lib/i18n";
import type { ApercuSuppression } from "@/lib/suppression-compte";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "en" ? "Delete my account" : "Supprimer mon compte",
    robots: { index: false },
  };
}

/**
 * Écran de confirmation de la suppression de compte.
 *
 * Supprimer, ici, veut dire anonymiser : le journal des
 * mouvements est immuable par construction et les paiements
 * relèvent de l'obligation comptable. Plutôt que de le taire, on
 * l'affiche — colonne par colonne, ce qui part et ce qui reste.
 * Un utilisateur qui comprend ce qu'il déclenche consent
 * vraiment ; c'est aussi ce qu'exige la loyauté du traitement.
 */
export default async function PageSupprimerCompte({
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
  if (!user) redirect(localise("/connexion?suivant=/espace/supprimer-compte", locale));

  const { data: brut } = await supabase.rpc("apercu_suppression_compte");
  const apercu = (brut ?? null) as unknown as ApercuSuppression | null;

  const nb = (n: number | undefined) => n ?? 0;

  const t = en
    ? {
        mesDonnees: "My data",
        titre: "Delete my account",
        intro:
          "At Keywi, deleting doesn't mean “hiding”. Your identity is destroyed in the database; what remains can no longer be traced back to you.",
        avant: "Before you go",
        avantAide:
          "Once the account is deleted, your history is no longer recoverable. Take it with you if you need it.",
        telecharger: "Download my history",
        efface: "Erased",
        conserve: "Kept, but anonymous",
        effaceItems: [
          "Your name, your email, your phone",
          "The name of your properties and your tags",
          "The pickup codes and the identity of their recipients",
          "Your recurring access",
          "Your notifications",
          "Your API keys",
          "Your shared traceability certificates (links revoked)",
          "Your login identifier",
        ],
        journalLibelle: "The movement log, without name or property",
        journalPourquoi:
          "Immutable by design: this is what makes the traceability certificate enforceable. The dates, places and slots remain; the identity is removed.",
        paiementsLibelle: "The payment records",
        paiementsPourquoi:
          "10-year accounting obligation (art. L123-22 of the French Commercial Code). Amounts and dates only, attached to a profile that has become anonymous.",
      }
    : {
        mesDonnees: "Mes données",
        titre: "Supprimer mon compte",
        intro:
          "Chez Keywi, supprimer ne veut pas dire « masquer ». Votre identité est détruite en base ; ce qui subsiste ne permet plus de remonter jusqu'à vous.",
        avant: "Avant de partir",
        avantAide:
          "Une fois le compte supprimé, votre historique n'est plus récupérable. Emportez-le si vous en avez besoin.",
        telecharger: "Télécharger mon historique",
        efface: "Effacé",
        conserve: "Conservé, mais anonyme",
        effaceItems: [
          "Votre nom, votre email, votre téléphone",
          "Le nom de vos logements et vos badges",
          "Les codes de retrait et l'identité de leurs bénéficiaires",
          "Vos accès récurrents",
          "Vos notifications",
          "Vos clés d'API",
          "Vos certificats de traçabilité partagés (liens révoqués)",
          "Votre identifiant de connexion",
        ],
        journalLibelle: "Le journal des mouvements, sans nom ni logement",
        journalPourquoi:
          "Immuable par conception : c'est ce qui rend le certificat de traçabilité opposable. Les dates, lieux et cases restent ; l'identité en est retirée.",
        paiementsLibelle: "Les écritures de paiement",
        paiementsPourquoi:
          "Obligation comptable de 10 ans (art. L123-22 du Code de commerce). Montants et dates uniquement, rattachés à un profil devenu anonyme.",
      };

  const efface = [
    { libelle: t.effaceItems[0] },
    { libelle: t.effaceItems[1], compte: nb(apercu?.trousseaux) },
    {
      libelle: t.effaceItems[2],
      compte: nb(apercu?.codes_actifs) + nb(apercu?.codes_recus),
    },
    { libelle: t.effaceItems[3], compte: nb(apercu?.recurrences) },
    { libelle: t.effaceItems[4], compte: nb(apercu?.notifications) },
    { libelle: t.effaceItems[5], compte: nb(apercu?.cles_api) },
    { libelle: t.effaceItems[6] },
    { libelle: t.effaceItems[7] },
  ];

  const conserve = [
    {
      libelle: t.journalLibelle,
      compte: nb(apercu?.mouvements),
      pourquoi: t.journalPourquoi,
    },
    {
      libelle: t.paiementsLibelle,
      compte: nb(apercu?.paiements),
      pourquoi: t.paiementsPourquoi,
    },
  ];

  return (
    <div className="max-w-3xl">
      <Link
        href={localise("/espace/confidentialite", locale)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-encre"
      >
        <ArrowLeft size={15} aria-hidden="true" /> {t.mesDonnees}
      </Link>

      <h1 className="mt-3 text-2xl font-black">{t.titre}</h1>
      <p className="mt-1 text-gray-600">{t.intro}</p>

      {/* ----- Avant de partir ----- */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-bold">{t.avant}</h2>
        <p className="mt-1 text-sm text-gray-600">{t.avantAide}</p>
        {/* Téléchargement d'un CSV (route API), pas une navigation de page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/export/mouvements"
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <Download size={16} aria-hidden="true" /> {t.telecharger}
        </a>
      </section>

      {/* ----- Ce qui part / ce qui reste ----- */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <section
          aria-labelledby="titre-efface"
          className="rounded-2xl border border-gray-200 bg-white p-5"
        >
          <h2 id="titre-efface" className="flex items-center gap-2 font-bold">
            <span className="flex size-7 items-center justify-center rounded-full bg-red-100 text-red-700">
              <X size={15} aria-hidden="true" />
            </span>
            {t.efface}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {efface.map((e) => (
              <li key={e.libelle} className="flex gap-2">
                <X
                  size={15}
                  className="mt-0.5 shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <span>
                  {e.libelle}
                  {e.compte !== undefined && e.compte > 0 && (
                    <span className="ml-1 font-semibold text-gray-500">
                      ({e.compte})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="titre-conserve"
          className="rounded-2xl border border-gray-200 bg-white p-5"
        >
          <h2 id="titre-conserve" className="flex items-center gap-2 font-bold">
            <span className="flex size-7 items-center justify-center rounded-full bg-primaire-pale text-primaire-fonce">
              <Lock size={15} aria-hidden="true" />
            </span>
            {t.conserve}
          </h2>
          <ul className="mt-3 space-y-3 text-sm">
            {conserve.map((c) => (
              <li key={c.libelle} className="flex gap-2">
                <Check
                  size={15}
                  className="mt-0.5 shrink-0 text-primaire"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium">
                    {c.libelle}
                    {c.compte > 0 && (
                      <span className="ml-1 font-semibold text-gray-500">
                        ({c.compte})
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-gray-500">
                    {c.pourquoi}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ----- Confirmation ----- */}
      <div className="mt-5">
        <SuppressionCompte blocage={apercu?.blocage ?? null} />
      </div>
    </div>
  );
}
