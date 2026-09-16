import "server-only";

import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCALE_DEFAUT, type Locale } from "@/lib/i18n";

/**
 * Envoi des notifications email via Resend.
 * Les notifications in-app sont créées en base par les fonctions
 * RPC Postgres ; ce module ne gère que le canal email.
 *
 * Chaque gabarit est bilingue : il reçoit `locale` (« fr » par
 * défaut) et compose sujet, corps, dates et châssis dans la langue
 * du destinataire.
 *
 * Sans RESEND_API_KEY (développement local), les emails sont
 * journalisés dans la console du serveur au lieu d'être envoyés.
 * En dev, chaque gabarit est visualisable sur
 * /api/dev/apercu-email?type=…
 */

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EXPEDITEUR = process.env.EMAIL_FROM ?? "Keywi <notifications@keywi.fr>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** URL publique localisée : `/espace` → `/en/espace` en anglais. */
function lienSite(chemin: string, en: boolean): string {
  if (en) return `${SITE}/en${chemin === "/" ? "" : chemin}`;
  return `${SITE}${chemin === "/" ? "" : chemin}`;
}

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

/**
 * Échappement HTML.
 *
 * Un nom de logement ou de bénéficiaire est saisi librement par un
 * utilisateur, puis réinjecté dans le HTML d'un email adressé à un
 * tiers. Sans cette passe, appeler son logement
 * `<a href="…">Confirmez votre compte</a>` suffit à transformer une
 * notification Keywi en support de hameçonnage, expédiée depuis
 * notre domaine et notre réputation d'envoi.
 */
