"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lecture d'un badge RFID/NFC, abstraite en trois modes :
 *
 *  - "nfc"    : API Web NFC (NDEFReader) — Android / Chrome uniquement.
 *               L'UID du badge (numéro de série) est lu directement.
 *  - "hid"    : lecteur RFID USB en mode clavier — l'UID est « tapé »
 *               très vite puis validé par Entrée. On capte la frappe
 *               globale : rafale de caractères (< 80 ms entre touches).
 *  - "manuel" : saisie du code à 8 caractères imprimé sur le badge.
 *
 * Le composant appelant reçoit l'identifiant scanné via onScan, quel
 * que soit le mode : la suite du flux est identique.
 */

export type RfidMode = "nfc" | "hid" | "manuel";

// Déclaration minimale de l'API Web NFC (absente des types TS standards)
interface NDEFReadingEventLike extends Event {
  serialNumber: string;
}
interface NDEFReaderLike {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  addEventListener(
    type: "reading",
    listener: (event: NDEFReadingEventLike) => void
  ): void;
  addEventListener(type: "readingerror", listener: () => void): void;
}
declare global {
  interface Window {
    NDEFReader?: new () => NDEFReaderLike;
  }
}

interface UseRfidScanOptions {
  /** Appelé avec l'UID (NFC/HID) ou le code imprimé (manuel) */
  onScan: (identifiant: string, mode: RfidMode) => void;
  /** Le scan n'écoute que lorsque actif est vrai */
  actif?: boolean;
}

export function useRfidScan({ onScan, actif = true }: UseRfidScanOptions) {
  const [nfcDisponible, setNfcDisponible] = useState(false);
  const [mode, setMode] = useState<RfidMode>("hid");
  const [ecoute, setEcoute] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Référence stable vers onScan pour ne pas réabonner à chaque rendu
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  // Détection du support Web NFC (Android / Chrome) : capacité du
  // navigateur, lisible uniquement après montage (window absent en SSR)
  useEffect(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation unique avec une capacité externe (window)
      setNfcDisponible(true);
      setMode("nfc");
    }
  }, []);

  // --- Mode NFC : lecture de l'UID via NDEFReader -----------------
  useEffect(() => {
    if (!actif || mode !== "nfc" || !nfcDisponible) return;

    const controller = new AbortController();
    const reader = new window.NDEFReader!();

    reader.addEventListener("reading", (event) => {
      // serialNumber est l'UID du badge, au format aa:bb:cc:…
      if (event.serialNumber) {
        onScanRef.current(event.serialNumber.toUpperCase(), "nfc");
      }
    });
    reader.addEventListener("readingerror", () => {
      setErreur("Lecture NFC impossible — réessayez ou saisissez le code du badge.");
    });

    reader
      .scan({ signal: controller.signal })
      .then(() => setEcoute(true))
      .catch(() => {
        setErreur("Accès NFC refusé — utilisez la saisie manuelle.");
        setMode("manuel");
      });

    return () => {
      controller.abort();
      setEcoute(false);
    };
  }, [actif, mode, nfcDisponible]);

  // --- Mode HID : rafale clavier d'un lecteur USB ------------------
  useEffect(() => {
    if (!actif || mode !== "hid") return;

    let tampon = "";
    let dernierAppui = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      // On ignore la frappe humaine dans un champ de formulaire
      const cible = e.target as HTMLElement;
      if (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA") return;

      const maintenant = Date.now();
      // Une pause > 80 ms = nouvelle séquence (un lecteur tape bien plus vite)
      if (maintenant - dernierAppui > 80) tampon = "";
      dernierAppui = maintenant;

      if (e.key === "Enter") {
        if (tampon.length >= 6) {
          onScanRef.current(tampon.toUpperCase(), "hid");
        }
        tampon = "";
      } else if (e.key.length === 1) {
        tampon += e.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflète l'état d'un abonnement externe (écouteur clavier)
    setEcoute(true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      setEcoute(false);
    };
  }, [actif, mode]);

  // --- Mode manuel : le formulaire appelle soumettreManuel ---------
  const soumettreManuel = useCallback((code: string) => {
    const propre = code.trim().toUpperCase();
    if (propre.length < 6) {
      setErreur("Le code du badge comporte au moins 6 caractères.");
      return;
    }
    setErreur(null);
    onScanRef.current(propre, "manuel");
  }, []);

  return {
    /** Mode de lecture courant */
    mode,
    /** Changer de mode (les trois restent accessibles à tout moment) */
    setMode,
    /** Web NFC est-il disponible sur cet appareil ? */
    nfcDisponible,
    /** Une écoute (NFC ou HID) est-elle active ? */
    ecoute,
    /** Message d'erreur lisible, ou null */
    erreur,
    /** À appeler avec le code imprimé en mode manuel */
    soumettreManuel,
  };
}
