import "server-only";

import { Resend } from "resend";

/**
 * Envoi des notifications email via Resend.
 * Les notifications in-app sont créées en base par les fonctions
 * RPC Postgres ; ce module ne gère que le canal email.
 *
 * Sans RESEND_API_KEY (développement local), les emails sont
 * journalisés dans la console du serveur au lieu d'être envoyés.
 * En dev, chaque gabarit est visualisable sur
 * /api/dev/apercu-email?type=…
 *
 * Structure extensible : ajouter ici les canaux push web et SMS
 * (même signature, sélection par le champ `canal`).
 */

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EXPEDITEUR = process.env.EMAIL_FROM ?? "Keywi <notifications@keywi.fr>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* ------------------------------------------------------------------
   Identité visuelle (mêmes jetons que src/app/globals.css)
   ------------------------------------------------------------------ */
const COULEURS = {
  encre: "#3A5230",
  primaire: "#5C7A4A",
  primaireFonce: "#4C6A3C",
  primairePale: "#D9E3C2",
  corail: "#AEC98A",
  menthe: "#0FA86C",
  menthePale: "#E2F7EE",
  sable: "#FBFAF3",
  texte: "#3A5230",
  texteSecondaire: "#6B7A6B",
} as const;

export interface ContenuEmail {
  sujet: string;
  html: string;
}

async function envoyerEmail(destinataire: string, contenu: ContenuEmail) {
  if (!destinataire) return;
  if (!resend) {
    // Mode local : on journalise au lieu d'envoyer
    console.log(
      `\n📧 [EMAIL SIMULÉ — configurez RESEND_API_KEY pour envoyer]\n` +
        `   À      : ${destinataire}\n` +
        `   Sujet  : ${contenu.sujet}\n` +
        `   Corps  : ${contenu.html
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 300)}\n`
    );
    return;
  }
  try {
    await resend.emails.send({
      from: EXPEDITEUR,
      to: destinataire,
      subject: contenu.sujet,
      html: contenu.html,
    });
  } catch (e) {
    // L'échec d'un email ne doit jamais bloquer le flux métier
    console.error("Échec d'envoi email Resend :", e);
  }
}

/* ------------------------------------------------------------------
   Briques visuelles (HTML email : tables + styles inline uniquement,
   pour la compatibilité Gmail / Outlook / Apple Mail)
   ------------------------------------------------------------------ */