function echapper(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Mêmes paramètres, chaînes échappées. Chaque gabarit travaille sur
 * cette copie (`p`) pour composer son HTML, et garde `params` pour
 * le sujet — qui est du texte brut, où « &amp; » s'afficherait tel quel.
 */
function proteger<T extends Record<string, unknown>>(params: T): T {
  return Object.fromEntries(
    Object.entries(params).map(([cle, valeur]) => [
      cle,
      typeof valeur === "string" ? echapper(valeur) : valeur,
    ])
  ) as T;
}

/**
 * Langue de préférence d'un destinataire, lue sur son profil
 * (colonne profiles.langue, renseignée à l'inscription). Repli
 * « fr » : destinataire sans compte (bénéficiaire d'un code) ou
 * lecture impossible. Centralise la localisation des emails sans
 * toucher aux nombreux points d'appel.
 */
async function langueDestinataire(email: string | null | undefined): Promise<Locale> {
  if (!email) return LOCALE_DEFAUT;
  try {
    const admin = createAdminClient();
    // 1) Titulaire de compte : préférence du profil.
    const { data: profil } = await admin
      .from("profiles")
      .select("langue")
      .eq("email", email)
      .maybeSingle();
    if (profil?.langue === "en") return "en";
    if (profil?.langue === "fr") return "fr";
    // 2) Bénéficiaire sans compte : langue portée par son code le plus récent.
    const { data: code } = await admin
      .from("access_codes")
      .select("langue")
      .eq("beneficiaire_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return code?.langue === "en" ? "en" : LOCALE_DEFAUT;
  } catch {
    return LOCALE_DEFAUT;
  }
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

/** Bouton d'action principal (vert primaire, arrondi) */
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
 * Gabarit HTML commun, bilingue.
 *
 * `mentionTiers` : à activer pour les emails adressés à une personne
 * qui n'a pas de compte Keywi (bénéficiaire d'un code, prestataire
 * récurrent). L'article 14 du RGPD impose de l'informer du
 * traitement de ses données et de ses droits — c'est ce que la
 * ligne ajoutée au pied fait, en pointant vers la politique.
 */
function gabarit(
  titre: string,
  corps: string,
  options: { mentionTiers?: boolean; locale?: Locale } = {}
): string {
  const en = options.locale === "en";
  const mentionTiers = options.mentionTiers
    ? `<p style="margin:0 0 10px;font-size:12px;color:${COULEURS.texteSecondaire}">
         ${
           en
             ? `You are receiving this email because a Keywi user shared an access with
                you. Your name and email address are used only to send you this code and
                to identify the handover. You can request their deletion at any time —
                <a href="${lienSite("/confidentialite", true)}" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">learn more</a>.`
             : `Vous recevez cet email car un utilisateur de Keywi vous a partagé un
                accès. Vos nom et adresse email servent uniquement à vous transmettre
                ce code et à identifier la remise. Vous pouvez en demander
                l'effacement à tout moment —
                <a href="${lienSite("/confidentialite", false)}" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">en savoir plus</a>.`
         }
       </p>`
    : "";
  return gabaritHtml(titre, corps, mentionTiers, en);
}

function gabaritHtml(titre: string, corps: string, mentionTiers: string, en: boolean): string {
  const tagline = en ? "Your keys, safe, close to home" : "Vos clés, en lieu sûr, près de chez vous";
  const piedTitre = en
    ? "Keywi — the French network of key drop-off points."
    : "Keywi — le réseau français de points relais pour clés.";
  const piedAuto = en
    ? "Automated email — please do not reply."
    : "Email envoyé automatiquement, merci de ne pas y répondre.";
  const faqLabel = en ? "FAQ" : "FAQ";
  const contactLabel = en ? "Contact" : "Contact";
  return `<!doctype html>
<html lang="${en ? "en" : "fr"}">
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
                    <div style="background:${COULEURS.primaire};border-radius:10px;width:38px;height:38px;
                                text-align:center;font-size:19px;line-height:38px">🥝</div>
                  </td>
                  <td style="padding-left:12px">
                    <span style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:22px;
                                 font-weight:800;letter-spacing:.04em;color:#ffffff">Keywi</span><br>
                    <span style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:12px;
                                 color:rgba(255,255,255,.65)">${tagline}</span>
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
              ${mentionTiers}
              <p style="margin:0 0 6px;font-size:12px;color:${COULEURS.texteSecondaire}">
                <a href="${lienSite("/", en)}" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">keywi.fr</a>
                &nbsp;·&nbsp;
                <a href="${lienSite("/faq", en)}" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">${faqLabel}</a>
                &nbsp;·&nbsp;
                <a href="${lienSite("/contact", en)}" style="color:${COULEURS.primaire};text-decoration:none;font-weight:600">${contactLabel}</a>
              </p>
              <p style="margin:0;font-size:12px;color:${COULEURS.texteSecondaire}">
                ${piedTitre}<br>
                ${piedAuto}
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

/** Format de date/heure selon la langue. */
function locFmt(en: boolean): string {
  return en ? "en-IE" : "fr-FR";
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
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  return {
    sujet: en
      ? `Your keys “${params.logement}” have been dropped off`
      : `Vos clés « ${params.logement} » ont bien été déposées`,
    html: gabarit(
      en ? "Your keys have been dropped off ✅" : "Vos clés ont bien été déposées ✅",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">Your keys for <strong>${p.logement}</strong> have been
           dropped off at <strong>${p.commerce}</strong>.</p>
           ${encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`)}
           <p style="margin:0">Follow every movement in real time from your dashboard.</p>
           ${bouton("Open my dashboard", lienSite("/espace", true))}`
        : `<p style="margin:0 0 12px">Bonjour ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">Vos clés du logement <strong>${p.logement}</strong> ont bien
           été déposées chez <strong>${p.commerce}</strong>.</p>
           ${encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`)}
           <p style="margin:0">Suivez chaque mouvement en temps réel depuis votre tableau de bord.</p>
           ${bouton("Ouvrir mon tableau de bord", lienSite("/espace", false))}`,
      { locale: params.locale }
    ),
  };
}

export async function emailDepotEffectue(
  params: Parameters<typeof contenuDepotEffectue>[0] & { hoteEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.hoteEmail));
  await envoyerEmail(params.hoteEmail, contenuDepotEffectue({ ...params, locale }));
}

/** Clé revenue au point relais → email à l'hôte */
export function contenuRetourEffectue(params: {
  hoteNom: string | null;
  logement: string;
  commerce: string;
  adresseCommerce: string;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  return {
    sujet: en
      ? `Your keys “${params.logement}” are back at the drop-off point`
      : `Vos clés « ${params.logement} » sont de retour au point relais`,
    html: gabarit(
      en ? "Your keys are back 🔁" : "Vos clés sont de retour 🔁",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">Your keys for <strong>${p.logement}</strong> have been
           returned to <strong>${p.commerce}</strong>.</p>
           ${encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`)}
           <p style="margin:0">You can pick them up or generate a new pickup code.</p>
           ${bouton("Manage my keys", lienSite("/espace", true))}`
        : `<p style="margin:0 0 12px">Bonjour ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">Vos clés du logement <strong>${p.logement}</strong> ont été
           redéposées chez <strong>${p.commerce}</strong>.</p>
           ${encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`)}
           <p style="margin:0">Vous pouvez les récupérer ou générer un nouveau code de retrait.</p>
           ${bouton("Gérer mes clés", lienSite("/espace", false))}`,
      { locale: params.locale }
    ),
  };
}

