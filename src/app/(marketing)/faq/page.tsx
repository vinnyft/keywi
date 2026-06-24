import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Les réponses aux questions les plus fréquentes sur KLAV.",
};

const QUESTIONS = [
  {
    q: "Comment fonctionne le dépôt d'une clé ?",
    r: "Choisissez un point relais sur la carte, réglez le dépôt et recevez un badge à coller sur votre trousseau. Apportez-le au commerce : le commerçant le scanne et le range dans une case numérotée.",
  },
  {
    q: "Comment un bénéficiaire récupère-t-il les clés ?",
    r: "Vous lui partagez un code de retrait à 6 caractères (par email ou WhatsApp). Il le présente au commerçant, qui sort le trousseau de la case après une vérification du badge.",
  },
  {
    q: "Mes clés sont-elles en sécurité ?",
    r: "Chaque trousseau est rangé dans une case dédiée, jamais étiqueté avec votre adresse. Chaque mouvement est journalisé de façon immuable, et vous êtes notifié en temps réel.",
  },
  {
    q: "Combien ça coûte ?",
    r: "7,90 € par dépôt à l'unité, ou 5,49 €/mois en abonnement hôte avec dépôts illimités. Aucun engagement.",
  },
  {
    q: "Puis-je révoquer un code de retrait ?",
    r: "Oui, à tout moment depuis le détail de la clé dans votre espace. Le code devient immédiatement inutilisable.",
  },
  {
    q: "Je suis commerçant, que dois-je installer ?",
    r: "Rien à acheter : nous fournissons les cases numérotées, les badges et la signalétique. L'application comptoir fonctionne sur smartphone ou tablette.",
  },
];

export default function PageFaq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">Questions fréquentes</h1>
      <dl className="mt-8 space-y-3">
        {QUESTIONS.map((item) => (
          <details
            key={item.q}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <summary className="cursor-pointer font-bold">{item.q}</summary>
            <dd className="mt-2 text-gray-600">{item.r}</dd>
          </details>
        ))}
      </dl>
    </div>
  );
}
