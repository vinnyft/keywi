import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GestionCleApi } from "@/components/client/GestionCleApi";
import { actionRevoquerCleApi } from "@/lib/actions/api";

export const metadata: Metadata = { title: "Clés API" };

/** Réglages développeur : clés API de l'hôte */
export default async function PageApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cles } = await supabase
    .from("api_keys")
    .select("id, nom, prefixe, derniere_utilisation, revoquee_le, created_at")
    .eq("hote_id", user!.id)
    .order("created_at", { ascending: false });

  const dateFr = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Clés API</h1>
          <p className="mt-1 text-gray-600">
            Pilotez vos clés Keywi depuis vos propres outils : automatisez la
            création des codes de retrait à chaque réservation.
          </p>
        </div>
        <Link
          href="/developpeurs"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <BookOpen size={16} aria-hidden="true" /> Documentation
        </Link>
      </div>

      <div className="mt-6 space-y-5">
        <GestionCleApi />

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">Vos clés</h2>
          {!cles?.length ? (
            <p className="mt-2 text-sm text-gray-600">
              Aucune clé pour l&apos;instant. Générez-en une ci-dessus pour
              commencer.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {cles.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {c.nom}
                      {c.revoquee_le && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                          Révoquée
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-gray-500">
                      {c.prefixe}…
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Créée le {dateFr(c.created_at)}
                      {c.derniere_utilisation
                        ? ` · dernière utilisation le ${dateFr(c.derniere_utilisation)}`
                        : " · jamais utilisée"}
                    </p>
                  </div>
                  {!c.revoquee_le && (
                    <form action={actionRevoquerCleApi}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-red-700 underline hover:text-red-800"
                      >
                        Révoquer
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
