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
    title: loc === "en" ? "About" : "À propos",
    description:
      loc === "en"
        ? "KeyWe's mission: make handing over keys simple and safe."
        : "La mission de KeyWe : rendre la remise de clés simple et sûre.",
    alternates: alternatesLangues("/a-propos", loc),
  };
}

export default async function PageAPropos({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";

  const fr = {
    h1: "À propos de KeyWe",
    p: [
      "KeyWe est né d'un constat simple : remettre des clés ne devrait jamais être un casse-tête. Boîtes à clés fragiles, rendez-vous ratés, allers-retours interminables… il fallait une alternative de confiance, ancrée dans le quartier.",
      "Notre réponse : un réseau de commerces partenaires qui gardent vos clés en lieu sûr, à deux pas de chez vous. Vous déposez un trousseau muni d'un badge, vous partagez un code de retrait, et vous suivez chaque mouvement en temps réel.",
      "Côté commerçants, c'est un revenu complémentaire et du passage supplémentaire, sans matériel coûteux ni formation lourde.",
      "KeyWe est conçu et opéré en France, dans le respect de vos données et de la confiance que vous nous accordez.",
    ],
  };
  const en = {
    h1: "About KeyWe",
    p: [
      "KeyWe grew from a simple observation: handing over keys should never be a headache. Flimsy lockboxes, missed appointments, endless round trips… a trustworthy, neighbourhood-rooted alternative was needed.",
      "Our answer: a network of partner shops that keep your keys safe, just steps from home. You drop off a keyring fitted with a tag, share a pickup code, and track every movement in real time.",
      "For shop owners, it means extra income and extra footfall — with no costly hardware and no heavy training.",
      "KeyWe is designed and operated in France, with respect for your data and the trust you place in us.",
    ],
  };
  const t = locale === "en" ? en : fr;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">{t.h1}</h1>
      <div className="mt-6 space-y-4 text-lg text-gray-700">
        {t.p.map((paragraphe, i) => (
          <p key={i}>{paragraphe}</p>
        ))}
      </div>
    </article>
  );
}
