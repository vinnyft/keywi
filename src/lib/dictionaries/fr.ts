/**
 * Dictionnaire français — langue de référence. La forme de cet objet
 * définit le type `Dictionnaire` que l'anglais doit satisfaire :
 * toute clé ajoutée ici devient obligatoire dans en.ts.
 */
export const fr = {
  nav: {
    produits: "Produits",
    casUsage: "Cas d'usage",
    trouverPointRelais: "Trouver un point relais",
    devenirPointRelais: "Devenir point relais",
    tarifs: "Tarifs",
    connexion: "Connexion",
    deposerMesCles: "Déposer mes clés",
    ouvrirMenu: "Ouvrir le menu",
    fermerMenu: "Fermer le menu",
    produitsItems: {
      pointsRelais: { label: "Points relais", note: "Le réseau public KeyWe" },
      casiers: { label: "Casiers connectés", note: "Bientôt disponible" },
      logiciel: { label: "Logiciel de suivi de clés", note: "Bientôt disponible" },
    },
  },
  footer: {
    tagline:
      "Le réseau français de points relais pour clés. Déposez près de chez vous, gérez les accès à distance.",
    produits: "Produits",
    casUsage: "Cas d'usage",
    keywi: "KeyWe",
    pointsRelais: "Points relais",
    casiers: "Casiers connectés",
    logicielSuivi: "Logiciel de suivi",
    tarifs: "Tarifs",
    devenirPointRelais: "Devenir point relais",
    aPropos: "À propos",
    contact: "Contact",
    faq: "FAQ",
    cgv: "CGV",
    confidentialite: "Confidentialité",
    mentionsLegales: "Mentions légales",
    droits: "Tous droits réservés. Fait avec ♥ à Paris.",
  },
  home: {
    badge: "Réseau français de points relais",
    titre1: "Vos clés, en lieu sûr,",
    titre2: "près de chez vous.",
    lede:
      "Déposez vos clés dans un commerce de confiance et gérez les accès à distance — sans boîte à clés, sans attente, sans stress.",
    deposerCle: "Déposer une clé",
    voirCarte: "Voir la carte",
    statPointsRelais: "points relais",
    statClesGerees: "clés gérées",
    statMouvements: "mouvements",
    commentTitre: "Comment ça marche ?",
    commentLede:
      "Trois étapes suffisent pour confier vos clés et garder la main sur chaque accès.",
    etape: "Étape",
    etapes: [
      {
        titre: "Déposez près de chez vous",
        texte:
          "Choisissez un commerce partenaire sur la carte et déposez votre trousseau muni d'un badge KeyWe.",
      },
      {
        titre: "Partagez un code",
        texte:
          "Générez un code de retrait à 6 caractères et envoyez-le à votre voyageur, votre prestataire ou un proche.",
      },
      {
        titre: "Suivez en temps réel",
        texte:
          "Chaque dépôt, retrait ou retour vous est notifié instantanément, par email et dans votre espace.",
      },
    ],
    penseTitre: "Pensé pour vous",
    commercantTitre: "Commerçant ? Rejoignez le réseau KeyWe.",
    commercantLede:
      "Transformez votre comptoir en point relais : un revenu complémentaire à chaque mouvement, une application simple, aucun matériel coûteux.",
    devenirPointRelais: "Devenir point relais",
  },
};

// Pas de `as const` : les valeurs restent typées `string` afin que le
// dictionnaire anglais puisse satisfaire la même forme.
export type Dictionnaire = typeof fr;