/** Bouton d'action principal (bleu primaire, arrondi) */
function bouton(libelle: string, url: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 8px">
    <tr>
      <td style="background:${COULEURS.primaire};border-radius:10px">
        <a href="${url}"
           style="display:inline-block;padding:13px 28px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
                  font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">
          ${libelle}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Bloc code de retrait (6 caractères, bien visible au comptoir) */
function blocCode(code: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto">
    <tr>
      <td style="background:${COULEURS.primairePale};border-radius:12px;padding:14px 28px">
        <span style="font-family:'SF Mono',Consolas,monospace;font-size:30px;font-weight:800;
                     letter-spacing:8px;color:${COULEURS.primaireFonce}">${code}</span>
      </td>
    </tr>
  </table>`;
}

/** Encadré d'information secondaire (fond sable) */
function encadre(html: string) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0">
    <tr>
      <td style="background:${COULEURS.sable};border-radius:12px;padding:16px 20px;
                 font-size:14px;line-height:1.6;color:${COULEURS.texte}">
        ${html}
      </td>
    </tr>
  </table>`;
}

/**
 * Gabarit commun : reprend l'identité du site — bandeau encre avec
 * le logo (clé sur carré bleu arrondi), carte blanche sur fond
 * sable, pied de page avec liens.
 */
function gabarit(titre: string, corps: string): string {
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:${COULEURS.sable}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COULEURS.sable}">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="max-width:560px;width:100%">

          <!-- Bandeau de marque (encre + logo) -->
          <tr>
            <td style="background:${COULEURS.encre};border-radius:16px 16px 0 0;padding:22px 28px">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle">
                    <!-- Dimensions fixées par un bloc interne : la cellule
                         s'étire avec la ligne, pas le logo -->
                    <div style="background:${COULEURS.primaire};border-radius:10px;width:38px;height:38px;
                                text-align:center;font-size:19px;line-height:38px">🥝</div>
                  </td>
                  <td style="padding-left:12px">
                    <span style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:22px;
                                 font-weight:800;letter-spacing:.04em;color:#ffffff">Keywi</span><br>
                    <span style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:12px;
                                 color:rgba(255,255,255,.65)">Vos clés, en lieu sûr, près de chez vous</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Carte de contenu -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 16px 16px;padding:30px 28px;
                       font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
              <h1 style="margin:0 0 14px;font-size:20px;line-height:1.35;color:${COULEURS.encre}">
                ${titre}
              </h1>
              <div style="font-size:15px;line-height:1.65;color:${COULEURS.texte}">
                ${corps}
              </div>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="padding:20px 28px;text-align:center;
                       font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
              <p style="margin:0 0 6px;font-size:12px;color:${COULEURS.texteSecondaire}">
                <a href="${SITE}" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">keywi.fr</a>
                &nbsp;·&nbsp;
                <a href="${SITE}/faq" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">FAQ</a>
                &nbsp;·&nbsp;
                <a href="${SITE}/contact" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">Contact</a>
              </p>
              <p style="margin:0;font-size:12px;color:${COULEURS.texteSecondaire}">
                Keywi — le réseau français de points relais pour clés.<br>
                Email envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------------
   Matrice d'événements → contenus d'emails
   (builders purs, exportés pour l'aperçu /api/dev/apercu-email)
   ------------------------------------------------------------------ */

/** Dépôt confirmé → email au déposant (hôte) */
export function contenuDepotEffectue(params: {
  hoteNom: string | null;
  logement: string;
  commerce: string;
  adresseCommerce: string;
}): ContenuEmail {
  return {
    sujet: `Vos clés « ${params.logement} » ont bien été déposées`,
    html: gabarit(
      "Vos clés ont bien été déposées ✅",
      `<p style="margin:0 0 12px">Bonjour ${params.hoteNom ?? ""},</p>
       <p style="margin:0 0 12px">Vos clés du logement <strong>${params.logement}</strong> ont bien
       été déposées chez <strong>${params.commerce}</strong>.</p>
       ${encadre(`📍 <strong>${params.commerce}</strong><br>${params.adresseCommerce}`)}
       <p style="margin:0">Suivez chaque mouvement en temps réel depuis votre tableau de bord.</p>
       ${bouton("Ouvrir mon tableau de bord", `${SITE}/espace`)}`
    ),
  };
}

export async function emailDepotEffectue(
  params: Parameters<typeof contenuDepotEffectue>[0] & { hoteEmail: string }
) {
  await envoyerEmail(params.hoteEmail, contenuDepotEffectue(params));
}

/** Clé revenue au point relais → email à l'hôte */
export function contenuRetourEffectue(params: {
  hoteNom: string | null;
  logement: string;
  commerce: string;
  adresseCommerce: string;
}): ContenuEmail {
  return {
    sujet: `Vos clés « ${params.logement} » sont de retour au point relais`,
    html: gabarit(
      "Vos clés sont de retour 🔁",
      `<p style="margin:0 0 12px">Bonjour ${params.hoteNom ?? ""},</p>
       <p style="margin:0 0 12px">Vos clés du logement <strong>${params.logement}</strong> ont été
       redéposées chez <strong>${params.commerce}</strong>.</p>
       ${encadre(`📍 <strong>${params.commerce}</strong><br>${params.adresseCommerce}`)}
       <p style="margin:0">Vous pouvez les récupérer ou générer un nouveau code de retrait.</p>
       ${bouton("Gérer mes clés", `${SITE}/espace`)}`
    ),
  };
}

export async function emailRetourEffectue(
  params: Parameters<typeof contenuRetourEffectue>[0] & { hoteEmail: string }
) {
  await envoyerEmail(params.hoteEmail, contenuRetourEffectue(params));
}

/** Clés disponibles → email au bénéficiaire d'un code actif */
export function contenuClesDisponibles(params: {
  beneficiaireNom: string | null;
  logement: string;
  commerce: string;
  adresseCommerce: string;
  code6: string;
}): ContenuEmail {
  return {
    sujet: `Les clés de « ${params.logement} » vous attendent`,
    html: gabarit(
      "Vos clés sont disponibles 🎉",
      `<p style="margin:0 0 12px">Bonjour ${params.beneficiaireNom ?? ""},</p>
       <p style="margin:0 0 12px">Les clés du logement <strong>${params.logement}</strong> sont
       disponibles. Présentez ce code au commerçant pour les récupérer :</p>
       ${blocCode(params.code6)}
       ${encadre(`📍 <strong>${params.commerce}</strong><br>${params.adresseCommerce}`)}
       <p style="margin:0;font-size:13px;color:${COULEURS.texteSecondaire}">
       Pensez à vérifier les horaires d'ouverture du commerce avant de vous déplacer.</p>`
    ),
  };
}

export async function emailClesDisponibles(
  params: Parameters<typeof contenuClesDisponibles>[0] & { beneficiaireEmail: string }
) {
  await envoyerEmail(params.beneficiaireEmail, contenuClesDisponibles(params));
}

/** Retrait confirmé → email à l'hôte */
export function contenuRetraitEffectue(params: {
  hoteNom: string | null;
  logement: string;
  commerce: string;
  beneficiaire: string;
}): ContenuEmail {
  const heure = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    sujet: `Clés « ${params.logement} » récupérées par ${params.beneficiaire}`,
    html: gabarit(
      "Vos clés ont été récupérées 🤝",
      `<p style="margin:0 0 12px">Bonjour ${params.hoteNom ?? ""},</p>
       <p style="margin:0 0 12px">Les clés du logement <strong>${params.logement}</strong> ont été
       récupérées par <strong>${params.beneficiaire}</strong> à <strong>${heure}</strong>
       chez <strong>${params.commerce}</strong>.</p>
       <p style="margin:0">L'historique complet est disponible dans votre espace.</p>
       ${bouton("Voir l'historique", `${SITE}/espace`)}`
    ),
  };
}

export async function emailRetraitEffectue(
  params: Parameters<typeof contenuRetraitEffectue>[0] & { hoteEmail: string }
) {
  await envoyerEmail(params.hoteEmail, contenuRetraitEffectue(params));
}

/** Nouveau code de retrait → email au bénéficiaire */
export function contenuCodeRetrait(params: {
  beneficiaireNom: string | null;
  logement: string;
  code6: string;
  commerce: string | null;
  adresseCommerce: string | null;
  cleEnDepot: boolean;
}): ContenuEmail {
  const disponibilite = params.cleEnDepot
    ? encadre(
        `✅ Les clés sont <strong>déjà disponibles</strong>.<br>
         📍 <strong>${params.commerce}</strong><br>${params.adresseCommerce}`
      )
    : encadre(
        `⏳ Les clés ne sont <strong>pas encore déposées</strong>. Vous recevrez un
         email dès qu'elles seront disponibles${
           params.commerce ? ` chez <strong>${params.commerce}</strong>` : ""
         }.`
      );
  return {
    sujet: `Votre code de retrait pour « ${params.logement} »`,
    html: gabarit(
      "Votre code de retrait Keywi 🔑",
      `<p style="margin:0 0 12px">Bonjour ${params.beneficiaireNom ?? ""},</p>
       <p style="margin:0 0 12px">Un code de retrait vous a été partagé pour les clés du logement
       <strong>${params.logement}</strong> :</p>
       ${blocCode(params.code6)}
       ${disponibilite}`
    ),
  };
}

export async function emailCodeRetrait(
  params: Parameters<typeof contenuCodeRetrait>[0] & { beneficiaireEmail: string }
) {
  await envoyerEmail(params.beneficiaireEmail, contenuCodeRetrait(params));
}

/** Intervention récurrente à venir → code envoyé au prestataire */
export function contenuAccesRecurrent(params: {
  beneficiaireNom: string | null;
  logement: string;
  code6: string;
  interventionLe: string;
  dureeHeures: number;
  commerce: string | null;
  adresseCommerce: string | null;
}): ContenuEmail {
  const quand = new Date(params.interventionLe).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    sujet: `Votre accès à « ${params.logement} » — ${quand}`,
    html: gabarit(
      "Votre code pour la prochaine intervention 🔁",
      `<p style="margin:0 0 12px">Bonjour ${params.beneficiaireNom ?? ""},</p>
       <p style="margin:0 0 12px">Voici votre code pour récupérer les clés du logement
       <strong>${params.logement}</strong>, pour l'intervention du <strong>${quand}</strong> :</p>
       ${blocCode(params.code6)}
       ${
         params.commerce
           ? encadre(`📍 <strong>${params.commerce}</strong><br>${params.adresseCommerce ?? ""}`)
           : ""
       }
       <p style="margin:0;font-size:13px;color:${COULEURS.texteSecondaire}">
       Ce code n'est valable que ${params.dureeHeures} h autour de votre intervention.
       Vous en recevrez un nouveau avant la prochaine — inutile de conserver celui-ci.</p>`
    ),
  };
}

