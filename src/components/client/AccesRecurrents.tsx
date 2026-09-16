"use client";

import { useActionState, useState } from "react";
import { Repeat, Plus, Pause, Play, Trash2 } from "lucide-react";
import {
  actionCreerRecurrent,
  actionBasculerRecurrent,
  actionSupprimerRecurrent,
} from "@/lib/actions/recurrents";
import { useLocale } from "@/lib/useLocale";
import type { Locale } from "@/lib/i18n";

/**
 * Gestion des accès récurrents d'une clé : le prestataire qui
 * revient chaque semaine reçoit son code automatiquement avant
 * chaque intervention, sans intervention de l'hôte.
 */

export interface AccesRecurrent {
  id: string;
  beneficiaire_nom: string | null;
  beneficiaire_email: string | null;
  jours_semaine: number[];
  heure_debut: string;
  duree_heures: number;
  actif: boolean;
}

const JOURS: Record<Locale, string[]> = {
  fr: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

/** « Mar, Jeu » à partir de [2, 4] */
function libelleJours(jours: number[], locale: Locale) {
  return [...jours].sort((a, b) => a - b).map((j) => JOURS[locale][j]).join(", ");
}

export function AccesRecurrents({
  cleId,
  acces,
}: {
  cleId: string;
  acces: AccesRecurrent[];
}) {
  const locale = useLocale();
  const en = locale === "en";
  const [ouvert, setOuvert] = useState(false);
  const [etat, soumettre, attente] = useActionState(actionCreerRecurrent, {
    erreur: null,
    ok: false,
  });

  // Le formulaire se referme une fois la récurrence créée
  const afficheFormulaire = ouvert && !etat.ok;

  const t = en
    ? {
        titre: "Recurring access",
        intro:
          "For a provider who returns: the code is generated and sent before each visit.",
        ajouter: "Add",
        enPause: "Paused",
        codeValable: (h: number) => `code valid for ${h} h`,
        a: "at",
        aucun:
          "No recurring access yet. Perfect for weekly cleaning or a regular provider.",
        mettreEnPause: "Pause",
        reactiver: "Resume",
        pause: "Pause",
        reprendre: "Resume",
        supprimer: "Delete this recurrence",
        prestataire: "Provider's first name",
        joursIntervention: "Visit days *",
        heureArrivee: "Arrival time",
        validiteCode: "Code validity",
        h: (n: number) => `${n} hours`,
        enregistrement: "Saving…",
        creer: "Create the recurrence",
        annuler: "Cancel",
      }
    : {
        titre: "Accès récurrents",
        intro:
          "Pour un prestataire qui revient : le code est généré et envoyé avant chaque intervention.",
        ajouter: "Ajouter",
        enPause: "En pause",
        codeValable: (h: number) => `code valable ${h} h`,
        a: "à",
        aucun:
          "Aucun accès récurrent. Idéal pour le ménage hebdomadaire ou un prestataire régulier.",
        mettreEnPause: "Mettre en pause",
        reactiver: "Réactiver",
        pause: "Pause",
        reprendre: "Reprendre",
        supprimer: "Supprimer cette récurrence",
        prestataire: "Prénom du prestataire",
        joursIntervention: "Jours d'intervention *",
        heureArrivee: "Heure d'arrivée",
        validiteCode: "Validité du code",
        h: (n: number) => `${n} heures`,
        enregistrement: "Enregistrement…",
        creer: "Créer la récurrence",
        annuler: "Annuler",
      };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-bold">
            <Repeat size={18} className="text-primaire" aria-hidden="true" />
            {t.titre}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{t.intro}</p>
        </div>
        {!afficheFormulaire && (
          <button
            onClick={() => setOuvert(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
          >
            <Plus size={15} aria-hidden="true" /> {t.ajouter}
          </button>
        )}
      </div>

      {/* Liste des récurrences */}
      {acces.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100">
          {acces.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {a.beneficiaire_nom ?? a.beneficiaire_email}
                  {!a.actif && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                      {t.enPause}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {libelleJours(a.jours_semaine, locale)} {t.a}{" "}
                  {a.heure_debut.slice(0, 5)} · {t.codeValable(a.duree_heures)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={actionBasculerRecurrent}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="key_id" value={cleId} />
                  <input type="hidden" name="actif" value={String(a.actif)} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50"
                    aria-label={a.actif ? t.mettreEnPause : t.reactiver}
                  >
                    {a.actif ? (
                      <>
                        <Pause size={13} aria-hidden="true" /> {t.pause}
                      </>
                    ) : (
                      <>
                        <Play size={13} aria-hidden="true" /> {t.reprendre}
                      </>
                    )}
                  </button>
                </form>
                <form action={actionSupprimerRecurrent}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="key_id" value={cleId} />
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-red-700 hover:bg-red-50"
                    aria-label={t.supprimer}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {acces.length === 0 && !afficheFormulaire && (
        <p className="mt-3 rounded-xl bg-sable p-3 text-sm text-gray-600">{t.aucun}</p>
      )}

      {/* Formulaire de création */}
      {afficheFormulaire && (
        <form action={soumettre} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <input type="hidden" name="key_id" value={cleId} />
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rec_nom" className="block text-sm font-medium">
                {t.prestataire}
              </label>
              <input
                id="rec_nom"
                name="beneficiaire_nom"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Sofia"
              />
            </div>
            <div>
              <label htmlFor="rec_email" className="block text-sm font-medium">
                Email *
              </label>
              <input
                id="rec_email"
                name="beneficiaire_email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={en ? "sofia@example.com" : "sofia@exemple.fr"}
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">{t.joursIntervention}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {JOURS[locale].map((j, i) => (
                <label
                  key={j}
                  className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium has-checked:border-primaire has-checked:bg-primaire-pale has-checked:text-primaire-fonce"
                >
                  <input type="checkbox" name={`jour_${i}`} className="sr-only" />
                  {j}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rec_heure" className="block text-sm font-medium">
                {t.heureArrivee}
              </label>
              <input
                id="rec_heure"
                name="heure_debut"
                type="time"
                defaultValue="09:00"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="rec_duree" className="block text-sm font-medium">
                {t.validiteCode}
              </label>
              <select
                id="rec_duree"
                name="duree_heures"
                defaultValue="12"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="4">{t.h(4)}</option>
                <option value="8">{t.h(8)}</option>
                <option value="12">{t.h(12)}</option>
                <option value="24">{t.h(24)}</option>
              </select>
            </div>
          </div>

          {etat.erreur && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {etat.erreur}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={attente}
              className="rounded-lg bg-primaire px-4 py-2.5 font-semibold text-white hover:bg-primaire-fonce disabled:opacity-60"
            >
              {attente ? t.enregistrement : t.creer}
            </button>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold hover:bg-gray-50"
            >
              {t.annuler}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
