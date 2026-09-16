import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { LOCALE_DEFAUT, estLocale, localise, type Locale } from "@/lib/i18n";

/**
 * Proxy (ex-« middleware » avant Next.js 16). Deux rôles :
 *
 *  1. **Langue.** Les routes vivent sous `app/[lang]/`. Le français
 *     (par défaut) reste sur des URLs nues — une requête « /tarifs »
 *     est réécrite en interne vers « /fr/tarifs » sans changer la
 *     barre d'adresse. L'anglais garde son préfixe visible « /en ».
 *     Un « /fr/… » explicite est redirigé vers l'URL nue (canonique).
 *
 *  2. **Accès.** Sur les espaces privés (/espace, /commercant,
 *     /admin, quel que soit le préfixe de langue), on rafraîchit la
 *     session Supabase et on renvoie les visiteurs non authentifiés
 *     vers la connexion. La vérification fine du rôle reste faite
 *     dans chaque page / RPC (la RLS Postgres est la source de vérité).
 *
 * L'appel à `getUser()` — un aller-retour vers Supabase Auth — n'a
 * lieu que sur ces espaces : le trafic public n'est que réécrit, sans
 * toucher à l'authentification, ce qui préserve sa mise en cache.
 */

const PREFIXES_PROTEGES = ["/espace", "/commercant", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const seg = pathname.split("/")[1];

  // « /fr/… » explicite → on redirige vers l'URL nue (le français
  // n'est jamais préfixé dans la barre d'adresse).
  if (seg === LOCALE_DEFAUT) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(LOCALE_DEFAUT.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  const localePrefixee = estLocale(seg) && seg !== LOCALE_DEFAUT;
  const locale: Locale = localePrefixee ? (seg as Locale) : LOCALE_DEFAUT;

  // Chemin sans préfixe de langue, pour tester les zones protégées.
  const reste = localePrefixee ? pathname.slice(seg.length + 1) || "/" : pathname;

  // Fabrique la réponse selon le mode : réécriture interne vers /fr
  // pour le français nu, passage direct pour l'anglais déjà préfixé.
  const construire = () => {
    if (localePrefixee) return NextResponse.next({ request });
    const url = request.nextUrl.clone();
    url.pathname = `/${LOCALE_DEFAUT}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request });
  };

  let response = construire();

  const protege = PREFIXES_PROTEGES.some(
    (p) => reste === p || reste.startsWith(`${p}/`)
  );
  if (!protege) return response;

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
          response = construire();
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

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = localise("/connexion", locale);
    url.searchParams.set("suivant", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  /*
   * Toutes les pages, pour porter le routage de langue — mais jamais
   * l'API, les fichiers Next, ni les routes de métadonnées/assets
   * (elles n'ont pas de préfixe de langue). L'appel Supabase, lui,
   * reste cantonné aux espaces privés (voir ci-dessus).
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|twitter-image|.*\\.).*)",
  ],
};
