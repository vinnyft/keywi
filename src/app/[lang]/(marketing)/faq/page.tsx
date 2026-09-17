import type { Metadata } from "next";
import { alternatesLangues, estLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "FAQ" : "FAQ",
    description:
      loc === "en"
        ? "Answers to the most common questions about KeyWe."
        : "Les réponses aux questions les plus fréquentes sur KeyWe.",
    alternates: alternatesLangues("/faq", loc),
  };
}

const QUESTIONS_FR = [
  { q: "Comment fonctionne le dépôt d'une clé ?", r: "Choisissez un point relais sur la carte, réglez le dépôt et recevez un badge à coller sur votre trousseau. Apportez-le au commerce : le commerçant le scanne et le range dans une case numérotée." },
  { q: "Comment un bénéficiaire récupère-t-il les clés ?", r: "Vous lui partagez un code de retrait à 6 caractères (par email ou WhatsApp). Il le présente au commerçant, qui sort le trousseau de la case après une vérification du badge." },
  { q: "Mes clés sont-elles en sécurité ?", r: "Chaque trousseau est rangé dans une case dédiée, jamais étiqueté avec votre adresse. Chaque mouvement est journalisé de façon immuable, et vous êtes notifié en temps réel." },
  { q: "Combien ça coûte ?", r: "7,90 € par dépôt à l'unité, ou 5,49 €/mois en abonnement hôte avec dépôts illimités. Aucun engagement." },
  { q: "Puis-je révoquer un code de retrait ?", r: "Oui, à tout moment depuis le détail de la clé dans votre espace. Le code devient immédiatement inutilisable." },
  { q: "Je suis commerçant, que dois-je installer ?", r: "Rien à acheter : nous fournissons les cases numérotées, les badges et la signalétique. L'application comptoir fonctionne sur smartphone ou tablette." },
];

const QUESTIONS_EN = [
  { q: "How does dropping off a key work?", r: "Pick a drop-off point on the map, pay for the drop-off and get a tag to stick on your keyring. Bring it to the shop: the owner scans it and stores it in a numbered slot." },
  { q: "How does someone pick up the keys?", r: "You share a 6-character pickup code with them (by email or WhatsApp). They show it to the shop owner, who takes the keyring out of the slot after checking the tag." },
  { q: "Are my keys safe?", r: "Each keyring is stored in a dedicated slot, never labelled with your address. Every movement is logged immutably, and you're notified in real time." },
  { q: "How much does it cost?", r: "€7.90 per one-off drop-off, or €5.49/month on a host subscription with unlimited drop-offs. No commitment." },
  { q: "Can I revoke a pickup code?", r: "Yes, at any time from the key's detail page in your dashboard. The code becomes unusable immediately." },
  { q: "I'm a shop owner — what do I need to install?", r: "Nothing to buy: we provide the numbered slots, the tags and the signage. The counter app runs on a smartphone or tablet." },
];

export default async function PageFaq({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const titre = locale === "en" ? "Frequently asked questions" : "Questions fréquentes";
  const questions = locale === "en" ? QUESTIONS_EN : QUESTIONS_FR;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">{titre}</h1>
      <dl className="mt-8 space-y-3">
        {questions.map((item) => (
          <details key={item.q} className="rounded-2xl border border-gray-200 bg-white p-5">
            <summary className="cursor-pointer font-bold">{item.q}</summary>
            <dd className="mt-2 text-gray-600">{item.r}</dd>
          </details>
        ))}
      </dl>
    </div>
  );
}
