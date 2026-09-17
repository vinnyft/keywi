import { ImageResponse } from "next/og";

/**
 * Image de partage social (Open Graph), générée à la construction.
 *
 * Une seule carte, aux couleurs de la marque, pour tout le site :
 * quand un lien KeyWe est partagé (WhatsApp, LinkedIn, iMessage,
 * Slack…), il affiche cette vignette au lieu d'un aperçu vide.
 * Rendu par Satori (next/og) — mise en page en flexbox uniquement,
 * police système par défaut, aucun asset externe.
 */
export const alt = "KeyWe — Vos clés, en lieu sûr, près de chez vous";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2f4226",
          padding: "72px 80px",
          color: "#f3f1dc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#5c7a4a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 800,
              color: "#f3f1dc",
            }}
          >
            K
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            KeyWe
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            Vos clés, en lieu sûr, près de chez vous.
          </div>
          <div style={{ fontSize: 30, color: "#aec98a", maxWidth: 820 }}>
            Le réseau français de points relais pour clés — dépôt, code de
            retrait, suivi en temps réel.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#aec98a" }}>
          keywe.io
        </div>
      </div>
    ),
    size
  );
}
