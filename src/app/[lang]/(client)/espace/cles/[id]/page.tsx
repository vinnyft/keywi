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
import { AccesRecurrents, type AccesRecurrent } from "@/components/client/AccesRecurrents";
import { CertificatCle } from "@/components/client/CertificatCle";
import { DepotCasier } from "@/components/client/DepotCasier";
import { PartageCode } from "@/components/client/PartageCode";
import { SuiviCleTempsReel } from "@/components/client/SuiviCleTempsReel";
import { localise, type Locale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "Key details" : "Détail de la clé" };
}

const ICONES_MOUVEMENT = {
  depot: PackagePlus,
  retrait: PackageMinus,
  retour: RotateCcw,
} as const;

const LIBELLES_MOUVEMENT: Record<Locale, Record<"depot" | "retrait" | "retour", string>> = {
  fr: {
    depot: "Dépôt au point relais",
    retrait: "Retrait par un bénéficiaire",
    retour: "Retour au point relais",
  },
  en: {
    depot: "Drop-off at the point",
    retrait: "Pickup by a recipient",
    retour: "Return to the point",
  },
};

/**
 * Détail d'une clé : statut temps réel, historique horodaté de
 * chaque mouvement, gestion des codes de retrait (création,
 * partage email/WhatsApp, révocation, QR code).
 */
