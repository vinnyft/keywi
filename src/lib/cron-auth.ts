import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Contrôle d'accès des routes `/api/cron/*`.
 *
 * Ces routes envoient des emails et génèrent des codes d'accès : les
 * laisser ouvertes revient à offrir un robot d'envoi. La protection
 * ne peut donc pas dépendre de la présence d'une variable — un
 * `CRON_SECRET` oublié au déploiement ouvrirait tout, en silence.
 *
 * En développement, l'absence de secret reste tolérée : la route
 * s'appelle au curl pendant qu'on travaille.
 */
export function verifierCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "CRON_SECRET absent : les routes cron sont refusées tant qu'il " +
          "n'est pas défini."
      );
      return NextResponse.json(
        { erreur: "Tâche planifiée non configurée." },
        { status: 503 }
      );
    }
    return null;
  }

  const entete = request.headers.get("authorization") ?? "";
  const attendu = `Bearer ${secret}`;

  // Comparaison à temps constant : la longueur reste comparée avant,
  // `timingSafeEqual` exigeant deux tampons de même taille.
  const recu = Buffer.from(entete);
  const reference = Buffer.from(attendu);
  const valide =
    recu.length === reference.length && timingSafeEqual(recu, reference);

  if (!valide) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  return null;
}
