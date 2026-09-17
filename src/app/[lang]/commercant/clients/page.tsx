import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { estLocale, type Locale } from "@/lib/i18n";
import {
  actionCreerClientRelais,
  actionSupprimerClientRelais,
} from "@/lib/actions/relais-crm";

export const metadata: Metadata = { title: "Mes clients" };

function dateLisible(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PageClientsRelais({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";

  const t = en
    ? {
        titre: "My clients",
        sousTitre: "Your recurring customers at this drop-off point.",
        ajouter: "Add a client",
        nom: "Name",
        contact: "Contact (phone / email)",
        derniere: "Last visit",
        notes: "Notes",
        enregistrer: "Add",
        supprimer: "Delete",
        aucun: "No client saved yet.",
        vu: "Last visit",
      }
    : {
        titre: "Mes clients",
        sousTitre: "Vos clients récurrents à ce point relais.",
        ajouter: "Ajouter un client",
        nom: "Nom",
        contact: "Contact (téléphone / email)",
        derniere: "Dernière visite",
        notes: "Notes",
        enregistrer: "Ajouter",
        supprimer: "Supprimer",
        aucun: "Aucun client enregistré.",
        vu: "Dernière visite",
      };

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("relais_clients")
    .select("*")
    .order("nom");

  const champ =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primaire focus:outline-none focus:ring-2 focus:ring-primaire/30";
  const etiquette = "block text-sm font-medium text-encre";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-encre">{t.titre}</h2>
        <p className="text-sm text-gray-600">{t.sousTitre}</p>
      </div>

      {/* Formulaire d'ajout */}
      <form
        action={actionCreerClientRelais}
        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <p className="text-sm font-semibold text-encre">{t.ajouter}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="nom" className={etiquette}>
              {t.nom} <span className="text-primaire">*</span>
            </label>
            <input id="nom" name="nom" required className={champ} />
          </div>
          <div>
            <label htmlFor="contact" className={etiquette}>{t.contact}</label>
            <input id="contact" name="contact" className={champ} />
          </div>
          <div>
            <label htmlFor="derniere_visite" className={etiquette}>{t.derniere}</label>
            <input id="derniere_visite" name="derniere_visite" type="date" className={champ} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className={etiquette}>{t.notes}</label>
          <textarea id="notes" name="notes" rows={2} className={champ} />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primaire px-4 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
        >
          {t.enregistrer}
        </button>
      </form>

      {/* Liste */}
      {(clients ?? []).length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-500">{t.aucun}</p>
      ) : (
        <ul className="space-y-2">
          {(clients ?? []).map((c) => (
            <li key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-encre">{c.nom}</p>
                  {c.contact && <p className="text-sm text-gray-600">{c.contact}</p>}
                  {c.derniere_visite && (
                    <p className="text-xs text-gray-400">
                      {t.vu} : {dateLisible(c.derniere_visite, locale)}
                    </p>
                  )}
                  {c.notes && (
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{c.notes}</p>
                  )}
                </div>
                <form action={actionSupprimerClientRelais}>
                  <input type="hidden" name="client_id" value={c.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:border-red-300 hover:text-red-600"
                  >
                    {t.supprimer}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
