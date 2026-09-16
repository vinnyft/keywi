import { notFound } from "next/navigation";
import { EnTete } from "@/components/marketing/EnTete";
import { PiedDePage } from "@/components/marketing/PiedDePage";
import { AssistanceBot } from "@/components/support/AssistanceBot";
import { estLocale } from "@/lib/i18n";
import { getDictionnaire } from "@/lib/dictionaries";

/** Gabarit du site public : en-tête + contenu + pied de page (localisé). */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!estLocale(lang)) notFound();
  const dict = getDictionnaire(lang);

  return (
    <>
      <EnTete dict={dict.nav} locale={lang} />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PiedDePage dict={dict.footer} locale={lang} />
      <AssistanceBot />
    </>
  );
}
