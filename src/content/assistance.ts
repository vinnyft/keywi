import type { Locale } from "@/lib/i18n";

/**
 * Arbre de décision du bot d'assistance KeyWe, bilingue.
 *
 * Volontairement sans IA : un arbre déterministe résout les
 * problèmes courants sans coût, sans hallucination et sans envoyer
 * la moindre donnée à un tiers. Quand aucune branche ne convient,
 * le widget bascule vers un email au SAV (voir AssistanceBot).
 *
 * La structure (ids, liens entre nœuds) est définie une seule fois ;
 * chaque texte porte sa version `fr` et `en`. `getArbre(locale)`
 * résout l'arbre dans la langue courante.
 */

type Texte = { fr: string; en: string };

interface ChoixSrc {
  libelle: Texte;
  vers: string;
}
interface NoeudSrc {
  id: string;
  message: Texte;
  choix?: ChoixSrc[];
  lien?: { href: string; libelle: Texte };
  feuille?: boolean;
}

/** Un choix résolu dans une langue. */
export interface Choix {
  libelle: string;
  vers: string;
}
/** Un nœud résolu dans une langue. */
export interface Noeud {
  id: string;
  message: string;
  choix?: Choix[];
  lien?: { href: string; libelle: string };
  feuille?: boolean;
}

/** Adresse du service après-vente, repli quand l'arbre ne suffit pas. */
export const EMAIL_SAV = "sav@keywe.io";

export const RACINE = "accueil";

