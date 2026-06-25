"use client";

import { useEffect } from "react";
import { usePanierStore } from "@/lib/configurateur/store";

// Rehydrates the persisted panier store from localStorage after mount.
// Must be rendered in a client layout to avoid SSR/localStorage mismatch.
export function PanierHydrator() {
  useEffect(() => {
    usePanierStore.persist.rehydrate();
  }, []);
  return null;
}
