"use client";

import { useActionState, useState } from "react";
import { Repeat, Plus, Pause, Play, Trash2 } from "lucide-react";
import {
  actionCreerRecurrent,
  actionBasculerRecurrent,
  actionSupprimerRecurrent,
} from "@/lib/actions/recurrents";

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

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/** « Mar, Jeu » à partir de [2, 4] */
function libelleJours(jours: number[]) {
  return [...jours].sort((a, b) => a - b).map((j) => JOURS[j]).join(", ");
}

export function AccesRecurrents({
  cleId,
  acces,
}: {
  cleId: string;
  acces: AccesRecurrent[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, soumettre, attente] = useActionState(actionCreerRecurrent, {
    erreur: null,
    ok: false,
  });

  // Le formulaire se referme une fois la récurrence créée
  const afficheFormulaire = ouvert && !etat.ok;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-bold">
            <Repeat size={18} className="text-primaire" aria-hidden="true" />
            Accès récurrents
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Pour un prestataire qui revient : le code est généré et envoyé
            avant chaque intervention.
          </p>
        </div>
        {!afficheFormulaire && (
          <button
            onClick={() => setOuvert(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
          >
            <Plus size={15} aria-hidden="true" /> Ajouter
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
                      En pause
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {libelleJours(a.jours_semaine)} à {a.heure_debut.slice(0, 5)} ·
                  code valable {a.duree_heures} h
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
                    aria-label={a.actif ? "Mettre en pause" : "Réactiver"}
                  >
                    {a.actif ? (
                      <>
                        <Pause size={13} aria-hidden="true" /> Pause
                      </>
                    ) : (
                      <>
                        <Play size={13} aria-hidden="true" /> Reprendre
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
                    aria-label="Supprimer cette récurrence"
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
        <p className="mt-3 rounded-xl bg-sable p-3 text-sm text-gray-600">
          Aucun accès récurrent. Idéal pour le ménage hebdomadaire ou un
          prestataire régulier.
        </p>
      )}

      {/* Formulaire de création */}
      {afficheFormulaire && (
        <form action={soumettre} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          <input type="hidden" name="key_id" value={cleId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="rec_nom" className="block text-sm font-medium">
                Prénom du prestataire
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
                placeholder="sofia@exemple.fr"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Jours d&apos;intervention *</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {JOURS.map((j, i) => (
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
                Heure d&apos;arrivée
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
                Validité du code
              </label>
              <select
                id="rec_duree"
                name="duree_heures"
                defaultValue="12"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="4">4 heures</option>
                <option value="8">8 heures</option>
                <option value="12">12 heures</option>
                <option value="24">24 heures</option>
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
              {attente ? "Enregistrement…" : "Créer la récurrence"}
            </button>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
