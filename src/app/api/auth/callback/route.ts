import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LOCALE_DEFAUT, estLocale, localise } from "@/lib/i18n";

/**
 * Callback des liens Supabase reçus par email : échange le code
 * contre une session.
 *
 * Deux cas :
 *  - lien magique / confirmation → on redirige vers l'espace adapté
 *  - réinitialisation (`type=recovery`) → on envoie vers le
 *    formulaire de choix du nouveau mot de passe.
 *
 * La langue (`lang`, posée dans l'URL du lien à l'envoi) est
 * préservée pour que l'atterrissage se fasse dans la bonne langue.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const langBrut = searchParams.get("lang") ?? "";
  const locale = estLocale(langBrut) ? langBrut : LOCALE_DEFAUT;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}${localise("/reinitialiser", locale)}`);
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .single();
      const destination =
        profil?.role === "commercant"
          ? "/commercant"
          : profil?.role === "admin"
            ? "/admin"
            : "/espace";
      return NextResponse.redirect(`${origin}${localise(destination, locale)}`);
    }
  }
  return NextResponse.redirect(
    `${origin}${localise("/connexion", locale)}?erreur=lien-invalide`
  );
}
