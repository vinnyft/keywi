import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  CalendarClock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { actionDefinirEcheance } from "@/lib/actions/client";
import { PartageCode } from "@/components/client/PartageCode";
import { SuiviCleTempsReel } from "@/components/client/SuiviCleTempsReel";

export const metadata: Metadata = { title: "Détail de la clé" };

const ICONES_MOUVEMENT = {
  depot: PackagePlus,
  retrait: PackageMinus,
  retour: RotateCcw,
} as const;

const LIBELLES_MOUVEMENT = {
  depot: "Dépôt au point relais",
  retrait: "Retrait par un bénéficiaire",
  retour: "Retour au point relais",
} as const;

/**
 * Détail d'une clé : statut temps réel, historique horodaté de
 * chaque mouvement, gestion des codes de retrait (création,
 * partage email/WhatsApp, révocation, QR code).
 */
export default async function PageDetailCle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { id } = await params;
  const { paiement } = await searchParams;
  const supabase = await createClient();

  const { data: cle } = await supabase
    .from("keys")
    .select(
      "*, relay_points(nom, adresse, code_postal, ville), slots(numero)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!cle) notFound();

  // Échéance dépassée alors que la clé n'est pas revenue chez l'hôte
  const enRetard =
    cle.date_retour_attendue != null &&
    new Date(cle.date_retour_attendue) < new Date() &&
    cle.statut !== "en_attente" &&
    cle.statut !== "perdue";

  const [{ data: codes }, { data: mouvements }] = await Promise.all([
    supabase
      .from("access_codes")
      .select("*")
      .eq("key_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("movements")
      .select("*")
      .eq("key_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const commerce = cle.relay_points;

  return (
    <div>
      <Link
        href="/espace"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-encre"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Mes clés
      </Link>

      {/* Bannière après paiement */}
      {(paiement === "succes" || paiement === "simule") && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-menthe-pale px-4 py-3 font-medium text-menthe"
        >
          ✅ Paiement confirmé{paiement === "simule" ? " (mode simulé local)" : " (Stripe test)"} !
          Apportez votre trousseau muni du badge{" "}
          <span className="font-mono font-bold">{cle.code_badge_imprime}</span> au
          point relais.
        </p>
      )}
      {paiement === "annule" && (
        <p role="alert" className="mt-3 rounded-xl bg-ambre-pale px-4 py-3 font-medium text-ambre">
          Paiement annulé. Vous pourrez le reprendre depuis cette page.
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-5">
        {/* Colonne principale */}
        <div className="space-y-5 lg:col-span-3">
          {/* Identité de la clé (statut mis à jour en temps réel) */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{cle.logement}</h1>
              <SuiviCleTempsReel cleId={cle.id} statutInitial={cle.statut} />
              {enRetard && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  <CalendarClock size={12} aria-hidden="true" /> En retard
                </span>
              )}
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Point relais</dt>
                <dd className="font-medium">
                  {commerce
                    ? `${commerce.nom} — ${commerce.adresse}, ${commerce.code_postal}`
                    : "Non choisi"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Code badge (imprimé sur le badge)</dt>
                <dd className="font-mono text-lg font-bold tracking-widest">
                  {cle.code_badge_imprime}
                </dd>
              </div>
              {cle.slots && (
                <div>
                  <dt className="text-gray-500">Case actuelle</dt>
                  <dd className="font-medium">n° {cle.slots.numero}</dd>
                </div>
              )}
            </dl>

            {/* Échéance de retour : relance automatique si dépassée */}
            <form
              action={actionDefinirEcheance}
              className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
            >
              <input type="hidden" name="key_id" value={cle.id} />
              <div>
                <label
                  htmlFor="date_retour_attendue"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <CalendarClock size={14} className="text-primaire" aria-hidden="true" />
                  Retour attendu le
                </label>
                <input
                  id="date_retour_attendue"
                  name="date_retour_attendue"
                  type="date"
                  defaultValue={
                    cle.date_retour_attendue
                      ? new Date(cle.date_retour_attendue).toISOString().slice(0, 10)
                      : ""
                  }
                  className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primaire px-4 py-2 text-sm font-semibold text-white hover:bg-primaire-fonce"
              >
                Enregistrer
              </button>
              {cle.date_retour_attendue && (
                <p className="w-full text-xs text-gray-500">
                  {enRetard
                    ? "Échéance dépassée — une relance vous a été envoyée."
                    : "Passée cette date, vous recevrez une relance automatique par email."}
                  {" "}Laissez vide et enregistrez pour retirer l&apos;échéance.
                </p>
              )}
            </form>
          </section>

          {/* Historique horodaté */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold">Historique des mouvements</h2>
            {!mouvements?.length ? (
              <p className="mt-2 text-sm text-gray-600">
                Aucun mouvement pour l&apos;instant — le dépôt apparaîtra ici dès
                le scan du badge par le commerçant.
              </p>
            ) : (
              <ol className="mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
                {mouvements.map((m) => {
                  const Icone = ICONES_MOUVEMENT[m.type];
                  const details = m.details as {
                    case_numero?: number;
                    beneficiaire?: string;
                  } | null;
                  return (
                    <li key={m.id} className="relative">
                      <span className="absolute -left-[25px] top-0.5 flex size-4 items-center justify-center rounded-full bg-primaire-pale">
                        <Icone size={10} className="text-primaire" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-semibold">{LIBELLES_MOUVEMENT[m.type]}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(m.created_at).toLocaleString("fr-FR", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                        {details?.case_numero != null && ` · case n° ${details.case_numero}`}
                        {details?.beneficiaire && ` · remis à ${details.beneficiaire}`}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Colonne codes de retrait */}
        <div className="lg:col-span-2">
          <PartageCode
            cleId={cle.id}
            logement={cle.logement}
            commerce={commerce?.nom ?? null}
            codes={JSON.parse(JSON.stringify(codes ?? []))}
          />
        </div>
      </div>
    </div>
  );
}
