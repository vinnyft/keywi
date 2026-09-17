import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actionDeconnexion } from "@/lib/actions/auth";
import { actionTraiterCandidature } from "@/lib/actions/admin";
import { actionDefinirObjectif } from "@/lib/actions/commercial";
import { StatutCle } from "@/components/ui/StatutCle";
import { Logo } from "@/components/ui/Logo";
import { SelecteurLangue } from "@/components/ui/SelecteurLangue";
import { estLocale, localise, type Locale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Administration" };

/**
 * Page d'administration minimale : points relais, clés,
 * mouvements récents et validation des candidatures commerçants.
 */
export default async function PageAdmin({
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
        candidatures: "Partner applications",
        aTraiter: (n: number) => `${n} to process`,
        aucuneCandidature: "No application yet.",
        valider: "Approve",
        refuser: "Decline",
        validee: "Approved",
        refusee: "Declined",
        points: (n: number) => `Drop-off points (${n})`,
        thCommerce: "Business",
        thAdresse: "Address",
        thOccupation: "Occupancy",
        thStatut: "Status",
        cases: "slots",
        clesTitre: (n: number) => `Keys (${n})`,
        thLogement: "Property",
        thHote: "Host",
        thBadge: "Tag",
        thPoint: "Drop-off point",
        derniers: "Last 20 movements",
      }
    : {
        candidatures: "Candidatures commerçants",
        aTraiter: (n: number) => `${n} à traiter`,
        aucuneCandidature: "Aucune candidature pour l'instant.",
        valider: "Valider",
        refuser: "Refuser",
        validee: "Validée",
        refusee: "Refusée",
        points: (n: number) => `Points relais (${n})`,
        thCommerce: "Commerce",
        thAdresse: "Adresse",
        thOccupation: "Occupation",
        thStatut: "Statut",
        cases: "cases",
        clesTitre: (n: number) => `Clés (${n})`,
        thLogement: "Logement",
        thHote: "Hôte",
        thBadge: "Badge",
        thPoint: "Point relais",
        derniers: "20 derniers mouvements",
      };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${l("/connexion")}?suivant=${l("/admin")}`);

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profil?.role !== "admin") redirect(l("/espace"));

  const [
    { data: candidatures },
    { data: pointsRelais },
    { data: cles },
    { data: mouvements },
  ] = await Promise.all([
    supabase
      .from("candidatures_commercants")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("relay_points").select("*, slots(statut)").order("nom"),
    supabase
      .from("keys")
      .select("*, relay_points(nom), profiles:hote_id(nom)")
      .order("created_at", { ascending: false }),
    supabase
      .from("movements")
      .select("*, relay_points(nom)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const candidaturesEnAttente = (candidatures ?? []).filter(
    (c) => c.statut === "en_attente"
  );

  // Suivi commercial : report hebdo (RPC) + liste des commerciaux
  const [{ data: rapportCommercial }, { data: commerciaux }] = await Promise.all([
    supabase.rpc("rapport_commercial_hebdo"),
    supabase.from("profiles").select("id, nom").eq("role", "commercial").order("nom"),
  ]);

  const moisDefaut = new Date().toISOString().slice(0, 7); // AAAA-MM

  const tc = en
    ? {
        titre: "Sales tracking",
        ouvrir: "Open sales area →",
        rapport: "This week (last 7 days)",
        commercial: "Rep",
        prospects: "New",
        contacts: "Outreach",
        rdv: "Meetings",
        signes: "Signed",
        actifs: "Active",
        videRapport: "No sales activity yet.",
        objectifs: "Set a monthly target",
        choisir: "Rep",
        mois: "Month",
        cibleSignes: "Target signed",
        cibleContacts: "Target outreach",
        definir: "Save target",
        aucunCommercial: "No sales rep account yet.",
      }
    : {
        titre: "Suivi commercial",
        ouvrir: "Ouvrir l'espace commercial →",
        rapport: "Cette semaine (7 derniers jours)",
        commercial: "Commercial",
        prospects: "Ajoutés",
        contacts: "Contacts",
        rdv: "RDV",
        signes: "Signés",
        actifs: "Actifs",
        videRapport: "Aucune activité commerciale pour l'instant.",
        objectifs: "Définir un objectif mensuel",
        choisir: "Commercial",
        mois: "Mois",
        cibleSignes: "Cible signés",
        cibleContacts: "Cible contacts",
        definir: "Enregistrer l'objectif",
        aucunCommercial: "Aucun compte commercial pour l'instant.",
      };

  return (
    <div className="min-h-screen bg-sable">
      <header className="border-b border-gray-200 bg-encre text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo taille={28} sombre lien={l("/admin")} />
            <span className="rounded-full bg-corail px-2.5 py-0.5 text-xs font-bold">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SelecteurLangue sombre />
            <form action={actionDeconnexion}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                {en ? "Sign out" : "Déconnexion"}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* ----- Candidatures ----- */}
        <section aria-labelledby="titre-candidatures">
          <h1 id="titre-candidatures" className="text-xl font-bold">
            {t.candidatures}
            {candidaturesEnAttente.length > 0 && (
              <span className="ml-2 rounded-full bg-corail px-2.5 py-0.5 text-sm font-bold text-white">
                {t.aTraiter(candidaturesEnAttente.length)}
              </span>
            )}
          </h1>
          {!candidatures?.length ? (
            <p className="mt-3 rounded-xl bg-white p-4 text-gray-600">
              {t.aucuneCandidature}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {candidatures.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div>
                    <p className="font-bold">
                      {c.nom_commerce}{" "}
                      <span className="font-normal text-gray-600">
                        — {c.adresse}, {c.code_postal} {c.ville}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {c.nom_contact} · {c.email}
                      {c.telephone ? ` · ${c.telephone}` : ""}
                    </p>
                    {c.message && (
                      <p className="mt-1 text-sm italic text-gray-500">« {c.message} »</p>
                    )}
                  </div>
                  {c.statut === "en_attente" ? (
                    <div className="flex gap-2">
                      <form action={actionTraiterCandidature}>
                        <input type="hidden" name="candidature_id" value={c.id} />
                        <input type="hidden" name="decision" value="valider" />
                        <button
                          type="submit"
                          className="rounded-lg bg-menthe px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110"
                        >
                          {t.valider}
                        </button>
                      </form>
                      <form action={actionTraiterCandidature}>
                        <input type="hidden" name="candidature_id" value={c.id} />
                        <input type="hidden" name="decision" value="refuser" />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          {t.refuser}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.statut === "validee"
                          ? "bg-menthe-pale text-menthe"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {c.statut === "validee" ? t.validee : t.refusee}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ----- Points relais ----- */}
        <section aria-labelledby="titre-points">
          <h2 id="titre-points" className="text-xl font-bold">
            {t.points(pointsRelais?.length ?? 0)}
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thCommerce}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thAdresse}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thOccupation}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thStatut}</th>
                </tr>
              </thead>
              <tbody>
                {(pointsRelais ?? []).map((p) => {
                  const occupees = (p.slots as { statut: string }[]).filter(
                    (s) => s.statut === "occupee"
                  ).length;
                  return (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold">{p.nom}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {p.adresse}, {p.code_postal}
                      </td>
                      <td className="px-4 py-2.5">
                        {occupees}/{p.capacite} {t.cases}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            p.statut === "actif"
                              ? "bg-menthe-pale text-menthe"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ----- Clés ----- */}
        <section aria-labelledby="titre-cles">
          <h2 id="titre-cles" className="text-xl font-bold">
            {t.clesTitre(cles?.length ?? 0)}
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thLogement}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thHote}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thBadge}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thPoint}</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">{t.thStatut}</th>
                </tr>
              </thead>
              <tbody>
                {(cles ?? []).map((k) => (
                  <tr key={k.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold">{k.logement}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {(k.profiles as { nom: string | null } | null)?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{k.code_badge_imprime}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {(k.relay_points as { nom: string } | null)?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatutCle statut={k.statut} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ----- Mouvements récents ----- */}
        <section aria-labelledby="titre-mouvements">
          <h2 id="titre-mouvements" className="text-xl font-bold">
            {t.derniers}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {(mouvements ?? []).map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                <span className="font-semibold uppercase">{m.type}</span>
                <span className="text-gray-600">
                  {(m.details as { logement?: string })?.logement ?? ""} ·{" "}
                  {(m.relay_points as { nom: string } | null)?.nom} ·{" "}
                  {new Date(m.created_at).toLocaleString(en ? "en-IE" : "fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ----- Suivi commercial ----- */}
        <section aria-labelledby="titre-commercial">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titre-commercial" className="text-xl font-bold">
              {tc.titre}
            </h2>
            <Link
              href={l("/commercial")}
              className="text-sm font-semibold text-primaire hover:text-primaire-fonce"
            >
              {tc.ouvrir}
            </Link>
          </div>

          {/* Report hebdo */}
          <p className="mt-3 text-sm text-gray-600">{tc.rapport}</p>
          <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">{tc.commercial}</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">{tc.prospects}</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">{tc.contacts}</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">{tc.rdv}</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">{tc.signes}</th>
                  <th scope="col" className="px-4 py-2.5 text-center font-medium">{tc.actifs}</th>
                </tr>
              </thead>
              <tbody>
                {(rapportCommercial ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                      {tc.videRapport}
                    </td>
                  </tr>
                ) : (
                  (rapportCommercial ?? []).map((r) => (
                    <tr key={r.commercial_id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold">{r.commercial_nom ?? "—"}</td>
                      <td className="px-4 py-2.5 text-center">{r.prospects_ajoutes}</td>
                      <td className="px-4 py-2.5 text-center">{r.contactes}</td>
                      <td className="px-4 py-2.5 text-center">{r.rdv}</td>
                      <td className="px-4 py-2.5 text-center font-semibold">{r.signes}</td>
                      <td className="px-4 py-2.5 text-center">{r.actifs_total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Définition d'objectif */}
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-encre">{tc.objectifs}</p>
            {(commerciaux ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">{tc.aucunCommercial}</p>
            ) : (
              <form
                action={actionDefinirObjectif}
                className="mt-3 flex flex-wrap items-end gap-3"
              >
                <div>
                  <label htmlFor="obj_commercial" className="block text-xs font-medium text-gray-600">
                    {tc.choisir}
                  </label>
                  <select
                    id="obj_commercial"
                    name="commercial_id"
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {(commerciaux ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom ?? c.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="obj_mois" className="block text-xs font-medium text-gray-600">
                    {tc.mois}
                  </label>
                  <input
                    id="obj_mois"
                    name="mois"
                    type="month"
                    defaultValue={moisDefaut}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="obj_signes" className="block text-xs font-medium text-gray-600">
                    {tc.cibleSignes}
                  </label>
                  <input
                    id="obj_signes"
                    name="cible_signes"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="obj_contacts" className="block text-xs font-medium text-gray-600">
                    {tc.cibleContacts}
                  </label>
                  <input
                    id="obj_contacts"
                    name="cible_contacts"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-encre px-4 py-2 text-sm font-semibold text-white hover:bg-encre-2"
                >
                  {tc.definir}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
