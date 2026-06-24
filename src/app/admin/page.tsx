import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { actionDeconnexion } from "@/lib/actions/auth";
import { actionTraiterCandidature } from "@/lib/actions/admin";
import { StatutCle } from "@/components/ui/StatutCle";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Administration" };

/**
 * Page d'administration minimale : points relais, clés,
 * mouvements récents et validation des candidatures commerçants.
 */
export default async function PageAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?suivant=/admin");

  const { data: profil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profil?.role !== "admin") redirect("/espace");

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

  return (
    <div className="min-h-screen bg-sable">
      <header className="border-b border-gray-200 bg-encre text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo taille={28} sombre lien="/admin" />
            <span className="rounded-full bg-corail px-2.5 py-0.5 text-xs font-bold">
              ADMIN
            </span>
          </div>
          <form action={actionDeconnexion}>
            <button
              type="submit"
              className="rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* ----- Candidatures ----- */}
        <section aria-labelledby="titre-candidatures">
          <h1 id="titre-candidatures" className="text-xl font-bold">
            Candidatures commerçants
            {candidaturesEnAttente.length > 0 && (
              <span className="ml-2 rounded-full bg-corail px-2.5 py-0.5 text-sm font-bold text-white">
                {candidaturesEnAttente.length} à traiter
              </span>
            )}
          </h1>
          {!candidatures?.length ? (
            <p className="mt-3 rounded-xl bg-white p-4 text-gray-600">
              Aucune candidature pour l&apos;instant.
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
                          Valider
                        </button>
                      </form>
                      <form action={actionTraiterCandidature}>
                        <input type="hidden" name="candidature_id" value={c.id} />
                        <input type="hidden" name="decision" value="refuser" />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          Refuser
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
                      {c.statut === "validee" ? "Validée" : "Refusée"}
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
            Points relais ({pointsRelais?.length ?? 0})
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Commerce</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Adresse</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Occupation</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Statut</th>
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
                        {occupees}/{p.capacite} cases
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
            Clés ({cles?.length ?? 0})
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Logement</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Hôte</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Badge</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Point relais</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Statut</th>
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
                      <StatutCle statut={k.statut} />
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
            20 derniers mouvements
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
                  {new Date(m.created_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