const SOURCE: Record<string, NoeudSrc> = {
  accueil: {
    id: "accueil",
    message: {
      fr: "Bonjour 👋 Je suis l'assistant KeyWe. Sur quoi puis-je vous aider ?",
      en: "Hi 👋 I'm the KeyWe assistant. How can I help?",
    },
    choix: [
      { libelle: { fr: "Déposer une clé", en: "Drop off a key" }, vers: "depot" },
      { libelle: { fr: "Récupérer une clé", en: "Pick up a key" }, vers: "retrait" },
      { libelle: { fr: "Un code de retrait ne marche pas", en: "A pickup code isn't working" }, vers: "code" },
      { libelle: { fr: "Paiement ou facturation", en: "Payment or billing" }, vers: "paiement" },
      { libelle: { fr: "Mon compte", en: "My account" }, vers: "compte" },
      { libelle: { fr: "Devenir point relais", en: "Become a partner" }, vers: "commercant" },
    ],
  },

  depot: {
    id: "depot",
    message: { fr: "À quel moment du dépôt en êtes-vous ?", en: "Where are you in the drop-off?" },
    choix: [
      { libelle: { fr: "Je ne sais pas comment ça marche", en: "I don't know how it works" }, vers: "depot_principe" },
      { libelle: { fr: "Je ne trouve pas de point relais près de moi", en: "I can't find a drop-off point near me" }, vers: "depot_carte" },
      { libelle: { fr: "J'ai payé mais rien ne se passe", en: "I paid but nothing happens" }, vers: "depot_paye" },
    ],
  },
  depot_principe: {
    id: "depot_principe",
    message: {
      fr: "Choisissez un point relais sur la carte et réglez le dépôt : vous recevez un badge à coller sur votre trousseau. Apportez-le au commerce, le commerçant le scanne et le range dans une case numérotée. Vous êtes notifié à chaque étape.",
      en: "Pick a drop-off point on the map and pay for the drop-off: you get a tag to stick on your keyring. Bring it to the shop, the owner scans it and stores it in a numbered slot. You're notified at every step.",
    },
    lien: { href: "/espace/deposer", libelle: { fr: "Déposer une clé", en: "Drop off a key" } },
    feuille: true,
  },
  depot_carte: {
    id: "depot_carte",
    message: {
      fr: "La carte n'affiche que les points relais actifs. Tapez votre code postal ou votre ville dans la recherche pour voir les plus proches. Le réseau s'étend : si aucun n'apparaît, il n'y en a pas encore près de chez vous.",
      en: "The map only shows active drop-off points. Type your postcode or city in the search to see the nearest ones. The network is growing: if none appear, there isn't one near you yet.",
    },
    lien: { href: "/points-relais", libelle: { fr: "Ouvrir la carte", en: "Open the map" } },
    feuille: true,
  },
  depot_paye: {
    id: "depot_paye",
    message: {
      fr: "Après paiement, votre clé passe en « payée » et le dépôt devient possible au point relais choisi. Si le statut n'a pas changé au bout de quelques minutes, vérifiez le détail de la clé dans votre espace — le paiement s'y reflète dès qu'il est confirmé.",
      en: "After payment, your key becomes « paid » and the drop-off can happen at the chosen point. If the status hasn't changed after a few minutes, check the key's details in your dashboard — payment shows there as soon as it's confirmed.",
    },
    lien: { href: "/espace", libelle: { fr: "Voir mes clés", en: "View my keys" } },
    feuille: true,
  },

  retrait: {
    id: "retrait",
    message: { fr: "Vous venez récupérer des clés. Que se passe-t-il ?", en: "You're here to pick up keys. What's happening?" },
    choix: [
      { libelle: { fr: "Comment récupérer avec mon code", en: "How to pick up with my code" }, vers: "retrait_principe" },
      { libelle: { fr: "Je n'ai pas reçu de code", en: "I didn't get a code" }, vers: "retrait_pas_de_code" },
      { libelle: { fr: "Le commerce est fermé", en: "The shop is closed" }, vers: "retrait_horaires" },
    ],
  },
  retrait_principe: {
    id: "retrait_principe",
    message: {
      fr: "Présentez votre code à 6 caractères au commerçant du point relais indiqué. Il vérifie le badge du trousseau, puis vous remet les clés de la case correspondante. Rien d'autre à installer.",
      en: "Show your 6-character code to the shop owner at the indicated drop-off point. They check the keyring's tag, then hand you the keys from the matching slot. Nothing else to install.",
    },
    feuille: true,
  },
  retrait_pas_de_code: {
    id: "retrait_pas_de_code",
    message: {
      fr: "Le code est envoyé par la personne qui dépose les clés (l'hôte), par email. Vérifiez vos spams. Si vous ne l'avez toujours pas, c'est à l'hôte de vous le renvoyer depuis son espace — nous ne pouvons pas le communiquer à sa place, pour des raisons de sécurité.",
      en: "The code is sent by email by whoever drops off the keys (the host). Check your spam. If you still don't have it, the host must resend it from their dashboard — we can't share it on their behalf, for security reasons.",
    },
    feuille: true,
  },
  retrait_horaires: {
    id: "retrait_horaires",
    message: {
      fr: "Les clés se récupèrent aux horaires d'ouverture du commerce. Ceux-ci sont affichés sur la fiche du point relais, sur la carte. Un casier connecté, quand il est disponible, permet un accès 24/7.",
      en: "Keys are collected during the shop's opening hours, shown on the drop-off point's card on the map. A smart locker, where available, allows 24/7 access.",
    },
    lien: { href: "/points-relais", libelle: { fr: "Vérifier les horaires", en: "Check the hours" } },
    feuille: true,
  },

  code: {
    id: "code",
    message: { fr: "Que dit l'écran quand vous présentez le code ?", en: "What does the screen say when you enter the code?" },
    choix: [
      { libelle: { fr: "« Code inconnu ou expiré »", en: "“Unknown or expired code”" }, vers: "code_expire" },
      { libelle: { fr: "« Mauvais point relais »", en: "“Wrong drop-off point”" }, vers: "code_lieu" },
      { libelle: { fr: "Je veux révoquer un code", en: "I want to revoke a code" }, vers: "code_revoquer" },
    ],
  },
  code_expire: {
    id: "code_expire",
    message: {
      fr: "Un code peut avoir une date de validité, ou avoir déjà été utilisé. Demandez à l'hôte de vous en générer un nouveau depuis le détail de la clé. Chaque code est à usage suivi : une fois consommé, il ne fonctionne plus.",
      en: "A code may have an expiry date, or have already been used. Ask the host to generate a new one from the key's details. Each code is single-use-tracked: once consumed, it no longer works.",
    },
    feuille: true,
  },
  code_lieu: {
    id: "code_lieu",
    message: {
      fr: "Ce message signifie que les clés sont déposées dans un autre commerce que celui où vous êtes. Vérifiez l'adresse du point relais indiquée dans l'email contenant le code.",
      en: "This message means the keys are stored at a different shop than the one you're at. Check the drop-off point address given in the email with the code.",
    },
    feuille: true,
  },
  code_revoquer: {
    id: "code_revoquer",
    message: {
      fr: "Depuis votre espace, ouvrez le détail de la clé concernée : chaque code actif peut être révoqué d'un clic. Il devient immédiatement inutilisable.",
      en: "From your dashboard, open the relevant key's details: each active code can be revoked in one click. It becomes unusable immediately.",
    },
    lien: { href: "/espace", libelle: { fr: "Gérer mes codes", en: "Manage my codes" } },
    feuille: true,
  },

  paiement: {
    id: "paiement",
    message: { fr: "Votre question porte sur…", en: "Your question is about…" },
    choix: [
      { libelle: { fr: "Les tarifs", en: "Pricing" }, vers: "paiement_tarifs" },
      { libelle: { fr: "Un paiement qui a échoué", en: "A failed payment" }, vers: "paiement_echec" },
      { libelle: { fr: "Une facture", en: "An invoice" }, vers: "paiement_facture" },
    ],
  },
  paiement_tarifs: {
    id: "paiement_tarifs",
    message: {
      fr: "7,90 € par dépôt à l'unité, ou 5,49 €/mois en abonnement hôte avec dépôts illimités, sans engagement. Le prix final est toujours affiché avant paiement.",
      en: "€7.90 per one-off drop-off, or €5.49/month on a host subscription with unlimited drop-offs, no commitment. The final price is always shown before payment.",
    },
    lien: { href: "/tarifs", libelle: { fr: "Voir les tarifs", en: "See pricing" } },
    feuille: true,
  },
  paiement_echec: {
    id: "paiement_echec",
    message: {
      fr: "Aucun montant n'est prélevé tant que le paiement n'aboutit pas : une clé restée « en attente de paiement » n'a rien coûté. Vous pouvez relancer le paiement depuis le détail de la clé. Si votre banque a bloqué l'opération, réessayez avec une autre carte.",
      en: "No amount is charged until payment succeeds: a key left « awaiting payment » cost nothing. You can retry payment from the key's details. If your bank blocked it, try another card.",
    },
    lien: { href: "/espace", libelle: { fr: "Reprendre le paiement", en: "Resume payment" } },
    feuille: true,
  },
  paiement_facture: {
    id: "paiement_facture",
    message: {
      fr: "Vos règlements figurent dans votre espace. Pour un justificatif détaillé ou une facture au nom d'une société, le SAV vous l'établit sur demande.",
      en: "Your payments appear in your dashboard. For a detailed receipt or a company invoice, our support team will issue one on request.",
    },
    feuille: true,
  },

  compte: {
    id: "compte",
    message: { fr: "Que souhaitez-vous faire ?", en: "What would you like to do?" },
    choix: [
      { libelle: { fr: "Je n'arrive pas à me connecter", en: "I can't log in" }, vers: "compte_connexion" },
      { libelle: { fr: "Mot de passe oublié", en: "Forgot password" }, vers: "compte_mdp" },
      { libelle: { fr: "Gérer ou supprimer mes données", en: "Manage or delete my data" }, vers: "compte_rgpd" },
    ],
  },
  compte_connexion: {
    id: "compte_connexion",
    message: {
      fr: "Vérifiez d'abord que votre email est confirmé : à l'inscription, un lien vous est envoyé, et la connexion reste bloquée tant qu'il n'est pas cliqué. Après plusieurs essais infructueux, l'accès est momentanément suspendu — patientez quelques minutes.",
      en: "First check that your email is confirmed: a link is sent at sign-up, and login stays blocked until it's clicked. After several failed attempts, access is briefly suspended — wait a few minutes.",
    },
    lien: { href: "/connexion", libelle: { fr: "Aller à la connexion", en: "Go to login" } },
    feuille: true,
  },
  compte_mdp: {
    id: "compte_mdp",
    message: {
      fr: "Depuis la page de connexion, cliquez sur « Oublié ? » : nous vous envoyons un lien pour en choisir un nouveau. Le lien est valable une heure.",
      en: "From the login page, click « Forgot? »: we'll send you a link to choose a new one. The link is valid for one hour.",
    },
    lien: { href: "/mot-de-passe-oublie", libelle: { fr: "Réinitialiser mon mot de passe", en: "Reset my password" } },
    feuille: true,
  },
  compte_rgpd: {
    id: "compte_rgpd",
    message: {
      fr: "Depuis « Mes données » dans votre espace, vous pouvez exporter votre historique et supprimer votre compte en autonomie. La suppression efface votre identité de nos bases ; ce qui subsiste est rendu anonyme.",
      en: "From « My data » in your dashboard, you can export your history and delete your account yourself. Deletion erases your identity from our systems; what remains is made anonymous.",
    },
    lien: { href: "/espace/confidentialite", libelle: { fr: "Gérer mes données", en: "Manage my data" } },
    feuille: true,
  },

  commercant: {
    id: "commercant",
    message: {
      fr: "Devenir point relais est gratuit : nous fournissons les cases numérotées, les badges et la signalétique, et l'application comptoir fonctionne sur smartphone ou tablette. Déposez votre candidature, notre équipe vous recontacte.",
      en: "Becoming a drop-off point is free: we provide the numbered slots, tags and signage, and the counter app runs on a smartphone or tablet. Submit your application and our team will get back to you.",
    },
    lien: { href: "/devenir-point-relais", libelle: { fr: "Déposer ma candidature", en: "Submit my application" } },
    feuille: true,
  },
};

/** Arbre résolu dans une langue. */
export function getArbre(locale: Locale): Record<string, Noeud> {
  const resolu: Record<string, Noeud> = {};
  for (const [id, n] of Object.entries(SOURCE)) {
    resolu[id] = {
      id: n.id,
      message: n.message[locale],
      feuille: n.feuille,
      choix: n.choix?.map((c) => ({ libelle: c.libelle[locale], vers: c.vers })),
      lien: n.lien ? { href: n.lien.href, libelle: n.lien.libelle[locale] } : undefined,
    };
  }
  return resolu;
}
