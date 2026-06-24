import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Proxy (ex-« middleware » avant Next.js 16) :
 *  1. rafraîchit la session Supabase à chaque requête (les cookies
 *     d'auth sont réécrits sur la réponse) ;
 *  2. protège les espaces privés en renvoyant vers /connexion les
 *     visiteurs non authentifiés.
 *
 * La vérification fine du rôle reste faite dans chaque page / RPC
 * (la RLS Postgres est la source de vérité) — ici on ne fait qu'un
 * garde-fou optimiste, conformément aux recommandations Next.js.
 */

const PREFIXES_PROTEGES = ["/espace", "/commercant", "/admin"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const estProtege = PREFIXES_PROTEGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (estProtege && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suivant", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf : fichiers statiques Next, images
     * optimisées, favicon/manifeste et fichiers d'assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
