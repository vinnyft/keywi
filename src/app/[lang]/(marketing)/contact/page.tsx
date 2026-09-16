import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Store } from "lucide-react";
import { alternatesLangues, estLocale, localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc: Locale = estLocale(lang) ? lang : "fr";
  return {
    title: "Contact",
    description:
      loc === "en" ? "A question? The Keywi team is here to help." : "Une question ? L'équipe Keywi vous répond.",
    alternates: alternatesLangues("/contact", loc),
  };
}

export default async function PageContact({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const l = (chemin: string) => localise(chemin, locale);

  const t =
    locale === "en"
      ? {
          h1: "Get in touch",
          lede: "A question about a drop-off, a pickup, or want to join the network? Pick the right channel.",
          emailTitre: "By email",
          emailNote: "bonjour@keywi.fr — reply within 24 business hours",
          faqTitre: "Frequently asked questions",
          faqNote: "The answer may already be in the FAQ",
          commercantTitre: "Are you a shop owner?",
          commercantNote: "Offer your shop as a drop-off point",
        }
      : {
          h1: "Nous contacter",
          lede: "Une question sur un dépôt, un retrait, ou l'envie de rejoindre le réseau ? Choisissez le bon canal.",
          emailTitre: "Par email",
          emailNote: "bonjour@keywi.fr — réponse sous 24 h ouvrées",
          faqTitre: "Questions fréquentes",
          faqNote: "La réponse est peut-être déjà dans la FAQ",
          commercantTitre: "Vous êtes commerçant ?",
          commercantNote: "Proposez votre commerce comme point relais",
        };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">{t.h1}</h1>
      <p className="mt-3 text-lg text-gray-600">{t.lede}</p>

      <div className="mt-8 space-y-4">
        <a
          href="mailto:bonjour@keywi.fr"
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primaire"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
            <Mail size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-bold">{t.emailTitre}</span>
            <span className="text-gray-600">{t.emailNote}</span>
          </span>
        </a>

        <Link
          href={l("/faq")}
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primaire"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-menthe-pale text-menthe">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-bold">{t.faqTitre}</span>
            <span className="text-gray-600">{t.faqNote}</span>
          </span>
        </Link>

        <Link
          href={l("/devenir-point-relais")}
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primaire"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-corail/10 text-corail">
            <Store size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-bold">{t.commercantTitre}</span>
            <span className="text-gray-600">{t.commercantNote}</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
