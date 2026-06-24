import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback des liens magiques Supabase : échange le code reçu par
 * email contre une session, puis redirige vers l'espace adapté.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
