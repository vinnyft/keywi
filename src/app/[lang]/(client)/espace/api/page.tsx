import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GestionCleApi } from "@/components/client/GestionCleApi";
import { actionRevoquerCleApi } from "@/lib/actions/api";
import { localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "API keys" : "Clés API" };
}

/** Réglages développeur : clés API de l'hôte */
export default async function PageApi({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = lang === "en" ? "en" : "fr";
  const en = locale === "en";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cles } = await supabase
    .from("api_keys")
    .select("id, nom, prefixe, portees, derniere_utilisation, revoquee_le, created_at")
    .eq("hote_id", user!.id)
    .order("created_at", { ascending: false });

  const LIBELLE_PORTEE: Record<Locale, Record<string, string>> = {
    fr: { lire: "Lecture", creer: "Création de codes" },
    en: { lire: "Read", creer: "Create codes" },
  };

  const dateCourte = (d: string) =>
    new Date(d).toLocaleDateString(en ? "en-IE" : "fr-FR", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });

  const t = en
    ? {
        titre: "API keys",
        intro:
          "Drive your KeyWe keys from your own tools: automate pickup-code creation on every booking.",
        doc: "Documentation",
        vosCles: "Your keys",
        aucune: "No key yet. Generate one above to get started.",
        revoquee: "Revoked",
        creeeLe: (d: string) => `Created on ${d}`,
        derniereUtil: (d: string) => ` · last used on ${d}`,
        jamais: " · never used",
        revoquer: "Revoke",
      }
    : {
        titre: "Clés API",
        intro:
          "Pilotez vos clés KeyWe depuis vos propres outils : automatisez la création des codes de retrait à chaque réservation.",
        doc: "Documentation",
        vosCles: "Vos clés",
        aucune: "Aucune clé pour l'instant. Générez-en une ci-dessus pour commencer.",
        revoquee: "Révoquée",
        creeeLe: (d: string) => `Créée le ${d}`,
        derniereUtil: (d: string) => ` · dernière utilisation le ${d}`,
        jamais: " · jamais utilisée",
        revoquer: "Révoquer",
      };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{t.titre}</h1>
          <p className="mt-1 text-gray-600">{t.intro}</p>
        </div>
        <Link
          href={localise("/developpeurs", locale)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          <BookOpen size={16} aria-hidden="true" /> {t.doc}
        </Link>
      </div>

      <div className="mt-6 space-y-5">
        <GestionCleApi />

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">{t.vosCles}</h2>
          {!cles?.length ? (
            <p className="mt-2 text-sm text-gray-600">{t.aucune}</p>
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
                          {t.revoquee}
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-gray-500">
                      {c.prefixe}…
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {(c.portees ?? []).map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-primaire-pale px-2 py-0.5 text-xs font-semibold text-primaire-fonce"
                        >
                          {LIBELLE_PORTEE[locale][p] ?? p}
                        </span>
                      ))}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t.creeeLe(dateCourte(c.created_at))}
                      {c.derniere_utilisation
                        ? t.derniereUtil(dateCourte(c.derniere_utilisation))
                        : t.jamais}
                    </p>
                  </div>
                  {!c.revoquee_le && (
                    <form action={actionRevoquerCleApi}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-red-700 underline hover:text-red-800"
                      >
                        {t.revoquer}
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
