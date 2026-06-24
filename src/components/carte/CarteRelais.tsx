"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Carte Leaflet + OpenStreetMap des points relais.
 * Marqueur original KLAV (SVG inline — pas d'assets externes,
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
}

const PARIS_CENTRE: [number, number] = [48.8655, 2.3645];

function marqueur(selectionne: boolean) {
  return divIcon({
    className: "",
    html: `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0C8 0 0 8 0 18c0 12 18 26 18 26s18-14 18-26C36 8 28 0 18 0z"
            fill="${selectionne ? "#FF6B5B" : "#2D5BFF"}"/>
      <circle cx="15" cy="16" r="4.5" stroke="white" stroke-width="2.8" fill="none"/>
      <path d="M18.5 19.5 L26 27 M23 24 L26 21" stroke="white" stroke-width="2.8" stroke-linecap="round"/>
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
          icon={marqueur(p.id === pointSelectionne)}
          eventHandlers={surSelection ? { click: () => surSelection(p) } : undefined}
        >
          <Popup>
            <strong>{p.nom}</strong>
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
                    background: "#2D5BFF",
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
