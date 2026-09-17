import { redirect } from "next/navigation";
import Link from "next/link";
import { Target, UserPlus, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SelecteurLangue } from "@/components/ui/SelecteurLangue";
import { actionDeconnexion } from "@/lib/actions/auth";
import { estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Gabarit de l'espace commercial (démarchage des points relais).
 * Réservé aux rôles `commercial` et `admin` ; navigation en barre
 * d'onglets basse, pensée pour un usage mobile sur le terrain.
 */
export default async function CommercialLayout({
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
  if (!user) redirect(`${l("/connexion")}?suivant=${l("/commercial")}`);

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, nom")
    .eq("id", user.id)
    .single();
  if (profil?.role !== "commercial" && profil?.role !== "admin") {
    redirect(l("/espace"));
  }

  const onglets = [
    { href: "/commercial", icone: Target, libelle: en ? "Pipeline" : "Pipeline" },
    { href: "/commercial/nouveau", icone: UserPlus, libelle: en ? "Add" : "Ajouter" },
    { href: "/commercial/rapport", icone: BarChart3, libelle: en ? "Report" : "Rapport" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-sable">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-encre text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60">
              {en ? "Sales area" : "Espace commercial"}
            </p>
            <h1 className="font-bold leading-tight">
              {profil?.nom ?? (en ? "Sales rep" : "Commercial")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SelecteurLangue sombre />
            <form action={actionDeconnexion}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                {en ? "Sign out" : "Quitter"}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4">
        {children}
      </main>

      <nav
        aria-label={en ? "Sales navigation" : "Navigation commerciale"}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-3">
          {onglets.map(({ href, icone: Icone, libelle }) => (
            <Link
              key={href}
              href={l(href)}
              className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-gray-600 hover:text-primaire"
            >
              <Icone size={22} aria-hidden="true" />
              {libelle}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