export async function emailRetourEffectue(
  params: Parameters<typeof contenuRetourEffectue>[0] & { hoteEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.hoteEmail));
  await envoyerEmail(params.hoteEmail, contenuRetourEffectue({ ...params, locale }));
}

/** Clés disponibles → email au bénéficiaire d'un code actif */
export function contenuClesDisponibles(params: {
  beneficiaireNom: string | null;
  logement: string;
  commerce: string;
  adresseCommerce: string;
  code6: string;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  return {
    sujet: en
      ? `The keys for “${params.logement}” are waiting for you`
      : `Les clés de « ${params.logement} » vous attendent`,
    html: gabarit(
      en ? "Your keys are available 🎉" : "Vos clés sont disponibles 🎉",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.beneficiaireNom ?? ""},</p>
           <p style="margin:0 0 12px">The keys for <strong>${p.logement}</strong> are
           available. Show this code to the shop to pick them up:</p>
           ${blocCode(p.code6)}
           ${encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`)}
           <p style="margin:0;font-size:13px;color:${COULEURS.texteSecondaire}">
           Please check the shop's opening hours before you go.</p>`
        : `<p style="margin:0 0 12px">Bonjour ${p.beneficiaireNom ?? ""},</p>
           <p style="margin:0 0 12px">Les clés du logement <strong>${p.logement}</strong> sont
           disponibles. Présentez ce code au commerçant pour les récupérer :</p>
           ${blocCode(p.code6)}
           ${encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`)}
           <p style="margin:0;font-size:13px;color:${COULEURS.texteSecondaire}">
           Pensez à vérifier les horaires d'ouverture du commerce avant de vous déplacer.</p>`,
      { mentionTiers: true, locale: params.locale }
    ),
  };
}

export async function emailClesDisponibles(
  params: Parameters<typeof contenuClesDisponibles>[0] & { beneficiaireEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.beneficiaireEmail));
  await envoyerEmail(params.beneficiaireEmail, contenuClesDisponibles({ ...params, locale }));
}

/** Retrait confirmé → email à l'hôte */
export function contenuRetraitEffectue(params: {
  hoteNom: string | null;
  logement: string;
  commerce: string;
  beneficiaire: string;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  const heure = new Date().toLocaleTimeString(locFmt(en), {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    sujet: en
      ? `Keys “${params.logement}” picked up by ${params.beneficiaire}`
      : `Clés « ${params.logement} » récupérées par ${params.beneficiaire}`,
    html: gabarit(
      en ? "Your keys have been picked up 🤝" : "Vos clés ont été récupérées 🤝",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">The keys for <strong>${p.logement}</strong> were
           picked up by <strong>${p.beneficiaire}</strong> at <strong>${heure}</strong>
           at <strong>${p.commerce}</strong>.</p>
           <p style="margin:0">The full history is available in your dashboard.</p>
           ${bouton("View the history", lienSite("/espace", true))}`
        : `<p style="margin:0 0 12px">Bonjour ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">Les clés du logement <strong>${p.logement}</strong> ont été
           récupérées par <strong>${p.beneficiaire}</strong> à <strong>${heure}</strong>
           chez <strong>${p.commerce}</strong>.</p>
           <p style="margin:0">L'historique complet est disponible dans votre espace.</p>
           ${bouton("Voir l'historique", lienSite("/espace", false))}`,
      { locale: params.locale }
    ),
  };
}

export async function emailRetraitEffectue(
  params: Parameters<typeof contenuRetraitEffectue>[0] & { hoteEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.hoteEmail));
  await envoyerEmail(params.hoteEmail, contenuRetraitEffectue({ ...params, locale }));
}

/** Nouveau code de retrait → email au bénéficiaire */
export function contenuCodeRetrait(params: {
  beneficiaireNom: string | null;
  logement: string;
  code6: string;
  commerce: string | null;
  adresseCommerce: string | null;
  cleEnDepot: boolean;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  const disponibilite = p.cleEnDepot
    ? encadre(
        en
          ? `✅ The keys are <strong>already available</strong>.<br>
             📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`
          : `✅ Les clés sont <strong>déjà disponibles</strong>.<br>
             📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce}`
      )
    : encadre(
        en
          ? `⏳ The keys are <strong>not dropped off yet</strong>. You'll get an email
             as soon as they are available${
               p.commerce ? ` at <strong>${p.commerce}</strong>` : ""
             }.`
          : `⏳ Les clés ne sont <strong>pas encore déposées</strong>. Vous recevrez un
             email dès qu'elles seront disponibles${
               p.commerce ? ` chez <strong>${p.commerce}</strong>` : ""
             }.`
      );
  return {
    sujet: en
      ? `Your pickup code for “${params.logement}”`
      : `Votre code de retrait pour « ${params.logement} »`,
    html: gabarit(
      en ? "Your Keywi pickup code 🔑" : "Votre code de retrait Keywi 🔑",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.beneficiaireNom ?? ""},</p>
           <p style="margin:0 0 12px">A pickup code has been shared with you for the keys of
           <strong>${p.logement}</strong>:</p>
           ${blocCode(p.code6)}
           ${disponibilite}`
        : `<p style="margin:0 0 12px">Bonjour ${p.beneficiaireNom ?? ""},</p>
           <p style="margin:0 0 12px">Un code de retrait vous a été partagé pour les clés du logement
           <strong>${p.logement}</strong> :</p>
           ${blocCode(p.code6)}
           ${disponibilite}`,
      { mentionTiers: true, locale: params.locale }
    ),
  };
}

