import { redirect } from "next/navigation";
import Link from "next/link";
import { ScanLine, Grid3X3, History, Euro } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { actionDeconnexion } from "@/lib/actions/auth";

/**
 * Gabarit de l'application commerçant (mobile-first, route /commercant).
 * Vérifie le rôle, charge le point relais et affiche la navigation
 * en barre d'onglets basse (utilisable d'une main derrière un comptoir).
 */
export default async function CommercantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?suivant=/commercant");

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, nom")
    .eq("id", user.id)
    .single();
  // Seuls les commerçants (et l'admin pour dépannage) accèdent à cet espace
  if (profil?.role !== "commercant" && profil?.role !== "admin") {
    redirect("/espace");
  }

  const { data: pointRelais } = await supabase
    .from("relay_points")
    .select("id, nom, adresse")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col bg-sable">
      {/* En-tête : nom du commerce */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-encre text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/60">
              Espace point relais
            </p>
            <h1 className="font-bold leading-tight">
              {pointRelais?.nom ?? "Aucun point relais associé"}
            </h1>
          </div>
          <form action={actionDeconnexion}>
            <button
              type="submit"
              className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Quitter
            </button>
          </form>
        </div>
      </header>

      {/* Contenu de la page, avec espace pour la barre d'onglets */}
      <main id="contenu" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        {pointRelais ? (
          children
        ) : (
          <p className="rounded-xl bg-ambre-pale p-4 text-ambre">
            Votre compte commerçant n&apos;est rattaché à aucun point relais.
            Contactez l&apos;équipe KLAV.
          </p>
        )}
      </main>

      {/* Barre d'onglets basse (mobile-first) */}
      <nav
        aria-label="Navigation commerçant"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {[
            { href: "/commercant", icone: ScanLine, libelle: "Scanner" },
            { href: "/commercant/cases", icone: Grid3X3, libelle: "Mes cases" },
            { href: "/commercant/historique", icone: History, libelle: "Historique" },
            { href: "/commercant/remuneration", icone: Euro, libelle: "Gains" },
          ].map(({ href, icone: Icone, libelle }) => (
            <Link
              key={href}
              href={href}
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
