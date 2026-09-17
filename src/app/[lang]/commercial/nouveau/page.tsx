import type { Metadata } from "next";
import Link from "next/link";
import { estLocale, localise, type Locale } from "@/lib/i18n";
import { actionCreerProspect } from "@/lib/actions/commercial";

export const metadata: Metadata = { title: "Nouveau prospect" };

export default async function PageNouveauProspect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = estLocale(lang) ? lang : "fr";
  const en = locale === "en";
  const l = (chemin: string) => localise(chemin, locale);

  const t = en
    ? {
        titre: "New prospect",
        sousTitre: "A drop-off point to canvass.",
        nom: "Business name",
        adresse: "Address",
        cp: "Postcode",
        arr: "Arrondissement (1–20)",
        contactNom: "Contact name",
        contactTel: "Phone",
        contactEmail: "Email",
        source: "Source",
        notes: "Notes",
        enregistrer: "Add prospect",
        annuler: "Cancel",
        requis: "required",
      }
    : {
        titre: "Nouveau prospect",
        sousTitre: "Un point relais à démarcher.",
        nom: "Nom du commerce",
        adresse: "Adresse",
        cp: "Code postal",
        arr: "Arrondissement (1–20)",
        contactNom: "Nom du contact",
        contactTel: "Téléphone",
        contactEmail: "Email",
        source: "Source",
        notes: "Notes",
        enregistrer: "Ajouter le prospect",
        annuler: "Annuler",
        requis: "requis",
      };

  const champ =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primaire focus:outline-none focus:ring-2 focus:ring-primaire/30";
  const etiquette = "block text-sm font-medium text-encre";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-encre">{t.titre}</h2>
        <p className="text-sm text-gray-600">{t.sousTitre}</p>
      </div>

      <form action={actionCreerProspect} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
        <input type="hidden" name="locale" value={locale} />

        <div>
          <label htmlFor="nom_commerce" className={etiquette}>
            {t.nom} <span className="text-primaire">*</span>
          </label>
          <input id="nom_commerce" name="nom_commerce" required className={champ} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="adresse" className={etiquette}>{t.adresse}</label>
            <input id="adresse" name="adresse" className={champ} />
          </div>
          <div>
            <label htmlFor="code_postal" className={etiquette}>{t.cp}</label>
            <input id="code_postal" name="code_postal" inputMode="numeric" className={champ} />
          </div>
          <div>
            <label htmlFor="arrondissement" className={etiquette}>{t.arr}</label>
            <input
              id="arrondissement"
              name="arrondissement"
              type="number"
              min={1}
              max={20}
              className={champ}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="contact_nom" className={etiquette}>{t.contactNom}</label>
            <input id="contact_nom" name="contact_nom" className={champ} />
          </div>
          <div>
            <label htmlFor="contact_tel" className={etiquette}>{t.contactTel}</label>
            <input id="contact_tel" name="contact_tel" type="tel" className={champ} />
          </div>
          <div>
            <label htmlFor="contact_email" className={etiquette}>{t.contactEmail}</label>
            <input id="contact_email" name="contact_email" type="email" className={champ} />
          </div>
        </div>

        <div>
          <label htmlFor="source" className={etiquette}>{t.source}</label>
          <input id="source" name="source" className={champ} placeholder={en ? "e.g. street canvassing, referral…" : "ex. porte-à-porte, recommandation…"} />
        </div>

        <div>
          <label htmlFor="notes" className={etiquette}>{t.notes}</label>
          <textarea id="notes" name="notes" rows={3} className={champ} />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-primaire px-4 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
          >
            {t.enregistrer}
          </button>
          <Link href={l("/commercial")} className="text-sm text-gray-600 hover:text-encre">
            {t.annuler}
          </Link>
        </div>
      </form>
    </div>
  );
}
