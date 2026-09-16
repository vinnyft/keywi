import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: loc === "en" ? "Pricing" : "Tarifs",
    description:
      loc === "en"
        ? "Keywi key drop-off, pay-as-you-go or on a host subscription."
        : "Le dépôt de clés Keywi à l'unité ou en abonnement hôte.",
    alternates: alternatesLangues("/tarifs", loc),
  };
}

function contenu(locale: Locale) {
  if (locale === "en") {
    return {
      h1: "Simple pricing",
      lede: "No commitment, no hidden fees. Pay per drop-off, or switch to a subscription once you manage several keys.",
      populaire: "Most popular",
      note: "Locally, with no Stripe key configured, payments are simulated: the full flow stays testable end to end.",
      offres: [
        {
          nom: "Pay-as-you-go", prix: "€7.90", periode: "per drop-off",
          description: "Ideal for a one-off drop-off.",
          avantages: ["A tag to stick on the keyring", "Unlimited pickup codes", "Real-time notifications", "Full tracking in your dashboard"],
          cta: "Drop off a key", href: "/espace/deposer", surligne: false,
        },
        {
          nom: "Host subscription", prix: "€5.49", periode: "per month",
          description: "For hosts who manage several keys regularly.",
          avantages: ["Unlimited drop-offs included", "KeyHost CRM: occupancy days, revenue", "Priority on available slots", "Dedicated support"],
          cta: "Create an account", href: "/inscription", surligne: true,
        },
      ],
    };
  }
  return {
    h1: "Des tarifs simples",
    lede: "Pas d'engagement, pas de frais cachés. Payez au dépôt ou passez à l'abonnement dès que vous gérez plusieurs clés.",
    populaire: "Le plus populaire",
    note: "En local, sans clé Stripe configurée, les paiements sont simulés : le flux complet reste testable de bout en bout.",
    offres: [
      {
        nom: "À l'unité", prix: "7,90 €", periode: "par dépôt",
        description: "Idéal pour un dépôt ponctuel.",
        avantages: ["Un badge à coller sur le trousseau", "Codes de retrait illimités", "Notifications en temps réel", "Suivi complet dans votre espace"],
        cta: "Déposer une clé", href: "/espace/deposer", surligne: false,
      },
      {
        nom: "Abonnement hôte", prix: "5,49 €", periode: "par mois",
        description: "Pour les hôtes qui gèrent plusieurs clés régulièrement.",
        avantages: ["Dépôts illimités inclus", "CRM KeyHost : jours d'occupation, revenus", "Priorité sur les cases disponibles", "Support dédié"],
        cta: "Créer un compte", href: "/inscription", surligne: true,
      },
    ],
  };
}

export default async function PageTarifs({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const t = contenu(locale);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-center text-4xl font-black">{t.h1}</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-gray-600">{t.lede}</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {t.offres.map((o) => (
          <div
            key={o.nom}
            className={`rounded-3xl border bg-white p-8 ${
              o.surligne ? "border-primaire ring-2 ring-primaire" : "border-gray-200"
            }`}
          >
            {o.surligne && (
              <span className="inline-block rounded-full bg-primaire-pale px-3 py-1 text-xs font-bold text-primaire-fonce">
                {t.populaire}
              </span>
            )}
            <h2 className="mt-2 text-xl font-bold">{o.nom}</h2>
            <p className="mt-3">
              <span className="text-4xl font-black">{o.prix}</span>{" "}
              <span className="text-gray-500">{o.periode}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">{o.description}</p>

            <ul className="mt-6 space-y-2 text-sm">
              {o.avantages.map((a) => (
                <li key={a} className="flex items-start gap-2">
                  <Check size={18} className="mt-0.5 shrink-0 text-menthe" aria-hidden="true" />
                  {a}
                </li>
              ))}
            </ul>

            <Link
              href={localise(o.href, locale)}
              className={`mt-8 block rounded-lg px-4 py-3 text-center font-semibold ${
                o.surligne
                  ? "bg-primaire text-white hover:bg-primaire-fonce"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {o.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-gray-500">{t.note}</p>
    </div>
  );
}
