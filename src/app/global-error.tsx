"use client";

import { useEffect } from "react";

/**
 * Erreur survenue dans le gabarit racine lui-même : ni le layout,
 * ni les polices, ni le CSS ne sont garantis. On réécrit donc un
 * document complet, avec des styles en ligne uniquement.
 */
export default function ErreurGlobale({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale :", error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#FBFAF3",
          color: "#3A5230",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#5C7A4A",
            color: "#F1ECE0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          K
        </div>
        <h1 style={{ margin: 0, fontSize: 24 }}>Keywi est momentanément indisponible</h1>
        <p style={{ margin: 0, maxWidth: 420, color: "#6B7A6B" }}>
          Une erreur est survenue au chargement de l&apos;application. Vos
          données ne sont pas affectées.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "12px 22px",
            borderRadius: 10,
            border: 0,
            background: "#5C7A4A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Recharger
        </button>
        {error.digest && (
          <p style={{ marginTop: 12, fontSize: 12, color: "#9aa89a" }}>
            Référence : {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