export default async function PageDetailCle({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { lang, id } = await params;
  const { paiement } = await searchParams;
  const locale: Locale = lang === "en" ? "en" : "fr";
  const en = locale === "en";
  const supabase = await createClient();

  const t = en
    ? {
        mesCles: "My keys",
        enRetard: "Overdue",
        pointRelais: "Drop-off point",
        nonChoisi: "Not chosen",
        codeBadge: "Tag code (printed on the tag)",
        caseActuelle: "Current slot",
        caseNum: (n: number) => `no. ${n}`,
        retourAttendu: "Expected return on",
        enregistrer: "Save",
        echeanceDepassee: "Deadline passed — a reminder has been sent to you.",
        echeanceFuture: "After this date, you'll get an automatic email reminder.",
        laisserVide: "Leave empty and save to remove the deadline.",
        histo: "Movement history",
        aucunMouvement:
          "No movement yet — the drop-off will appear here as soon as the shop scans the tag.",
        caseLabel: "slot",
        remisA: "handed to",
        paiementConfirme: "Payment confirmed",
        modeSimule: " (local simulated mode)",
        modeStripe: " (Stripe test)",
        apportez: "Bring your keyring with the tag",
        auPoint: "to the drop-off point.",
        paiementAnnule: "Payment cancelled. You can resume it from this page.",
      }
    : {
        mesCles: "Mes clés",
        enRetard: "En retard",
        pointRelais: "Point relais",
        nonChoisi: "Non choisi",
        codeBadge: "Code badge (imprimé sur le badge)",
        caseActuelle: "Case actuelle",
        caseNum: (n: number) => `n° ${n}`,
        retourAttendu: "Retour attendu le",
        enregistrer: "Enregistrer",
        echeanceDepassee: "Échéance dépassée — une relance vous a été envoyée.",
        echeanceFuture:
          "Passée cette date, vous recevrez une relance automatique par email.",
        laisserVide: "Laissez vide et enregistrez pour retirer l'échéance.",
        histo: "Historique des mouvements",
        aucunMouvement:
          "Aucun mouvement pour l'instant — le dépôt apparaîtra ici dès le scan du badge par le commerçant.",
        caseLabel: "case",
        remisA: "remis à",
        paiementConfirme: "Paiement confirmé",
        modeSimule: " (mode simulé local)",
        modeStripe: " (Stripe test)",
        apportez: "Apportez votre trousseau muni du badge",
        auPoint: "au point relais.",
        paiementAnnule: "Paiement annulé. Vous pourrez le reprendre depuis cette page.",
      };

  const { data: cle } = await supabase
    .from("keys")
    .select(
      "*, relay_points(nom, adresse, code_postal, ville, type), slots(numero)"
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

  const [{ data: codes }, { data: mouvements }, { data: recurrents }] = await Promise.all([
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
    supabase
      .from("acces_recurrents")
      .select("id, beneficiaire_nom, beneficiaire_email, jours_semaine, heure_debut, duree_heures, actif")
      .eq("key_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const commerce = cle.relay_points;

  // Casier connecté : l'hôte dépose lui-même, sans comptoir
  const depotCasierPossible =
    commerce?.type === "casier" &&
    cle.paiement_statut !== "en_attente" &&
    (cle.statut === "en_attente" || cle.statut === "retiree");

  return (
    <div>
      <Link
        href={localise("/espace", locale)}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-encre"
      >
        <ArrowLeft size={16} aria-hidden="true" /> {t.mesCles}
      </Link>

      {/* Bannière après paiement */}
      {(paiement === "succes" || paiement === "simule") && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-menthe-pale px-4 py-3 font-medium text-menthe"
        >
          ✅ {t.paiementConfirme}
          {paiement === "simule" ? t.modeSimule : t.modeStripe} ! {t.apportez}{" "}
          <span className="font-mono font-bold">{cle.code_badge_imprime}</span> {t.auPoint}
        </p>
      )}
      {paiement === "annule" && (
        <p role="alert" className="mt-3 rounded-xl bg-ambre-pale px-4 py-3 font-medium text-ambre">
          {t.paiementAnnule}
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
                  <CalendarClock size={12} aria-hidden="true" /> {t.enRetard}
                </span>
              )}
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">{t.pointRelais}</dt>
                <dd className="font-medium">
                  {commerce
                    ? `${commerce.nom} — ${commerce.adresse}, ${commerce.code_postal}`
                    : t.nonChoisi}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">{t.codeBadge}</dt>
                <dd className="font-mono text-lg font-bold tracking-widest">
                  {cle.code_badge_imprime}
                </dd>
              </div>
              {cle.slots && (
                <div>
                  <dt className="text-gray-500">{t.caseActuelle}</dt>
                  <dd className="font-medium">{t.caseNum(cle.slots.numero)}</dd>
                </div>
              )}
            </dl>

            {/* Échéance de retour : relance automatique si dépassée */}
            <form
              action={actionDefinirEcheance}
              className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
            >
              <input type="hidden" name="key_id" value={cle.id} />
              <input type="hidden" name="locale" value={locale} />
              <div>
                <label
                  htmlFor="date_retour_attendue"
                  className="flex items-center gap-1.5 text-sm font-medium"
                >
                  <CalendarClock size={14} className="text-primaire" aria-hidden="true" />
                  {t.retourAttendu}
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
                {t.enregistrer}
              </button>
              {cle.date_retour_attendue && (
                <p className="w-full text-xs text-gray-500">
                  {enRetard ? t.echeanceDepassee : t.echeanceFuture} {t.laisserVide}
                </p>
              )}
            </form>
          </section>

          {/* Historique horodaté */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="font-bold">{t.histo}</h2>
            {!mouvements?.length ? (
              <p className="mt-2 text-sm text-gray-600">{t.aucunMouvement}</p>
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
                      <p className="text-sm font-semibold">
                        {LIBELLES_MOUVEMENT[locale][m.type]}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(m.created_at).toLocaleString(en ? "en-IE" : "fr-FR", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                        {details?.case_numero != null &&
                          ` · ${t.caseLabel} ${t.caseNum(details.case_numero)}`}
                        {details?.beneficiaire && ` · ${t.remisA} ${details.beneficiaire}`}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <CertificatCle
            cleId={cle.id}
            token={cle.certificat_token}
            nbMouvements={mouvements?.length ?? 0}
          />
        </div>

        {/* Colonne codes de retrait */}
        <div className="space-y-5 lg:col-span-2">
          {depotCasierPossible && commerce && (
            <DepotCasier cleId={cle.id} casierNom={commerce.nom} />
          )}
          <AccesRecurrents
            cleId={cle.id}
            acces={JSON.parse(JSON.stringify(recurrents ?? [])) as AccesRecurrent[]}
          />

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
