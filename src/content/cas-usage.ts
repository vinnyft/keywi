/**
 * Contenu des 7 landing pages « Cas d'usage » (même gabarit).
 * Textes 100 % originaux, en français.
 */

export interface CasUsage {
  slug: string;
  /** Libellé court pour les menus et l'accueil */
  menu: string;
  titre: string;
  accroche: string;
  description: string;
  benefices: { titre: string; texte: string }[];
  temoignage: { citation: string; auteur: string };
  emoji: string;
}

export const CAS_USAGE: CasUsage[] = [
  {
    slug: "hotes-airbnb",
    menu: "Hôtes Airbnb",
    emoji: "🏠",
    titre: "Hôtes Airbnb : accueillez sans être là",
    accroche:
      "Fini les allers-retours pour remettre les clés. Vos voyageurs les récupèrent à deux pas du logement, à l'heure qui les arrange.",
    description:
      "Déposez votre trousseau dans un commerce partenaire Keywi proche de votre logement. Chaque voyageur reçoit un code de retrait unique : il récupère les clés pendant les horaires d'ouverture du commerce, vous êtes notifié à chaque mouvement, en temps réel.",
    benefices: [
      {
        titre: "Check-in autonome",
        texte:
          "Vos voyageurs arrivent quand ils veulent, même tard le soir grâce aux commerces à horaires étendus.",
      },
      {
        titre: "Codes à usage unique",
        texte:
          "Générez et révoquez les codes de retrait en un clic, partagez-les par email ou WhatsApp.",
      },
      {
        titre: "Traçabilité totale",
        texte:
          "Dépôt, retrait, retour : chaque mouvement est horodaté et visible dans votre tableau de bord.",
      },
    ],
    temoignage: {
      citation:
        "Je gère deux studios à distance. Depuis Keywi, je n'ai plus jamais traversé Paris pour une remise de clés.",
      auteur: "Camille, hôte à Paris 10ᵉ",
    },
  },
  {
    slug: "conciergeries",
    menu: "Conciergeries & gestionnaires",
    emoji: "🛎️",
    titre: "Conciergeries : industrialisez la gestion des clés",
    accroche:
      "Un trousseau par logement, un badge par trousseau, un journal d'audit complet. Votre parc de clés enfin sous contrôle.",
    description:
      "Keywi remplace le tiroir à clés et le tableur. Chaque trousseau est identifié par un badge RFID scanné à chaque mouvement : vous savez qui a quoi, où, depuis quand. Vos équipes terrain et prestataires récupèrent les clés au point relais le plus proche, avec leur propre code.",
    benefices: [
      {
        titre: "Multi-logements",
        texte:
          "Gérez des dizaines de trousseaux depuis un seul tableau de bord, avec recherche et statuts en temps réel.",
      },
      {
        titre: "Journal d'audit immuable",
        texte:
          "Chaque scan est journalisé : datage, point relais, opérateur. Idéal pour vos engagements qualité.",
      },
      {
        titre: "Codes par intervenant",
        texte:
          "Ménage, maintenance, photographe : un code dédié et révocable pour chaque prestataire.",
      },
    ],
    temoignage: {
      citation:
        "Nous avons supprimé deux trajets par jour et nos pertes de clés sont tombées à zéro en trois mois.",
      auteur: "Sofiane, responsable d'une conciergerie parisienne",
    },
  },
  {
    slug: "agents-immobiliers",
    menu: "Agents immobiliers",
    emoji: "🔑",
    titre: "Agents immobiliers : des visites sans contrainte",
    accroche:
      "Diagnostiqueurs, photographes, artisans, confrères : donnez accès au bien sans immobiliser un négociateur.",
    description:
      "Déposez les clés du bien dans le commerce Keywi le plus proche. Chaque intervenant reçoit un code valable le temps de sa mission. Vous suivez les retraits et retours en direct, et le badge RFID garantit que le bon trousseau revient toujours dans la bonne case.",
    benefices: [
      {
        titre: "Zéro déplacement inutile",
        texte:
          "Plus besoin d'ouvrir le bien pour chaque diagnostic ou état des lieux : l'intervenant se sert au point relais.",
      },
      {
        titre: "Accès limités dans le temps",
        texte: "Les codes expirent automatiquement à la date que vous fixez.",
      },
      {
        titre: "Preuve de passage",
        texte:
          "L'horodatage des retraits et retours documente les interventions auprès des propriétaires.",
      },
    ],
    temoignage: {
      citation:
        "Le trousseau du mandat dort au point relais, pas dans la poche d'un négociateur. Tout le monde gagne du temps.",
      auteur: "Claire, directrice d'agence dans le Marais",
    },
  },
  {
    slug: "locations-moyenne-duree",
    menu: "Locations moyenne durée",
    emoji: "📅",
    titre: "Moyenne durée : des entrées et sorties fluides",
    accroche:
      "Baux mobilité, étudiants, professionnels en mission : gérez les rotations sans rendez-vous de remise de clés.",
    description:
      "Entre deux locataires, les clés passent par votre point relais Keywi : le sortant les redépose, l'entrant les récupère avec son code. Vous validez chaque étape à distance et gardez un historique complet de la rotation.",
    benefices: [
      {
        titre: "Rotations sans friction",
        texte:
          "Le locataire sortant redépose le trousseau au commerce : vous êtes notifié, le suivant peut arriver.",
      },
      {
        titre: "Flexibilité des horaires",
        texte:
          "Les arrivées tardives ne sont plus un problème : le commerce d'à côté est ouvert.",
      },
      {
        titre: "Moins de doubles",
        texte:
          "Un seul trousseau circulant de façon tracée remplace les copies multiples distribuées au fil de l'eau.",
      },
    ],
    temoignage: {
      citation:
        "Quatre rotations par mois sur mon T2 : tout passe par l'épicerie en bas, je ne me déplace plus.",
      auteur: "Marc, bailleur en moyenne durée",
    },
  },
  {
    slug: "hotels",
    menu: "Hôtels",
    emoji: "🏨",
    titre: "Hôtels : étendez votre réception",
    accroche:
      "Annexes, appart'hôtels, arrivées hors horaires : déléguez la remise de clés sans embaucher de veilleur.",
    description:
      "Pour vos chambres annexes ou vos suites en dehors du bâtiment principal, Keywi joue le rôle de réception déportée. Le client reçoit son code à la réservation, récupère ses clés au commerce partenaire et votre équipe suit tout depuis le back-office.",
    benefices: [
      {
        titre: "Réception 7j/7",
        texte:
          "Appuyez-vous sur les horaires étendus des commerces partenaires, sans coût de personnel de nuit.",
      },
      {
        titre: "Image soignée",
        texte:
          "Un parcours d'arrivée clair et guidé, aux couleurs de votre établissement dans les emails.",
      },
      {
        titre: "Intégrable",
        texte:
          "Générez les codes depuis votre logiciel maison à terme grâce à notre API (bientôt disponible).",
      },
    ],
    temoignage: {
      citation:
        "Nos studios annexes affichent complet même quand la réception est fermée : le point relais s'occupe des clés.",
      auteur: "Nadia, directrice d'un boutique-hôtel",
    },
  },
  {
    slug: "double-de-cles",
    menu: "Double de clés & particuliers",
    emoji: "👨‍👩‍👧",
    titre: "Particuliers : un double de clés toujours à portée",
    accroche:
      "Clés oubliées, enfants qui rentrent seuls, voisin qui arrose les plantes : votre double vous attend au commerce d'en bas.",
    description:
      "Déposez un double de vos clés dans le point relais Keywi de votre quartier. En cas de besoin, générez un code pour vous-même ou un proche : plus besoin de serrurier à 150 € quand la porte claque.",
    benefices: [
      {
        titre: "Anti-galère",
        texte:
          "Porte claquée ? Votre double est à cinq minutes à pied, pas chez un serrurier d'urgence.",
      },
      {
        titre: "Partage familial",
        texte:
          "Un code pour la baby-sitter, un autre pour le voisin pendant les vacances — révocables à tout moment.",
      },
      {
        titre: "Petit prix",
        texte: "Quelques euros par mois, des centaines d'euros de serrurier économisées.",
      },
    ],
    temoignage: {
      citation:
        "Ma fille de 12 ans a un code Keywi en cas d'oubli. La boulangerie est sur le chemin de l'école.",
      auteur: "Aïcha, maman dans le 11ᵉ",
    },
  },
  {
    slug: "prestataires-menage",
    menu: "Ménage & prestataires",
    emoji: "🧹",
    titre: "Prestataires : récupérez les clés sans rendez-vous",
    accroche:
      "Femmes et hommes de ménage, linge, maintenance : commencez vos missions à l'heure, sans attendre personne.",
    description:
      "Vos clients hôtes déposent les clés une fois au point relais. À chaque mission, vous récupérez le trousseau avec votre code et le redéposez en partant. L'hôte est notifié automatiquement, votre passage est horodaté : la confiance s'installe.",
    benefices: [
      {
        titre: "Plannings tenus",
        texte:
          "Plus d'attente devant la porte : les clés sont disponibles dès l'ouverture du commerce.",
      },
      {
        titre: "Passages prouvés",
        texte:
          "Retrait et redépôt horodatés : la facturation de vos interventions est incontestable.",
      },
      {
        titre: "Simple pour tous",
        texte:
          "Aucune application à installer : un code à 6 caractères suffit au comptoir.",
      },
    ],
    temoignage: {
      citation:
        "Je fais six logements par jour. Les badges Keywi m'évitent une heure de logistique quotidienne.",
      auteur: "Rosa, auto-entrepreneuse ménage",
    },
  },
];

export function getCasUsage(slug: string) {
  return CAS_USAGE.find((c) => c.slug === slug);
}
