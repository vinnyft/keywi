import type { Metadata } from "next";
import { Euro, Clock, Boxes, HeartHandshake } from "lucide-react";
import {
  FormulaireCandidature,
  type TextesCandidature,
} from "@/components/marketing/FormulaireCandidature";
import { alternatesLangues, estLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Become a partner" : "Devenir point relais",
    description:
      loc === "en"
        ? "Turn your shop into a Keywi drop-off point: extra income on every key movement."
        : "Transformez votre commerce en point relais Keywi : un revenu complémentaire à chaque mouvement de clés.",
    alternates: alternatesLangues("/devenir-point-relais", loc),
  };
}

function contenu(locale: Locale): {
  h1: string;
  lede: string;
  atouts: { icone: typeof Euro; titre: string; texte: string }[];
  formTitre: string;
  formLede: string;
  form: TextesCandidature;
} {
  if (locale === "en") {
    return {
      h1: "Become a Keywi drop-off point",
      lede: "Your counter already has everything it needs. Join the network and help your neighbourhood — while topping up your month.",
      atouts: [
        { icone: Euro, titre: "Extra income", texte: "Up to €1.20 paid for each scanned drop-off, pickup or return, paid at the start of the following month." },
        { icone: Clock, titre: "No hassle", texte: "A few seconds per movement: one scan, a slot assigned, done. No heavy training." },
        { icone: Boxes, titre: "Kit provided", texte: "Numbered slots, tags and signage installed by our team. No investment on your side." },
        { icone: HeartHandshake, titre: "More footfall", texte: "Customers coming to drop off or pick up a key discover your shop." },
      ],
      formTitre: "Offer your shop",
      formLede: "Fill in this form: our team gets back to you within 48 business hours.",
      form: {
        succes: "Application received! Our team will contact you within 48 business hours to finalise joining the Keywi network.",
        nomCommerce: "Shop name",
        nomCommercePlaceholder: "Corner Café",
        votreNom: "Your name",
        votreNomPlaceholder: "Jane Martin",
        email: "Email",
        telephone: "Phone",
        adresse: "Shop address",
        adressePlaceholder: "12 Republic Street",
        codePostal: "Postcode",
        ville: "City",
        message: "Tell us about your shop",
        messagePlaceholder: "Type of shop, opening hours, space available behind the counter…",
        envoyer: "Send my application",
        envoi: "Sending…",
        obligatoires: "* Required fields. Your data is used only to process your application (see our privacy policy).",
      },
    };
  }
  return {
    h1: "Devenez point relais Keywi",
    lede: "Votre comptoir a déjà tout ce qu'il faut. Rejoignez le réseau et rendez service à votre quartier — tout en arrondissant vos fins de mois.",
    atouts: [
      { icone: Euro, titre: "Un revenu complémentaire", texte: "Jusqu'à 1,20 € reversé pour chaque dépôt, retrait ou retour scanné, versé en début de mois suivant." },
      { icone: Clock, titre: "Zéro contrainte", texte: "Quelques secondes par mouvement : un scan, une case attribuée, c'est rangé. Aucune formation lourde." },
      { icone: Boxes, titre: "Le kit fourni", texte: "Cases numérotées, badges et signalétique installés par notre équipe. Aucun investissement de votre part." },
      { icone: HeartHandshake, titre: "Plus de passage", texte: "Les clients qui viennent déposer ou récupérer une clé découvrent votre commerce." },
    ],
    formTitre: "Proposez votre commerce",
    formLede: "Remplissez ce formulaire : notre équipe vous recontacte sous 48 h ouvrées.",
    form: {
      succes: "Candidature bien reçue ! Notre équipe vous recontacte sous 48 h ouvrées pour finaliser votre adhésion au réseau Keywi.",
      nomCommerce: "Nom du commerce",
      nomCommercePlaceholder: "Café du Coin",
      votreNom: "Votre nom",
      votreNomPlaceholder: "Jeanne Martin",
      email: "Email",
      telephone: "Téléphone",
      adresse: "Adresse du commerce",
      adressePlaceholder: "12 rue de la République",
      codePostal: "Code postal",
      ville: "Ville",
      message: "Parlez-nous de votre commerce",
      messagePlaceholder: "Type de commerce, horaires, espace disponible derrière le comptoir…",
      envoyer: "Envoyer ma candidature",
      envoi: "Envoi…",
      obligatoires: "* Champs obligatoires. Vos données ne servent qu'au traitement de votre candidature (voir notre politique de confidentialité).",
    },
  };
}

/** Page partenaires + formulaire de candidature */
export default async function PageDevenirPointRelais({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = contenu(locale);

  return (
    <>
      <section className="bg-encre text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-4xl font-black">{t.h1}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t.lede}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.atouts.map(({ icone: Icone, titre, texte }) => (
            <div key={titre} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-corail/10 text-corail">
                <Icone size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold">{titre}</h2>
              <p className="mt-1 text-sm text-gray-600">{texte}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <h2 className="text-center text-2xl font-black">{t.formTitre}</h2>
          <p className="mt-2 text-center text-gray-600">{t.formLede}</p>
          <FormulaireCandidature t={t.form} locale={locale} />
        </div>
      </section>
    </>
  );
}
