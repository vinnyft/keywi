import type { Dictionnaire } from "./fr";

/** English dictionary. Must satisfy the shape defined by fr.ts. */
export const en: Dictionnaire = {
  nav: {
    produits: "Products",
    casUsage: "Use cases",
    trouverPointRelais: "Find a drop-off point",
    devenirPointRelais: "Become a partner",
    tarifs: "Pricing",
    connexion: "Log in",
    deposerMesCles: "Drop off my keys",
    ouvrirMenu: "Open menu",
    fermerMenu: "Close menu",
    produitsItems: {
      pointsRelais: { label: "Drop-off points", note: "The Keywi public network" },
      casiers: { label: "Smart lockers", note: "Coming soon" },
      logiciel: { label: "Key-tracking software", note: "Coming soon" },
    },
  },
  footer: {
    tagline:
      "France's local shop network for keys. Drop off nearby, manage access remotely.",
    produits: "Products",
    casUsage: "Use cases",
    keywi: "Keywi",
    pointsRelais: "Drop-off points",
    casiers: "Smart lockers",
    logicielSuivi: "Tracking software",
    tarifs: "Pricing",
    devenirPointRelais: "Become a partner",
    aPropos: "About",
    contact: "Contact",
    faq: "FAQ",
    cgv: "Terms of sale",
    confidentialite: "Privacy",
    mentionsLegales: "Legal notice",
    droits: "All rights reserved. Made with ♥ in Paris.",
  },
  home: {
    badge: "France's local drop-off network",
    titre1: "Your keys, kept safe,",
    titre2: "just around the corner.",
    lede:
      "Leave your keys with a trusted local shop and manage access remotely — no lockbox, no waiting, no stress.",
    deposerCle: "Drop off a key",
    voirCarte: "View the map",
    statPointsRelais: "drop-off points",
    statClesGerees: "keys managed",
    statMouvements: "movements",
    commentTitre: "How it works",
    commentLede:
      "Three steps to entrust your keys and stay in control of every handover.",
    etape: "Step",
    etapes: [
      {
        titre: "Drop off nearby",
        texte:
          "Pick a partner shop on the map and drop off your keyring fitted with a Keywi tag.",
      },
      {
        titre: "Share a code",
        texte:
          "Generate a 6-character pickup code and send it to your guest, your cleaner or a relative.",
      },
      {
        titre: "Track in real time",
        texte:
          "Every drop-off, pickup or return is notified instantly, by email and in your dashboard.",
      },
    ],
    penseTitre: "Built for you",
    commercantTitre: "A shop owner? Join the Keywi network.",
    commercantLede:
      "Turn your counter into a drop-off point: extra income on every handover, a simple app, no costly hardware.",
    devenirPointRelais: "Become a partner",
  },
};
