import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Entrée de l'espace : redirige vers la bonne vue selon le rôle.
 * Seul le propriétaire (hôte, qui paie l'abonnement) a un compte ;
 * le bénéficiaire n'en a pas — il reçoit un lien de retrait. Les
 * redirections conservent la langue.
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
    case "commercial":
      redirect(l("/commercial"));
    default:
      redirect(l("/espace/keyhost"));
  }
}
