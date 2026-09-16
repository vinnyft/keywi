"use client";

import { useState } from "react";
import { Nfc, Usb, Keyboard } from "lucide-react";
import { useRfidScan, type RfidMode } from "@/hooks/useRfidScan";
import { useLocale } from "@/lib/useLocale";

/**
 * Zone de scan d'un badge RFID/NFC, trois modes au choix :
 * NFC (Android/Chrome), lecteur USB (HID clavier), saisie manuelle.
 * Quel que soit le mode, onScan reçoit l'identifiant lu.
 */
export function ScannerBadge({
  onScan,
  titre,
}: {
  onScan: (identifiant: string) => void;
  titre?: string;
}) {
  const en = useLocale() === "en";
  const { mode, setMode, nfcDisponible, ecoute, erreur, soumettreManuel } =
    useRfidScan({ onScan: (id) => onScan(id) });
  const [saisie, setSaisie] = useState("");

  const t = en
    ? {
        titreDefaut: "Scan the keyring tag",
        scannerAria: "Scan a tag",
        modeAria: "Reading mode",
        usb: "USB reader",
        saisie: "Enter code",
        nfcApprochez: "Hold the tag near the phone…",
        nfcActivation: "Activating NFC…",
        usbPresentez: "Present the tag to the USB reader…",
        usbAide: "The identifier is entered automatically by the reader.",
        codeImprime: "Code printed on the tag (8 characters)",
        valider: "Validate the tag",
      }
    : {
        titreDefaut: "Scannez le badge du trousseau",
        scannerAria: "Scanner un badge",
        modeAria: "Mode de lecture",
        usb: "Lecteur USB",
        saisie: "Saisie code",
        nfcApprochez: "Approchez le badge du téléphone…",
        nfcActivation: "Activation du NFC…",
        usbPresentez: "Présentez le badge au lecteur USB…",
        usbAide: "L'identifiant est saisi automatiquement par le lecteur.",
        codeImprime: "Code imprimé sur le badge (8 caractères)",
        valider: "Valider le badge",
      };

  const modes: Array<{ id: RfidMode; libelle: string; icone: typeof Nfc; visible: boolean }> = [
    { id: "nfc", libelle: "NFC", icone: Nfc, visible: nfcDisponible },
    { id: "hid", libelle: t.usb, icone: Usb, visible: true },
    { id: "manuel", libelle: t.saisie, icone: Keyboard, visible: true },
  ];

  return (
    <section
      aria-label={t.scannerAria}
      className="rounded-2xl border border-gray-200 bg-white p-5"
    >
      <h2 className="text-lg font-bold">{titre ?? t.titreDefaut}</h2>

      {/* Choix du mode de lecture */}
      <div className="mt-3 flex gap-2" role="tablist" aria-label={t.modeAria}>
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
              {ecoute ? t.nfcApprochez : t.nfcActivation}
            </p>
          </div>
        )}

        {mode === "hid" && (
          <div className="flex flex-col items-center gap-2 rounded-xl bg-primaire-pale py-10">
            <Usb size={48} className="animate-pulse text-primaire" aria-hidden="true" />
            <p className="font-medium text-primaire-fonce">{t.usbPresentez}</p>
            <p className="text-xs text-gray-600">{t.usbAide}</p>
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
              {t.codeImprime}
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
              {t.valider}
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
