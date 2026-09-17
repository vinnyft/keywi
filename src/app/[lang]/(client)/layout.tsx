import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound, PackagePlus, Bell, Table2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { SelecteurLangue } from "@/components/ui/SelecteurLangue";
import { actionDeconnexion } from "@/lib/actions/auth";
import { AssistanceBot } from "@/components/support/AssistanceBot";
import { estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Gabarit de l'espace client (propriétaire / hôte).
 * La protection d'accès est portée par le proxy ; seul le
 * propriétaire des clés a un compte (le bénéficiaire reçoit un lien).
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${l("/connexion")}?suivant=${l("/espace")}`);

  const liens = [
    { href: "/espace", icone: KeyRound, libelle: en ? "My keys" : "Mes clés" },
    { href: "/espace/registre", icone: Table2, libelle: en ? "Register" : "Registre" },
    { href: "/espace/deposer", icone: PackagePlus, libelle: en ? "Drop off" : "Déposer" },
    { href: "/espace/notifications", icone: Bell, libelle: "Notifications" },
    { href: "/espace/confidentialite", icone: ShieldCheck, libelle: en ? "My data" : "Mes données" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo taille={30} lien={l("/espace")} />

          <nav aria-label={en ? "Client area" : "Espace client"} className="flex items-center gap-1">
            {liens.map(({ href, icone: Icone, libelle }) => (
              <Link
                key={href}
                href={l(href)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Icone size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{libelle}</span>
              </Link>
            ))}
            <span className="mx-1 hidden sm:inline">
              <SelecteurLangue />
            </span>
            <form action={actionDeconnexion}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="ml-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                {en ? "Sign out" : "Quitter"}
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>

      <AssistanceBot />
    </div>
  );
}
