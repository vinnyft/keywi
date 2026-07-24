import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback des liens Supabase reçus par email : échange le code
 * contre une session.
 *
 * Deux cas :
 *  - lien magique / confirmation → on redirige vers l'espace adapté
 *  - réinitialisation (`type=recovery`) → on envoie vers le
 *    formulaire de choix du nouveau mot de passe, la session
 *    ouverte servant à autoriser la mise à jour
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reinitialiser`);
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
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }
  return NextResponse.redirect(`${origin}/connexion?erreur=lien-invalide`);
}
