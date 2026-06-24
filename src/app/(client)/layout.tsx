import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound, PackagePlus, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { actionDeconnexion } from "@/lib/actions/auth";

/**
 * Gabarit de l'espace client (hôte / voyageur).
 * La protection d'accès est portée par le proxy ; ici on charge le
 * profil pour adapter la navigation au rôle.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?suivant=/espace");

  const { data: profil } = await supabase
    .from("profiles")
    .select("role, nom")
    .eq("id", user.id)
    .single();

  const estHote = profil?.role !== "voyageur";

  const liens = [
    { href: "/espace", icone: KeyRound, libelle: "Mes clés" },
    ...(estHote
      ? [{ href: "/espace/deposer", icone: PackagePlus, libelle: "Déposer" }]
      : []),
    { href: "/espace/notifications", icone: Bell, libelle: "Notifications" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo taille={30} lien="/espace" />

          <nav aria-label="Espace client" className="flex items-center gap-1">
            {liens.map(({ href, icone: Icone, libelle }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <Icone size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{libelle}</span>
              </Link>
            ))}
            <form action={actionDeconnexion}>
              <button
                type="submit"
                className="ml-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Quitter
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
