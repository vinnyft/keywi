import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estLocale, localise, type Locale } from "@/lib/i18n";
import {
  actionMajStatutProspect,
  actionAjouterActivite,
} from "@/lib/actions/commercial";
import {
  STATUTS,
  TYPES_ACTIVITE,
  libelleStatut,
  libelleType,
  couleurStatut,
} from "@/content/commercial";

export const metadata: Metadata = { title: "Fiche prospect" };

function dateLisible(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PageProspect({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);

  const t = en
    ? {
        retour: "← Pipeline",
        coordonnees: "Details",
        contact: "Contact",
        statut: "Stage",
        maj: "Update",
        activite: "Activity",
        ajouter: "Log activity",
        type: "Type",
        contenu: "What happened?",
        enregistrer: "Save",
        aucune: "No activity logged yet.",
        arr: "arr.",
        source: "Source",
      }
    : {
        retour: "← Pipeline",
        coordonnees: "Coordonnées",
        contact: "Contact",
        statut: "Étape",
        maj: "Mettre à jour",
        activite: "Activité",
        ajouter: "Journaliser une activité",
        type: "Type",
        contenu: "Que s'est-il passé ?",
        enregistrer: "Enregistrer",
        aucune: "Aucune activité pour l'instant.",
        arr: "arr.",
        source: "Source",
      };

  const supabase = await createClient();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!prospect) notFound();

  const { data: activites } = await supabase
    .from("prospect_activites")
    .select("*")
    .eq("prospect_id", id)
    .order("created_at", { ascending: false });

  const champ =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primaire focus:outline-none focus:ring-2 focus:ring-primaire/30";

  return (
    <div className="space-y-5">
      <Link href={l("/commercial")} className="text-sm text-gray-600 hover:text-encre">
        {t.retour}
      </Link>

      {/* En-tête */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-encre">{prospect.nom_commerce}</h2>
            <p className="text-sm text-gray-500">
              {[
                prospect.arrondissement ? `${prospect.arrondissement}ᵉ ${t.arr}` : null,
                prospect.adresse,
                prospect.code_postal,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${couleurStatut(prospect.statut)}`}>
            {libelleStatut(prospect.statut, locale)}
          </span>
        </div>

        {(prospect.contact_nom || prospect.contact_tel || prospect.contact_email) && (
          <p className="mt-3 text-sm text-gray-700">
            <span className="font-medium text-encre">{t.contact} : </span>
            {[prospect.contact_nom, prospect.contact_tel, prospect.contact_email]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {prospect.source && (
          <p className="mt-1 text-sm text-gray-500">{t.source} : {prospect.source}</p>
        )}
        {prospect.notes && (
          <p className="mt-2 whitespace-pre-line rounded-lg bg-sable/60 p-3 text-sm text-gray-700">
            {prospect.notes}
          </p>
        )}
      </div>

      {/* Changement de statut */}
      <form
        action={actionMajStatutProspect}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <input type="hidden" name="prospect_id" value={prospect.id} />
        <div>
          <label htmlFor="statut" className="block text-sm font-medium text-encre">
            {t.statut}
          </label>
          <select
            id="statut"
            name="statut"
            defaultValue={prospect.statut}
            className={`${champ} min-w-40`}
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {libelleStatut(s, locale)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-encre px-4 py-2 text-sm font-semibold text-white hover:bg-encre-2"
        >
          {t.maj}
        </button>
      </form>

      {/* Journaliser une activité */}
      <form
        action={actionAjouterActivite}
        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <input type="hidden" name="prospect_id" value={prospect.id} />
        <p className="text-sm font-semibold text-encre">{t.ajouter}</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-encre">{t.type}</label>
            <select id="type" name="type" defaultValue="appel" className={`${champ} min-w-32`}>
              {TYPES_ACTIVITE.map((ty) => (
                <option key={ty} value={ty}>
                  {libelleType(ty, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="contenu" className="block text-sm font-medium text-encre">{t.contenu}</label>
          <textarea id="contenu" name="contenu" rows={2} required className={champ} />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primaire px-4 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
        >
          {t.enregistrer}
        </button>
      </form>

      {/* Historique */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-encre">{t.activite}</h3>
        {(activites ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-4 text-sm text-gray-500">{t.aucune}</p>
        ) : (
          <ul className="space-y-2">
            {(activites ?? []).map((a) => (
              <li key={a.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-sable px-2 py-0.5 text-xs font-medium text-encre">
                    {libelleType(a.type, locale)}
                  </span>
                  <time className="text-xs text-gray-400">{dateLisible(a.created_at, locale)}</time>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{a.contenu}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
