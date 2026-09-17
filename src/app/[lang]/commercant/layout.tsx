import { redirect } from "next/navigation";
import Link from "next/link";
import { ScanLine, Grid3X3, History, Euro, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SelecteurLangue } from "@/components/ui/SelecteurLangue";
import { actionDeconnexion } from "@/lib/actions/auth";
import { estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Gabarit de l'application commerçant (mobile-first).
 * Vérifie le rôle, charge le point relais et affiche la navigation
 * en barre d'onglets basse (utilisable d'une main derrière un comptoir).
 */
export default async function CommercantLayout({
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
  if (!user) redirect(`${l("/connexion")}?suivant=${l("/commercant")}`);

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, nom")
    .eq("id", user.id)
    .single();
  if (profil?.role !== "commercant" && profil?.role !== "admin") {
    redirect(l("/espace"));
  }

  const { data: pointRelais } = await supabase
    .from("relay_points")
    .select("id, nom, adresse")
    .eq("owner_id", user.id)
    .maybeSingle();

  const onglets = [
    { href: "/commercant", icone: ScanLine, libelle: en ? "Scan" : "Scanner" },
    { href: "/commercant/cases", icone: Grid3X3, libelle: en ? "My slots" : "Mes cases" },
    { href: "/commercant/clients", icone: Users, libelle: en ? "Clients" : "Clients" },
    { href: "/commercant/historique", icone: History, libelle: en ? "History" : "Historique" },
    { href: "/commercant/remuneration", icone: Euro, libelle: en ? "Earnings" : "Gains" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-sable">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-encre text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60">
              {en ? "Drop-off point area" : "Espace point relais"}
            </p>
            <h1 className="font-bold leading-tight">
              {pointRelais?.nom ?? (en ? "No drop-off point linked" : "Aucun point relais associé")}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SelecteurLangue sombre />
            <Link
              href={l("/espace/confidentialite")}
              className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {en ? "My data" : "Mes données"}
            </Link>
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

      <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        {pointRelais ? (
          children
        ) : (
          <p className="rounded-xl bg-ambre-pale p-4 text-ambre">
            {en
              ? "Your shop account isn't linked to any drop-off point yet. Contact the KeyWe team."
              : "Votre compte commerçant n'est rattaché à aucun point relais. Contactez l'équipe KeyWe."}
          </p>
        )}
      </main>

      <nav
        aria-label={en ? "Shop navigation" : "Navigation commerçant"}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-5">
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
