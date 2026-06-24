import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Entrée de l'espace : redirige vers la bonne vue selon le rôle —
 * CRM KeyHost pour les hôtes, « Mes clés à récupérer » pour les
 * voyageurs / bénéficiaires.
 */
export default async function PageEspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?suivant=/espace");

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Chaque rôle rejoint son espace dédié
  switch (profil?.role) {
    case "commercant":
      redirect("/commercant");
    case "admin":
      redirect("/admin");
    case "voyageur":
      redirect("/espace/guest");
    default:
      redirect("/espace/keyhost");
  }
}
