import { NextResponse } from "next/server";
import {
  contenuCandidatureRecue,
  contenuNouvelleCandidatureAdmin,
  contenuCandidatureRefusee,
  contenuCandidatureValidee,
  contenuClesDisponibles,
  contenuCodeRetrait,
  contenuDepotEffectue,
  contenuRetourEffectue,
  contenuRetraitEffectue,
  contenuRapportAdmin,
  contenuRapportCommercial,
  contenuRapportRelais,
  contenuAlerteCapacite,
  contenuCapaciteRelais,
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
  "candidature-recue": {
    libelle: "Accusé de réception de candidature (→ commerçant)",
    contenu: () =>
      contenuCandidatureRecue({ nomContact: "Jeanne Martin", nomCommerce: "Café du Coin" }),
  },
  "candidature-admin": {
    libelle: "Nouvelle candidature (→ admin)",
    contenu: () =>
      contenuNouvelleCandidatureAdmin({
        nomCommerce: "Café du Coin",
        nomContact: "Jeanne Martin",
        email: "contact@cafeducoin.fr",
        telephone: "01 23 45 67 89",
        adresse: "12 rue de la République",
        codePostal: "75011",
        ville: "Paris",
        message: "Bar-tabac ouvert 7j/7, grande réserve derrière le comptoir.",
        commercialCode: "KW-MARIE",
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
  "rapport-admin": {
    libelle: "Rapport hebdo (→ admin)",
    contenu: () =>
      contenuRapportAdmin({
        nouveaux_relais: 4,
        total_relais_actifs: 37,
        relais_inactifs: 2,
        candidatures_semaine: 9,
        candidatures_en_attente: 3,
        depots_semaine: 58,
        retraits_semaine: 51,
        cles_en_depot: 22,
        nouveaux_hotes: 12,
        ca_centimes_semaine: 48900,
      }),
  },
  "rapport-commercial": {
    libelle: "Rapport hebdo (→ commercial)",
    contenu: () =>
      contenuRapportCommercial({
        commercialNom: "Marie",
        prospectsAjoutes: 14,
        contactes: 22,
        rdv: 6,
        signes: 3,
        actifsTotal: 11,
        cibleSignes: 5,
      }),
  },
  "rapport-relais": {
    libelle: "Rapport hebdo (→ relais)",
    contenu: () =>
      contenuRapportRelais({
        relaisNom: "Librairie du Marais",
        mouvementsSemaine: 12,
        clesEnGestion: 4,
        caMoisCentimes: 3600,
        nbMouvementsMois: 41,
      }),
  },
  "capacite-equipe": {
    libelle: "Alerte capacité 80% (→ admin / commercial)",
    contenu: () =>
      contenuAlerteCapacite({
        relaisNom: "Librairie du Marais",
        adresse: "24 rue de Bretagne",
        ville: "Paris",
        pourcent: 85,
        occupees: 17,
        capacite: 20,
        commercialNom: "Marie",
        cheminEspace: "/admin",
      }),
  },
  "capacite-relais": {
    libelle: "Alerte capacité 80% (→ relais)",
    contenu: () =>
      contenuCapaciteRelais({
        relaisNom: "Librairie du Marais",
        pourcent: 85,
        occupees: 17,
        capacite: 20,
      }),
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
           style="color:#5C7A4A;font-weight:600">${g.libelle}</a>
           <code style="color:#5B6472">?type=${cle}</code></li>`
    )
    .join("");
  return new NextResponse(
    `<body style="font-family:system-ui;max-width:560px;margin:40px auto;color:#3A5230">
       <h1 style="font-size:20px">📧 Aperçu des emails KeyWe (dev)</h1>
       <ul style="padding-left:18px">${liens}</ul>
     </body>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
