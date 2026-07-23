"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Carte Leaflet + OpenStreetMap des points relais.
 * Marqueur original Keywi (SVG inline — pas d'assets externes,
 * évite aussi les soucis d'icônes Leaflet avec les bundlers).
 */

export interface PointRelaisCarte {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  lat: number;
  lng: number;
  casesLibres?: number;
  /** « casier » = armoire automatique 24/7, sinon commerce partenaire */
  type?: "commerce" | "casier";
}

const PARIS_CENTRE: [number, number] = [48.8655, 2.3645];

/**
 * Deux pictogrammes : une clé pour les commerces partenaires,
 * une grille de cases pour les casiers connectés (accès 24/7).
 */
function marqueur(selectionne: boolean, estCasier: boolean) {
  const fond = selectionne ? "#3A5230" : estCasier ? "#8A7252" : "#5C7A4A";
  const pictoCasier = `
      <rect x="10" y="10" width="7" height="6" rx="1.2" fill="white"/>
      <rect x="19" y="10" width="7" height="6" rx="1.2" fill="white"/>
      <rect x="10" y="18" width="7" height="6" rx="1.2" fill="white"/>
      <rect x="19" y="18" width="7" height="6" rx="1.2" fill="white" opacity="0.55"/>`;
  const pictoCle = `
      <circle cx="15" cy="16" r="4.5" stroke="white" stroke-width="2.8" fill="none"/>
      <path d="M18.5 19.5 L26 27 M23 24 L26 21" stroke="white" stroke-width="2.8" stroke-linecap="round"/>`;
  return divIcon({
    className: "",
    html: `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8 0 0 8 0 18c0 12 18 26 18 26s18-14 18-26C36 8 28 0 18 0z" fill="${fond}"/>
      ${estCasier ? pictoCasier : pictoCle}
    </svg>`,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}

export default function CarteRelais({
  points,
  surSelection,
  pointSelectionne,
  hauteur = "420px",
}: {
  points: PointRelaisCarte[];
  surSelection?: (point: PointRelaisCarte) => void;
  pointSelectionne?: string | null;
  hauteur?: string;
}) {
  return (
    <MapContainer
      center={PARIS_CENTRE}
      zoom={13}
      style={{ height: hauteur, width: "100%", borderRadius: "1rem", zIndex: 0 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; les contributeurs <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={marqueur(p.id === pointSelectionne, p.type === "casier")}
          eventHandlers={surSelection ? { click: () => surSelection(p) } : undefined}
        >
          <Popup>
            <strong>{p.nom}</strong>
            {p.type === "casier" && (
              <span
                style={{
                  marginLeft: 6,
                  background: "#8A7252",
                  color: "white",
                  borderRadius: 99,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                24/7
              </span>
            )}
            <br />
            {p.adresse}, {p.code_postal} {p.ville}
            {p.casesLibres != null && (
              <>
                <br />
                <span style={{ color: "#0FA86C", fontWeight: 600 }}>
                  {p.casesLibres} case{p.casesLibres > 1 ? "s" : ""} libre
                  {p.casesLibres > 1 ? "s" : ""}
                </span>
              </>
            )}
            {surSelection && (
              <>
                <br />
                <button
                  onClick={() => surSelection(p)}
                  style={{
                    marginTop: 6,
                    background: "#5C7A4A",
                    color: "white",
                    border: 0,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Choisir ce point relais
                </button>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