export async function emailAccesRecurrent(
  params: Parameters<typeof contenuAccesRecurrent>[0] & { beneficiaireEmail: string }
) {
  await envoyerEmail(params.beneficiaireEmail, contenuAccesRecurrent(params));
}

/** Clé en retard → relance à l'hôte */
export function contenuRappelRetour(params: {
  hoteNom: string | null;
  logement: string;
  echeance: string;
  commerce: string | null;
  adresseCommerce: string | null;
}): ContenuEmail {
  const dateEcheance = new Date(params.echeance).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  const lieu = params.commerce
    ? encadre(`📍 <strong>${params.commerce}</strong><br>${params.adresseCommerce ?? ""}`)
    : "";
  return {
    sujet: `⏰ Clés « ${params.logement} » : retour attendu depuis le ${dateEcheance}`,
    html: gabarit(
      "Votre clé n'est pas revenue ⏰",
      `<p style="margin:0 0 12px">Bonjour ${params.hoteNom ?? ""},</p>
       <p style="margin:0 0 12px">Vous attendiez le retour des clés du logement
       <strong>${params.logement}</strong> pour le <strong>${dateEcheance}</strong> —
       elles n'ont pas encore été rendues.</p>
       ${lieu}
       <p style="margin:0">Vérifiez leur statut, contactez le détenteur ou
       repoussez l'échéance depuis votre espace.</p>
       ${bouton("Voir la clé", `${SITE}/espace`)}`
    ),
  };
}