export async function emailCodeRetrait(
  params: Parameters<typeof contenuCodeRetrait>[0] & { beneficiaireEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.beneficiaireEmail));
  await envoyerEmail(params.beneficiaireEmail, contenuCodeRetrait({ ...params, locale }));
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
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  const quand = new Date(p.interventionLe).toLocaleString(locFmt(en), {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    sujet: en
      ? `Your access to “${params.logement}” — ${quand}`
      : `Votre accès à « ${params.logement} » — ${quand}`,
    html: gabarit(
      en
        ? "Your code for the next visit 🔁"
        : "Votre code pour la prochaine intervention 🔁",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.beneficiaireNom ?? ""},</p>
           <p style="margin:0 0 12px">Here is your code to collect the keys of
           <strong>${p.logement}</strong>, for the visit on <strong>${quand}</strong>:</p>
           ${blocCode(p.code6)}
           ${
             p.commerce
               ? encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce ?? ""}`)
               : ""
           }
           <p style="margin:0;font-size:13px;color:${COULEURS.texteSecondaire}">
           This code is only valid for ${p.dureeHeures} h around your visit.
           You'll get a new one before the next visit — no need to keep this one.</p>`
        : `<p style="margin:0 0 12px">Bonjour ${p.beneficiaireNom ?? ""},</p>
           <p style="margin:0 0 12px">Voici votre code pour récupérer les clés du logement
           <strong>${p.logement}</strong>, pour l'intervention du <strong>${quand}</strong> :</p>
           ${blocCode(p.code6)}
           ${
             p.commerce
               ? encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce ?? ""}`)
               : ""
           }
           <p style="margin:0;font-size:13px;color:${COULEURS.texteSecondaire}">
           Ce code n'est valable que ${p.dureeHeures} h autour de votre intervention.
           Vous en recevrez un nouveau avant la prochaine — inutile de conserver celui-ci.</p>`,
      { mentionTiers: true, locale: params.locale }
    ),
  };
}

export async function emailAccesRecurrent(
  params: Parameters<typeof contenuAccesRecurrent>[0] & { beneficiaireEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.beneficiaireEmail));
  await envoyerEmail(params.beneficiaireEmail, contenuAccesRecurrent({ ...params, locale }));
}

/** Clé en retard → relance à l'hôte */
export function contenuRappelRetour(params: {
  hoteNom: string | null;
  logement: string;
  echeance: string;
  commerce: string | null;
  adresseCommerce: string | null;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  const dateEcheance = new Date(p.echeance).toLocaleDateString(locFmt(en), {
    day: "numeric",
    month: "long",
  });
  const lieu = p.commerce
    ? encadre(`📍 <strong>${p.commerce}</strong><br>${p.adresseCommerce ?? ""}`)
    : "";
  return {
    sujet: en
      ? `⏰ Keys “${params.logement}”: return overdue since ${dateEcheance}`
      : `⏰ Clés « ${params.logement} » : retour attendu depuis le ${dateEcheance}`,
    html: gabarit(
      en ? "Your key hasn't come back ⏰" : "Votre clé n'est pas revenue ⏰",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">You expected the keys for <strong>${p.logement}</strong>
           back by <strong>${dateEcheance}</strong> — they haven't been returned yet.</p>
           ${lieu}
           <p style="margin:0">Check their status, contact the holder, or push back the
           deadline from your dashboard.</p>
           ${bouton("View the key", lienSite("/espace", true))}`
        : `<p style="margin:0 0 12px">Bonjour ${p.hoteNom ?? ""},</p>
           <p style="margin:0 0 12px">Vous attendiez le retour des clés du logement
           <strong>${p.logement}</strong> pour le <strong>${dateEcheance}</strong> —
           elles n'ont pas encore été rendues.</p>
           ${lieu}
           <p style="margin:0">Vérifiez leur statut, contactez le détenteur ou
           repoussez l'échéance depuis votre espace.</p>
           ${bouton("Voir la clé", lienSite("/espace", false))}`,
      { locale: params.locale }
    ),
  };
}

