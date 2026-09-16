import type { Metadata } from "next";
import { Euro } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "My earnings" : "Mes gains" };
}

const euros = (centimes: number, en: boolean) =>
  (centimes / 100).toLocaleString(en ? "en-IE" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  });

/** Rémunération du mois en cours, calculée par paliers en base */
export default async function PageRemuneration({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const en = lang === "en";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pointRelais } = await supabase
    .from("relay_points")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const [{ data: remu }, { data: paliers }] = await Promise.all([
    supabase.rpc("remuneration_mois", { p_relay_point_id: pointRelais!.id }),
    supabase
      .from("remuneration_paliers")
      .select("seuil_min, seuil_max, montant_centimes")
      .order("seuil_min"),
  ]);

  const r = (remu ?? {}) as { nb_mouvements?: number; montant_centimes?: number };
  const mois = new Date().toLocaleDateString(en ? "en-IE" : "fr-FR", {
    month: "long",
    year: "numeric",
  });

  const t = en
    ? {
        titre: "My earnings",
        mouvementsMois: "movements this month",
        aPercevoir: "to be paid",
        comment: "How it's calculated",
        commentAide:
          "Every movement (drop-off, pickup, return) scanned at your counter is paid according to its rank in the month.",
        palier: (min: number, max: number | null) =>
          max ? `Movements ${min} to ${max}` : `From movement ${min}`,
        parMouvement: "/ movement",
        versement: "Paid at the start of the following month.",
      }
    : {
        titre: "Mes gains",
        mouvementsMois: "mouvements ce mois-ci",
        aPercevoir: "à percevoir",
        comment: "Comment c'est calculé",
        commentAide:
          "Chaque mouvement (dépôt, retrait, retour) scanné à votre comptoir est rémunéré selon son rang dans le mois.",
        palier: (min: number, max: number | null) =>
          max ? `Mouvements ${min} à ${max}` : `À partir du mouvement ${min}`,
        parMouvement: "/ mouvement",
        versement: "Versement en début de mois suivant.",
      };

  return (
    <div>
      <RafraichirTempsReel
        table="movements"
        filtre={`relay_point_id=eq.${pointRelais!.id}`}
      />

      <h1 className="text-xl font-bold">{t.titre}</h1>
      <p className="mt-1 text-sm capitalize text-gray-600">{mois}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-3xl font-black text-primaire">
            {r.nb_mouvements ?? 0}
          </p>
          <p className="text-sm text-gray-600">{t.mouvementsMois}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-corail/10 text-corail">
            <Euro size={18} aria-hidden="true" />
          </span>
          <p className="mt-2 text-3xl font-black">
            {euros(r.montant_centimes ?? 0, en)}
          </p>
          <p className="text-sm text-gray-600">{t.aPercevoir}</p>
        </div>
      </div>

      {paliers && paliers.length > 0 && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold">{t.comment}</h2>
          <p className="mt-1 text-sm text-gray-600">{t.commentAide}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {paliers.map((p) => (
              <li
                key={p.seuil_min}
                className="flex items-center justify-between border-b border-gray-100 pb-1.5 last:border-0"
              >
                <span className="text-gray-600">
                  {t.palier(p.seuil_min, p.seuil_max)}
                </span>
                <span className="font-semibold">
                  {euros(p.montant_centimes, en)} {t.parMouvement}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500">{t.versement}</p>
        </section>
      )}
    </div>
  );
}
