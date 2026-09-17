import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Diagnostic TEMPORAIRE de l'envoi email applicatif (Resend).
 *
 * Sans paramètre, renvoie uniquement des informations NON sensibles
 * (présence de la clé au runtime, son préfixe « re_ » et sa longueur,
 * l'expéditeur résolu, l'URL du site) — aucun secret n'est divulgué.
 *
 * L'envoi de test réel (`?to=…`) est protégé par `CRON_SECRET`
 * (`&secret=…`) pour éviter tout usage en relais de spam.
 *
 * À SUPPRIMER une fois le pipeline email confirmé.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = process.env.RESEND_API_KEY ?? "";
  const from = process.env.EMAIL_FROM ?? "KeyWe <notifications@keywe.io>";

  const diag: Record<string, unknown> = {
    resendKeyPresent: Boolean(key),
    resendKeyPrefix: key ? key.slice(0, 3) : null,
    resendKeyLength: key.length,
    from,
    site: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    cronSecretPresent: Boolean(process.env.CRON_SECRET),
  };

  const to = url.searchParams.get("to");
  if (to) {
    const secret = url.searchParams.get("secret");
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      diag.sendSkipped = "secret manquant ou invalide (ajoutez &secret=CRON_SECRET)";
    } else if (!key) {
      diag.sendSkipped = "RESEND_API_KEY absente au runtime";
    } else {
      try {
        const resend = new Resend(key);
        const { data, error } = await resend.emails.send({
          from,
          to,
          subject: "KeyWe — diagnostic email",
          html: "<p>Diagnostic KeyWe : si vous lisez ceci, l'envoi applicatif fonctionne.</p>",
        });
        diag.sendId = data?.id ?? null;
        diag.sendError = error ? { name: error.name, message: error.message } : null;
      } catch (e) {
        diag.sendThrew = e instanceof Error ? e.message : String(e);
      }
    }
  }

  return NextResponse.json(diag);
}