export async function emailRappelRetour(
  params: Parameters<typeof contenuRappelRetour>[0] & { hoteEmail: string }
) {
  await envoyerEmail(params.hoteEmail, contenuRappelRetour(params));
}

/* ------------------------------------------------------------------
   Réponses aux candidatures commerçants (envoyées depuis /admin)
   ------------------------------------------------------------------ */

/** Candidature validée → email de bienvenue au commerçant */
export function contenuCandidatureValidee(params: {
  nomContact: string;
  nomCommerce: string;
}): ContenuEmail {
  return {
    sujet: `Bienvenue dans le réseau Keywi, ${params.nomCommerce} 🎉`,
    html: gabarit(
      "Votre candidature est acceptée 🎉",
      `<p style="margin:0 0 12px">Bonjour ${params.nomContact},</p>
       <p style="margin:0 0 12px">Excellente nouvelle : <strong>${params.nomCommerce}</strong>
       rejoint le réseau de points relais Keywi. Toute l'équipe vous souhaite la bienvenue !</p>
       ${encadre(
         `<strong>Les prochaines étapes :</strong><br>
          1️⃣ Un membre de l'équipe vous appelle sous 48 h pour convenir d'un rendez-vous.<br>
          2️⃣ Nous installons votre kit point relais (badges, cases numérotées, signalétique).<br>
          3️⃣ Vous recevez vos accès à l'application comptoir — 15 minutes de prise en main suffisent.`
       )}
       <p style="margin:0">Chaque dépôt, retrait ou retour scanné vous est rémunéré
       (jusqu'à 1,20 € par mouvement) et versé en début de mois suivant.</p>
       ${bouton("Découvrir le programme partenaires", `${SITE}/devenir-point-relais`)}`
    ),
  };
}

/** Candidature refusée → réponse courtoise au commerçant */
export function contenuCandidatureRefusee(params: {
  nomContact: string;
  nomCommerce: string;
}): ContenuEmail {
  return {
    sujet: `Votre candidature Keywi — ${params.nomCommerce}`,
    html: gabarit(
      "Merci pour votre candidature",
      `<p style="margin:0 0 12px">Bonjour ${params.nomContact},</p>
       <p style="margin:0 0 12px">Merci d'avoir proposé <strong>${params.nomCommerce}</strong>
       comme point relais Keywi. Après étude, nous ne sommes malheureusement pas en mesure
       d'intégrer votre commerce au réseau pour le moment.</p>
       ${encadre(
         `Les raisons les plus fréquentes : une zone non encore couverte par nos tournées
          d'installation, ou un point relais déjà actif à proximité immédiate. Votre
          candidature reste enregistrée : nous reviendrons vers vous dès que la situation évolue.`
       )}
       <p style="margin:0">Le réseau s'étend chaque mois — n'hésitez pas à repostuler.</p>
       ${bouton("Suivre l'ouverture du réseau", `${SITE}/devenir-point-relais`)}`
    ),
  };
}

/**
 * Point relais créé → accès de l'app comptoir envoyés au commerçant.
 * Contient le lien de définition du mot de passe : le compte est
 * créé sans mot de passe connu, le commerçant choisit le sien.
 */
export function contenuBienvenueCommercant(params: {
  nomContact: string;
  nomCommerce: string;
  adresse: string;
  nbCases: number;
  lienAcces: string;
}): ContenuEmail {
  return {
    sujet: `Votre point relais Keywi est ouvert — ${params.nomCommerce}`,
    html: gabarit(
      "Votre point relais est en ligne 🎉",
      `<p style="margin:0 0 12px">Bonjour ${params.nomContact},</p>
       <p style="margin:0 0 12px"><strong>${params.nomCommerce}</strong> fait
       désormais partie du réseau Keywi. Votre comptoir apparaît dès maintenant
       sur la carte publique.</p>
       ${encadre(
         `📍 <strong>${params.nomCommerce}</strong><br>${params.adresse}<br>
          🗄️ <strong>${params.nbCases} cases</strong> numérotées à votre disposition`
       )}
       <p style="margin:0 0 12px">Première étape : choisissez votre mot de passe
       pour accéder à l'application comptoir.</p>
       ${bouton("Choisir mon mot de passe", params.lienAcces)}
       <p style="margin:16px 0 0;font-size:13px;color:${COULEURS.texteSecondaire}">
       Ensuite, tout tient en deux gestes : scanner le badge quand un client
       dépose ses clés, saisir le code à 6 caractères quand un bénéficiaire
       vient les chercher. Chaque mouvement scanné vous est rémunéré.</p>`
    ),
  };
}

export async function emailBienvenueCommercant(
  params: Parameters<typeof contenuBienvenueCommercant>[0] & { email: string }
) {
  await envoyerEmail(params.email, contenuBienvenueCommercant(params));
}

/** Envoi de la réponse à une candidature (validée ou refusée) */
export async function emailReponseCandidature(params: {
  email: string;
  nomContact: string;
  nomCommerce: string;
  decision: "validee" | "refusee";
}) {
  const contenu =
    params.decision === "validee"
      ? contenuCandidatureValidee(params)
      : contenuCandidatureRefusee(params);
  await envoyerEmail(params.email, contenu);
}
