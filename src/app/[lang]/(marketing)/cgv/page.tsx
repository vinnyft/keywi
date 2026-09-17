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
    title: loc === "en" ? "Terms and conditions" : "Conditions générales de vente",
    description:
      loc === "en"
        ? "General terms of sale and use of the KeyWe service."
        : "Conditions générales de vente et d'utilisation du service KeyWe.",
    alternates: alternatesLangues("/cgv", loc),
  };
}

export default async function PageCgv({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";

  const fr = {
    h1: "Conditions générales",
    maj: "Dernière mise à jour",
    sections: [
      { h: "1. Objet", p: "Les présentes conditions régissent l'utilisation du service KeyWe de dépôt et de remise de clés via un réseau de commerces partenaires." },
      { h: "2. Service", p: "KeyWe met en relation des déposants et des points relais. Le déposant reste responsable des clés confiées et des accès qu'il partage via les codes de retrait." },
      { h: "3. Tarifs et paiement", p: "Les dépôts sont facturés à l'unité ou via un abonnement, aux tarifs indiqués sur la page Tarifs. Les paiements sont traités de façon sécurisée." },
      { h: "4. Responsabilité", p: "KeyWe s'engage à assurer la traçabilité de chaque mouvement. La remise des clés est conditionnée à la présentation d'un code de retrait valide et à la vérification du badge." },
    ],
    note: "Document fourni à titre d'exemple dans le cadre de cette démonstration. À remplacer par vos conditions juridiques définitives avant toute mise en production.",
    courtoisie: null as string | null,
  };
  const en = {
    h1: "Terms and conditions",
    maj: "Last updated",
    sections: [
      { h: "1. Purpose", p: "These terms govern use of the KeyWe service for dropping off and handing over keys through a network of partner shops." },
      { h: "2. The service", p: "KeyWe connects depositors with drop-off points. The depositor remains responsible for the keys entrusted and for the access they share via pickup codes." },
      { h: "3. Pricing and payment", p: "Drop-offs are billed per unit or via a subscription, at the rates shown on the Pricing page. Payments are processed securely." },
      { h: "4. Liability", p: "KeyWe undertakes to ensure the traceability of every movement. Keys are handed over only on presentation of a valid pickup code and verification of the tag." },
    ],
    note: "Sample document provided as part of this demonstration. Replace with your final legal terms before going live.",
    courtoisie: "Courtesy translation. The French version is the authoritative text.",
  };
  const t = locale === "en" ? en : fr;

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
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-bold">{s.h}</h2>
            <p className="mt-2">{s.p}</p>
          </section>
        ))}

        <p className="rounded-xl bg-sable p-4 text-sm text-gray-500">{t.note}</p>
      </div>
    </article>
  );
}
