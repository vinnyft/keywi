import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Client Supabase côté serveur (Server Components, Server Actions,
 * Route Handlers). La session vit dans les cookies de la requête ;
 * leur rafraîchissement éventuel est porté par le proxy
 * (src/proxy.ts). Doit être `await`-é : `cookies()` est asynchrone
 * sous Next.js 16.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : l'écriture de cookies
            // y est interdite. Le proxy se charge du rafraîchissement.
          }
        },
      },
    }
  );
}
