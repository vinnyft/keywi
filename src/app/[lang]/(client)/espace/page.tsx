import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Entrée de l'espace : redirige vers la bonne vue selon le rôle —
 * CRM KeyHost pour les hôtes, « Mes clés à récupérer » pour les
 * voyageurs / bénéficiaires. Les redirections conservent la langue.
 */
export default async function PageEspace({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const l = (chemin: string) => localise(chemin, locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${l("/connexion")}?suivant=${l("/espace")}`);

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  switch (profil?.role) {
    case "commercant":
      redirect(l("/commercant"));
    case "admin":
      redirect(l("/admin"));
    case "voyageur":
      redirect(l("/espace/guest"));
    default:
      redirect(l("/espace/keyhost"));
  }
}
