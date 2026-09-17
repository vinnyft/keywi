import type { Locale } from "@/lib/i18n";

/**
 * Contenu des 7 landing pages « Cas d'usage » (même gabarit),
 * bilingue. Chaque entrée porte un slug et un emoji (indépendants
 * de la langue) plus une version `fr` et `en` du contenu.
 */

export interface CasUsageContenu {
  /** Libellé court pour les menus et l'accueil */
  menu: string;
  titre: string;
  accroche: string;
  description: string;
  benefices: { titre: string; texte: string }[];
  temoignage: { citation: string; auteur: string };
}

interface CasUsageEntree {
  slug: string;
  emoji: string;
  fr: CasUsageContenu;
  en: CasUsageContenu;
}

/** Cas d'usage résolu dans une langue : contenu + slug + emoji. */
export type CasUsage = CasUsageContenu & { slug: string; emoji: string };

const ENTREES: CasUsageEntree[] = [
  {
    slug: "hotes-airbnb",
    emoji: "🏠",
    fr: {
      menu: "Hôtes Airbnb",
      titre: "Hôtes Airbnb : accueillez sans être là",
      accroche:
        "Fini les allers-retours pour remettre les clés. Vos voyageurs les récupèrent à deux pas du logement, à l'heure qui les arrange.",
      description:
        "Déposez votre trousseau dans un commerce partenaire KeyWe proche de votre logement. Chaque voyageur reçoit un code de retrait unique : il récupère les clés pendant les horaires d'ouverture du commerce, vous êtes notifié à chaque mouvement, en temps réel.",
      benefices: [
        { titre: "Check-in autonome", texte: "Vos voyageurs arrivent quand ils veulent, même tard le soir grâce aux commerces à horaires étendus." },
        { titre: "Codes à usage unique", texte: "Générez et révoquez les codes de retrait en un clic, partagez-les par email ou WhatsApp." },
        { titre: "Traçabilité totale", texte: "Dépôt, retrait, retour : chaque mouvement est horodaté et visible dans votre tableau de bord." },
      ],
      temoignage: { citation: "Je gère deux studios à distance. Depuis KeyWe, je n'ai plus jamais traversé Paris pour une remise de clés.", auteur: "Camille, hôte à Paris 10ᵉ" },
    },
    en: {
      menu: "Airbnb hosts",
      titre: "Airbnb hosts: welcome guests without being there",
      accroche:
        "No more round trips to hand over keys. Your guests pick them up steps from the rental, whenever suits them.",
      description:
        "Drop your keyring off at a KeyWe partner shop near your rental. Each guest gets a unique pickup code and collects the keys during the shop's opening hours — and you're notified of every movement, in real time.",
      benefices: [
        { titre: "Self check-in", texte: "Guests arrive whenever they like, even late at night, thanks to shops with extended hours." },
        { titre: "Single-use codes", texte: "Generate and revoke pickup codes in one click; share them by email or WhatsApp." },
        { titre: "Full traceability", texte: "Drop-off, pickup, return: every movement is timestamped and visible in your dashboard." },
      ],
      temoignage: { citation: "I manage two studios remotely. Since KeyWe, I've never crossed Paris for a key handover again.", auteur: "Camille, host in Paris 10th" },
    },
  },
  {
    slug: "conciergeries",
    emoji: "🛎️",
    fr: {
      menu: "Conciergeries & gestionnaires",
      titre: "Conciergeries : industrialisez la gestion des clés",
      accroche:
        "Un trousseau par logement, un badge par trousseau, un journal d'audit complet. Votre parc de clés enfin sous contrôle.",
      description:
        "KeyWe remplace le tiroir à clés et le tableur. Chaque trousseau est identifié par un badge RFID scanné à chaque mouvement : vous savez qui a quoi, où, depuis quand. Vos équipes terrain et prestataires récupèrent les clés au point relais le plus proche, avec leur propre code.",
      benefices: [
        { titre: "Multi-logements", texte: "Gérez des dizaines de trousseaux depuis un seul tableau de bord, avec recherche et statuts en temps réel." },
        { titre: "Journal d'audit immuable", texte: "Chaque scan est journalisé : datage, point relais, opérateur. Idéal pour vos engagements qualité." },
        { titre: "Codes par intervenant", texte: "Ménage, maintenance, photographe : un code dédié et révocable pour chaque prestataire." },
      ],
      temoignage: { citation: "Nous avons supprimé deux trajets par jour et nos pertes de clés sont tombées à zéro en trois mois.", auteur: "Sofiane, responsable d'une conciergerie parisienne" },
    },
    en: {
      menu: "Property managers",
      titre: "Property managers: industrialise key management",
      accroche:
        "One keyring per unit, one tag per keyring, a complete audit trail. Your key inventory finally under control.",
      description:
        "KeyWe replaces the key drawer and the spreadsheet. Each keyring is identified by an RFID tag scanned at every movement: you know who has what, where, and since when. Your field teams and contractors pick up keys at the nearest drop-off point, each with their own code.",
      benefices: [
        { titre: "Multi-unit", texte: "Manage dozens of keyrings from a single dashboard, with search and real-time statuses." },
        { titre: "Immutable audit log", texte: "Every scan is logged: time, drop-off point, operator. Ideal for your quality commitments." },
        { titre: "Per-contractor codes", texte: "Cleaning, maintenance, photographer: a dedicated, revocable code for each provider." },
      ],
      temoignage: { citation: "We cut two trips a day and our lost-key incidents dropped to zero within three months.", auteur: "Sofiane, head of a Paris property-management firm" },
    },
  },
  {
    slug: "agents-immobiliers",
    emoji: "🔑",
    fr: {
      menu: "Agents immobiliers",
      titre: "Agents immobiliers : des visites sans contrainte",
      accroche:
        "Diagnostiqueurs, photographes, artisans, confrères : donnez accès au bien sans immobiliser un négociateur.",
      description:
        "Déposez les clés du bien dans le commerce KeyWe le plus proche. Chaque intervenant reçoit un code valable le temps de sa mission. Vous suivez les retraits et retours en direct, et le badge RFID garantit que le bon trousseau revient toujours dans la bonne case.",
      benefices: [
        { titre: "Zéro déplacement inutile", texte: "Plus besoin d'ouvrir le bien pour chaque diagnostic ou état des lieux : l'intervenant se sert au point relais." },
        { titre: "Accès limités dans le temps", texte: "Les codes expirent automatiquement à la date que vous fixez." },
        { titre: "Preuve de passage", texte: "L'horodatage des retraits et retours documente les interventions auprès des propriétaires." },
      ],
      temoignage: { citation: "Le trousseau du mandat dort au point relais, pas dans la poche d'un négociateur. Tout le monde gagne du temps.", auteur: "Claire, directrice d'agence dans le Marais" },
    },
    en: {
      menu: "Estate agents",
      titre: "Estate agents: viewings without the hassle",
      accroche:
        "Surveyors, photographers, tradespeople, fellow agents: grant access to the property without tying up a negotiator.",
      description:
        "Drop the property keys at the nearest KeyWe shop. Each visitor gets a code valid for the duration of their job. You track pickups and returns live, and the RFID tag guarantees the right keyring always comes back to the right slot.",
      benefices: [
        { titre: "No wasted trips", texte: "No need to open the property for every survey or inventory: the visitor collects the keys at the drop-off point." },
        { titre: "Time-limited access", texte: "Codes expire automatically on the date you set." },
        { titre: "Proof of visit", texte: "Timestamped pickups and returns document each visit for the owners." },
      ],
      temoignage: { citation: "The listing's keys sit at the drop-off point, not in a negotiator's pocket. Everyone saves time.", auteur: "Claire, agency director in the Marais" },
    },
  },
  {
    slug: "locations-moyenne-duree",
    emoji: "📅",
    fr: {
      menu: "Locations moyenne durée",
      titre: "Moyenne durée : des entrées et sorties fluides",
      accroche:
        "Baux mobilité, étudiants, professionnels en mission : gérez les rotations sans rendez-vous de remise de clés.",
      description:
        "Entre deux locataires, les clés passent par votre point relais KeyWe : le sortant les redépose, l'entrant les récupère avec son code. Vous validez chaque étape à distance et gardez un historique complet de la rotation.",
      benefices: [
        { titre: "Rotations sans friction", texte: "Le locataire sortant redépose le trousseau au commerce : vous êtes notifié, le suivant peut arriver." },
        { titre: "Flexibilité des horaires", texte: "Les arrivées tardives ne sont plus un problème : le commerce d'à côté est ouvert." },
        { titre: "Moins de doubles", texte: "Un seul trousseau circulant de façon tracée remplace les copies multiples distribuées au fil de l'eau." },
      ],
      temoignage: { citation: "Quatre rotations par mois sur mon T2 : tout passe par l'épicerie en bas, je ne me déplace plus.", auteur: "Marc, bailleur en moyenne durée" },
    },
    en: {
      menu: "Mid-term rentals",
      titre: "Mid-term rentals: smooth move-ins and move-outs",
      accroche:
        "Mobility leases, students, professionals on assignment: handle turnovers without key-handover appointments.",
      description:
        "Between two tenants, the keys pass through your KeyWe drop-off point: the outgoing tenant drops them off, the incoming one collects them with their code. You approve each step remotely and keep a full history of the turnover.",
      benefices: [
        { titre: "Friction-free turnovers", texte: "The outgoing tenant drops the keyring at the shop: you're notified, the next one can arrive." },
        { titre: "Flexible hours", texte: "Late arrivals are no longer a problem: the shop next door is open." },
        { titre: "Fewer copies", texte: "A single, traceable keyring in circulation replaces the multiple copies handed out over time." },
      ],
      temoignage: { citation: "Four turnovers a month on my one-bedroom: it all goes through the grocery downstairs, I no longer travel.", auteur: "Marc, mid-term landlord" },
    },
  },
  {
    slug: "hotels",
    emoji: "🏨",
    fr: {
      menu: "Hôtels",
      titre: "Hôtels : étendez votre réception",
      accroche:
        "Annexes, appart'hôtels, arrivées hors horaires : déléguez la remise de clés sans embaucher de veilleur.",
      description:
        "Pour vos chambres annexes ou vos suites en dehors du bâtiment principal, KeyWe joue le rôle de réception déportée. Le client reçoit son code à la réservation, récupère ses clés au commerce partenaire et votre équipe suit tout depuis le back-office.",
      benefices: [
        { titre: "Réception 7j/7", texte: "Appuyez-vous sur les horaires étendus des commerces partenaires, sans coût de personnel de nuit." },
        { titre: "Image soignée", texte: "Un parcours d'arrivée clair et guidé, aux couleurs de votre établissement dans les emails." },
        { titre: "Intégrable", texte: "Générez les codes depuis votre logiciel maison à terme grâce à notre API (bientôt disponible)." },
      ],
      temoignage: { citation: "Nos studios annexes affichent complet même quand la réception est fermée : le point relais s'occupe des clés.", auteur: "Nadia, directrice d'un boutique-hôtel" },
    },
    en: {
      menu: "Hotels",
      titre: "Hotels: extend your front desk",
      accroche:
        "Annexes, aparthotels, out-of-hours arrivals: delegate key handovers without hiring a night porter.",
      description:
        "For your annexe rooms or suites outside the main building, KeyWe acts as a remote front desk. The guest receives their code at booking, collects their keys at the partner shop, and your team tracks everything from the back office.",
      benefices: [
        { titre: "24/7 reception", texte: "Lean on partner shops' extended hours, with no night-staff cost." },
        { titre: "Polished experience", texte: "A clear, guided arrival journey, with your establishment's branding in the emails." },
        { titre: "Integrable", texte: "Generate codes from your own software in time via our API (coming soon)." },
      ],
      temoignage: { citation: "Our annexe studios sell out even when the desk is closed: the drop-off point handles the keys.", auteur: "Nadia, director of a boutique hotel" },
    },
  },
  {
    slug: "double-de-cles",
    emoji: "👨‍👩‍👧",
    fr: {
      menu: "Double de clés & particuliers",
      titre: "Particuliers : un double de clés toujours à portée",
      accroche:
        "Clés oubliées, enfants qui rentrent seuls, voisin qui arrose les plantes : votre double vous attend au commerce d'en bas.",
      description:
        "Déposez un double de vos clés dans le point relais KeyWe de votre quartier. En cas de besoin, générez un code pour vous-même ou un proche : plus besoin de serrurier à 150 € quand la porte claque.",
      benefices: [
        { titre: "Anti-galère", texte: "Porte claquée ? Votre double est à cinq minutes à pied, pas chez un serrurier d'urgence." },
        { titre: "Partage familial", texte: "Un code pour la baby-sitter, un autre pour le voisin pendant les vacances — révocables à tout moment." },
        { titre: "Petit prix", texte: "Quelques euros par mois, des centaines d'euros de serrurier économisées." },
      ],
      temoignage: { citation: "Ma fille de 12 ans a un code KeyWe en cas d'oubli. La boulangerie est sur le chemin de l'école.", auteur: "Aïcha, maman dans le 11ᵉ" },
    },
    en: {
      menu: "Spare keys & individuals",
      titre: "Individuals: a spare key always within reach",
      accroche:
        "Forgotten keys, children coming home alone, a neighbour watering the plants: your spare is waiting at the shop downstairs.",
      description:
        "Leave a spare set of keys at your neighbourhood KeyWe drop-off point. When you need it, generate a code for yourself or someone close: no more €150 locksmith when the door slams shut.",
      benefices: [
        { titre: "No more lockouts", texte: "Door slammed shut? Your spare is a five-minute walk away, not at an emergency locksmith." },
        { titre: "Family sharing", texte: "A code for the babysitter, another for the neighbour during the holidays — revocable any time." },
        { titre: "Low cost", texte: "A few euros a month, hundreds in locksmith fees saved." },
      ],
      temoignage: { citation: "My 12-year-old has a KeyWe code in case she forgets hers. The bakery is on the way to school.", auteur: "Aïcha, mum in the 11th" },
    },
  },
  {
    slug: "prestataires-menage",
    emoji: "🧹",
    fr: {
      menu: "Ménage & prestataires",
      titre: "Prestataires : récupérez les clés sans rendez-vous",
      accroche:
        "Femmes et hommes de ménage, linge, maintenance : commencez vos missions à l'heure, sans attendre personne.",
      description:
        "Vos clients hôtes déposent les clés une fois au point relais. À chaque mission, vous récupérez le trousseau avec votre code et le redéposez en partant. L'hôte est notifié automatiquement, votre passage est horodaté : la confiance s'installe.",
      benefices: [
        { titre: "Plannings tenus", texte: "Plus d'attente devant la porte : les clés sont disponibles dès l'ouverture du commerce." },
        { titre: "Passages prouvés", texte: "Retrait et redépôt horodatés : la facturation de vos interventions est incontestable." },
        { titre: "Simple pour tous", texte: "Aucune application à installer : un code à 6 caractères suffit au comptoir." },
      ],
      temoignage: { citation: "Je fais six logements par jour. Les badges KeyWe m'évitent une heure de logistique quotidienne.", auteur: "Rosa, auto-entrepreneuse ménage" },
    },
    en: {
      menu: "Cleaning & contractors",
      titre: "Contractors: collect keys without an appointment",
      accroche:
        "Cleaners, laundry, maintenance: start your jobs on time, without waiting for anyone.",
      description:
        "Your host clients drop the keys off once at the drop-off point. On each job, you collect the keyring with your code and return it on your way out. The host is notified automatically and your visit is timestamped: trust builds.",
      benefices: [
        { titre: "Schedules kept", texte: "No more waiting at the door: the keys are available as soon as the shop opens." },
        { titre: "Proven visits", texte: "Timestamped pickup and return: billing for your work is indisputable." },
        { titre: "Simple for everyone", texte: "No app to install: a 6-character code at the counter is enough." },
      ],
      temoignage: { citation: "I do six homes a day. KeyWe tags save me an hour of logistics every day.", auteur: "Rosa, self-employed cleaner" },
    },
  },
];

/** Slugs (indépendants de la langue) — pour le routage et le sitemap. */
export const CAS_USAGE_SLUGS = ENTREES.map((e) => e.slug);

/** Liste des cas d'usage résolus dans une langue. */
export function listeCasUsage(locale: Locale): CasUsage[] {
  return ENTREES.map((e) => ({ slug: e.slug, emoji: e.emoji, ...e[locale] }));
}

/** Un cas d'usage résolu dans une langue, ou `undefined` si le slug est inconnu. */
export function getCasUsage(slug: string, locale: Locale): CasUsage | undefined {
  const e = ENTREES.find((x) => x.slug === slug);
  return e ? { slug: e.slug, emoji: e.emoji, ...e[locale] } : undefined;
}
