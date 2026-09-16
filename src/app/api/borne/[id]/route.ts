import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailRetraitEffectue } from "@/lib/notifications";
import { delaiLisible, reinitialiserLimite, verifierLimite } from "@/lib/limitation";

/**
 * Borne d'un casier connecté : le bénéficiaire tape son code à
 * 6 caractères sur l'écran, la case s'ouvre.
 *
 * La borne est un terminal public — sa page l'est aussi — et cette
 * route est appelable depuis n'importe où. La comparaison au
 * digicode ne tient donc que si l'on ajoute ce qu'un digicode
 * possède naturellement : la lenteur. Sans limitation, 31⁶
 * combinaisons se balaient en quelques heures, et chaque réussite
 * ouvre une case contenant les clés d'un logement.
 *
 * Le compteur est porté par le casier (pas par l'appelant) : une
 * attaque distribuée sur des milliers d'IP se heurte au même seuil.
 * Un retrait réussi le remet à zéro, l'usage normal ne le voit
 * jamais.
 *
 * POST /api/borne/<relay_point_id>  { code: "H7KM2P" }
 */

/** Le paramètre d'URL arrive brut : sans ça, la RPC échoue en 500. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { code } = (await request.json().catch(() => ({}))) as { code?: string };

  if (!UUID.test(id)) {
    return NextResponse.json(
      { ok: false, message: "Borne inconnue." },
      { status: 404 }
    );
  }

  if (!code || code.trim().length < 6) {
    return NextResponse.json(
      { ok: false, message: "Entrez votre code à 6 caractères." },
      { status: 400 }
    );
  }

  const quota = await verifierLimite("borne", id);
  if (!quota.autorise) {
    return NextResponse.json(
      {
        ok: false,
        message: `Trop d'essais sur cette borne. Réessayez dans ${delaiLisible(quota.reessayerDans)} ou présentez-vous au comptoir.`,
      },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("casier_retirer", {
    p_relay_point_id: id,
    p_code: code,
  });
  if (error) {
    // Le message de Postgres peut décrire le schéma : il reste dans
    // les journaux, l'écran de la borne n'en voit rien.
    console.error("casier_retirer :", error.message);
    return NextResponse.json(
      { ok: false, message: "Erreur technique. Présentez-vous au comptoir." },
      { status: 500 }
    );
  }

  const r = (data ?? { ok: false }) as unknown as {
    ok: boolean;
    message?: string;
    case_numero?: number;
    logement?: string;
    casier?: string;
    beneficiaire?: string;
    hote_email?: string;
    hote_nom?: string | null;
  };

  // Un retrait légitime rend son crédit à la borne : la file de
  // bénéficiaires d'un après-midi chargé ne doit pas la bloquer.
  if (r.ok) await reinitialiserLimite("borne", id);

  // L'hôte est prévenu que ses clés ont été récupérées
  if (r.ok && r.hote_email) {
    await emailRetraitEffectue({
      hoteEmail: r.hote_email,
      hoteNom: r.hote_nom ?? null,
      logement: r.logement ?? "",
      commerce: r.casier ?? "",
      beneficiaire: r.beneficiaire ?? "",
    });
  }

  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