export async function emailRappelRetour(
  params: Parameters<typeof contenuRappelRetour>[0] & { hoteEmail: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.hoteEmail));
  await envoyerEmail(params.hoteEmail, contenuRappelRetour({ ...params, locale }));
}

/* ------------------------------------------------------------------
   Réponses aux candidatures commerçants (envoyées depuis /admin)
   ------------------------------------------------------------------ */

/** Candidature validée → email de bienvenue au commerçant */
export function contenuCandidatureValidee(params: {
  nomContact: string;
  nomCommerce: string;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  return {
    sujet: en
      ? `Welcome to the Keywi network, ${params.nomCommerce} 🎉`
      : `Bienvenue dans le réseau Keywi, ${params.nomCommerce} 🎉`,
    html: gabarit(
      en ? "Your application is accepted 🎉" : "Votre candidature est acceptée 🎉",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.nomContact},</p>
           <p style="margin:0 0 12px">Great news: <strong>${p.nomCommerce}</strong>
           is joining the Keywi network of drop-off points. The whole team welcomes you!</p>
           ${encadre(
             `<strong>Next steps:</strong><br>
              1️⃣ A team member calls you within 48 h to set up a meeting.<br>
              2️⃣ We install your drop-off kit (tags, numbered slots, signage).<br>
              3️⃣ You get access to the counter app — 15 minutes to get the hang of it.`
           )}
           <p style="margin:0">Every drop-off, pickup or return you scan earns you
           up to €1.20 per movement, paid at the start of the following month.</p>
           ${bouton("Discover the partner programme", lienSite("/devenir-point-relais", true))}`
        : `<p style="margin:0 0 12px">Bonjour ${p.nomContact},</p>
           <p style="margin:0 0 12px">Excellente nouvelle : <strong>${p.nomCommerce}</strong>
           rejoint le réseau de points relais Keywi. Toute l'équipe vous souhaite la bienvenue !</p>
           ${encadre(
             `<strong>Les prochaines étapes :</strong><br>
              1️⃣ Un membre de l'équipe vous appelle sous 48 h pour convenir d'un rendez-vous.<br>
              2️⃣ Nous installons votre kit point relais (badges, cases numérotées, signalétique).<br>
              3️⃣ Vous recevez vos accès à l'application comptoir — 15 minutes de prise en main suffisent.`
           )}
           <p style="margin:0">Chaque dépôt, retrait ou retour scanné vous est rémunéré
           (jusqu'à 1,20 € par mouvement) et versé en début de mois suivant.</p>
           ${bouton("Découvrir le programme partenaires", lienSite("/devenir-point-relais", false))}`,
      { locale: params.locale }
    ),
  };
}

/** Candidature refusée → réponse courtoise au commerçant */
export function contenuCandidatureRefusee(params: {
  nomContact: string;
  nomCommerce: string;
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  return {
    sujet: en
      ? `Your Keywi application — ${params.nomCommerce}`
      : `Votre candidature Keywi — ${params.nomCommerce}`,
    html: gabarit(
      en ? "Thank you for your application" : "Merci pour votre candidature",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.nomContact},</p>
           <p style="margin:0 0 12px">Thank you for proposing <strong>${p.nomCommerce}</strong>
           as a Keywi drop-off point. After review, we're unfortunately unable to add
           your business to the network right now.</p>
           ${encadre(
             `The most common reasons: an area not yet covered by our installation rounds,
              or a drop-off point already active nearby. Your application stays on file:
              we'll get back to you as soon as the situation changes.`
           )}
           <p style="margin:0">The network grows every month — feel free to reapply.</p>
           ${bouton("Follow the network's roll-out", lienSite("/devenir-point-relais", true))}`
        : `<p style="margin:0 0 12px">Bonjour ${p.nomContact},</p>
           <p style="margin:0 0 12px">Merci d'avoir proposé <strong>${p.nomCommerce}</strong>
           comme point relais Keywi. Après étude, nous ne sommes malheureusement pas en mesure
           d'intégrer votre commerce au réseau pour le moment.</p>
           ${encadre(
             `Les raisons les plus fréquentes : une zone non encore couverte par nos tournées
              d'installation, ou un point relais déjà actif à proximité immédiate. Votre
              candidature reste enregistrée : nous reviendrons vers vous dès que la situation évolue.`
           )}
           <p style="margin:0">Le réseau s'étend chaque mois — n'hésitez pas à repostuler.</p>
           ${bouton("Suivre l'ouverture du réseau", lienSite("/devenir-point-relais", false))}`,
      { locale: params.locale }
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
  locale?: Locale;
}): ContenuEmail {
  const en = params.locale === "en";
  const p = proteger(params);
  return {
    sujet: en
      ? `Your Keywi drop-off point is live — ${params.nomCommerce}`
      : `Votre point relais Keywi est ouvert — ${params.nomCommerce}`,
    html: gabarit(
      en ? "Your drop-off point is online 🎉" : "Votre point relais est en ligne 🎉",
      en
        ? `<p style="margin:0 0 12px">Hello ${p.nomContact},</p>
           <p style="margin:0 0 12px"><strong>${p.nomCommerce}</strong> is now
           part of the Keywi network. Your counter already appears on the public map.</p>
           ${encadre(
             `📍 <strong>${p.nomCommerce}</strong><br>${p.adresse}<br>
              🗄️ <strong>${p.nbCases} numbered slots</strong> at your disposal`
           )}
           <p style="margin:0 0 12px">First step: choose your password to access the
           counter app.</p>
           ${bouton("Choose my password", p.lienAcces)}
           <p style="margin:16px 0 0;font-size:13px;color:${COULEURS.texteSecondaire}">
           Then it's two gestures: scan the tag when a customer drops off their keys,
           enter the 6-character code when a recipient comes to collect them. Every
           scanned movement earns you money.</p>`
        : `<p style="margin:0 0 12px">Bonjour ${p.nomContact},</p>
           <p style="margin:0 0 12px"><strong>${p.nomCommerce}</strong> fait
           désormais partie du réseau Keywi. Votre comptoir apparaît dès maintenant
           sur la carte publique.</p>
           ${encadre(
             `📍 <strong>${p.nomCommerce}</strong><br>${p.adresse}<br>
              🗄️ <strong>${p.nbCases} cases</strong> numérotées à votre disposition`
           )}
           <p style="margin:0 0 12px">Première étape : choisissez votre mot de passe
           pour accéder à l'application comptoir.</p>
           ${bouton("Choisir mon mot de passe", p.lienAcces)}
           <p style="margin:16px 0 0;font-size:13px;color:${COULEURS.texteSecondaire}">
           Ensuite, tout tient en deux gestes : scanner le badge quand un client
           dépose ses clés, saisir le code à 6 caractères quand un bénéficiaire
           vient les chercher. Chaque mouvement scanné vous est rémunéré.</p>`,
      { locale: params.locale }
    ),
  };
}

export async function emailBienvenueCommercant(
  params: Parameters<typeof contenuBienvenueCommercant>[0] & { email: string }
) {
  const locale = params.locale ?? (await langueDestinataire(params.email));
  await envoyerEmail(params.email, contenuBienvenueCommercant({ ...params, locale }));
}

/** Envoi de la réponse à une candidature (validée ou refusée) */
export async function emailReponseCandidature(params: {
  email: string;
  nomContact: string;
  nomCommerce: string;
  decision: "validee" | "refusee";
  locale?: Locale;
}) {
  const locale = params.locale ?? (await langueDestinataire(params.email));
  const contenu =
    params.decision === "validee"
      ? contenuCandidatureValidee({ ...params, locale })
      : contenuCandidatureRefusee({ ...params, locale });
  await envoyerEmail(params.email, contenu);
}
