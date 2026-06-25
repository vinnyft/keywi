"use client";

import { useState } from "react";
import { Nfc, Usb, Keyboard } from "lucide-react";
import { useRfidScan, type RfidMode } from "@/hooks/useRfidScan";

/**
 * Zone de scan d'un badge RFID/NFC, trois modes au choix :
 * NFC (Android/Chrome), lecteur USB (HID clavier), saisie manuelle.
 * Quel que soit le mode, onScan reçoit l'identifiant lu.
 */
export function ScannerBadge({
  onScan,
  titre = "Scannez le badge du trousseau",
}: {
  onScan: (identifiant: string) => void;
  titre?: string;
}) {
  const { mode, setMode, nfcDisponible, ecoute, erreur, soumettreManuel } =
    useRfidScan({ onScan: (id) => onScan(id) });
  const [saisie, setSaisie] = useState("");

  const modes: Array<{ id: RfidMode; libelle: string; icone: typeof Nfc; visible: boolean }> = [
    { id: "nfc", libelle: "NFC", icone: Nfc, visible: nfcDisponible },
    { id: "hid", libelle: "Lecteur USB", icone: Usb, visible: true },
    { id: "manuel", libelle: "Saisie code", icone: Keyboard, visible: true },
  ];

  return (
    <section
      aria-label="Scanner un badge"
      className="rounded-2xl border border-gray-200 bg-white p-5"
    >
      <h2 className="text-lg font-bold">{titre}</h2>

      {/* Choix du mode de lecture */}
      <div className="mt-3 flex gap-2" role="tablist" aria-label="Mode de lecture">
        {modes
          .filter((m) => m.visible)
          .map(({ id, libelle, icone: Icone }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                mode === id
                  ? "bg-encre text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icone size={15} aria-hidden="true" />
              {libelle}
            </button>
          ))}
      </div>

      {/* Zone d'état du scan */}
      <div className="mt-4">
        {mode === "nfc" && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-primaire-pale py-10">
            <Nfc size={48} className="animate-pulse text-primaire" aria-hidden="true" />
            <p className="font-medium text-primaire-fonce">
              {ecoute ? "Approchez le badge du téléphone…" : "Activation du NFC…"}
            </p>
          </div>
        )}

        {mode === "hid" && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-primaire-pale py-10">
            <Usb size={48} className="animate-pulse text-primaire" aria-hidden="true" />
            <p className="font-medium text-primaire-fonce">
              Présentez le badge au lecteur USB…
            </p>
            <p className="text-xs text-gray-600">
              L&apos;identifiant est saisi automatiquement par le lecteur.
            </p>
          </div>
        )}

        {mode === "manuel" && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              soumettreManuel(saisie);
            }}
          >
            <label htmlFor="code-badge" className="block text-sm font-medium">
              Code imprimé sur le badge (8 caractères)
            </label>
            <input
              id="code-badge"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value.toUpperCase())}
              autoFocus
              autoComplete="off"
              maxLength={24}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-center font-mono text-xl tracking-[0.3em] uppercase"
              placeholder="KWI•••••"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-primaire px-4 py-3 font-semibold text-white hover:bg-primaire-fonce"
            >
              Valider le badge
            </button>
          </form>
        )}

        {erreur && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {erreur}
          </p>
        )}
      </div>
    </section>
  );
}
