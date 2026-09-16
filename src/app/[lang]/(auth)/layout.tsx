import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { estLocale, localise, type Locale } from "@/lib/i18n";

/** Gabarit des pages d'authentification : carte centrée, fond sable */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const retour = locale === "en" ? "← Back to the site" : "← Retour au site";

  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center bg-sable px-4 py-12"
    >
      <div className="mb-8">
        <Logo taille={40} lien={localise("/", locale)} />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {children}
      </div>
      <p className="mt-6 text-sm text-gray-600">
        <Link href={localise("/", locale)} className="underline hover:text-encre">
          {retour}
        </Link>
      </p>
    </main>
  );
}
