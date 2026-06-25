import { NextResponse } from "next/server";
import {
  contenuCandidatureRefusee,
  contenuCandidatureValidee,
  contenuClesDisponibles,
  contenuCodeRetrait,
  contenuDepotEffectue,
  contenuRetourEffectue,
  contenuRetraitEffectue,
  type ContenuEmail,
} from "@/lib/notifications";

/**
 * Aperçu des gabarits d'emails dans le navigateur — DÉVELOPPEMENT
 * UNIQUEMENT (404 en production).
 *
 *   /api/dev/apercu-email                      → index des gabarits
 *   /api/dev/apercu-email?type=depot           → un gabarit donné
 */

const EXEMPLE = {
  commerce: "Librairie du Marais",
  adresseCommerce: "24 rue de Bretagne, 75003 Paris",
  logement: "Studio République",
};

const GABARITS: Record<string, { libelle: string; contenu: () => ContenuEmail }> = {
  depot: {
    libelle: "Dépôt effectué (→ hôte)",
    contenu: () =>
      contenuDepotEffectue({ hoteNom: "Vincent Meli", ...EXEMPLE }),
  },
  retour: {
    libelle: "Clés de retour (→ hôte)",
    contenu: () =>
      contenuRetourEffectue({ hoteNom: "Vincent Meli", ...EXEMPLE }),
  },
  disponibles: {
    libelle: "Clés disponibles (→ bénéficiaire)",
    contenu: () =>
      contenuClesDisponibles({ beneficiaireNom: "Léa Martin", code6: "H7KM2P", ...EXEMPLE }),
  },
  retrait: {
    libelle: "Retrait effectué (→ hôte)",
    contenu: () =>
      contenuRetraitEffectue({
        hoteNom: "Vincent Meli",
        logement: EXEMPLE.logement,
        commerce: EXEMPLE.commerce,
        beneficiaire: "Léa Martin",
      }),
  },
  code: {
    libelle: "Code de retrait partagé (→ bénéficiaire)",
    contenu: () =>
      contenuCodeRetrait({
        beneficiaireNom: "Léa Martin",
        code6: "H7KM2P",
        cleEnDepot: false,
        ...EXEMPLE,
      }),
  },
  "candidature-validee": {
    libelle: "Candidature validée (→ commerçant)",
    contenu: () =>
      contenuCandidatureValidee({ nomContact: "Jeanne Martin", nomCommerce: "Café du Coin" }),
  },
  "candidature-refusee": {
    libelle: "Candidature refusée (→ commerçant)",
    contenu: () =>
      contenuCandidatureRefusee({ nomContact: "Jeanne Martin", nomCommerce: "Café du Coin" }),
  },
};

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const type = new URL(request.url).searchParams.get("type");

  // Un gabarit précis : on rend l'email tel qu'il partira
  if (type && GABARITS[type]) {
    const { sujet, html } = GABARITS[type].contenu();
    return new NextResponse(
      html.replace(
        "<body",
        `<!-- Sujet : ${sujet} --><body`
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Index de tous les gabarits
  const liens = Object.entries(GABARITS)
    .map(
      ([cle, g]) =>
        `<li style="margin:8px 0"><a href="/api/dev/apercu-email?type=${cle}"
           style="color:#6FA82C;font-weight:600">${g.libelle}</a>
           <code style="color:#5B6472">?type=${cle}</code></li>`
    )
    .join("");
  return new NextResponse(
    `<body style="font-family:system-ui;max-width:560px;margin:40px auto;color:#14331E">
       <h1 style="font-size:20px">📧 Aperçu des emails Keywi (dev)</h1>
       <ul style="padding-left:18px">${liens}</ul>
     </body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
